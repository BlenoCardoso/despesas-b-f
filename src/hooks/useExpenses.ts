import { useState, useEffect, useCallback } from 'react'
import { expenseService, type Expense, type ExpenseFormData } from '@/services/expenseService'
import { useHouseholds } from './useHouseholds'
import { toast } from 'sonner'

export function useExpenses() {
  const { currentHousehold } = useHouseholds()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Escutar mudanças em tempo real
  useEffect(() => {
    if (!currentHousehold?.id) {
      setExpenses([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = expenseService.subscribeToExpenses(
      currentHousehold.id,
      (newExpenses) => {
        setExpenses(newExpenses)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [currentHousehold?.id])

  // Criar despesa
  const createExpense = useCallback(async (data: ExpenseFormData) => {
    try {
      setError(null)
      if (!currentHousehold?.id) throw new Error('Nenhuma household selecionada')
      
      await expenseService.createExpense(data, currentHousehold.id)
      toast.success('Despesa criada com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar despesa'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [currentHousehold?.id])

  // Atualizar despesa
  const updateExpense = useCallback(async (id: string, data: Partial<ExpenseFormData>) => {
    try {
      setError(null)
      await expenseService.updateExpense(id, data)
      toast.success('Despesa atualizada com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar despesa'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [])

  // Deletar despesa
  const deleteExpense = useCallback(async (id: string) => {
    try {
      setError(null)
      await expenseService.deleteExpense(id)
      toast.success('Despesa deletada com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar despesa'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [])

  // Marcar como paga
  const markAsPaid = useCallback(async (id: string) => {
    try {
      setError(null)
      await expenseService.markAsPaid(id)
      toast.success('Despesa marcada como paga!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao marcar como paga'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [])

  // Marcar como não paga
  const markAsUnpaid = useCallback(async (id: string) => {
    try {
      setError(null)
      await expenseService.markAsUnpaid(id)
      toast.success('Despesa marcada como não paga!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao marcar como não paga'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [])

  // Duplicar despesa
  const duplicateExpense = useCallback(async (expense: Expense) => {
    try {
      setError(null)
      const data: ExpenseFormData = {
        title: `${expense.title} (cópia)`,
        amount: expense.amount,
        category: expense.category,
        date: new Date(),
        notes: expense.notes,
        paymentMethod: expense.paymentMethod,
        participants: expense.participants,
        sharedPercentages: expense.sharedPercentages
      }
      
      await createExpense(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao duplicar despesa'
      setError(message)
      toast.error(message)
      throw error
    }
  }, [createExpense])

  // Obter estatísticas
  const getStats = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      if (!currentHousehold?.id) return null
      return await expenseService.getHouseholdStats(currentHousehold.id, startDate, endDate)
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return null
    }
  }, [currentHousehold?.id])

  // Filtrar despesas
  const filteredExpenses = useCallback((
    searchText = '',
    category = '',
    paid?: boolean,
    startDate?: Date,
    endDate?: Date
  ) => {
    return expenses.filter(expense => {
      // Filtro de texto
      if (searchText) {
        const search = searchText.toLowerCase()
        const matchesTitle = expense.title.toLowerCase().includes(search)
        const matchesNotes = expense.notes?.toLowerCase().includes(search)
        if (!matchesTitle && !matchesNotes) return false
      }

      // Filtro de categoria
      if (category && expense.category !== category) return false

      // Filtro de status de pagamento
      if (paid !== undefined && expense.paid !== paid) return false

      // Filtro de data
      if (startDate && expense.date < startDate) return false
      if (endDate && expense.date > endDate) return false

      return true
    })
  }, [expenses])

  // Calcular totais
  const totals = useCallback((filteredExpenses: Expense[]) => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const paid = filteredExpenses.filter(e => e.paid).reduce((sum, expense) => sum + expense.amount, 0)
    const pending = total - paid
    
    return { total, paid, pending }
  }, [])

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
    markAsUnpaid,
    duplicateExpense,
    getStats,
    filteredExpenses,
    totals
  }
}