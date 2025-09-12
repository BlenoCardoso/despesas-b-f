import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AttachmentViewer } from '@/components/AttachmentViewer'
import { Attachment } from '@/types/global'
import { FileText, Image, Film } from 'lucide-react'

export function AttachmentViewerDemo() {
  const [showViewer, setShowViewer] = useState(false)
  
  // Anexos de demonstração
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

  return (
    <>
      <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Visualizador de Anexos - Demonstração
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Teste o novo visualizador de anexos com arquivos de demonstração.
        </p>
        
        <div className="flex flex-wrap gap-2">
          {demoAttachments.map((attachment, index) => (
            <Button
              key={attachment.id}
              variant="outline"
              size="sm"
              onClick={() => setShowViewer(true)}
              className="flex items-center gap-2"
            >
              {attachment.mimeType.startsWith('image') && <Image className="w-4 h-4" />}
              {attachment.mimeType.startsWith('video') && <Film className="w-4 h-4" />}
              {attachment.mimeType.includes('pdf') && <FileText className="w-4 h-4" />}
              {attachment.fileName}
            </Button>
          ))}
        </div>
        
        <Button onClick={() => setShowViewer(true)}>
          Abrir Visualizador de Anexos
        </Button>
      </div>

      <AttachmentViewer
        attachments={demoAttachments}
        initialIndex={0}
        open={showViewer}
        onClose={() => setShowViewer(false)}
      />
    </>
  )
}