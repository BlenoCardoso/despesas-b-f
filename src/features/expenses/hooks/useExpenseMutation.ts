import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'
import type { Expense } from '@/types'

interface CreateExpenseInput {
  householdId: string
  amount: number
  categoryId?: string
  title?: string
  date: string
  notes?: string
  paidById?: string
}

export function useExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const expense: Partial<Expense> = {
        householdId: input.householdId,
        title: input.title || 'Nova despesa',
        amount: input.amount,
        categoryId: input.categoryId,
        date: input.date,
        notes: input.notes,
        paidById: input.paidById
      }

      // Usar middleware para criar despesa
      const id = await DatabaseMiddleware.create({
        collection: 'expenses',
        data: expense
      })

      return id
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ['expenses']
      })
      queryClient.invalidateQueries({
        queryKey: ['expense-summaries']
      })

      toast.success('Despesa adicionada')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar despesa')
    }
  })
}