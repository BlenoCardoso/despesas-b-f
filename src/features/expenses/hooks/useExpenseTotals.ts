import { useMemo } from 'react'
import { useExpenseRatioStore } from '@/stores/expenseRatio'

interface Expense {
  id: string
  amount: number
  paidBy: string
}

interface Member {
  id: string
  name: string
}

export function useExpenseTotals(
  householdId: string,
  expenses: Expense[],
  members: Member[]
) {
  const { isUnified, getRatios } = useExpenseRatioStore()
  const ratios = getRatios(householdId)

  return useMemo(() => {
    // Total geral
    const total = expenses.reduce((acc, expense) => acc + expense.amount, 0)

    // Separado: cada um paga o que gastou
    const separatedTotals = expenses.reduce((acc, expense) => {
      acc[expense.paidBy] = (acc[expense.paidBy] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Unificado: proporção definida do total
    const unifiedTotals = members.reduce((acc, member) => {
      const ratio = ratios[member.id] || 0
      acc[member.id] = (total * ratio) / 100
      return acc
    }, {} as Record<string, number>)

    // Retorna totais conforme modo
    return {
      total,
      totals: isUnified ? unifiedTotals : separatedTotals
    }
  }, [expenses, members, ratios, isUnified])
}