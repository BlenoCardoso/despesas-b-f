import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ExpenseRatioState {
  // Se as despesas estão unificadas
  isUnified: boolean

  // Mapa de proporções por household
  // householdId -> { memberId -> ratio }
  ratios: Record<string, Record<string, number>>

  // Ações
  setUnified: (unified: boolean) => void
  setRatio: (householdId: string, memberId: string, ratio: number) => void
  getRatios: (householdId: string) => Record<string, number>
}

export const useExpenseRatioStore = create<ExpenseRatioState>()(
  persist(
    (set, get) => ({
      isUnified: false,
      ratios: {},

      setUnified: (unified) => set({ isUnified: unified }),

      setRatio: (householdId, memberId, ratio) => {
        set((state) => ({
          ratios: {
            ...state.ratios,
            [householdId]: {
              ...state.ratios[householdId],
              [memberId]: ratio
            }
          }
        }))
      },

      getRatios: (householdId) => {
        const state = get()
        return state.ratios[householdId] || {}
      }
    }),
    {
      name: 'expense-ratios'
    }
  )
)