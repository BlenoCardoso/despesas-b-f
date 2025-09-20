import { useInfiniteQuery } from '@tanstack/react-query'
import type { FlexibleExpense } from '../types/expense'

const PAGE_SIZE = 20

export interface UseExpensesInfiniteOptions {
  householdId: string
  month?: string
  categoryId?: string
  memberId?: string
}

interface QueryPage {
  items: FlexibleExpense[]
  cursor: { date: string } | null
}

export function useExpensesInfinite(options: UseExpensesInfiniteOptions) {
  const { householdId, month, categoryId, memberId } = options

  return useInfiniteQuery<QueryPage>({
    queryKey: ['expenses', 'infinite', options],
    queryFn: async ({ pageParam }) => {
      console.log('🔍 useExpensesInfinite - queryFn called with:', { householdId, options, pageParam })
      
      // Debug: Verificar todas as despesas no banco primeiro
      console.log('🔍 Checking ALL expenses in database...')
      const { db } = await import('@/core/db/database')
      const allExpenses = await db.expenses.toArray()
      console.log('📊 All expenses in DB:', allExpenses.length, allExpenses)
      
      // Debug: Verificar despesas por household
      console.log('🔍 Filtering by householdId:', householdId)
      const householdExpenses = await db.expenses.where('householdId').equals(householdId).toArray()
      console.log('🏠 Expenses for this household:', householdExpenses.length, householdExpenses)
      
      // Debug: Verificar despesas não deletadas
      const nonDeletedExpenses = householdExpenses.filter(
        exp => exp.deletedAt == null
      )
      console.log('✅ Non-deleted expenses:', nonDeletedExpenses.length, nonDeletedExpenses)
      console.log('🔍 Sample expense deletedAt values:', householdExpenses.map(exp => ({ id: exp.id, deletedAt: exp.deletedAt, type: typeof exp.deletedAt })))

      // Create base query
      let query = db.expenses.where('householdId').equals(householdId)

      // Add filters
      if (month) {
        const [year, monthNum] = month.split('-')
        const startDate = `${year}-${monthNum}-01`
        const endDate = `${year}-${monthNum}-31` // Simplified approach
        query = query
          .and(expense => expense.deletedAt == null && expense.date >= startDate)
          .and(expense => expense.date <= endDate)
      } else {
        // Only show non-deleted expenses
        query = query.and(expense => expense.deletedAt == null)
      }
      
      if (categoryId) {
        query = query.and(expense => expense.categoryId === categoryId)
      }
      if (memberId) {
        query = query.and(expense => expense.paidById === memberId)
      }

      // Get items (sorting is handled by index)
      const items = await query.limit(PAGE_SIZE + 1).toArray()
      console.log('📊 Database query result:', items)

      // Check if there are more items
      const hasMore = items.length > PAGE_SIZE
      const results = hasMore ? items.slice(0, -1) : items
      console.log('📋 Results after pagination:', results)

      // Convert to FlexibleExpense format
      const flexResults: FlexibleExpense[] = results.map((expense: any) => ({
        ...expense,
        paymentMethod: 'dinheiro', // Default
        isShared: false // Default
      }))

      // Get cursor for next page
      const nextCursor = hasMore ? {
        date: results[results.length - 1].date
      } : null

      return {
        items: flexResults,
        cursor: nextCursor
      }
    },
    initialPageParam: null as null | { date: string },
    getNextPageParam: (lastPage) => lastPage.cursor,
    getPreviousPageParam: () => undefined // We only support forward pagination
  })
}