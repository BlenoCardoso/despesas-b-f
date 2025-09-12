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
import { 
  useExpenses, 
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
import { toast } from 'sonner'

export function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<ExpenseFilter>({})
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const currentHousehold = useCurrentHousehold()
  const currentMonthStr = format(currentMonth, 'yyyy-MM')

  // Queries
  const { data: monthlyExpenses = [], isLoading: expensesLoading } = useMonthlyExpenses(currentMonth)
  const { data: categories = [] } = useCategories()
  const { data: budgetSummary } = useBudgetSummary(currentMonthStr)

  // Mutations
  const createExpenseMutation = useCreateExpense()
  const updateExpenseMutation = useUpdateExpense()
  const deleteExpenseMutation = useDeleteExpense()
  const duplicateExpenseMutation = useDuplicateExpense()

  // Filter expenses based on search and filters
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

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (activeFilters.categoryIds?.length) count++
    if (activeFilters.paymentMethods?.length) count++
    if (activeFilters.minAmount !== undefined) count++
    if (activeFilters.maxAmount !== undefined) count++
    if (searchText.trim()) count++
    return count
  }, [activeFilters, searchText])

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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <Button variant="outline" size="sm">
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
            onChange={(e) => setSearchText(e.target.value)}
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
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>
                Filtre suas despesas por categoria, forma de pagamento e valor
              </SheetDescription>
            </SheetHeader>
            {/* TODO: Implement filter form */}
            <div className="mt-6">
              <p className="text-sm text-gray-500">Filtros em desenvolvimento...</p>
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
          {/* TODO: Add other active filter badges */}
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

