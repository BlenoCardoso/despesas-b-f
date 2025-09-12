import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { AttachmentViewer } from '@/components/AttachmentViewer'
import { Attachment } from '@/types/global'
import { FileText, Image, Film } from 'lucide-react'
import { useFilteredExpenses } from '@/features/expenses/hooks/useExpenses'
import { startOfMonth, endOfMonth } from 'date-fns'

export function AttachmentViewerDemo() {
  const [showViewer, setShowViewer] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  // Buscar despesas do mês atual para obter anexos reais
  const currentMonth = new Date()
  const { data: expenses = [] } = useFilteredExpenses({
    startDate: startOfMonth(currentMonth),
    endDate: endOfMonth(currentMonth)
  })
  
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
          Visualizador de Anexos {isShowingRealAttachments ? '- Anexos Reais' : '- Demonstração'}
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {isShowingRealAttachments 
            ? `Visualize os ${realAttachments.length} anexos das suas despesas do mês atual.`
            : `Teste o visualizador de anexos com arquivos de demonstração (${expenses.length} despesas encontradas, mas nenhuma com anexos).`}
        </p>
        
        {attachmentsToShow.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {attachmentsToShow.map((attachment, index) => (
                <Button
                  key={attachment.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAttachmentClick(index)}
                  className="flex items-center gap-2"
                >
                  {attachment.mimeType.startsWith('image') && <Image className="w-4 h-4" />}
                  {attachment.mimeType.startsWith('video') && <Film className="w-4 h-4" />}
                  {attachment.mimeType.includes('pdf') && <FileText className="w-4 h-4" />}
                  {attachment.fileName}
                </Button>
              ))}
            </div>
            
            <Button onClick={() => handleAttachmentClick(0)}>
              Abrir Visualizador de Anexos
            </Button>
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