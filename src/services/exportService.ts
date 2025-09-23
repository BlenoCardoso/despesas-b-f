import { db } from '@/core/db/database'
import { auth } from '@/lib/firebase'
import { DatabaseMiddleware } from '@/lib/databaseMiddleware'

function toCSV(rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return ''
  const keys = Object.keys(rows[0])
  const header = keys.join(',')
  const lines = rows.map(r => keys.map(k => {
    const v = r[k]
    if (v === null || v === undefined) return ''
    const s = typeof v === 'string' ? v : JSON.stringify(v)
    // Escape double quotes
    return `"${String(s).replace(/"/g, '""')}"`
  }).join(','))

  return [header, ...lines].join('\n')
}

export async function exportCSV(opts: { householdId?: string; startDate?: Date; endDate?: Date } = {}): Promise<Blob> {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')

  // If householdId specified, ensure membership
  let householdIds: string[] = []
  if (opts.householdId) {
    const ok = await DatabaseMiddleware.checkMembership(opts.householdId)
    if (!ok) throw new Error('Sem permissão para exportar dados desta household')
    householdIds = [opts.householdId]
  } else {
    const members = await db.householdMembers.where('userId').equals(user.uid).toArray()
    householdIds = members.map(m => (m as any).householdId)
  }

  const expenses: any[] = []
  for (const hid of householdIds) {
    let q: any = db.expenses.where('householdId').equals(hid)
    if (opts.startDate) {
      const s = opts.startDate.toISOString()
      q = q.and((e: any) => (e.date || '') >= s)
    }
    if (opts.endDate) {
      const s = opts.endDate.toISOString()
      q = q.and((e: any) => (e.date || '') <= s)
    }
    const rows = await q.toArray()
    rows.forEach(r => expenses.push(r))
  }

  const csv = toCSV(expenses)
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

export async function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportPDF(opts: { householdId?: string; startDate?: Date; endDate?: Date } = {}) {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')

  let householdIds: string[] = []
  if (opts.householdId) {
    const ok = await DatabaseMiddleware.checkMembership(opts.householdId)
    if (!ok) throw new Error('Sem permissão para exportar dados desta household')
    householdIds = [opts.householdId]
  } else {
    const members = await db.householdMembers.where('userId').equals(user.uid).toArray()
    householdIds = members.map(m => (m as any).householdId)
  }

  const expenses: Record<string, any>[] = []
  for (const hid of householdIds) {
    const rows: Record<string, any>[] = await db.expenses.where('householdId').equals(hid).toArray()
    rows.forEach(r => expenses.push(r))
  }

  const html = `
    <html>
      <head>
        <title>Minhas despesas</title>
        <style>
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px }
          th { background: #f4f4f4 }
        </style>
      </head>
      <body>
        <h1>Minhas despesas</h1>
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>title</th>
              <th>amount</th>
              <th>date</th>
              <th>category</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(e => `
              <tr>
                <td>${e.id}</td>
                <td>${String(e.title || '')}</td>
                <td>${String(e.amount ?? '')}</td>
                <td>${String(e.date ?? '')}</td>
                <td>${String(e.categoryId ?? '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  const w = window.open('', '_blank')
  if (!w) throw new Error('Não foi possível abrir nova janela para export')
  w.document.write(html)
  w.document.close()
}
