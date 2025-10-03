import { useState } from 'react'
import { useExpenses } from '@/hooks/useExpenses'
import { useHouseholds } from '@/hooks/useHouseholds'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, CreditCard, Share2, Users, CheckCircle, XCircle, MoreHorizontal, Copy, Trash2, Edit, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/utils/formatters'
import { toast } from 'sonner'
import { ExpenseFormData } from '@/services/expenseService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Categorias padrão
const categories = [
  { id: 'alimentacao', name: 'Alimentação', icon: '🍔', color: '#EF4444' },
  { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#3B82F6' },
  { id: 'moradia', name: 'Moradia', icon: '🏠', color: '#10B981' },
  { id: 'lazer', name: 'Lazer', icon: '🎮', color: '#8B5CF6' },
  { id: 'saude', name: 'Saúde', icon: '💊', color: '#F59E0B' },
  { id: 'educacao', name: 'Educação', icon: '📚', color: '#06B6D4' },
  { id: 'outros', name: 'Outros', icon: '📦', color: '#6B7280' }
]

// Formulário de despesa
function ExpenseForm({ 
  onSubmit, 
  onCancel, 
  expense 
}: { 
  onSubmit: (data: ExpenseFormData) => void
  onCancel: () => void
  expense?: any 
}) {
  const { user } = useAuth()
  const { currentHousehold } = useHouseholds()
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: expense?.title || '',
    amount: expense?.amount || 0,
    category: expense?.category || 'outros',
    date: expense?.date || new Date(),
    notes: expense?.notes || '',
    paymentMethod: expense?.paymentMethod || 'dinheiro',
    participants: expense?.participants || [user?.id || ''],
    sharedPercentages: expense?.sharedPercentages || { [user?.id || '']: 100 }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const selectedCategory = categories.find(c => c.id === formData.category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Supermercado"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Valor</label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
            placeholder="0,00"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <Input
            type="date"
            value={format(formData.date, 'yyyy-MM-dd')}
            onChange={(e) => setFormData(prev => ({ ...prev, date: new Date(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Categoria</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
              className={`p-3 rounded-lg border text-center transition-colors ${
                formData.category === category.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg mb-1">{category.icon}</div>
              <div className="text-xs font-medium">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Método de Pagamento</label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
          className="w-full p-2 border rounded-lg"
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao_credito">Cartão de Crédito</option>
          <option value="cartao_debito">Cartão de Débito</option>
          <option value="pix">PIX</option>
          <option value="transferencia">Transferência</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observações</label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Observações opcionais..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {expense ? 'Atualizar' : 'Criar'} Despesa
        </Button>
      </div>
    </form>
  )
}

export function NewExpensesPage() {
  const { user } = useAuth()
  const { currentHousehold, generateInviteCode } = useHouseholds()
  const { 
    expenses, 
    loading, 
    createExpense, 
    updateExpense, 
    deleteExpense, 
    markAsPaid, 
    markAsUnpaid, 
    duplicateExpense,
    filteredExpenses,
    totals 
  } = useExpenses()

  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Filtrar despesas
  const filtered = filteredExpenses(searchText, selectedCategory)
  const stats = totals(filtered)

  const handleCreateExpense = async (data: ExpenseFormData) => {
    try {
      await createExpense(data)
      setShowForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleUpdateExpense = async (data: ExpenseFormData) => {
    if (!editingExpense) return
    
    try {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
      setShowForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDeleteExpense = async (expense: any) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    
    try {
      await deleteExpense(expense.id)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDuplicateExpense = async (expense: any) => {
    try {
      await duplicateExpense(expense)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleGenerateInvite = async () => {
    try {
      await generateInviteCode()
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="h-4 w-4" />
      case 'pix':
        return <Share2 className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  const getCategoryData = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || categories[categories.length - 1]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Carregando despesas...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas Compartilhadas</h1>
          <p className="text-gray-600 mt-1">
            {currentHousehold?.name || 'Nenhuma household selecionada'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateInvite} variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Convidar
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.pending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar despesas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="">Todas as categorias</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {expenses.length === 0 ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa corresponde aos filtros'}
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira despesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((expense) => {
            const category = getCategoryData(expense.category)
            
            return (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{category.icon}</div>
                      <div>
                        <h3 className="font-semibold">{expense.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {format(expense.date, 'dd/MM/yyyy', { locale: ptBR })}
                          {getPaymentMethodIcon(expense.paymentMethod)}
                          <span className="capitalize">{expense.paymentMethod.replace('_', ' ')}</span>
                        </div>
                        {expense.notes && (
                          <p className="text-sm text-gray-600 mt-1">{expense.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(expense.amount)}</div>
                        <Badge variant={expense.paid ? 'default' : 'destructive'} className="text-xs">
                          {expense.paid ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pago
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Pendente
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            setEditingExpense(expense)
                            setShowForm(true)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleDuplicateExpense(expense)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => 
                            expense.paid ? markAsUnpaid(expense.id) : markAsPaid(expense.id)
                          }>
                            {expense.paid ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Marcar como pendente
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como pago
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteExpense(expense)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open)
        if (!open) {
          setEditingExpense(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          
          <ExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
            onCancel={() => {
              setShowForm(false)
              setEditingExpense(null)
            }}
            expense={editingExpense}
          />
        </DialogContent>
      </Dialog>

      {/* Floating Action Button Mobile */}
      <Button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="default"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}