// Hook para câmera integrada com Capacitor
import { useState, useCallback } from 'react'
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

interface CameraOptions {
  quality?: number
  allowEditing?: boolean
  resultType?: CameraResultType
  source?: CameraSource
  width?: number
  height?: number
}

interface CameraError {
  message: string
  code?: string
}

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CameraError | null>(null)

  const checkCameraPermissions = useCallback(async () => {
    try {
      const permissions = await Camera.checkPermissions()
      return permissions.camera === 'granted'
    } catch (err) {
      console.error('Erro ao verificar permissões da câmera:', err)
      return false
    }
  }, [])

  const requestCameraPermissions = useCallback(async () => {
    try {
      const permissions = await Camera.requestPermissions({ permissions: ['camera'] })
      return permissions.camera === 'granted'
    } catch (err) {
      console.error('Erro ao solicitar permissões da câmera:', err)
      setError({ message: 'Não foi possível obter permissão para acessar a câmera' })
      return false
    }
  }, [])

  const takePicture = useCallback(async (options: CameraOptions = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      // Verificar se é um dispositivo nativo
      if (!Capacitor.isNativePlatform()) {
        // Para web, usar input file como fallback
        return await takePictureWeb()
      }

      // Verificar permissões
      const hasPermission = await checkCameraPermissions()
      if (!hasPermission) {
        const granted = await requestCameraPermissions()
        if (!granted) {
          throw new Error('Permissão da câmera negada')
        }
      }

      const defaultOptions: CameraOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1080,
        ...options
      }

      const photo = await Camera.getPhoto(defaultOptions)
      return photo
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao capturar foto'
      console.error('Erro na câmera:', err)
      setError({ message: errorMessage, code: err.code })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [checkCameraPermissions, requestCameraPermissions])

  const pickFromGallery = useCallback(async (options: CameraOptions = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const defaultOptions: CameraOptions = {
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        ...options
      }

      const photo = await Camera.getPhoto(defaultOptions)
      return photo
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao selecionar foto'
      console.error('Erro na galeria:', err)
      setError({ message: errorMessage, code: err.code })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fallback para web usando input file
  const takePictureWeb = useCallback(async (): Promise<Photo | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // Usar câmera traseira por padrão
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            resolve({
              dataUrl,
              format: file.type.split('/')[1] as any,
              saved: false
            })
          }
          reader.readAsDataURL(file)
        } else {
          resolve(null)
        }
      }
      
      input.oncancel = () => resolve(null)
      input.click()
    })
  }, [])

  const convertToBlob = useCallback(async (photo: Photo): Promise<Blob | null> => {
    if (!photo.dataUrl) return null

    try {
      const response = await fetch(photo.dataUrl)
      return await response.blob()
    } catch (err) {
      console.error('Erro ao converter foto para blob:', err)
      return null
    }
  }, [])

  const compressImage = useCallback(async (
    photo: Photo, 
    maxWidth = 1200, 
    maxHeight = 1200, 
    quality = 0.8
  ): Promise<string | null> => {
    if (!photo.dataUrl) return null

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve(null)
          return
        }

        // Calcular novas dimensões mantendo aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar e comprimir
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.onerror = () => resolve(null)
      img.src = photo.dataUrl
    })
  }, [])

  return {
    takePicture,
    pickFromGallery,
    convertToBlob,
    compressImage,
    checkCameraPermissions,
    requestCameraPermissions,
    isLoading,
    error,
    clearError: () => setError(null),
    isNativePlatform: Capacitor.isNativePlatform()
  }
}