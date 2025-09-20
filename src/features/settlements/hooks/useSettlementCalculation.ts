import { useMemo } from 'react'
import { useExpenseTotals } from '@/features/expenses/hooks/useExpenseTotals'
import { useExpenseRatioStore } from '@/stores/expenseRatio'
import { SettlementService } from '../services/settlementService'
import { Settlement } from '@/types/settlement'

interface Member {
  id: string
  name: string
}

interface Expense {
  id: string
  amount: number
  paidBy: string
  createdAt: Date
}

export function useSettlementCalculation(
  householdId: string,
  month: string,
  expenses: Expense[],
  members: Member[]
) {
  // Filtra despesas do mês
  const monthExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseMonth = expense.createdAt.toISOString().slice(0, 7)
      return expenseMonth === month
    })
  }, [expenses, month])

  // Calcula totais usando proporções configuradas
  const { total, totals } = useExpenseTotals(householdId, monthExpenses, members)
  const { getRatios } = useExpenseRatioStore()
  const ratios = getRatios(householdId)

  // Calcula saldos e transferências
  const settlement = useMemo(() => {
    // Calcula quanto cada um pagou vs quanto deveria pagar
    const amounts: Settlement['amounts'] = {}
    
    members.forEach(member => {
      const paid = totals[member.id] || 0
      const owed = total * (ratios[member.id] || 0) / 100
      const balance = paid - owed

      amounts[member.id] = {
        paid,
        owed,
        balance,
        transfers: []
      }
    })

    // Calcula transferências necessárias
    const transfers = SettlementService.calculateTransfers(
      Object.fromEntries(
        Object.entries(amounts).map(([id, data]) => [id, data.balance])
      )
    )

    // Distribui transferências
    transfers.forEach(transfer => {
      amounts[transfer.from].transfers.push({
        to: transfer.to,
        amount: transfer.amount
      })
    })

    return {
      householdId,
      month,
      completedAt: null,
      amounts
    } as Settlement
  }, [householdId, month, members, total, totals])

  return {
    settlement,
    total,
    totals
  }
}