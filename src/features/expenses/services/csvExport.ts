import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/utils/format'

interface Member {
  id: string
  name: string
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  categoryId?: string
  createdAt: Date
}

interface Category {
  id: string
  name: string
}

export class CSVExportService {
  // Separador padrão para Excel BR
  private static readonly SEPARATOR = ';'
  private static readonly ENCODING = 'utf-8'

  // Gera CSV das despesas
  static generateCSV(
    expenses: Expense[],
    members: Member[],
    categories: Category[]
  ): string {
    // Cabeçalho
    const headers = [
      'Data',
      'Descrição',
      'Valor',
      'Categoria',
      'Pago por'
    ]

    // Linhas de dados
    const rows = expenses.map(expense => {
      const member = members.find(m => m.id === expense.paidBy)
      const category = categories.find(c => c.id === expense.categoryId)

      return [
        format(expense.createdAt, 'dd/MM/yyyy'),
        this.escapeField(expense.description),
        formatCurrency(expense.amount).replace('R$', '').trim(),
        this.escapeField(category?.name || ''),
        this.escapeField(member?.name || '')
      ]
    })

    // Monta CSV
    return [
      headers.join(this.SEPARATOR),
      ...rows.map(row => row.join(this.SEPARATOR))
    ].join('\n')
  }

  // Faz download do arquivo
  static downloadCSV(csv: string, filename: string): void {
    // Adiciona BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], {
      type: 'text/csv;charset=' + this.ENCODING
    })

    // Cria link e dispara download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Escapa campo para CSV
  private static escapeField(value: string): string {
    const needsQuotes = value.includes(this.SEPARATOR) || 
      value.includes('"') ||
      value.includes('\n')

    if (!needsQuotes) return value

    // Escapa aspas duplicando-as
    return '"' + value.replace(/"/g, '""') + '"'
  }
}