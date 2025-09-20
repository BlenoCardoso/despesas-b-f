import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BalanceService } from '../services/balanceService'
import { MonthlyBalanceReport } from '../types/balance'

const balanceService = new BalanceService()

// Hook para buscar os saldos do mês
export function useMonthlyBalance(householdId: string) {
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  const { data, isLoading, error } = useQuery({
    queryKey: ['balance', householdId, month, year],
    queryFn: () => balanceService.calculateMonthlyBalance(householdId, month, year)
  })

  return {
    balance: data,
    isLoading,
    error
  }
}

// Hook para histórico de acertos
export function useSettleHistory(householdId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['settleHistory', householdId],
    queryFn: () => balanceService.getSettleHistory(householdId)
  })

  return {
    settleHistory: data || [],
    isLoading,
    error
  }
}

// Hook para configurações de divisão
export function useSplitSettings(householdId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['splitSettings', householdId],
    queryFn: () => balanceService.getOrCreateSplitSettings(householdId)
  })

  return {
    settings: data,
    isLoading,
    error
  }
}

// Hook para agrupar todas as informações de saldos
export function useHouseholdBalance(householdId: string) {
  // Buscar dados
  const { balance, isLoading: balanceLoading } = useMonthlyBalance(householdId)
  const { settleHistory, isLoading: historyLoading } = useSettleHistory(householdId)
  const { settings, isLoading: settingsLoading } = useSplitSettings(householdId)

  // Calcula métricas e resumos
  const stats = useMemo(() => {
    if (!balance || !settleHistory) return null

    return {
      totalSettled: settleHistory.reduce((sum, record) => sum + record.amount, 0),
      averageSettle: settleHistory.length > 0
        ? settleHistory.reduce((sum, record) => sum + record.amount, 0) / settleHistory.length
        : 0,
      lastSettleDate: settleHistory.length > 0
        ? settleHistory[0].settledAt
        : null,
      pendingBalance: balance.memberBalances.reduce((sum, b) => sum + Math.abs(b.balance), 0) / 2
    }
  }, [balance, settleHistory])

  // Funções para atualizar configurações
  const toggleUnifyExpenses = useCallback(async () => {
    if (!settings) return
    await balanceService.updateSplitSettings(householdId, {
      unifyExpenses: !settings.unifyExpenses
    })
  }, [householdId, settings])

  return {
    // Dados principais
    balance,
    settings,
    settleHistory,
    
    // Status de loading
    isLoading: balanceLoading || historyLoading || settingsLoading,
    
    // Métricas calculadas
    stats,
    
    // Funções de atualização
    toggleUnifyExpenses
  }
}