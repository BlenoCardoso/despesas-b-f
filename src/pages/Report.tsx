import React, { useEffect, useMemo, useState, useRef } from 'react'
import { ReportCharts } from '@/components/ReportCharts'
import { exportToPDF, exportToExcel, exportTableToPDF } from '@/utils/export'
import { Link } from 'react-router-dom'
import { firebaseExpenseService } from '@/services/firebaseExpenseService'
import { auth } from '@/config/firebase'

type ExpenseRow = {
  id: string
  description: string
  amount: number
  category?: string
  createdAt: Date
  paidBy?: string
}

const months = ['Todos','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const ReportPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos')
  const householdIdRef = useRef<string | null>(null)
  const [includePdfFooter, setIncludePdfFooter] = useState<boolean>(true)
  const [includeExcelDetails, setIncludeExcelDetails] = useState<boolean>(true)
  const [showMA, setShowMA] = useState<boolean>(true)
  const [maWindow, setMaWindow] = useState<number>(3)

  useEffect(() => {
    // Try to get household id from localStorage (same key used elsewhere)
    const hh = typeof window !== 'undefined' ? localStorage.getItem('currentHouseholdId') : null
    householdIdRef.current = hh
    if (!hh) {
      setLoading(false)
      return
    }

    setLoading(true)
    // Subscribe to live updates
    const unsub = firebaseExpenseService.subscribeToExpenses(hh, (list) => {
      // Map to ExpenseRow shape
      const mapped = list.map((e: any) => ({
        id: e.id,
        description: e.description || e.title || '',
        amount: Number(e.amount || 0),
        category: e.category || 'Outros',
        createdAt: e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt),
        // Use firebase auth currentUser uid to decide label
        paidBy: e.createdBy === auth.currentUser?.uid ? 'Você' : (e.createdBy || 'Parceiro')
      }))
      setExpenses(mapped)
      setLoading(false)
    })

    return () => { try { unsub && unsub() } catch {} }
  }, [])

  // Build list of years available
  const years = useMemo(() => {
    const ys = new Set<number>()
    expenses.forEach(e => ys.add(e.createdAt.getFullYear()))
    return Array.from(ys).sort((a,b) => b - a)
  }, [expenses])

  // Client-side filter by year/month
  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (selectedYear !== 'all' && String(e.createdAt.getFullYear()) !== selectedYear) return false
      if (selectedMonth !== 'Todos') {
        const m = e.createdAt.getMonth() + 1
        if (m !== months.indexOf(selectedMonth)) return false
      }
      return true
    })
  }, [expenses, selectedYear, selectedMonth])

  // Aggregates
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      const c = (e.category || 'Outros')
      map[c] = (map[c] || 0) + (e.amount || 0)
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of filtered) {
      const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth()+1).padStart(2,'0')}`
      map[key] = (map[key] || 0) + (e.amount || 0)
    }
    // Convert to array ordered by key asc
    const arr = Object.entries(map).map(([k,v]) => ({ name: k, value: v })).sort((a,b) => a.name.localeCompare(b.name))
    // calculate moving average (window = maWindow)
    if (arr.length > 0 && maWindow > 0) {
      const vals = arr.map(x => x.value)
      const ma: number[] = []
      for (let i = 0; i < vals.length; i++) {
        const start = Math.max(0, i - (maWindow - 1))
        const slice = vals.slice(start, i + 1)
        const avg = slice.reduce((s, n) => s + n, 0) / slice.length
        ma.push(Number(avg.toFixed(2)))
      }
      return arr.map((x, idx) => ({ ...x, ma: ma[idx] }))
    }
    return arr
  }, [filtered])

  const total = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered])

  // Export handlers
  const handleExportPDF = async () => {
    const container = document.getElementById('report-root')
    await exportToPDF('Relatório de Despesas', container, {
      includeHeaderFooter: true,
      headerText: `Relatório — ${new Date().toLocaleDateString()}`,
      footerText: includePdfFooter ? `Total: R$ ${total.toFixed(2)}` : undefined
    })
  }

  const handleExportExcel = async () => {
    // Build rows
    const detailRows = filtered.map(e => ({
      Data: e.createdAt.toISOString().split('T')[0],
      Descrição: e.description,
      Categoria: e.category,
      Valor: e.amount,
      PagoPor: e.paidBy
    }))

    const aggRows = byCategory.map(b => ({ Categoria: b.name, Valor: b.value }))
    await exportToExcel({ details: includeExcelDetails ? detailRows : [], aggregates: aggRows }, 'relatorio_despesas')
  }

  // Selection and pagination for table
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const pageSize = 20
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => { if (page > pages) setPage(1) }, [pages])

  const pageItems = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAllOnPage = (checked: boolean) => {
    const updates: Record<string, boolean> = {}
    pageItems.forEach(i => updates[i.id] = checked)
    setSelectedIds(prev => ({ ...prev, ...updates }))
  }

  const selectedRows = useMemo(() => filtered.filter(r => selectedIds[r.id]), [filtered, selectedIds])

  const handleExportSelectedPDF = async () => {
    const rows = selectedRows.map(r => ({ date: r.createdAt.toISOString().split('T')[0], desc: r.description, category: r.category, value: r.amount, paidBy: r.paidBy }))
    const cols = [
      { key: 'date', label: 'Data' },
      { key: 'desc', label: 'Descrição' },
      { key: 'category', label: 'Categoria' },
      { key: 'value', label: 'Valor' },
      { key: 'paidBy', label: 'Pago Por' }
    ]
    await exportTableToPDF('Despesas Selecionadas', rows, cols, 'despesas_selecionadas')
  }

  const handleExportSelectedExcel = async () => {
    const detailRows = selectedRows.map(e => ({
      Data: e.createdAt.toISOString().split('T')[0],
      Descrição: e.description,
      Categoria: e.category,
      Valor: e.amount,
      PagoPor: e.paidBy
    }))
    const aggRows = byCategory.map(b => ({ Categoria: b.name, Valor: b.value }))
    await exportToExcel({ details: includeExcelDetails ? detailRows : [], aggregates: aggRows }, 'despesas_selecionadas')
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/expenses" className="text-sm text-blue-600">← Voltar</Link>
      </div>

      <div id="report-root" className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">📊 Relatório</h1>
            <p className="text-gray-600">Resumo das despesas</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total filtrado</p>
            <p className="text-xl font-bold text-blue-600">R$ {total.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Por Categoria</h3>
                <ReportCharts type="pie" data={byCategory} />
              </div>
              <div>
                <h3 className="font-medium mb-2">Por Mês</h3>
                <ReportCharts type="bar" data={byMonth} showLine={showMA} lineKey={'ma'} />
              </div>
            </div>
          </div>

          <aside className="p-3 border rounded bg-gray-50">
            <h3 className="font-medium mb-2">Filtros</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600">Ano</label>
                <select className="w-full p-2 border rounded" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  <option value="all">Todos</option>
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Mês</label>
                <select className="w-full p-2 border rounded" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <div className="mb-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={includePdfFooter} onChange={(e) => setIncludePdfFooter(e.target.checked)} />
                    <span className="text-sm">Incluir rodapé (total) no PDF</span>
                  </label>
                </div>
                <div className="mb-3">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={includeExcelDetails} onChange={(e) => setIncludeExcelDetails(e.target.checked)} />
                      <span className="text-sm">Incluir detalhes na planilha Excel</span>
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={showMA} onChange={(e) => setShowMA(e.target.checked)} />
                      <span className="text-sm">Mostrar média móvel (linha)</span>
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600">Janela média móvel</label>
                    <select className="w-full p-2 border rounded" value={maWindow} onChange={(e) => setMaWindow(Number(e.target.value))}>
                      <option value={2}>2 meses</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                    </select>
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded mb-2" onClick={handleExportPDF}>Exportar PDF</button>
                  <button className="w-full py-2 bg-green-600 text-white rounded" onClick={handleExportExcel}>Exportar Excel (detalhado)</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ReportPage
