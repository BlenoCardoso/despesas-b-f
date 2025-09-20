import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVExportService } from '../services/csvExport'
import { ExportRangeDialog } from './ExportRangeDialog'

interface Props {
  householdId: string
  expenses: Array<{
    id: string
    description: string
    amount: number
    paidBy: string
    categoryId?: string
    createdAt: Date
  }>
  members: Array<{
    id: string
    name: string
  }>
  categories: Array<{
    id: string
    name: string
  }>
  className?: string
}

export function ExportButtons({ 
  householdId,
  expenses,
  members,
  categories,
  className 
}: Props) {
  const [loading, setLoading] = useState(false)

  // Helper para exportar
  const handleExport = async (
    range: { start: Date; end: Date },
    label: string
  ) => {
    try {
      setLoading(true)

      // Filtra despesas do período
      const filtered = expenses.filter(expense => {
        const date = expense.createdAt
        return date >= range.start && date <= range.end
      })

      // Gera CSV
      const csv = CSVExportService.generateCSV(
        filtered,
        members,
        categories
      )

      // Nome do arquivo
      const filename = [
        'despesas',
        householdId,
        label,
        format(new Date(), 'yyyy-MM-dd-HHmm')
      ].join('_') + '.csv'

      // Faz download
      CSVExportService.downloadCSV(csv, filename)

    } catch (error) {
      console.error('Erro ao exportar:', error)
    } finally {
      setLoading(false)
    }
  }

  // Exportar mês atual
  const handleExportCurrentMonth = () => {
    const today = new Date()
    handleExport(
      {
        start: startOfMonth(today),
        end: endOfMonth(today)
      },
      format(today, 'yyyy-MM')
    )
  }

  // Exportar período customizado
  const handleExportRange = (range: { start: Date; end: Date }) => {
    handleExport(
      range,
      format(range.start, 'yyyy-MM-dd') + '_' + format(range.end, 'yyyy-MM-dd')
    )
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExportCurrentMonth}
          disabled={loading}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Exportar Mês Atual
        </Button>

        <ExportRangeDialog
          onExport={handleExportRange}
        />
      </div>
    </div>
  )
}