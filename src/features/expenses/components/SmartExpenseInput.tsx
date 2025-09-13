import React, { useState, useCallback, useRef } from 'react'
import { Camera, FileText, Image, Scan, Trash2, X, Check, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useCamera } from '../../hooks/useCamera'
import { useTouchGestures } from '../../hooks/useTouchGestures'

interface AttachmentFile {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  blob?: Blob
  isImage: boolean
  createdAt: Date
}

interface SmartExpenseInputProps {
  onSubmit: (data: {
    amount: number
    description: string
    category: string
    attachments: AttachmentFile[]
    ocrData?: any
  }) => Promise<void>
  categories: string[]
  isLoading?: boolean
}

export function SmartExpenseInput({ onSubmit, categories, isLoading }: SmartExpenseInputProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    takePicture,
    pickFromGallery,
    convertToBlob,
    compressImage,
    isLoading: cameraLoading,
    error: cameraError,
    clearError,
    isNativePlatform
  } = useCamera()

  // Gestos touch para funcionalidades mobile
  const { touchHandlers } = useTouchGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'right' && attachments.length > 0) {
        // Swipe direita para ver próximo anexo
        console.log('Próximo anexo')
      } else if (gesture.direction === 'left' && attachments.length > 0) {
        // Swipe esquerda para ver anexo anterior
        console.log('Anexo anterior')
      }
    },
    onLongPress: (gesture) => {
      // Long press para abrir câmera rapidamente
      if ((gesture.target as HTMLElement).closest('.quick-camera')) {
        handleTakePicture()
      }
    }
  })

  // OCR Simplificado (mock para demonstração)
  const performOCR = useCallback(async (imageDataUrl: string) => {
    // Em produção, usar serviços como Google Vision API, AWS Textract, etc.
    setIsProcessing(true)
    
    try {
      // Mock de OCR - detectar números que possam ser valores
      const mockExtraction = {
        detectedAmount: Math.random() * 100 + 10, // Simular valor detectado
        detectedText: 'Produto XYZ\nData: 12/09/2025\nTotal: R$ 45,90',
        confidence: 0.85
      }
      
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return mockExtraction
    } catch (error) {
      console.error('Erro no OCR:', error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleTakePicture = useCallback(async () => {
    clearError()
    const photo = await takePicture({
      quality: 90,
      allowEditing: true,
      width: 1920,
      height: 1080
    })

    if (photo?.dataUrl) {
      await processImage(photo.dataUrl, 'camera-capture.jpg')
    }
  }, [takePicture, clearError])

  const handlePickFromGallery = useCallback(async () => {
    clearError()
    const photo = await pickFromGallery({
      quality: 90,
      allowEditing: true
    })

    if (photo?.dataUrl) {
      await processImage(photo.dataUrl, 'gallery-image.jpg')
    }
  }, [pickFromGallery, clearError])

  const processImage = useCallback(async (dataUrl: string, fileName: string) => {
    try {
      // Comprimir imagem
      const compressedDataUrl = await compressImage(
        { dataUrl, format: 'jpeg', saved: false },
        1200, 1200, 0.8
      )

      if (!compressedDataUrl) return

      // Converter para blob
      const response = await fetch(compressedDataUrl)
      const blob = await response.blob()

      const attachment: AttachmentFile = {
        id: Date.now().toString(),
        name: fileName,
        size: blob.size,
        type: blob.type,
        dataUrl: compressedDataUrl,
        blob,
        isImage: true,
        createdAt: new Date()
      }

      setAttachments(prev => [...prev, attachment])

      // Tentar OCR se for recibo/nota fiscal
      if (fileName.includes('camera') || description.toLowerCase().includes('recibo')) {
        const ocrResult = await performOCR(compressedDataUrl)
        if (ocrResult && ocrResult.confidence > 0.7) {
          if (!amount && ocrResult.detectedAmount) {
            setAmount(ocrResult.detectedAmount.toFixed(2))
          }
          if (!description && ocrResult.detectedText) {
            setDescription(ocrResult.detectedText.split('\n')[0])
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
    }
  }, [compressImage, performOCR, amount, description])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Arquivo muito grande. Máximo 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const attachment: AttachmentFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          isImage: file.type.startsWith('image/'),
          createdAt: new Date()
        }
        setAttachments(prev => [...prev, attachment])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description) {
      alert('Preencha valor e descrição')
      return
    }

    await onSubmit({
      amount: parseFloat(amount.replace(',', '.')),
      description,
      category,
      attachments
    })

    // Reset form
    setAmount('')
    setDescription('')
    setCategory('')
    setAttachments([])
  }, [amount, description, category, attachments, onSubmit])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Nova Despesa Inteligente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de Valor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Valor *
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="text-lg"
              required
            />
          </div>

          {/* Input de Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a despesa..."
              className="min-h-20"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecionar categoria...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Área de Anexos */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Anexos
            </label>
            
            {/* Botões de Ação Rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTakePicture}
                disabled={cameraLoading}
                className="quick-camera"
                {...touchHandlers}
              >
                {cameraLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">Câmera</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickFromGallery}
                disabled={cameraLoading}
              >
                <Image className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Galeria</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Arquivo</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">OCR</span>
              </Button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Arraste arquivos aqui ou clique para selecionar
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Lista de Anexos */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Anexos ({attachments.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                  >
                    {attachment.isImage ? (
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-gray-400" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erro da Câmera */}
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{cameraError.message}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="mt-2"
              >
                Fechar
              </Button>
            </div>
          )}

          {/* Status de Processamento */}
          {isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-blue-600">
                Processando imagem com OCR...
              </span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || cameraLoading || isProcessing}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvar Despesa
              </>
            )}
          </Button>
        </form>

        {/* Info sobre plataforma */}
        <div className="text-xs text-gray-500 text-center">
          {isNativePlatform ? (
            <Badge variant="secondary">Modo Nativo - Câmera Completa</Badge>
          ) : (
            <Badge variant="outline">Modo Web - Upload de Arquivos</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}