import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Download, 
  FileText, 
  Image, 
  Film, 
  Music, 
  File,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Attachment } from '@/types/global'
import { formatFileSize } from '@/core/utils/formatters'
import { toast } from 'sonner'
import { expenseService } from '@/features/expenses/services/expenseService'

interface AttachmentViewerProps {
  attachments: Attachment[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

interface AttachmentData {
  attachment: Attachment
  dataUrl: string
  blob: Blob
}

export function AttachmentViewer({ 
  attachments, 
  initialIndex = 0, 
  open, 
  onClose 
}: AttachmentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [attachmentData, setAttachmentData] = useState<AttachmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  // Toggle fullscreen mode for the image within the dialog
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  // Listen for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreen) {
        setFullscreen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [fullscreen, open])

  // Carregar dados dos anexos do IndexedDB
  useEffect(() => {
    if (!open || !attachments.length) return

    const loadAttachments = async () => {
      setLoading(true)
      try {
        const data: AttachmentData[] = []
        
        for (const attachment of attachments) {
          // Simular carregamento do IndexedDB - você precisará implementar isso
          // baseado na sua implementação de armazenamento
          const blob = await loadAttachmentBlob(attachment.blobRef)
          const dataUrl = URL.createObjectURL(blob)
          
          data.push({
            attachment,
            dataUrl,
            blob
          })
        }
        
        setAttachmentData(data)
      } catch (error) {
        console.error('Erro ao carregar anexos:', error)
        toast.error('Erro ao carregar anexos')
      } finally {
        setLoading(false)
      }
    }

    loadAttachments()

    // Cleanup URLs when component unmounts
    return () => {
      attachmentData.forEach(data => {
        URL.revokeObjectURL(data.dataUrl)
      })
    }
  }, [open, attachments])

  // Carregamento real do IndexedDB
  const loadAttachmentBlob = async (blobRef: string): Promise<Blob> => {
    try {
      const blob = await expenseService.getAttachmentBlob(blobRef)
      if (!blob) {
        // Cria um placeholder visual para anexos não encontrados
        const canvas = document.createElement('canvas')
        canvas.width = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f3f4f6'
          ctx.fillRect(0, 0, 200, 200)
          ctx.fillStyle = '#6b7280'
          ctx.font = '16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Anexo não', 100, 90)
          ctx.fillText('encontrado', 100, 110)
        }
        
        return new Promise(resolve => {
          canvas.toBlob(blob => resolve(blob || new Blob()), 'image/png')
        })
      }
      return blob
    } catch (error) {
      console.error('Erro ao carregar anexo:', error)
      // Retorna um blob de imagem placeholder
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#fef3c7'
        ctx.fillRect(0, 0, 200, 200)
        ctx.fillStyle = '#d97706'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Erro ao', 100, 90)
        ctx.fillText('carregar', 100, 110)
      }
      
      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob || new Blob()), 'image/png')
      })
    }
  }

  const currentAttachment = attachmentData[currentIndex]

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5" />
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const isImage = (mimeType: string) => mimeType.startsWith('image/')
  const isVideo = (mimeType: string) => mimeType.startsWith('video/')
  const isAudio = (mimeType: string) => mimeType.startsWith('audio/')
  const isPDF = (mimeType: string) => mimeType.includes('pdf')

  const handleDownload = async () => {
    if (!currentAttachment) return

    try {
      const link = document.createElement('a')
      link.href = currentAttachment.dataUrl
      link.download = currentAttachment.attachment.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download iniciado')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  const handleShare = async () => {
    if (!currentAttachment) return

    try {
      if (navigator.share) {
        // Web Share API (mobile)
        const file = new (window as any).File([currentAttachment.blob], currentAttachment.attachment.fileName, {
          type: currentAttachment.attachment.mimeType
        })
        
        await navigator.share({
          title: currentAttachment.attachment.fileName,
          files: [file]
        })
      } else {
        // Fallback: copy to clipboard or download
        await handleDownload()
        toast.info('Use o download para compartilhar')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast.error('Erro ao compartilhar arquivo')
    }
  }

  const nextAttachment = () => {
    setCurrentIndex((prev) => (prev + 1) % attachmentData.length)
    setZoom(100)
    setRotation(0)
  }

  const prevAttachment = () => {
    setCurrentIndex((prev) => (prev - 1 + attachmentData.length) % attachmentData.length)
    setZoom(100)
    setRotation(0)
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  const renderAttachmentContent = () => {
    if (!currentAttachment) return null

    const { attachment, dataUrl } = currentAttachment
    const { mimeType } = attachment

    if (isImage(mimeType)) {
      return (
        <div className={`flex items-center justify-center h-full ${fullscreen ? 'min-h-[80vh] bg-black' : 'min-h-[400px] bg-gray-50 dark:bg-gray-900'}`}>
          <img
            src={dataUrl}
            alt={attachment.fileName}
            className={`object-contain transition-all duration-300 ${fullscreen ? 'max-w-[90vw] max-h-[80vh]' : 'max-w-full max-h-full'}`}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      )
    }

    if (isVideo(mimeType)) {
      return (
        <div className={`flex items-center justify-center h-full ${fullscreen ? 'min-h-[80vh]' : 'min-h-[400px]'} bg-black`}>
          <video
            src={dataUrl}
            controls
            className={`${fullscreen ? 'max-w-[90vw] max-h-[80vh]' : 'max-w-full max-h-full'} transition-all duration-300`}
            style={{ transform: `scale(${zoom / 100})` }}
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        </div>
      )
    }

    if (isAudio(mimeType)) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-900">
          <div className="text-center space-y-4">
            <Music className="w-24 h-24 mx-auto text-gray-400" />
            <audio src={dataUrl} controls className="w-full max-w-md">
              Seu navegador não suporta reprodução de áudio.
            </audio>
          </div>
        </div>
      )
    }

    if (isPDF(mimeType)) {
      return (
        <div className="h-full min-h-[400px]">
          <iframe
            src={dataUrl}
            className="w-full h-full border-0"
            title={attachment.fileName}
          />
        </div>
      )
    }

    // Arquivo não visualizável - mostrar info e opção de download
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          {getFileIcon(mimeType)}
          <div>
            <h3 className="font-medium">{attachment.fileName}</h3>
            <p className="text-sm text-gray-600">
              {formatFileSize(attachment.size)} • {mimeType}
            </p>
            <Button onClick={handleDownload} className="mt-4">
              <Download className="w-4 h-4 mr-2" />
              Baixar arquivo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p>Carregando anexos...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!currentAttachment) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            <File className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h3 className="font-medium">Nenhum anexo encontrado</h3>
              <p className="text-sm text-gray-600">
                Os anexos podem ter sido removidos ou não puderam ser carregados.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${fullscreen ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-6xl h-[90vh]'} p-0`}>
        {/* Header */}
        <DialogHeader className={`${fullscreen ? 'p-2' : 'p-4'} border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(currentAttachment.attachment.mimeType)}
              <div>
                <DialogTitle className="text-base">
                  {currentAttachment.attachment.fileName}
                </DialogTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{formatFileSize(currentAttachment.attachment.size)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentAttachment.attachment.mimeType}
                  </Badge>
                  {attachmentData.length > 1 && (
                    <span>• {currentIndex + 1} de {attachmentData.length}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Controls for images */}
              {isImage(currentAttachment.attachment.mimeType) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotation((rotation + 90) % 360)}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                title={fullscreen ? "Sair da visualização expandida (ESC)" : "Visualização expandida"}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {renderAttachmentContent()}

          {/* Navigation arrows */}
          {attachmentData.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={prevAttachment}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={nextAttachment}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Footer with thumbnails */}
        {attachmentData.length > 1 && (
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <ScrollArea className="w-full">
              <div className="flex space-x-2 p-4">
                {attachmentData.map((data, index) => (
                  <Button
                    key={data.attachment.id}
                    variant={index === currentIndex ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 h-16 w-16 p-1"
                    onClick={() => {
                      setCurrentIndex(index)
                      resetView()
                    }}
                  >
                    {isImage(data.attachment.mimeType) ? (
                      <img
                        src={data.dataUrl}
                        alt={data.attachment.fileName}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        {getFileIcon(data.attachment.mimeType)}
                        <span className="text-xs mt-1 truncate w-full">
                          {data.attachment.fileName.split('.').pop()}
                        </span>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}