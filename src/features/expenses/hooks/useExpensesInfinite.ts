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
  expenses: FlexibleExpense[]
  cursor: { id: string; date?: string } | null
}

export function useExpensesInfinite(options: UseExpensesInfiniteOptions) {
  const { householdId, month, categoryId, memberId, filter } = options

  return useInfiniteQuery<QueryPage>({
    // Use a stable, primitive-based queryKey so React Query can correctly
    // match and invalidate queries. Passing the whole `options` object here
    // caused identity changes and also allowed queries to run with
    // falsy/placeholder householdId which then failed membership checks.
    queryKey: ['expenses', 'infinite', householdId || null, month || null, categoryId || null, memberId || null, filter ? JSON.stringify(filter) : null],
    enabled: !!householdId,
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
        // Support paymentStatus filter coming from UI chips (e.g. 'paid' | 'unpaid')
        if (filter.paymentStatus) {
          filters.paymentStatus = filter.paymentStatus
        }
        // text search and complex predicates remain client-side after fetch
      }

      const pageOptions: any = { limit: PAGE_SIZE, cursor: pageParam || null, orderBy: [['date', 'desc']] }

      // Debug: print filters and pageParam entering the DB layer
      try {
        console.debug('[useExpensesInfinite] query start', { pageParam, filters, pageOptions })
      } catch (e) {}

      let result: any
      let items: any[] = []
      try {
        result = await DatabaseMiddleware.queryPaginated<any>('expenses', filters, pageOptions)
        items = result.items || []
      } catch (err: any) {
        // record the middleware error and attempt a local DB fallback so the UI can show data in dev
        try {
          console.warn('[useExpensesInfinite] DatabaseMiddleware failed, attempting local fallback', err)
          ;(window as any).__lastExpensesQuery = { error: String(err && err.message ? err.message : err), fallback: true }
        } catch (e) {}

        try {
          const mod = await import('@/core/db/database')
          const localDb = (mod as any).db
          // Read all expenses for household and filter in-memory
          let all = await (localDb.expenses.where('householdId').equals(filters.householdId).toArray?.() || [])

          // Apply date range filter if present
          if (filters.date && (filters.date as any).__range) {
            const [from, to] = (filters.date as any).__range
            all = all.filter((it: any) => {
              try {
                const raw = it.date
                if (!raw) return false
                const iso = (typeof raw === 'string') ? new Date(raw).toISOString() : (raw instanceof Date ? raw.toISOString() : String(raw))
                if (from && iso < from) return false
                if (to && iso > to) return false
                return true
              } catch (e) {
                return false
              }
            })
          }

          // Apply simple equality filters
          if (filters.categoryId) all = all.filter((it: any) => it.categoryId === filters.categoryId)
          if (filters.paidById) all = all.filter((it: any) => it.paidById === filters.paidById || it.userId === filters.paidById)
          if (filters.accountId) all = all.filter((it: any) => it.accountId === filters.accountId)
          if (filters.sharedOnly) all = all.filter((it: any) => !!it.isShared)

          // Apply ordering by first orderBy field
          const [field, direction] = (pageOptions.orderBy && pageOptions.orderBy[0]) || ['date', 'desc']
          all = all.slice().sort((a: any, b: any) => {
            const va = a[field]
            const vb = b[field]
            if (va === vb) return 0
            if (direction === 'desc') return va < vb ? 1 : -1
            return va > vb ? 1 : -1
          })

          // Apply cursor-based pagination: if cursor provided, find its index by id/field value
          let startIndex = 0
          if (pageOptions.cursor) {
            const cursor = pageOptions.cursor
            const idx = all.findIndex((it: any) => String(it.id) === String(cursor.id))
            if (idx >= 0) startIndex = idx + 1
          }

          const paged = all.slice(startIndex, startIndex + (pageOptions.limit || PAGE_SIZE) )
          const lastItem = paged.length ? paged[paged.length - 1] : null
          result = {
            items: paged,
            cursor: lastItem ? { id: lastItem.id, [field]: lastItem[field] } : null
          }
          items = result.items || []

          try { (window as any).__lastExpensesQuery = { fallback: true, itemsCount: items.length, sampleIds: items.slice(0,5).map((i:any)=>i.id), filters, pageOptions } } catch(e){}
        } catch (e) {
          // If fallback also fails, rethrow original error
          console.error('[useExpensesInfinite] fallback failed', e)
          throw err
        }
      }
      // Expose last query to window for easier inspection during development
      try {
        ;(window as any).__lastExpensesQuery = {
          timestamp: new Date().toISOString(),
          pageParam,
          filters,
          pageOptions,
          itemsCount: items.length,
          sampleIds: items.slice(0, 5).map((i: any) => i.id),
          cursor: result.cursor,
        }
        console.debug('[useExpensesInfinite] query result', (window as any).__lastExpensesQuery)
      } catch (e) {
        // ignore in non-browser environments
      }
  // hasMore intentionally unused here (kept for possible future conditions)
  // intentionally not using hasMore here

      const flexResults: FlexibleExpense[] = items.map((expense: any) => ({
        ...expense,
        paymentMethod: expense.paymentMethod || 'dinheiro',
        isShared: !!expense.isShared
      }))

      return {
        expenses: flexResults,
        cursor: result.cursor
      }
    },
  initialPageParam: null as null | { id: string; date?: string },
    getNextPageParam: (lastPage) => lastPage.cursor,
    getPreviousPageParam: () => undefined // We only support forward pagination
  })
}