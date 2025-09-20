import React, { useState, useMemo, useEffect } from 'react'
import { ATTACHMENTS_ENABLED } from '../../../config/features'
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
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  X,
  FilterX
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseForm } from '../components/ExpenseForm'
import { ExpenseFiltersForm } from '../components/ExpenseFiltersForm'
import { useFirebaseExpenses } from '@/hooks/useFirebaseExpenses'
import { useFirebaseHousehold } from '@/hooks/useFirebaseHousehold'
import { useAuth } from '@/hooks/useAuth'
import { firebaseExpenseService } from '@/services/firebaseExpenseService'
import { 
  useBudgetSummary,
  useCategories,
} from '../hooks/useExpenses'
import { Expense, ExpenseFilter } from '../types'
import { toast } from 'sonner'
import { useExportReport } from '@/features/reports/hooks/useReports'
import { useNavigate } from 'react-router-dom'

export function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showMonthPicker, setShowMonthPicker] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<ExpenseFilter>({})
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)

  const navigate = useNavigate()
  const exportReport = useExportReport()

  // Firebase hooks
  const { currentHousehold, loading: householdLoading } = useFirebaseHousehold()
  const { user } = useAuth()
  const fixedHouseholdId = currentHousehold?.id || '84d0cc61-1d5b-4cc6-8514-6388ce351bd8'
  
  const {
    expenses: monthlyExpenses, 
    loading: expensesLoading, 
    createExpense, 
    updateExpense, 
    deleteExpense 
  } = useFirebaseExpenses(fixedHouseholdId)

  const { data: categories = [] } = useCategories()
  const { data: budgetSummary } = useBudgetSummary(format(currentMonth, 'yyyy-MM'))

  // Error boundary para capturar erros
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('❌ Erro capturado:', event.error)
      setPageError(event.error?.message || 'Erro desconhecido')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Scroll listener para colapsar header
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 8
      setHeaderCollapsed(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Se há erro na página, mostrar mensagem amigável
  if (pageError) {
    return (
      <div className="readable space-consistent min-h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg padding-consistent-sm mb-4">
          <h3 className="font-semibold text-red-800 mb-2">Ops! Algo deu errado</h3>
          <p className="text-red-700 mb-4">
            {pageError}
          </p>
          <Button 
            onClick={() => {
              setPageError(null)
              window.location.reload()
            }}
            className="button-secondary-touch gap-2"
          >
            <span>🔄</span>
            Recarregar Página
          </Button>
        </div>
      </div>
    )
  }

  // Filtrar expenses localmente
  const filteredExpenses = useMemo(() => {
    console.log('🔍 FILTRO - monthlyExpenses originais:', monthlyExpenses)
    return monthlyExpenses || []
  }, [monthlyExpenses, searchText, activeFilters, categories])

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

  // Calculate summary data
  const summaryData = useMemo(() => {
    const totalMonth = monthlyExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0)
    const budget = budgetSummary?.totalBudget || 0
    const remaining = Math.max(0, budget - totalMonth)
    
    const dailyAverage = totalMonth / new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const projection = dailyAverage * 30
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

  const handleResetFilters = () => {
    setActiveFilters({})
    setSearchText('')
  }

  // Expense handlers
  const handleCreateExpense = async (data: any) => {
    console.log('🚀 INICIANDO handleCreateExpense')
    
    if (!user) {
      console.error('❌ Usuário não autenticado')
      toast.error('Você precisa fazer login para criar despesas')
      return
    }

    let householdId = currentHousehold?.id
    if (!householdId) {
      householdId = '84d0cc61-1d5b-4cc6-8514-6388ce351bd8'
    }

    try {
      const paymentMethodMap: Record<string, 'money' | 'card' | 'pix' | 'transfer'> = {
        'dinheiro': 'money',
        'cartao_credito': 'card',
        'cartao_debito': 'card',
        'pix': 'pix',
        'transferencia': 'transfer',
        'boleto': 'transfer'
      }
      
      if (!data.title || !data.amount || !data.categoryId) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }
      
      const expenseData = {
        description: data.title,
        amount: Number(data.amount),
        category: data.categoryId,
        paymentMethod: paymentMethodMap[data.paymentMethod as keyof typeof paymentMethodMap] || 'money',
        householdId: householdId,
        createdBy: user.id,
        ...(data.notes && { notes: data.notes }),
        ...(data.tags && { tags: data.tags }),
        ...(data.attachments && { attachments: data.attachments }),
      }
      
      if (!ATTACHMENTS_ENABLED) {
        expenseData.attachments = []
      }

      const expenseId = await firebaseExpenseService.createExpense(expenseData)
      console.log('✅ Despesa criada com ID:', expenseId)
      
      setShowExpenseForm(false)
      toast.success('Despesa criada com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao criar despesa:', error)
      toast.error('Erro ao criar despesa: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const handleUpdateExpense = async (data: any) => {
    if (!editingExpense) return
    
    try {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
      toast.success('Despesa atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar despesa')
    }
  }

  const handleDeleteExpense = async (expense: any) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    
    try {
      await deleteExpense(expense.id)
      toast.success('Despesa excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir despesa')
    }
  }

  const handleDuplicateExpense = async (expense: any) => {
    try {
      await createExpense({
        ...expense,
        id: undefined,
        createdAt: undefined,
        syncVersion: undefined
      })
      toast.success('Despesa duplicada com sucesso!')
    } catch (error) {
      toast.error('Erro ao duplicar despesa')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
  }

  return (
    <>
      {/* Main Content com Safe Area */}
      <main 
        className="safe-bottom content-with-fab readable space-consistent min-h-full"
        role="main"
        aria-label="Lista de despesas"
      >
        {/* Summary Card Otimizado */}
        <ExpenseSummaryCard
          {...summaryData}
          isLoading={expensesLoading}
        />

        {/* Centralized search bar */}
        <div className="py-3">
          <div className="readable">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <Input
                placeholder="Buscar despesas..."
                value={searchText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                className="pl-12 pr-28 h-11 bg-zinc-900/70 text-white border border-zinc-800 focus:bg-zinc-900 transition-colors"
                aria-label="Buscar despesas"
                role="searchbox"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <button
                      aria-label={`Filtros${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
                      className="button-icon-touch hover:bg-white/5 rounded-md transition-colors p-2 text-white"
                    >
                      <span aria-hidden="true" className="mr-1">🧪</span>
                      <Filter className="h-4 w-4 text-white" />
                    </button>
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

                <button
                  aria-label="Selecionar mês"
                  className="button-icon-touch hover:bg-white/5 rounded-md transition-colors p-2 text-white"
                  onClick={() => setShowMonthPicker(true)}
                >
                  <span aria-hidden="true" className="mr-1">📅</span>
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              <FilterX className="h-3 w-3" aria-hidden="true" />
              <span>Filtros:</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="btn-touch-safe-sm text-xs">
              Limpar
            </Button>
          </motion.div>
        )}

        {/* Expense List */}
        <ExpenseList
          expenses={filteredExpenses as any}
          categories={categories}
          onEdit={handleEditExpense}
          onDuplicate={handleDuplicateExpense}
          onDelete={handleDeleteExpense}
          onViewAttachments={() => {}}
          isLoading={expensesLoading}
          emptyMessage={
            searchText.trim() || activeFilterCount > 0
              ? "Nenhuma despesa encontrada com os filtros aplicados"
              : "Nenhuma despesa neste mês. Clique em 'Nova Despesa' para começar."
          }
        />

        {/* Floating Action Button (FAB) */}
        <Button
          onClick={() => setShowExpenseForm(true)}
          className="fixed fab-safe-bottom right-5 h-14 w-14 min-h-[56px] min-w-[56px] rounded-full shadow-2xl hover:shadow-2xl transition-all duration-200 z-50 bg-blue-600 hover:bg-blue-700 active:scale-95 flex items-center justify-center focus-visible"
          size="default"
          aria-label="Adicionar nova despesa"
          style={{
            boxShadow: '0 8px 25px -8px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Button>
      </main>

      {/* Dialogs */}
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
            isLoading={false}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showMonthPicker} onOpenChange={setShowMonthPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecionar mês</DialogTitle>
            <DialogDescription>Escolha o mês para visualizar as despesas</DialogDescription>
          </DialogHeader>
          <div className="py-2 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>◀</Button>
            <div className="text-center">
              <div className="font-medium">{format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}</div>
            </div>
            <Button variant="outline" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>▶</Button>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowMonthPicker(false)}>Cancelar</Button>
            <Button onClick={() => setShowMonthPicker(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

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
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}