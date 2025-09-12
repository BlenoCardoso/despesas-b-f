// Utilitários para otimização de anexos

export interface OptimizedBlob {
  blob: Blob
  thumbnail?: Blob
  cached: boolean
}

// Cache otimizado para blobs
class AttachmentCache {
  private cache = new Map<string, OptimizedBlob>()
  private maxSize = 50 // Máximo de 50 anexos em cache
  private accessOrder: string[] = []

  set(key: string, value: OptimizedBlob) {
    // Implementa LRU (Least Recently Used)
    if (this.cache.has(key)) {
      this.updateAccessOrder(key)
    } else {
      this.accessOrder.push(key)
      if (this.accessOrder.length > this.maxSize) {
        const oldestKey = this.accessOrder.shift()!
        this.cache.delete(oldestKey)
      }
    }
    
    this.cache.set(key, { ...value, cached: true })
  }

  get(key: string): OptimizedBlob | undefined {
    const value = this.cache.get(key)
    if (value) {
      this.updateAccessOrder(key)
    }
    return value
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  private updateAccessOrder(key: string) {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
      this.accessOrder.push(key)
    }
  }

  clear() {
    this.cache.clear()
    this.accessOrder = []
  }

  size() {
    return this.cache.size
  }
}

export const attachmentCache = new AttachmentCache()

// Função para criar thumbnail de imagem
export const createImageThumbnail = async (blob: Blob, maxSize = 200): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = document.createElement('img')
    
    img.onload = () => {
      // Calcular dimensões mantendo aspect ratio
      const { width, height } = img
      const aspectRatio = width / height
      
      let newWidth = maxSize
      let newHeight = maxSize
      
      if (aspectRatio > 1) {
        newHeight = maxSize / aspectRatio
      } else {
        newWidth = maxSize * aspectRatio
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob((thumbnailBlob) => {
        resolve(thumbnailBlob || blob)
      }, 'image/jpeg', 0.8)
    }
    
    img.onerror = () => resolve(blob)
    img.src = URL.createObjectURL(blob)
  })
}

// Função para verificar se é imagem
export const isImageMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

// Função para verificar se é vídeo
export const isVideoMimeType = (mimeType: string): boolean => {
  return mimeType.startsWith('video/')
}

// Função para preload inteligente
export const preloadAttachment = (dataUrl: string, mimeType: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isImageMimeType(mimeType)) {
      const img = document.createElement('img')
      img.onload = () => resolve()
      img.onerror = reject
      img.src = dataUrl
    } else if (isVideoMimeType(mimeType)) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => resolve()
      video.onerror = reject
      video.preload = 'metadata'
      video.src = dataUrl
    } else {
      resolve() // Para outros tipos, considera como carregado
    }
  })
}

// Debounce para otimizar chamadas frequentes
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Função para limpar URLs de objeto quando não precisar mais
export const cleanupObjectURLs = (urls: string[]) => {
  urls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
}