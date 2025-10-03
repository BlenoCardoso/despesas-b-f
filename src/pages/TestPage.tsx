import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/mobile-card'
import { Plus, Search } from 'lucide-react'

// Função local para formatação
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

export function MobileExpensesPage() {
  // Dados de teste simples
  const [searchText, setSearchText] = useState('')
  const expenses = [
    { id: 1, title: 'Supermercado', amount: 150.50, date: '2024-10-02', category: 'alimentação', notes: 'Compras da semana' },
    { id: 2, title: 'Combustível', amount: 80.00, date: '2024-10-02', category: 'transporte', notes: 'Posto Ipiranga' },
    { id: 3, title: 'Almoço', amount: 25.00, date: '2024-10-01', category: 'alimentação', notes: '' },
  ]

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchText.toLowerCase())
  )

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Despesas Mobile</h1>
          <p className="text-gray-600">Versão simplificada funcionando</p>
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Total das Despesas</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(total)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {filteredExpenses.length} despesa{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar despesas..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Expense List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchText ? 'Resultados da busca' : 'Despesas recentes'}
          </h2>
          
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {searchText ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa ainda'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchText ? 'Tente outros termos de busca' : 'Adicione sua primeira despesa'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map(expense => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{expense.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{expense.notes}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      <div className="text-xs text-gray-500 capitalize">
                        {expense.category}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Button */}
        <Button className="w-full h-12 text-base">
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Despesa
        </Button>

        {/* Status */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-green-700 font-medium text-sm">✅ Interface Mobile Funcionando!</p>
              <p className="text-xs text-green-600 mt-1">
                Versão simplificada • {expenses.length} despesas de teste
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}