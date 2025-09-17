import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { 
  attachmentCache
} from '@/utils/attachmentOptimization'

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
  loaded: boolean
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
  
  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number>(0)
  const [touchEnd, setTouchEnd] = useState<number>(0)

  // Pre-carregamento de imagens adjacentes para navegação mais rápida
  useEffect(() => {
    if (!attachmentData.length || currentIndex < 0) return

    const preloadAdjacent = () => {
      const nextIndex = (currentIndex + 1) % attachmentData.length
      const prevIndex = (currentIndex - 1 + attachmentData.length) % attachmentData.length
      
      // Pre-carregar próxima imagem
      if (attachmentData[nextIndex]?.loaded && isImage(attachmentData[nextIndex].attachment.mimeType)) {
        const img = document.createElement('img')
        img.src = attachmentData[nextIndex].dataUrl
        img.style.display = 'none'
      }
      
      // Pre-carregar imagem anterior
      if (attachmentData[prevIndex]?.loaded && isImage(attachmentData[prevIndex].attachment.mimeType)) {
        const img = document.createElement('img')
        img.src = attachmentData[prevIndex].dataUrl
        img.style.display = 'none'
      }
    }

    const timeoutId = setTimeout(preloadAdjacent, 100)
    return () => clearTimeout(timeoutId)
  }, [currentIndex, attachmentData])

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

  // Função otimizada para carregar blob com cache
  const loadAttachmentBlob = useCallback(async (blobRefOrUrl: string): Promise<Blob> => {
    // Sanity
    if (!blobRefOrUrl) return new Blob()

    // Verificar cache primeiro
    if (attachmentCache.has(blobRefOrUrl)) {
      return attachmentCache.get(blobRefOrUrl)!.blob
    }

    try {
      // Se for uma URL remota, buscar diretamente
      if (/^https?:\/\//i.test(blobRefOrUrl)) {
        const resp = await fetch(blobRefOrUrl)
        if (!resp.ok) throw new Error('Falha ao baixar arquivo remoto')
        const remoteBlob = await resp.blob()
        attachmentCache.set(blobRefOrUrl, { blob: remoteBlob, cached: true })
        return remoteBlob
      }

      // Caso contrário, tentar carregar do cache local/IndexedDB via expenseService
      const blob = await expenseService.getAttachmentBlob(blobRefOrUrl)
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
          canvas.toBlob(blob => {
            const finalBlob = blob || new Blob()
            attachmentCache.set(blobRefOrUrl, { blob: finalBlob, cached: true })
            resolve(finalBlob)
          }, 'image/png')
        })
      }
      
      // Armazenar no cache
      attachmentCache.set(blobRefOrUrl, { blob, cached: true })
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
        canvas.toBlob(blob => {
          const finalBlob = blob || new Blob()
          attachmentCache.set(blobRefOrUrl, { blob: finalBlob, cached: true })
          resolve(finalBlob)
        }, 'image/png')
      })
    }
  }, [])

  // Carregar dados dos anexos do IndexedDB com otimizações
  useEffect(() => {
    if (!open || !attachments.length) return

    const loadAttachments = async () => {
      setLoading(true)
      try {
        // Inicializar dados com placeholders
        const initialData: AttachmentData[] = attachments.map(attachment => ({
          attachment,
          dataUrl: '',
          blob: new Blob(),
          loaded: false
        }))
        
        setAttachmentData(initialData)
        setLoading(false)

        // Carregar anexo atual primeiro para reduzir delay percebido
        const priorityIndexes = [
          initialIndex,
          ...[...Array(attachments.length)].map((_, i) => i).filter(i => i !== initialIndex)
        ]

        // Carregar anexos de forma assíncrona com prioridade
        for (let i = 0; i < priorityIndexes.length; i++) {
          const index = priorityIndexes[i]
          const attachment = attachments[index]
          
          try {
            const refOrUrl = (attachment as any).url || attachment.blobRef || ''
            const blob = await loadAttachmentBlob(refOrUrl)
            const dataUrl = URL.createObjectURL(blob)
            
            setAttachmentData(prev => {
              const newData = [...prev]
              newData[index] = {
                attachment,
                dataUrl,
                blob,
                loaded: true
              }
              return newData
            })

            // Para o primeiro anexo (prioridade), dar um pequeno delay para o usuário ver
            if (i === 0) {
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          } catch (error) {
            console.error(`Erro ao carregar anexo ${index}:`, error)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar anexos:', error)
        toast.error('Erro ao carregar anexos')
        setLoading(false)
      }
    }

    loadAttachments()

    // Cleanup URLs when component unmounts
    return () => {
      attachmentData.forEach(data => {
        if (data.dataUrl) {
          URL.revokeObjectURL(data.dataUrl)
        }
      })
    }
  }, [open, attachments, initialIndex, loadAttachmentBlob])



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

  const nextAttachment = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % attachmentData.length)
    setZoom(100)
    setRotation(0)
  }, [attachmentData.length])

  const prevAttachment = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + attachmentData.length) % attachmentData.length)
    setZoom(100)
    setRotation(0)
  }, [attachmentData.length])

  const resetView = useCallback(() => {
    setZoom(100)
    setRotation(0)
  }, [])

  // Touch handlers for swipe navigation - otimizados
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(0) // Reset end position
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50
    
    // Swipe left (next attachment)
    if (distance > minSwipeDistance && attachmentData.length > 1) {
      nextAttachment()
    }
    
    // Swipe right (previous attachment)
    if (distance < -minSwipeDistance && attachmentData.length > 1) {
      prevAttachment()
    }
  }, [touchStart, touchEnd, nextAttachment, prevAttachment, attachmentData.length])

  const renderAttachmentContent = useMemo(() => {
    if (!currentAttachment || !currentAttachment.loaded) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-600">Carregando anexo...</p>
          </div>
        </div>
      )
    }

    const { attachment, dataUrl } = currentAttachment
    const { mimeType } = attachment

    if (isImage(mimeType)) {
      return (
        <div className={`flex items-center justify-center h-full overflow-hidden ${fullscreen ? 'bg-black' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <img
            src={dataUrl}
            alt={attachment.fileName}
            className="object-contain transition-all duration-200 touch-pinch-zoom max-w-full max-h-full"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              maxWidth: fullscreen ? '100vw' : '100%',
              maxHeight: fullscreen ? '100vh' : '100%',
            }}
            onDoubleClick={() => setZoom(zoom === 100 ? 150 : 100)}
            loading="eager"
            decoding="async"
          />
          
          {/* Mobile zoom controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2 sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              disabled={zoom <= 25}
              className="w-8 h-8 text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-white min-w-[3rem] text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
              className="w-8 h-8 text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }

    if (isVideo(mimeType)) {
      return (
        <div className="flex items-center justify-center h-full bg-black overflow-hidden">
          <video
            src={dataUrl}
            controls
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxWidth: fullscreen ? '100vw' : '100%',
              maxHeight: fullscreen ? '100vh' : '100%'
            }}
            playsInline
            preload="auto"
            muted
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        </div>
      )
    }

    if (isAudio(mimeType)) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center space-y-4 w-full max-w-md">
            <Music className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-gray-400" />
            <div className="space-y-2">
              <h3 className="font-medium text-sm sm:text-base truncate">{attachment.fileName}</h3>
              <audio src={dataUrl} controls className="w-full">
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          </div>
        </div>
      )
    }

    if (isPDF(mimeType)) {
      return (
        <div className="h-full overflow-hidden">
          <iframe
            src={dataUrl}
            className="w-full h-full border-0"
            title={attachment.fileName}
            style={{ minHeight: '300px' }}
          />
        </div>
      )
    }

    // Arquivo não visualizável - mostrar info e opção de download
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-gray-400 flex items-center justify-center">
            {getFileIcon(mimeType)}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-sm sm:text-base truncate">{attachment.fileName}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {formatFileSize(attachment.size)}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {mimeType}
            </p>
            <Button onClick={handleDownload} className="mt-4 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Baixar arquivo
            </Button>
          </div>
        </div>
      </div>
    )
  }, [currentAttachment, zoom, rotation, fullscreen, handleDownload])

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
      <DialogContent className={`${fullscreen ? 'max-w-[100vw] max-h-[100vh] w-full h-full' : 'max-w-[95vw] max-h-[95vh] w-full h-full sm:max-w-4xl lg:max-w-6xl sm:h-[90vh]'} p-0 overflow-hidden`}>
        {/* Header */}
        <DialogHeader className={`${fullscreen ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0`}>
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {getFileIcon(currentAttachment.attachment.mimeType)}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm sm:text-base truncate">
                  {currentAttachment.attachment.fileName}
                </DialogTitle>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                  <span className="shrink-0">{formatFileSize(currentAttachment.attachment.size)}</span>
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {currentAttachment.attachment.mimeType.split('/')[0]}
                  </Badge>
                  {attachmentData.length > 1 && (
                    <span className="shrink-0">• {currentIndex + 1}/{attachmentData.length}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Controls for images - hide some on mobile */}
              {isImage(currentAttachment.attachment.mimeType) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                    className="hidden sm:flex"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-600 min-w-[2rem] sm:min-w-[3rem] text-center hidden sm:inline">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                    className="hidden sm:flex"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="w-8 h-8 sm:w-auto sm:h-auto"
                  >
                    <RotateCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShare}
                className="w-8 h-8 sm:w-auto sm:h-auto"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownload}
                className="w-8 h-8 sm:w-auto sm:h-auto"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFullscreen}
                title={fullscreen ? "Sair da visualização expandida (ESC)" : "Visualização expandida"}
                className="w-8 h-8 sm:w-auto sm:h-auto"
              >
                {fullscreen ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div 
          className="flex-1 relative overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderAttachmentContent}

          {/* Navigation arrows - responsive positioning */}
          {attachmentData.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm w-8 h-8 sm:w-auto sm:h-auto p-0 sm:p-2"
                onClick={prevAttachment}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm w-8 h-8 sm:w-auto sm:h-auto p-0 sm:p-2"
                onClick={nextAttachment}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Mobile swipe indicator */}
          {attachmentData.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 sm:hidden">
              <span className="text-xs text-white">
                {currentIndex + 1} / {attachmentData.length}
              </span>
            </div>
          )}
        </div>

        {/* Footer with thumbnails - responsive layout */}
        {attachmentData.length > 1 && !fullscreen && (
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <ScrollArea className="w-full">
              <div className="flex space-x-2 p-2 sm:p-4">
                {attachmentData.map((data, index) => (
                  <Button
                    key={data.attachment.id}
                    variant={index === currentIndex ? "default" : "outline"}
                    size="sm"
                    className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 p-1 relative"
                    onClick={() => {
                      setCurrentIndex(index)
                      resetView()
                    }}
                  >
                    {isImage(data.attachment.mimeType) && data.loaded ? (
                      <img
                        src={data.dataUrl}
                        alt={data.attachment.fileName}
                        className="w-full h-full object-cover rounded"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 mb-1">
                          {getFileIcon(data.attachment.mimeType)}
                        </div>
                        <span className="text-xs truncate w-full hidden sm:block">
                          {data.attachment.fileName.split('.').pop()}
                        </span>
                      </div>
                    )}
                    
                    {/* Active indicator */}
                    {index === currentIndex && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background sm:hidden" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Mobile fullscreen thumbnails - show as overlay */}
        {attachmentData.length > 1 && fullscreen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2 sm:hidden">
            <div className="flex space-x-2 max-w-[80vw] overflow-x-auto">
              {attachmentData.map((data, index) => (
                <Button
                  key={data.attachment.id}
                  variant={index === currentIndex ? "secondary" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 h-10 w-10 p-1 relative"
                  onClick={() => {
                    setCurrentIndex(index)
                    resetView()
                  }}
                >
                  {isImage(data.attachment.mimeType) && data.loaded ? (
                    <img
                      src={data.dataUrl}
                      alt={data.attachment.fileName}
                      className="w-full h-full object-cover rounded"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-4 h-4">
                        {getFileIcon(data.attachment.mimeType)}
                      </div>
                    </div>
                  )}
                  
                  {/* Active indicator */}
                  {index === currentIndex && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}