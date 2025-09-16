import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AttachmentViewer } from '@/components/AttachmentViewer'
import { Attachment } from '@/types/global'
import { FileText, Image, Film, Eye } from 'lucide-react'

import { formatFileSize } from '@/core/utils/formatters'

export function AttachmentViewerDemo() {
  const [showViewer, setShowViewer] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Temporariamente desabilitado até implementar upload de anexos
  const expenses: any[] = [] // Vazio por enquanto
  
  // Extrair todos os anexos das despesas
  const realAttachments = useMemo(() => {
    const attachments: Attachment[] = []
    expenses.forEach(expense => {
      if (expense.attachments && expense.attachments.length > 0) {
        attachments.push(...expense.attachments)
      }
    })
    
    // Debug: log para verificar se há anexos
    console.log('AttachmentViewerDemo - Despesas encontradas:', expenses.length)
    console.log('AttachmentViewerDemo - Anexos encontrados:', attachments.length)
    console.log('AttachmentViewerDemo - Anexos:', attachments)
    
    return attachments
  }, [expenses])
  
  // Anexos de demonstração (fallback se não houver anexos reais)
  const demoAttachments: Attachment[] = [
    {
      id: 'demo-1',
      fileName: 'recibo-compra.pdf',
      mimeType: 'application/pdf',
      size: 245760,
      blobRef: 'demo-pdf-blob'
    },
    {
      id: 'demo-2', 
      fileName: 'foto-produto.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      blobRef: 'demo-image-blob'
    },
    {
      id: 'demo-3',
      fileName: 'video-unboxing.mp4',
      mimeType: 'video/mp4',
      size: 5242880,
      blobRef: 'demo-video-blob'
    }
  ]
  
  // Usar anexos reais se disponíveis, senão anexos de demonstração
  const attachmentsToShow = realAttachments.length > 0 ? realAttachments : demoAttachments
  const isShowingRealAttachments = realAttachments.length > 0

  const handleAttachmentClick = (index: number) => {
    setSelectedIndex(index)
    setShowViewer(true)
  }

  return (
    <>
      <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          📎 Anexos das Despesas
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {isShowingRealAttachments 
            ? `Visualize os ${realAttachments.length} anexos das suas despesas atuais.`
            : 'Ainda não há anexos nas suas despesas. Clique nos exemplos abaixo para testar o visualizador.'}
        </p>
        
        {attachmentsToShow.length > 0 ? (
          <>
            {/* Preview compacto de anexos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {attachmentsToShow.length} anexo{attachmentsToShow.length > 1 ? 's' : ''} encontrado{attachmentsToShow.length > 1 ? 's' : ''}
                </span>
                <Button 
                  size="sm" 
                  onClick={() => handleAttachmentClick(0)}
                  className="h-7 px-3 text-xs"
                >
                  Ver todos
                </Button>
              </div>
              
              {/* Lista horizontal compacta - mostra apenas os primeiros 3 anexos */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {attachmentsToShow.slice(0, 3).map((attachment, index) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors group min-w-0 flex-shrink-0 w-48"
                    onClick={() => handleAttachmentClick(index)}
                  >
                    <div className="shrink-0 p-1.5 rounded-md bg-muted">
                      {attachment.mimeType.startsWith('image') && <Image className="w-3.5 h-3.5 text-blue-600" />}
                      {attachment.mimeType.startsWith('video') && <Film className="w-3.5 h-3.5 text-purple-600" />}
                      {attachment.mimeType.includes('pdf') && <FileText className="w-3.5 h-3.5 text-red-600" />}
                      {!attachment.mimeType.startsWith('image') && !attachment.mimeType.startsWith('video') && !attachment.mimeType.includes('pdf') && (
                        <FileText className="w-3.5 h-3.5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" title={attachment.fileName}>
                        {attachment.fileName.length > 14 
                          ? `${attachment.fileName.substring(0, 14)}...` 
                          : attachment.fileName
                        }
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                
                {/* Indicador de mais anexos */}
                {attachmentsToShow.length > 3 && (
                  <div 
                    className="flex items-center justify-center p-2 rounded-md border border-dashed bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors min-w-0 flex-shrink-0 w-24"
                    onClick={() => handleAttachmentClick(0)}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-muted-foreground">
                        +{attachmentsToShow.length - 3}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        mais
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumo por tipo de arquivo */}
              <div className="flex flex-wrap gap-2 text-xs">
                {(() => {
                  const types = {
                    images: attachmentsToShow.filter(a => a.mimeType.startsWith('image')).length,
                    videos: attachmentsToShow.filter(a => a.mimeType.startsWith('video')).length,
                    pdfs: attachmentsToShow.filter(a => a.mimeType.includes('pdf')).length,
                    others: attachmentsToShow.filter(a => !a.mimeType.startsWith('image') && !a.mimeType.startsWith('video') && !a.mimeType.includes('pdf')).length
                  }
                  
                  return (
                    <>
                      {types.images > 0 && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Image className="w-3 h-3 mr-1" />
                          {types.images} imagem{types.images > 1 ? 'ns' : ''}
                        </Badge>
                      )}
                      {types.videos > 0 && (
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Film className="w-3 h-3 mr-1" />
                          {types.videos} vídeo{types.videos > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {types.pdfs > 0 && (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                          <FileText className="w-3 h-3 mr-1" />
                          {types.pdfs} PDF{types.pdfs > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {types.others > 0 && (
                        <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                          <FileText className="w-3 h-3 mr-1" />
                          {types.others} outro{types.others > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAttachmentClick(0)} 
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Anexos
              </Button>
              <Button 
                variant="outline"
                size="sm"
                className="px-3"
                title={`${attachmentsToShow.length} anexo${attachmentsToShow.length > 1 ? 's' : ''}`}
              >
                {attachmentsToShow.length}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nenhum anexo encontrado. Adicione anexos às suas despesas para testá-los aqui.
          </p>
        )}
      </div>

      <AttachmentViewer
        attachments={attachmentsToShow}
        initialIndex={selectedIndex}
        open={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  )
}