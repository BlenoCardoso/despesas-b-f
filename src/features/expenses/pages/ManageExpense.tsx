import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExpenseList } from '../components/ExpenseList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { FlexibleExpense } from '../types/expense'
import { toast } from '@/components/ui/toast'
import { deleteExpense, undoExpenseDelete } from '../services/expense-service'

export default function ManageExpense() {
  // Get household ID from URL
  const { id: householdId } = useParams<{ id: string }>()
  if (!householdId) throw new Error('Household ID is required')

  // Placeholder categories (should come from a database/API)
  const categories = [
    { id: 'alimentacao', name: 'Alimentação', icon: '🍔', color: '#EF4444' },
    { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#3B82F6' },
    { id: 'moradia', name: 'Moradia', icon: '🏠', color: '#10B981' },
    { id: 'lazer', name: 'Lazer', icon: '🎮', color: '#8B5CF6' }
  ]

  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>()
  const [selectedCategory, setSelectedCategory] = useState<string>()

  // Handle expense actions
  const handleEditExpense = (expense: FlexibleExpense) => {
    console.log('Edit expense:', expense.id)
  }

  const handleDuplicateExpense = (expense: FlexibleExpense) => {
    console.log('Duplicate expense:', expense.id)
  }

  const handleDeleteExpense = async (expense: FlexibleExpense) => {
    try {
      // Delete with undo support
      await deleteExpense(expense.id, () => {
        // Show undo toast
        toast('Despesa excluída', {
          action: {
            label: 'Desfazer',
            onClick: async () => {
              try {
                await undoExpenseDelete(expense.id)
                toast('Despesa restaurada', { type: 'success' })
              } catch (error) {
                toast('Erro ao restaurar despesa', { type: 'error' })
                console.error('Error restoring expense:', error)
              }
            }
          }
        })
      })
    } catch (error) {
      toast('Erro ao excluir despesa', { type: 'error' })
      console.error('Error deleting expense:', error)
    }
  }

  const handleViewAttachments = (expense: FlexibleExpense) => {
    console.log('View attachments:', expense.id)
  }

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* TODO: Add filters */}
      </div>

      {/* Expense List */}
      <ExpenseList
        householdId={householdId}
        categories={categories}
        month={selectedMonth}
        categoryId={selectedCategory}
        onEdit={handleEditExpense}
        onDuplicate={handleDuplicateExpense}
        onDelete={handleDeleteExpense}
        onViewAttachments={handleViewAttachments}
      />
    </div>
  )
}