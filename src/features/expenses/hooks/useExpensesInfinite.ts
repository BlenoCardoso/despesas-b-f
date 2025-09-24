import { useInfiniteQuery } from '@tanstack/react-query'
import type { FlexibleExpense } from '../types/expense'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'

const PAGE_SIZE = 20

export interface UseExpensesInfiniteOptions {
  householdId: string
  month?: string
  categoryId?: string
  memberId?: string
  filter?: any
}

interface QueryPage {
  items: FlexibleExpense[]
  cursor: { id: string; date?: string } | null
}

export function useExpensesInfinite(options: UseExpensesInfiniteOptions) {
  const { householdId, month, categoryId, memberId, filter } = options

  return useInfiniteQuery<QueryPage>({
    queryKey: ['expenses', 'infinite', options],
    queryFn: async ({ pageParam }) => {
      // Build filters object for DatabaseMiddleware.queryPaginated
      const filters: Record<string, any> = { householdId }

      if (month) {
        const [year, monthNum] = month.split('-')
        const startIso = new Date(`${year}-${monthNum}-01`).toISOString()
        const endIso = new Date(`${year}-${monthNum}-31`).toISOString()
        filters.date = { __range: [startIso, endIso] }
      }

      if (categoryId) filters.categoryId = categoryId
      if (memberId) filters.paidById = memberId

      // Merge advanced filters if provided (convert to simple equality/inequality where possible)
      if (filter) {
        if (filter.accountId) filters.accountId = filter.accountId
        if (filter.paidById) filters.paidById = filter.paidById
        if (filter.sharedOnly) filters.sharedOnly = true
        if (filter.categoryIds) filters.categoryId = filter.categoryIds[0] // simple mapping for now
        if (filter.startDate) filters.date = { __range: [new Date(filter.startDate).toISOString(), (filters.date && (filters.date as any).__range?.[1]) || undefined] }
        if (filter.endDate) filters.date = { __range: [(filters.date && (filters.date as any).__range?.[0]) || undefined, new Date(filter.endDate).toISOString()] }
        // text search and complex predicates remain client-side after fetch
      }

      const pageOptions: any = { limit: PAGE_SIZE, cursor: pageParam || null, orderBy: [['date', 'desc']] }

      const result = await DatabaseMiddleware.queryPaginated<any>('expenses', filters, pageOptions)

      const items = result.items || []
  // hasMore intentionally unused here (kept for possible future conditions)
  // intentionally not using hasMore here

      const flexResults: FlexibleExpense[] = items.map((expense: any) => ({
        ...expense,
        paymentMethod: expense.paymentMethod || 'dinheiro',
        isShared: !!expense.isShared
      }))

      return {
        items: flexResults,
        cursor: result.cursor
      }
    },
  initialPageParam: null as null | { id: string; date?: string },
    getNextPageParam: (lastPage) => lastPage.cursor,
    getPreviousPageParam: () => undefined // We only support forward pagination
  })
}