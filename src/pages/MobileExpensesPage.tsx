import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useHouseholds } from '@/hooks/useHouseholds'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ExpenseList } from '@/components/ui/expense-list'
import { ExpenseStats } from '@/components/ui/expense-stats-new'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mobile-card'
import { Plus, Search, Filter, Users, TrendingUp, Calendar, ChevronDown, Settings } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ExpenseFormData, Expense } from '@/services/expenseService'
import { animated, useSpring } from '@react-spring/web'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Categorias padrão com ícones
const categories = [
  { id: 'food', name: 'Alimentação', icon: '🍽️', color: '#ef4444' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'home', name: 'Casa', icon: '🏠', color: '#10b981' },
  { id: 'entertainment', name: 'Entretenimento', icon: '🎬', color: '#8b5cf6' },
  { id: 'health', name: 'Saúde', icon: '⚕️', color: '#f59e0b' },
  { id: 'education', name: 'Educação', icon: '📚', color: '#06b6d4' },
  { id: 'other', name: 'Outros', icon: '💰', color: '#6b7280' }
]

// Formulário de despesa mobile-optimized
function MobileExpenseForm({ 
  onSubmit, 
  onCancel, 
  expense 
}: { 
  onSubmit: (data: ExpenseFormData) => void
  onCancel: () => void
  expense?: Expense 
}) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: expense?.title || '',
    amount: expense?.amount || 0,
    category: expense?.category || 'other',
    date: expense?.date || new Date(),
    notes: expense?.notes || '',
    paymentMethod: expense?.paymentMethod || 'dinheiro',
    participants: expense?.participants || [user?.id || ''],
    sharedPercentages: expense?.sharedPercentages || { [user?.id || '']: 100 }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Por favor, adicione um título para a despesa')
      return
    }
    if (formData.amount <= 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }
    onSubmit(formData)
  }

  const selectedCategory = categories.find(c => c.id === formData.category) || categories[categories.length - 1]

  return (
    <div className="p-1">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Título da despesa</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Supermercado, Aluguel..."
            className="text-base prevent-zoom"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Valor</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="0,00"
              className="text-base prevent-zoom"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Data</label>
            <Input
              type="date"
              value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
              className="text-base prevent-zoom"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 touch-target ${
                  formData.category === category.id
                    ? 'border-primary bg-primary/10 text-primary shadow-glow'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="text-xl mb-1">{category.icon}</div>
                <div className="text-xs font-medium">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Observações (opcional)</label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Detalhes adicionais..."
            className="text-base prevent-zoom"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1 h-12 touch-target"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex-1 h-12 touch-target"
          >
            {expense ? 'Atualizar' : 'Criar'} Despesa
          </Button>
        </div>
      </form>
    </div>
  )
}

export function MobileExpensesPage() {
  const { user } = useAuth()
  const { currentHousehold, generateInviteCode } = useHouseholds()
  const { 
    expenses, 
    loading, 
    createExpense, 
    updateExpense, 
    deleteExpense
  } = useExpenses()

  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showStats, setShowStats] = useState(false)

  // Animation for the main content
  const fadeIn = useSpring({
    opacity: loading ? 0 : 1,
    transform: loading ? 'translateY(20px)' : 'translateY(0px)',
    config: { tension: 280, friction: 60 }
  })

  // Filtrar despesas
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.title.toLowerCase().includes(searchText.toLowerCase()) ||
                           expense.notes?.toLowerCase().includes(searchText.toLowerCase())
      const matchesCategory = !selectedCategory || expense.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [expenses, searchText, selectedCategory])

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const thisMonth = filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    })
    const monthTotal = thisMonth.reduce((sum, expense) => sum + expense.amount, 0)
    
    return {
      total,
      monthTotal,
      count: filteredExpenses.length,
      monthCount: thisMonth.length
    }
  }, [filteredExpenses])

  const handleCreateExpense = async (data: ExpenseFormData) => {
    try {
      await createExpense(data)
      setShowForm(false)
      toast.success('Despesa criada com sucesso!')
    } catch (error) {
      toast.error('Erro ao criar despesa')
    }
  }

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!editingExpense) return
    
    try {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
      setShowForm(false)
      toast.success('Despesa atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar despesa')
    }
  }

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id)
      toast.success('Despesa excluída com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir despesa')
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleGenerateInvite = async () => {
    try {
      await generateInviteCode()
      toast.success('Código de convite gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar código de convite')
    }
  }

  if (loading) {
    return (
      <div className="container-fluid min-h-screen-safe flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Carregando despesas...</p>
        </div>
      </div>
    )
  }

  return (
    <animated.div style={fadeIn} className="container-fluid min-h-screen-safe pb-20">
      {/* Header Compacto */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b safe-area-insets">
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-fluid-2xl font-bold text-foreground truncate">
                Despesas
              </h1>
              <p className="text-fluid-sm text-muted-foreground truncate">
                {currentHousehold?.name || 'Nenhuma household selecionada'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleGenerateInvite} 
                variant="outline" 
                size="sm"
                className="touch-target"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="touch-target">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh]">
                  <SheetHeader>
                    <SheetTitle>Estatísticas e Gráficos</SheetTitle>
                    <SheetDescription>
                      Análise detalhada dos seus gastos
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 mobile-scroll h-full overflow-y-auto">
                    <ExpenseStats expenses={expenses} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Stats compactos */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <div>
                    <p className="text-xs text-primary-600 font-medium">Este Mês</p>
                    <p className="text-sm font-bold text-primary-700">
                      {formatCurrency(stats.monthTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-secondary-600" />
                  <div>
                    <p className="text-xs text-secondary-600 font-medium">Total Geral</p>
                    <p className="text-sm font-bold text-secondary-700">
                      {formatCurrency(stats.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="py-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-12 text-base prevent-zoom"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between touch-target">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>
                    {selectedCategory ? 
                      categories.find(c => c.id === selectedCategory)?.name || 'Categoria' : 
                      'Todas as categorias'
                    }
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => setSelectedCategory('')}>
                Todas as categorias
              </DropdownMenuItem>
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category.id} 
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="pb-6">
        <ExpenseList 
          expenses={filteredExpenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          groupByDate={true}
          showPaidBy={true}
        />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onClick={() => setShowForm(true)}
        className="animate-bounce-in"
      />

      {/* Dialog do Formulário */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open)
        if (!open) {
          setEditingExpense(null)
        }
      }}>
        <DialogContent className="max-w-md h-[90vh] overflow-y-auto mobile-scroll">
          <DialogHeader>
            <DialogTitle className="text-fluid-lg">
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          
          <MobileExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
            onCancel={() => {
              setShowForm(false)
              setEditingExpense(null)
            }}
            expense={editingExpense}
          />
        </DialogContent>
      </Dialog>
    </animated.div>
  )
}