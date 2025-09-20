import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/core/db/database'
import { useHouseholdMembers } from '@/features/households/hooks/useHouseholdMembers'
import { Expense } from '../types'

// Hook para acompanhar novas despesas
export function useNewExpenseWatcher(householdId: string) {
  const [newExpense, setNewExpense] = useState<{
    expense: Expense
    isNew: boolean
  } | null>(null)

  const { members } = useHouseholdMembers(householdId)
  const queryClient = useQueryClient()

  // Buscar última despesa
  const { data: latestExpense } = useQuery({
    queryKey: ['latestExpense', householdId],
    queryFn: async () => {
      const expense = await db.expenses
        .where('householdId')
        .equals(householdId)
        .reverse()
        .first()
      
      return expense || null
    }
  })

  // Observar mudanças
  useEffect(() => {
    if (!latestExpense) return
    
    // Se há uma despesa nova, mostra notificação
    if (
      !newExpense || 
      latestExpense.id !== newExpense.expense.id
    ) {
      setNewExpense({
        expense: latestExpense,
        isNew: true
      })

      // Auto-oculta após 5 segundos
      setTimeout(() => {
        setNewExpense(curr => 
          curr?.expense.id === latestExpense.id
            ? { ...curr, isNew: false }
            : curr
        )
      }, 5000)
    }
  }, [latestExpense, newExpense])

  // Formata mensagem baseado no membro que criou
  const getMessage = () => {
    if (!newExpense) return null

    const creator = members?.find(m => m.userId === newExpense.expense.paidById)
    const amount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(newExpense.expense.amount)

    return {
      title: creator 
        ? `${creator.user.name} adicionou uma despesa`
        : 'Nova despesa adicionada',
      description: `${newExpense.expense.title} - ${amount}`
    }
  }

  return {
    newExpense: newExpense?.isNew ? getMessage() : null,
    dismissNewExpense: () => setNewExpense(curr => 
      curr ? { ...curr, isNew: false } : null
    )
  }
}