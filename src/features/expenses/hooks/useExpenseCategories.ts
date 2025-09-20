import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'
import type { Category } from '@/types'

export function useExpenseCategories(householdId: string) {
  return useQuery({
    queryKey: ['expense-categories', householdId],
    queryFn: async (): Promise<Category[]> => {
      const categories = await db.categories
        .where('householdId')
        .equals(householdId)
        .toArray()

      return categories.sort((a, b) => {
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