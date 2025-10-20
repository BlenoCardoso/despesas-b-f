import React from 'react'
import { ReportCharts } from '@/components/ReportCharts'
import { exportToPDF, exportToExcel } from '@/utils/export'
import { Link } from 'react-router-dom'

const ReportPage: React.FC = () => {
  // In a real app we'd fetch aggregated stats from services; for now derive from DOM sample or window
  // We'll accept that parent will render with available global data; fallback to demo data
  const demoData = {
    total: 29.56,
    byCategory: [
      { name: 'Alimentação', value: 15.0 },
      { name: 'Transporte', value: 10.0 },
      { name: 'Casa', value: 4.56 }
    ],
    byMonth: [
      { name: 'Set', value: 120 },
      { name: 'Out', value: 80 },
      { name: 'Nov', value: 40 }
    ]
  }

  const handleExportPDF = async () => {
    await exportToPDF('Relatório de Despesas', document.getElementById('report-root'))
  }

  const handleExportExcel = async () => {
    const rows = demoData.byCategory.map(r => ({ Categoria: r.name, Valor: r.value }))
    await exportToExcel(rows, 'relatorio-categorias')
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4">
        <Link to="/expenses" className="text-sm text-blue-600">← Voltar</Link>
      </div>
      <div id="report-root" className="bg-white p-4 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">📊 Relatório</h1>
        <p className="text-gray-600 mb-4">Resumo rápido das despesas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-2">
            <h3 className="font-medium mb-2">Por Categoria</h3>
            <ReportCharts type="pie" data={demoData.byCategory} />
          </div>
          <div className="p-2">
            <h3 className="font-medium mb-2">Por Mês</h3>
            <ReportCharts type="bar" data={demoData.byMonth} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={handleExportPDF} className="px-4 py-2 bg-blue-600 text-white rounded">Exportar PDF</button>
        <button onClick={handleExportExcel} className="px-4 py-2 bg-green-600 text-white rounded">Exportar Excel</button>
      </div>
    </div>
  )
}

export default ReportPage
