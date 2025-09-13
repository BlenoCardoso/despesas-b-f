import { Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { Medication } from '../types'

interface StockSummaryProps {
  medications: Medication[]
}

export function StockSummary({ medications }: StockSummaryProps) {
  const stockStats = medications.reduce((acc, med) => {
    if (med.stockQuantity <= 0) {
      acc.outOfStock++
    } else if (med.stockQuantity <= med.lowStockThreshold) {
      acc.lowStock++
    } else {
      acc.adequate++
    }
    return acc
  }, { outOfStock: 0, lowStock: 0, adequate: 0 })

  const totalMedications = medications.length

  if (totalMedications === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-600" />
          Resumo de Estoque
        </h3>
        <span className="text-sm text-gray-600">
          {totalMedications} medicamento{totalMedications !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Adequate Stock */}
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stockStats.adequate}</div>
          <div className="text-xs text-green-700 font-medium">Estoque OK</div>
          <div className="text-xs text-green-600 mt-1">
            {totalMedications > 0 ? Math.round((stockStats.adequate / totalMedications) * 100) : 0}%
          </div>
        </div>

        {/* Low Stock */}
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
            {stockStats.lowStock > 0 && <AlertTriangle className="h-4 w-4 mr-1" />}
            {stockStats.lowStock}
          </div>
          <div className="text-xs text-yellow-700 font-medium">Estoque Baixo</div>
          <div className="text-xs text-yellow-600 mt-1">
            {totalMedications > 0 ? Math.round((stockStats.lowStock / totalMedications) * 100) : 0}%
          </div>
        </div>

        {/* Out of Stock */}
        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
            {stockStats.outOfStock > 0 && <TrendingDown className="h-4 w-4 mr-1" />}
            {stockStats.outOfStock}
          </div>
          <div className="text-xs text-red-700 font-medium">Sem Estoque</div>
          <div className="text-xs text-red-600 mt-1">
            {totalMedications > 0 ? Math.round((stockStats.outOfStock / totalMedications) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stockStats.lowStock > 0 || stockStats.outOfStock > 0) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-sm font-medium text-amber-800">Atenção necessária</span>
          </div>
          <div className="text-sm text-amber-700 mt-1">
            {stockStats.outOfStock > 0 && (
              <div>• {stockStats.outOfStock} medicamento{stockStats.outOfStock !== 1 ? 's' : ''} sem estoque</div>
            )}
            {stockStats.lowStock > 0 && (
              <div>• {stockStats.lowStock} medicamento{stockStats.lowStock !== 1 ? 's' : ''} com estoque baixo</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}