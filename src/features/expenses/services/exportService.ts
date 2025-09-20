import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { db } from '@/lib/db'
import type { Expense, Category, Member, User } from '@/types'

// Tipos para agrupamento
interface GroupTotal {
  count: number
  total: number
}

interface ExportRow {
  date: string
  title: string 
  amount: string
  category?: string
  paidBy?: string
  notes?: string
}

// Opções de exportação
export interface ExportOptions {
  householdId: string
  startDate: Date
  endDate: Date
  includeCategories: boolean
  includePayers: boolean
  includeNotes: boolean
}

export class ExportService {
  // Buscar dados para exportação
  private async getExportData(options: ExportOptions) {
    // Buscar despesas do período
    const expenses = await db.expenses
      .where('householdId')
      .equals(options.householdId)
      .and(expense => {
        const date = new Date(expense.date)
        return date >= options.startDate && 
               date <= options.endDate &&
               !expense.deletedAt
      })
      .toArray()

    // Se não há despesas, retorna erro
    if (!expenses.length) {
      throw new Error('Não há despesas no período selecionado')
    }

    // Carregar dados relacionados em paralelo
    const [categories, members] = await Promise.all([
      options.includeCategories 
        ? db.categories
            .where('householdId')
            .equals(options.householdId)
            .toArray()
        : Promise.resolve([]),

      options.includePayers
        ? db.householdMembers
            .where('householdId')
            .equals(options.householdId)
            .toArray()
            .then(async members => {
              // Carregar detalhes dos usuários
              const users = await Promise.all(
                members.map(m => db.users.get(m.userId))
              )
              return members.map((m, i) => ({
                ...m,
                user: users[i]
              }))
            })
        : Promise.resolve([])
    ])

    // Mapear categorias e membros para lookup rápido
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    const memberMap = new Map(members.map(m => [m.userId, m.user?.name || m.userId]))

    // Preparar linhas para exportação
    const rows = expenses.map(expense => ({
      date: format(new Date(expense.date), 'dd/MM/yyyy'),
      title: expense.title,
      amount: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(expense.amount),
      category: categoryMap.get(expense.categoryId) || expense.categoryId,
      paidBy: memberMap.get(expense.paidById) || expense.paidById,
      notes: expense.notes || ''
    }))

    // Calcular totais
    const totals = {
      count: expenses.length,
      amount: expenses.reduce((sum, e) => sum + e.amount, 0),
      byCategory: options.includeCategories 
        ? this.groupBy(expenses, e => categoryMap.get(e.categoryId) || e.categoryId)
        : null,
      byPayer: options.includePayers
        ? this.groupBy(expenses, e => memberMap.get(e.paidById) || e.paidById)
        : null
    }

    return { rows, totals }
  }

  // Exportar para CSV
  async exportCSV(options: ExportOptions): Promise<string> {
    const { rows } = await this.getExportData(options)

    // Definir colunas com base nas opções
    const columns = ['Data', 'Título', 'Valor']
    if (options.includeCategories) columns.push('Categoria')
    if (options.includePayers) columns.push('Pago por')
    if (options.includeNotes) columns.push('Observações')

    // Converter para CSV
    const csvRows = rows.map(row => {
      const values = [row.date, row.title, row.amount]
      if (options.includeCategories) values.push(row.category)
      if (options.includePayers) values.push(row.paidBy)
      if (options.includeNotes) values.push(row.notes)
      return values.map(v => `"${v}"`).join(',')
    })

    return [columns.join(','), ...csvRows].join('\n')
  }

  // Exporta para PDF
  async exportPDF(options: ExportOptions): Promise<jsPDF> {
    const { rows, totals } = await this.getExportData(options)
    const doc = new jsPDF()

    // Título
    doc.setFontSize(16)
    doc.text('Relatório de Despesas', 14, 20)

    // Período
    doc.setFontSize(12)
    doc.text(
      `Período: ${format(options.startDate, 'dd/MM/yyyy')} a ${format(options.endDate, 'dd/MM/yyyy')}`,
      14, 
      30
    )

    // Configuração da tabela
    type Column = { header: string; dataKey: keyof ExportRow }
    const columns: Column[] = [
      { header: 'Data', dataKey: 'date' },
      { header: 'Título', dataKey: 'title' },
      { header: 'Valor', dataKey: 'amount' }
    ]

    if (options.includeCategories) {
      columns.push({ header: 'Categoria', dataKey: 'category' } as Column)
    }
    if (options.includePayers) {
      columns.push({ header: 'Pago por', dataKey: 'paidBy' } as Column)
    }
    if (options.includeNotes) {
      columns.push({ header: 'Observações', dataKey: 'notes' } as Column)
    }

    // Tabela de despesas
    doc.autoTable({
      startY: 40,
      columns,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [41, 128, 185] },
      foot: [[
        { content: 'Total', colSpan: 2 },
        { 
          content: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(totals.amount)
        }
      ]]
    })

    // Buscar última posição Y da tabela
    const finalY = (doc as any).lastAutoTable.finalY as number

    // Adicionar resumos
    if (totals.byCategory) {
      // Título do resumo
      doc.text('Resumo por Categoria', 14, finalY + 20)

      // Converter dados
      const categoryRows = Object.entries(totals.byCategory)
        .map(([category, { total }]: [string, GroupTotal]) => ({
          name: category,
          total: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(total)
        }))

      // Tabela de resumo por categoria
      doc.autoTable({
        startY: finalY + 30,
        columns: [
          { header: 'Categoria', dataKey: 'name' },
          { header: 'Total', dataKey: 'total' }
        ],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      })
    }

    // Resumo por pagador
    if (totals.byPayer) {
      const categoryTableFinalY = (doc as any).lastAutoTable.finalY as number

      // Título do resumo
      doc.text('Resumo por Pagador', 14, categoryTableFinalY + 20)

      // Converter dados
      const payerRows = Object.entries(totals.byPayer)
        .map(([payer, { total }]: [string, GroupTotal]) => ({
          name: payer,
          total: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(total)
        }))

      // Tabela de resumo por pagador
      doc.autoTable({
        startY: categoryTableFinalY + 30,
        columns: [
          { header: 'Pago por', dataKey: 'name' },
          { header: 'Total', dataKey: 'total' }
        ],
        body: payerRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      })
    }

    return doc
  }

  // Exportar para imagem (captura o elemento da tabela)
  async exportImage(
    options: ExportOptions,
    tableElement: HTMLElement
  ): Promise<string> {
    const canvas = await html2canvas(tableElement, {
      backgroundColor: '#ffffff',
      scale: 2 // Melhor qualidade
    })
    
    return canvas.toDataURL('image/png')
  }

  // Helper para agrupar valores
  private groupBy(
    items: Expense[],
    keyFn: (item: Expense) => string
  ): Record<string, GroupTotal> {
    return items.reduce((acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          total: 0
        }
      }
      acc[key].count++
      acc[key].total += item.amount
      return acc
    }, {} as Record<string, GroupTotal>)
  }

  // Download do arquivo
  download(fileName: string, content: string | Blob) {
    const link = document.createElement('a')
    
    if (typeof content === 'string') {
      link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content)
    } else {
      link.href = URL.createObjectURL(content)
    }
    
    link.download = fileName
    link.click()

    if (content instanceof Blob) {
      URL.revokeObjectURL(link.href)
    }
  }
}