import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ExportService, ExportOptions } from '../services/exportService'

const exportService = new ExportService()

interface ExportConfig {
  startDate: Date
  endDate: Date
  format: 'csv' | 'pdf' | 'image'
  includeCategories: boolean
  includePayers: boolean
  includeNotes: boolean
}

// Hook para gerenciar exportação
export function useExpenseExport(householdId: string) {
  // Estado do modal
  const [isExporting, setIsExporting] = useState(false)

  // Ref para tabela (usado na exportação de imagem)
  const tableRef = useRef<HTMLElement | null>(null)

  // Mutation para exportação
  const exportMutation = useMutation({
    mutationFn: async (config: ExportConfig) => {
      try {
        const options: ExportOptions = {
          ...config,
          householdId
        }

        // Formatar nome do arquivo
        const dateStr = format(new Date(), 'yyyy-MM-dd')
        let fileName = `despesas-${dateStr}`
        
        let content: string | Blob

        switch (config.format) {
          case 'csv':
            content = await exportService.exportCSV(options)
            fileName += '.csv'
            break

          case 'pdf':
            const doc = await exportService.exportPDF(options)
            content = doc.output('blob')
            fileName += '.pdf'
            break

          case 'image':
            if (!tableRef.current) {
              throw new Error('Elemento da tabela não encontrado')
            }
            content = await exportService.exportImage(options, tableRef.current)
            fileName += '.png'
            break

          default:
            throw new Error('Formato de exportação inválido')
        }

        // Download
        exportService.download(fileName, content)

      } finally {
        setIsExporting(false)
      }
    }
  })

  return {
    isExporting,
    setIsExporting,
    exportExpenses: exportMutation.mutate,
    tableRef
  }
}