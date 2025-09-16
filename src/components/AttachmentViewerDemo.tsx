import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { AttachmentViewer } from '@/components/AttachmentViewer'
import { Attachment } from '@/types/global'
import { Paperclip } from 'lucide-react'

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
      {/* Conditional Compact Attachments Chip - Only show if there are attachments */}
      {attachmentsToShow.length > 0 && (
        <div className="flex items-center justify-between padding-consistent-sm border rounded-lg bg-blue-50 dark:bg-blue-950/50">
          <div className="flex items-center gap-consistent-sm">
            <div className="flex items-center gap-consistent-sm padding-consistent-sm bg-blue-100 dark:bg-blue-900 rounded-md">
              <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">
                {attachmentsToShow.length}
              </span>
            </div>
            <span className="text-blue-700 dark:text-blue-300">
              {isShowingRealAttachments ? 'anexos encontrados' : 'anexos de exemplo'}
            </span>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => handleAttachmentClick(0)}
            className="btn-touch-safe padding-consistent-sm bg-blue-600 hover:bg-blue-700 gap-1"
          >
            <span className="text-sm">👁️</span>
            Ver
          </Button>
        </div>
      )}

      <AttachmentViewer
        attachments={attachmentsToShow}
        initialIndex={selectedIndex}
        open={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  )
}