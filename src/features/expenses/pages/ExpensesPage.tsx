import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, X } from 'lucide-react'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseForm } from '../components/ExpenseForm'
import { toast } from 'sonner'
import { simpleExpenseService } from '../services/simpleExpenseService'
import { authService } from '@/services/authService'
import { ExpenseFormData } from '../types'
import { useQueryClient } from '@tanstack/react-query'

export function ExpensesPage() {
  const [searchText, setSearchText] = useState('')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const queryClient = useQueryClient()
  const currentUser = authService.getCurrentUser()
  const householdIdForList = currentUser?.households?.[0] || 'default-household'

  // Mock categories for now
  const categories = [
    { id: 'alimentacao', name: 'Alimentação', icon: '🍔', color: '#EF4444' },
    { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#3B82F6' },
    { id: 'moradia', name: 'Moradia', icon: '🏠', color: '#10B981' },
    { id: 'lazer', name: 'Lazer', icon: '🎮', color: '#8B5CF6' }
  ]

  // Expense action handlers
  const handleEditExpense = (expense: any) => {
    console.log('✏️ Editing expense:', expense)
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleDuplicateExpense = async (expense: any) => {
    try {
      console.log('📋 Duplicating expense:', expense)
      
      const user = await authService.getCurrentUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      const householdId = user.households?.[0] || 'default-household'
      
      // Create a duplicate with new ID and current date
      const duplicateData: ExpenseFormData = {
        title: `${expense.title} (cópia)`,
        amount: expense.amount,
        categoryId: expense.categoryId,
        date: new Date(), // Today's date as Date object
        notes: expense.notes || '',
        paymentMethod: expense.paymentMethod || 'dinheiro'
      }
      
      const duplicatedExpense = await simpleExpenseService.createExpense(duplicateData, householdId, user.id)
      
      console.log('✅ Expense duplicated successfully:', duplicatedExpense.id)
      toast.success('Despesa duplicada com sucesso!')
      
      // Refresh the list
      queryClient.invalidateQueries({
        queryKey: ['expenses', 'infinite']
      })
    } catch (error) {
      console.error('❌ Error duplicating expense:', error)
      toast.error('Erro ao duplicar despesa. Tente novamente.')
    }
  }

  const handleDeleteExpense = async (expense: any) => {
    try {
      console.log('🗑️ Deleting expense:', expense)
      
      const { db } = await import('@/core/db/database')
      
      // Soft delete - mark as deleted instead of removing from database
      await db.expenses.update(expense.id, {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      console.log('✅ Expense deleted successfully:', expense.id)
      toast.success('Despesa excluída com sucesso!')
      
      // Refresh the list
      queryClient.invalidateQueries({
        queryKey: ['expenses', 'infinite']
      })
    } catch (error) {
      console.error('❌ Error deleting expense:', error)
      toast.error('Erro ao excluir despesa. Tente novamente.')
    }
  }

  const handleViewAttachments = (expense: any) => {
    console.log('📎 Viewing attachments for expense:', expense)
    const attachmentCount = expense.attachments?.length || 0
    if (attachmentCount === 0) {
      toast.info('Esta despesa não possui anexos')
    } else {
      toast.info(`Esta despesa possui ${attachmentCount} anexo(s). Visualização em desenvolvimento...`)
    }
  }

  const handleCreateExpense = async (data: ExpenseFormData) => {
    try {
      if (editingExpense) {
        // Edit mode
        console.log('✏️ ExpensesPage - handleCreateExpense (EDIT MODE) called with data:', data)
        
        await simpleExpenseService.updateExpense(editingExpense.id, data)
        
        console.log('Expense updated successfully:', editingExpense.id)
        toast.success('Despesa atualizada com sucesso!')
        setEditingExpense(null)
      } else {
        // Create mode
        console.log('🚀 ExpensesPage - handleCreateExpense (CREATE MODE) called with data:', data)
        
        // Get current user
        const user = authService.getCurrentUser()
        console.log('👤 Current user:', user)
        
        if (!user) {
          console.log('❌ No user authenticated')
          toast.error('Usuário não autenticado')
          return
        }

        // For now, use a default household ID or the user's first household
        const householdId = user.households?.[0] || 'default-household'
        console.log('🏠 Using householdId:', householdId)
        
        // Create the expense
        const expense = await simpleExpenseService.createExpense(data, householdId, user.id)
        
        console.log('✅ Expense created successfully:', expense.id)
        toast.success('Despesa criada com sucesso!')
        
        // Debug: Check if expense was actually saved
        console.log('🔍 Checking if expense was saved...')
        const { db } = await import('@/core/db/database')
        const allExpenses = await db.expenses.toArray()
        console.log('📊 All expenses after creation:', allExpenses.length, allExpenses)
        
        const newlyCreated = allExpenses.find(exp => exp.id === expense.id)
        console.log('🎯 Newly created expense found:', newlyCreated)
      }
      
      setShowExpenseForm(false)
      
      // Invalidate queries to refresh the expense list
      console.log('🔄 Invalidating queries...')
      queryClient.invalidateQueries({
        queryKey: ['expenses', 'infinite']
      })
    } catch (error) {
      console.error('Error processing expense:', error)
      const action = editingExpense ? 'atualizar' : 'criar'
      toast.error(`Erro ao ${action} despesa. Tente novamente.`)
    }
  }

  return (
    <main className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas despesas mensais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar despesas..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-lg border">
        <ExpenseList
          householdId={householdIdForList}
          categories={categories}
          onEdit={handleEditExpense}
          onDuplicate={handleDuplicateExpense}
          onDelete={handleDeleteExpense}
          onViewAttachments={handleViewAttachments}
        />
      </div>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={() => setShowExpenseForm(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 md:hidden"
        size="default"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowExpenseForm(false)
                  setEditingExpense(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <ExpenseForm
                categories={categories}
                expense={editingExpense || undefined}
                onSubmit={handleCreateExpense}
                onCancel={() => {
                  setShowExpenseForm(false)
                  setEditingExpense(null)
                }}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
