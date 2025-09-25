import React, { useEffect } from 'react'

// This component intentionally does not render a UI.
// It registers a small hidden dev API on window.__expenses_debug so the
// debug functionality (force refresh, DB sample, last query) remains
// available from the console while removing the visible buttons.
export default function DebugPanel({ householdId, onForceRefresh }: { householdId: string; onForceRefresh?: () => void }) {
  useEffect(() => {
    const api = {
      // returns the last query object and also mirrors it to __debug_last
      showLastQuery: async () => {
        try {
          const last = (window as any).__lastExpensesQuery || null
          try { (window as any).__debug_last = last } catch (e) {}
          return last
        } catch (e) {
          return null
        }
      },
      // returns a small sample of the local DB (count + up to 20 items)
      getDbSample: async () => {
        try {
          const mod = await import('@/core/db/database')
          const localDb = (mod as any).db
          let arr: any[] = []
          try {
            arr = await (localDb.expenses.toArray ? localDb.expenses.toArray() : Promise.resolve([]))
            if (!Array.isArray(arr)) arr = []
          } catch (e) {
            arr = []
          }
          return { count: arr.length, sample: arr.slice(0, 20) }
        } catch (e) {
          return { error: String(e) }
        }
      },
      // call the passed onForceRefresh handler (which invalidates/refetches queries)
      forceRefresh: async () => {
        try {
          if (typeof onForceRefresh === 'function') {
            await onForceRefresh()
            return true
          }
          return false
        } catch (e) {
          return false
        }
      }
    }

    try { (window as any).__expenses_debug = api } catch (e) {}

    return () => {
      try { delete (window as any).__expenses_debug } catch (e) {}
    }
  }, [onForceRefresh, householdId])

  return null
}
