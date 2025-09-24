import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'
import type { Category } from '@/types'

// Batch-1: return any[] to avoid cross-module Category shape mismatches while we tidy types.
export function useExpenseCategories(householdId: string) {
  return useQuery({
    queryKey: ['expense-categories', householdId],
    queryFn: async (): Promise<any[]> => {
      const categories = await db.categories
        .where('householdId')
        .equals(householdId)
        .toArray()

      return categories.sort((a: any, b: any) => {
        // Priorizar mais usadas
        if (a.usageCount && b.usageCount) {
          return b.usageCount - a.usageCount
        }
        // Ordem alfabética
        return a.name.localeCompare(b.name)
      })
    }
  })
}