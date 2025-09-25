import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DebugPanel({ householdId, onForceRefresh }: { householdId: string; onForceRefresh?: () => void }) {
  const [open, setOpen] = useState(false)
  const [dbSample, setDbSample] = useState<any>(null)

  const showDebug = async () => {
    setOpen(true)
    try {
      const last = (window as any).__lastExpensesQuery || null
      try { (window as any).__debug_last = last } catch (e) {}

      // runtime import from project alias
      const mod = await import('@/core/db/database')
      const localDb = (mod as any).db
      // Ensure we await the toArray result before slicing
      let arr: any[] = []
      try {
        arr = await (localDb.expenses.toArray ? localDb.expenses.toArray() : Promise.resolve([]))
        if (!Array.isArray(arr)) arr = []
      } catch (e) {
        arr = []
      }
      const sample = arr.slice(0, 20)
      setDbSample({ count: arr.length, sample })
    } catch (e) {
      setDbSample({ error: String(e) })
    }
  }

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 9999 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button onClick={() => { showDebug() }} size="sm">Debug</Button>
        <Button onClick={() => { try { onForceRefresh && onForceRefresh() } catch (e) {} }} variant="ghost" size="sm">Forçar refresh</Button>
      </div>

      {open && (
        <div style={{ marginTop: 8, width: 520, maxHeight: 480, overflow: 'auto', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Debug de despesas</strong>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#374151' }}><strong>Última query (window.__lastExpensesQuery):</strong></div>
            <pre style={{ fontSize: 12, background: '#f8fafc', padding: 8, borderRadius: 6, overflow: 'auto' }}>{JSON.stringify((window as any).__lastExpensesQuery || null, null, 2)}</pre>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: '#374151' }}><strong>Dump local DB (até 20 itens):</strong></div>
            <pre style={{ fontSize: 12, background: '#f8fafc', padding: 8, borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(dbSample || '--- carregue usando Debug ---', null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
