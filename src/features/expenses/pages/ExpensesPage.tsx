import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Filter, 
  Search, 
  Download,
  Upload,
  Settings,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseForm } from '../components/ExpenseForm'
import { AttachmentViewer } from '@/components/AttachmentViewer'
import { AttachmentViewerDemo } from '@/components/AttachmentViewerDemo'
import { ExpenseFiltersForm } from '../components/ExpenseFiltersForm'
import { 
  useExpenses, 
  useFilteredExpenses,
  useMonthlyExpenses,
  useCategories,
  useBudgetSummary,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useDuplicateExpense
} from '../hooks/useExpenses'
import { useCurrentHousehold } from '@/core/store'
import { Expense, ExpenseFilter } from '../types'
import { Attachment } from '@/types/global'
import { calculateDailyAverage, calculateMonthlyProjection, calculateMonthlyVariation } from '@/core/utils/calculations'
import { formatCurrency } from '@/core/utils/formatters'
import { toast } from 'sonner'
import { useExportReport } from '@/features/reports/hooks/useReports'
import { useNavigate } from 'react-router-dom'

export function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<ExpenseFilter>({})
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const currentHousehold = useCurrentHousehold()
  const currentMonthStr = format(currentMonth, 'yyyy-MM')
  const navigate = useNavigate()
  const exportReport = useExportReport()

  // Queries
  const { data: categories = [] } = useCategories()
  const { data: budgetSummary } = useBudgetSummary(currentMonthStr)
  
  // Use filtered expenses hook
  const { data: filteredExpenses = [], isLoading: expensesLoading } = useFilteredExpenses(
    {
      ...activeFilters,
      startDate: startOfMonth(currentMonth),
      endDate: endOfMonth(currentMonth)
    },
    searchText
  )

  // Mutations
  const createExpenseMutation = useCreateExpense()
  const updateExpenseMutation = useUpdateExpense()
  const deleteExpenseMutation = useDeleteExpense()
  const duplicateExpenseMutation = useDuplicateExpense()

  // Keep for backward compatibility - remove the old filtering logic
  const monthlyExpenses = filteredExpenses

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.categoryIds?.length) count++
    if (activeFilters.paymentMethods?.length) count++
    if (activeFilters.minAmount !== undefined) count++
    if (activeFilters.maxAmount !== undefined) count++
    if (activeFilters.hasRecurrence) count++
    if (activeFilters.hasInstallments) count++
    if (searchText.trim()) count++
    return count
  }, [activeFilters, searchText])

  // Old filtering logic - now handled by useFilteredExpenses hook
  /*
  const filteredExpenses = useMemo(() => {
    let filtered = monthlyExpenses

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(search) ||
        expense.notes?.toLowerCase().includes(search) ||
        categories.find(cat => cat.id === expense.categoryId)?.name.toLowerCase().includes(search)
      )
    }

    // Additional filters
    if (activeFilters.categoryIds?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.categoryIds!.includes(expense.categoryId)
      )
    }

    if (activeFilters.paymentMethods?.length) {
      filtered = filtered.filter(expense => 
        activeFilters.paymentMethods!.includes(expense.paymentMethod)
      )
    }

    if (activeFilters.minAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount >= activeFilters.minAmount!)
    }

    if (activeFilters.maxAmount !== undefined) {
      filtered = filtered.filter(expense => expense.amount <= activeFilters.maxAmount!)
    }

    return filtered
  }, [monthlyExpenses, searchText, activeFilters, categories])
  */

  // Calculate summary data
  const summaryData = useMemo(() => {
    const totalMonth = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const budget = budgetSummary?.totalBudget || 0
    const remaining = Math.max(0, budget - totalMonth)
    const dailyAverage = calculateDailyAverage(monthlyExpenses, currentMonth)
    const projection = calculateMonthlyProjection(monthlyExpenses, currentMonth)
    
    // Calculate variation from last month (mock data for now)
    const variationFromLastMonth = 0 // TODO: Implement actual calculation

    return {
      totalMonth,
      budget,
      remaining,
      dailyAverage,
      projection,
      variationFromLastMonth,
    }
  }, [monthlyExpenses, budgetSummary, currentMonth])

  // Filter handlers
  const handleFiltersChange = (filters: ExpenseFilter) => {
    setActiveFilters(filters)
  }

  const handleSearchChange = (text: string) => {
    setSearchText(text)
  }

  const handleResetFilters = () => {
    setActiveFilters({})
    setSearchText('')
  }

  // Handlers
  const handleCreateExpense = async (data: any) => {
    try {
      await createExpenseMutation.mutateAsync(data)
      setShowExpenseForm(false)
      toast.success('Despesa criada com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar despesa')
    }
  }

  const handleUpdateExpense = async (data: any) => {
    if (!editingExpense) return
    
    try {
      await updateExpenseMutation.mutateAsync({ id: editingExpense.id, data })
      setEditingExpense(null)
      toast.success('Despesa atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar despesa')
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    
    try {
      await deleteExpenseMutation.mutateAsync(expense.id)
      toast.success('Despesa excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir despesa')
    }
  }

  const handleDuplicateExpense = async (expense: Expense) => {
    try {
      await duplicateExpenseMutation.mutateAsync(expense.id)
      toast.success('Despesa duplicada com sucesso!')
    } catch (error) {
      toast.error('Erro ao duplicar despesa')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
  }

  const [viewingAttachments, setViewingAttachments] = useState<{
    attachments: Attachment[]
    index?: number
  } | null>(null)

  const handleViewAttachments = (expense: Expense) => {
    if (expense.attachments && expense.attachments.length > 0) {
      setViewingAttachments({
        attachments: expense.attachments,
        index: 0
      })
    } else {
      toast.info('Esta despesa não possui anexos')
    }
  }

  // Handler para exportar despesas
  const handleExportExpenses = () => {
    // Criar um menu dropdown ou modal para escolher o formato
    const exportOptions = [
      { label: 'CSV', format: 'csv' as const },
      { label: 'Excel', format: 'excel' as const },
      { label: 'PDF', format: 'pdf' as const }
    ]

    // Por enquanto, vamos criar botões para cada opção
    const createExportButton = (format: 'csv' | 'excel' | 'pdf') => {
      const button = document.createElement('button')
      button.textContent = `Exportar ${format.toUpperCase()}`
      button.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2'
      button.onclick = () => handleExportFormat(format)
      return button
    }

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h3 class="text-lg font-semibold mb-4">Escolha o formato de exportação</h3>
        <div class="flex gap-2 mb-4">
          <button id="csv-btn" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">CSV</button>
          <button id="excel-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Excel</button>
          <button id="pdf-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">PDF</button>
        </div>
        <button id="cancel-btn" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add event listeners
    modal.querySelector('#csv-btn')?.addEventListener('click', () => {
      handleExportFormat('csv')
      document.body.removeChild(modal)
    })
    modal.querySelector('#excel-btn')?.addEventListener('click', () => {
      handleExportFormat('excel')
      document.body.removeChild(modal)
    })
    modal.querySelector('#pdf-btn')?.addEventListener('click', () => {
      handleExportFormat('pdf')
      document.body.removeChild(modal)
    })
    modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const handleExportFormat = async (exportFormat: 'csv' | 'excel' | 'pdf') => {
    try {
      const expensesToExport = filteredExpenses.map(expense => ({
        data: format(new Date(expense.date), 'dd/MM/yyyy'),
        descricao: expense.title,
        categoria: categories.find(c => c.id === expense.categoryId)?.name || 'Não categorizada',
        valor: expense.amount,
        metodo_pagamento: expense.paymentMethod,
        notas: expense.notes || ''
      }))

      const filename = `despesas_${format(currentMonth, 'yyyy-MM')}`

      if (exportFormat === 'pdf') {
        // Para PDF, usar os dados de relatório mais completos
        const { reportService } = await import('@/features/reports/services/reportService')
        const reportData = {
          period: format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR }),
          totalExpenses: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
          totalIncome: 0,
          balance: -filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
          expensesByCategory: categories.map(cat => {
            const categoryExpenses = filteredExpenses.filter(exp => exp.categoryId === cat.id)
            const amount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            return {
              category: cat.name,
              amount,
              percentage: filteredExpenses.length > 0 ? (amount / filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100 : 0,
              count: categoryExpenses.length
            }
          }).filter(cat => cat.amount > 0)
        }
        
        const pdfBlob = await reportService.exportToPDF(reportData, 'expenses')
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else if (exportFormat === 'excel') {
        const { reportService } = await import('@/features/reports/services/reportService')
        const excelBlob = await reportService.exportToExcel(expensesToExport, filename)
        const url = window.URL.createObjectURL(excelBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        await exportReport.mutateAsync({
          data: expensesToExport,
          format: exportFormat as 'csv',
          filename
        })
      }

      toast.success(`Despesas exportadas em ${exportFormat.toUpperCase()} com sucesso!`)
    } catch (error) {
      toast.error(`Erro ao exportar despesas em ${exportFormat.toUpperCase()}`)
    }
  }

  // Handler para importar despesas
  const handleImportExpenses = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast.info('Funcionalidade de importação em desenvolvimento')
        // TODO: Implementar importação de arquivo
      }
    }
    input.click()
  }

  // Handler para navegar para relatórios
  const handleViewReports = () => {
    navigate('/reports')
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-gray-600">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExpenses}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleImportExpenses}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewReports}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          
          <Button onClick={() => setShowExpenseForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Demo do Visualizador de Anexos - Remover após teste */}
      <AttachmentViewerDemo />

      {/* Summary Card */}
      <ExpenseSummaryCard
        {...summaryData}
        isLoading={expensesLoading}
      />

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar despesas..."
            value={searchText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col h-full">
            <SheetHeader className="shrink-0">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Filtre suas despesas por categoria, forma de pagamento e valor
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 min-h-0 -mx-6 px-6">
              <ExpenseFiltersForm
                filters={activeFilters}
                categories={categories}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          {format(currentMonth, "MMM yyyy", { locale: ptBR })}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="text-sm text-gray-500">Filtros ativos:</span>
          {searchText.trim() && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{searchText}"
              <button onClick={() => setSearchText('')}>×</button>
            </Badge>
          )}
          
          {activeFilters.categoryIds?.length && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.categoryIds.length} categoria{activeFilters.categoryIds.length > 1 ? 's' : ''}
              <button onClick={() => setActiveFilters(prev => ({ ...prev, categoryIds: [] }))}>×</button>
            </Badge>
          )}
          
          {activeFilters.paymentMethods?.length && (
            <Badge variant="secondary" className="gap-1">
              {activeFilters.paymentMethods.length} forma{activeFilters.paymentMethods.length > 1 ? 's' : ''} de pagamento
              <button onClick={() => setActiveFilters(prev => ({ ...prev, paymentMethods: [] }))}>×</button>
            </Badge>
          )}
          
          {(activeFilters.minAmount !== undefined || activeFilters.maxAmount !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Valor: {activeFilters.minAmount !== undefined ? `≥${formatCurrency(activeFilters.minAmount)}` : ''}{activeFilters.minAmount !== undefined && activeFilters.maxAmount !== undefined ? ' e ' : ''}{activeFilters.maxAmount !== undefined ? `≤${formatCurrency(activeFilters.maxAmount)}` : ''}
              <button onClick={() => setActiveFilters(prev => ({ ...prev, minAmount: undefined, maxAmount: undefined }))}>×</button>
            </Badge>
          )}
          
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Limpar todos
          </Button>
        </motion.div>
      )}

      {/* Expense List */}
      <ExpenseList
        expenses={filteredExpenses}
        categories={categories}
        onEdit={handleEditExpense}
        onDuplicate={handleDuplicateExpense}
        onDelete={handleDeleteExpense}
        onViewAttachments={handleViewAttachments}
        isLoading={expensesLoading}
        emptyMessage={
          searchText.trim() || activeFilterCount > 0
            ? "Nenhuma despesa encontrada com os filtros aplicados"
            : "Nenhuma despesa neste mês. Clique em 'Nova Despesa' para começar."
        }
      />

      {/* Create Expense Dialog */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
            <DialogDescription>
              Adicione uma nova despesa ao seu orçamento
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            categories={categories}
            onSubmit={handleCreateExpense}
            onCancel={() => setShowExpenseForm(false)}
            isLoading={createExpenseMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
            <DialogDescription>
              Modifique os dados da despesa
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              categories={categories}
              onSubmit={handleUpdateExpense}
              onCancel={() => setEditingExpense(null)}
              isLoading={updateExpenseMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Visualizador de Anexos */}
      {viewingAttachments && (
        <AttachmentViewer
          attachments={viewingAttachments.attachments}
          initialIndex={viewingAttachments.index}
          open={!!viewingAttachments}
          onClose={() => setViewingAttachments(null)}
        />
      )}
    </div>
  )
}

