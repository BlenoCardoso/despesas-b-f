import { createBrowserRouter } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { firebaseExpenseService } from './services/firebaseExpenseService'
import { firebaseHouseholdService } from './services/firebaseHouseholdService'
import { auth } from './config/firebase'
import type { Expense } from './types/firebase-schema'

// Função auxiliar para formatar datas
const formatDate = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  
  const diffTime = Math.abs(today.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return `${diffDays} dias atrás`
  return date.toLocaleDateString('pt-BR')
}

// Componente principal de despesas
function ExpenseApp() {
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null)
  const [filter, setFilter] = useState('all') // all, paid, pending, category
  const [sortBy, setSortBy] = useState('date') // date, amount, title
  const [showStats, setShowStats] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  
  // Estados do Firebase
  const [expenses, setExpenses] = useState<any[]>([])  // Temporariamente any[] para compatibilidade
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentHousehold, setCurrentHousehold] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  // Simular usuário logado (para demo)
  useEffect(() => {
    const mockUser = {
      uid: 'demo-user-123',
      email: 'demo@exemplo.com',
      displayName: 'Usuário Demo'
    }
    setCurrentUser(mockUser)
    initializeDemo(mockUser.uid)
  }, [])

  // Inicializar demo com dados
  const initializeDemo = async (userId: string) => {
    try {
      setLoading(true)
      console.log('🚀 Inicializando aplicativo...')
      
      // Verificar se já existe uma household
      const households = await firebaseHouseholdService.getUserHouseholds(userId)
      let householdId: string
      
      if (households.length === 0) {
        console.log('🏠 Configurando nova casa...')
        householdId = await firebaseHouseholdService.createHousehold('Casa B&F', userId)
        
        // Criar algumas despesas demo
        await createDemoExpenses(householdId, userId)
      } else {
        householdId = households[0].id
        console.log('🏠 Carregando casa existente...')
      }
      
      const household = await firebaseHouseholdService.getHouseholdById(householdId)
      setCurrentHousehold(household)
      
      // Configurar listener em tempo real
      console.log('🔄 Ativando sincronização...')
      const unsubscribe = firebaseExpenseService.subscribeToExpenses(householdId, (expensesData) => {
        console.log('📡 Dados atualizados:', expensesData.length)
        // Adaptar dados Firebase para UI
        const adaptedExpenses = expensesData.map(exp => ({
          ...exp,
          title: exp.description,
          date: formatDate(exp.createdAt),
          paidBy: exp.createdBy === userId ? 'Você' : 'Parceiro',
          splitType: 'equal', // Padrão por enquanto
          isPaid: Math.random() > 0.3 // Simular alguns como não pagos
        }))
        setExpenses(adaptedExpenses)
        setConnected(true)
      })
      
      setLoading(false)
      return unsubscribe
      
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error)
      setLoading(false)
      // Fallback para dados locais se Firebase falhar
      setExpenses(getLocalExpenses())
    }
  }

  // Criar despesas demo no Firebase
  const createDemoExpenses = async (householdId: string, userId: string) => {
    const demoExpenses = [
      {
        householdId,
        description: '🛒 Supermercado',
        amount: 150.50,
        category: 'alimentacao',
        paymentMethod: 'card' as const,
        createdBy: userId
      },
      {
        householdId,
        description: '⛽ Combustível',
        amount: 80.00,
        category: 'transporte',
        paymentMethod: 'money' as const,
        createdBy: 'partner-user'
      },
      {
        householdId,
        description: '🍕 Almoço',
        amount: 25.00,
        category: 'alimentacao',
        paymentMethod: 'pix' as const,
        createdBy: userId
      }
    ]

    for (const expense of demoExpenses) {
      try {
        await firebaseExpenseService.createExpense(expense)
        console.log('✅ Despesa demo criada:', expense.description)
      } catch (error) {
        console.error('❌ Erro ao criar despesa demo:', error)
      }
    }
  }

  // Fallback para dados locais
  const getLocalExpenses = () => [
    {
      id: 1,
      title: '🛒 Supermercado',
      amount: 150.50,
      date: 'Hoje',
      paidBy: 'Você',
      splitType: 'equal',
      category: 'alimentacao',
      isPaid: true,
      createdAt: new Date('2025-10-02')
    },
    {
      id: 2,
      title: '⛽ Combustível',
      amount: 80.00,
      date: 'Hoje',
      paidBy: 'Parceiro',
      splitType: 'equal',
      category: 'transporte',
      isPaid: true,
      createdAt: new Date('2025-10-02')
    },
    {
      id: 3,
      title: '� Almoço',
      amount: 25.00,
      date: 'Ontem',
      paidBy: 'Você',
      splitType: 'me',
      category: 'alimentacao',
      isPaid: false,
      createdAt: new Date('2025-10-01')
    }
  ]

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const yourShare = expenses.reduce((sum, exp) => {
    if (exp.splitType === 'equal') return sum + (exp.amount / 2)
    if (exp.splitType === 'me' && exp.paidBy === 'Você') return sum + exp.amount
    return sum
  }, 0)
  const partnerShare = total - yourShare

  // Estatísticas
  const pendingExpenses = expenses.filter(exp => !exp.isPaid)
  const paidExpenses = expenses.filter(exp => exp.isPaid)
  const categoriesStats = expenses.reduce((acc: any, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})

  // Filtros e ordenação
  const filteredExpenses = expenses
    .filter(exp => {
      if (filter === 'paid') return exp.isPaid
      if (filter === 'pending') return !exp.isPaid
      if (filter.startsWith('cat-')) return exp.category === filter.replace('cat-', '')
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'amount') return b.amount - a.amount
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })

  const addExpense = async (newExpense: any) => {
    if (!currentHousehold || !currentUser) return
    
    try {
      const expenseData = {
        householdId: currentHousehold.id,
        description: newExpense.title,
        amount: newExpense.amount,
        category: newExpense.category.toLowerCase(),
        paymentMethod: 'card' as const,
        createdBy: currentUser.uid
      }
      
      console.log('💾 Criando nova despesa:', expenseData)
      await firebaseExpenseService.createExpense(expenseData)
      
      setShowModal(false)
    } catch (error) {
      console.error('❌ Erro ao criar despesa:', error)
      // Fallback local em caso de erro
      const expense = { 
        id: Date.now().toString(),
        ...newExpense,
        title: newExpense.title,
        date: 'Hoje',
        paidBy: 'Você',
        splitType: 'equal',
        isPaid: false,
        createdAt: new Date()
      }
      setExpenses([expense, ...expenses])
      setShowModal(false)
    }
  }

  const editExpense = async (updatedExpense: any) => {
    if (!currentHousehold) return
    
    try {
      const updateData = {
        description: updatedExpense.title,
        amount: updatedExpense.amount,
        category: updatedExpense.category.toLowerCase()
      }
      
      await firebaseExpenseService.updateExpense(updatedExpense.id, updateData)
      setEditingExpense(null)
      setShowModal(false)
    } catch (error) {
      console.error('❌ Erro ao editar despesa:', error)
      // Fallback local
      setExpenses(expenses.map(exp => 
        exp.id === updatedExpense.id ? updatedExpense : exp
      ))
      setEditingExpense(null)
      setShowModal(false)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!currentUser) return
    
    const element = document.querySelector(`[data-expense-id="${id}"]`)
    element?.classList.add('opacity-50', 'scale-95')
    
    setTimeout(async () => {
      try {
        await firebaseExpenseService.deleteExpense(id, currentUser.uid)
        setShowActionMenu(null)
      } catch (error) {
        console.error('❌ Erro ao deletar despesa:', error)
        // Fallback local
        setExpenses(expenses.filter(exp => exp.id !== id))
        setShowActionMenu(null)
      }
    }, 200)
  }

  const togglePaidStatus = async (id: string) => {
    const expense = expenses.find(exp => exp.id === id)
    if (!expense) return
    
    try {
      // Por enquanto, atualizar só localmente
      setExpenses(expenses.map(exp => 
        exp.id === id ? { ...exp, isPaid: !exp.isPaid } : exp
      ))
      setShowActionMenu(null)
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
    }
  }

  const openEditModal = (expense: any) => {
    setEditingExpense(expense)
    setShowModal(true)
    setShowActionMenu(null)
  }

  // Gerar código de convite
  const generateInviteCode = async () => {
    if (!currentHousehold) return
    
    try {
      const code = await firebaseHouseholdService.generateInviteCode(currentHousehold.id)
      setInviteCode(code)
      setShowInviteModal(true)
    } catch (error) {
      console.error('❌ Erro ao gerar código:', error)
      alert('Erro ao gerar código de convite')
    }
  }

  // Ingressar via código
  const joinByCode = async (code: string) => {
    if (!currentUser || !code) return
    
    try {
      console.log('🔗 Tentando ingressar com código:', code)
      console.log('👤 Usuário atual:', currentUser.uid)
      
      // Verificar se o código existe
      const householdId = await firebaseHouseholdService.joinHouseholdByCode(code, currentUser.uid)
      
      if (householdId) {
        console.log('✅ Ingressou na household:', householdId)
        
        // Atualizar estado local
        const household = await firebaseHouseholdService.getHouseholdById(householdId)
        setCurrentHousehold(household)
        
        // Limpar despesas antigas
        setExpenses([])
        
        // Reconfigurar listener para nova household
        console.log('🔄 Reconfigurando listener para household:', householdId)
        const unsubscribe = firebaseExpenseService.subscribeToExpenses(householdId, (expensesData) => {
          console.log('📡 Novas despesas recebidas:', expensesData.length)
          const adaptedExpenses = expensesData.map(exp => ({
            ...exp,
            title: exp.description,
            date: formatDate(exp.createdAt),
            paidBy: exp.createdBy === currentUser.uid ? 'Você' : 'Parceiro',
            splitType: 'equal',
            isPaid: Math.random() > 0.3
          }))
          setExpenses(adaptedExpenses)
          setConnected(true)
        })
        
        setShowJoinModal(false)
        alert('✅ Você ingressou na household com sucesso! Agora você pode ver e gerenciar as despesas compartilhadas.')
        
        // Forçar reload da página para garantir que tudo está sincronizado
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
      } else {
        console.log('❌ Código não encontrado ou inválido')
        alert('❌ Código inválido, expirado ou já usado. Solicite um novo código.')
      }
    } catch (error) {
      console.error('❌ Erro ao ingressar:', error)
      
      // Log detalhado do erro
      if (error instanceof Error) {
        console.error('Mensagem do erro:', error.message)
        console.error('Stack:', error.stack)
      }
      
      alert('❌ Erro ao ingressar. Verifique sua conexão e tente novamente.\nSe o problema persistir, solicite um novo código.')
    }
  }

  return (
    <div className="p-4 bg-blue-50 min-h-screen">
      <div className="max-w-md mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">🔄 Carregando despesas...</p>
              <p className="text-gray-500 text-sm mt-1">Preparando sistema compartilhado</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-blue-800">💰 Despesas Compartilhadas</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-medium hover:bg-orange-200"
                  title="Ingressar em outra household"
                >
                  🔗 Entrar
                </button>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  connected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {connected ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
            </div>
            
            {/* Household Info */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">
                    🏠 {currentHousehold?.name || 'Casa B&F'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {currentHousehold?.members?.length || 2} pessoas compartilhando
                  </p>
                </div>
                <button 
                  onClick={generateInviteCode}
                  className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded"
                >
                  👥 Convidar
                </button>
              </div>
            </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📊 Resumo</h2>
            <button 
              onClick={() => setShowStats(!showStats)}
              className="text-blue-600 text-sm font-medium"
            >
              {showStats ? '📊 Ocultar' : '📈 Ver Mais'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">R$ {total.toFixed(2)}</p>
            <p className="text-gray-600">Total das despesas</p>
            <div className="mt-3 flex justify-center space-x-4 text-sm">
              <span className="text-green-600">• Você: R$ {yourShare.toFixed(2)}</span>
              <span className="text-orange-600">• Parceiro: R$ {partnerShare.toFixed(2)}</span>
            </div>
            
            {showStats && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-semibold text-green-700">{paidExpenses.length} Pagas</p>
                    <p className="text-green-600">R$ {paidExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="font-semibold text-orange-700">{pendingExpenses.length} Pendentes</p>
                    <p className="text-orange-600">R$ {pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}</p>
                  </div>
                </div>
                
                {/* Top categorias */}
                <div className="text-left">
                  <p className="font-medium text-gray-700 mb-2">🏆 Top Categorias:</p>
                  {Object.entries(categoriesStats)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm py-1">
                      <span className="capitalize">{cat.replace('alimentacao', '🍽️ Alimentação').replace('transporte', '🚗 Transporte').replace('casa', '🏠 Casa').replace('entretenimento', '🎬 Entretenimento')}</span>
                      <span className="font-medium">R$ {(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros e Ordenação */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              📋 Todas ({expenses.length})
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              ⏳ Pendentes ({pendingExpenses.length})
            </button>
            <button 
              onClick={() => setFilter('paid')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              ✅ Pagas ({paidExpenses.length})
            </button>
          </div>
          
          <div className="flex gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="date">📅 Por Data</option>
              <option value="amount">💰 Por Valor</option>
              <option value="title">🔤 Por Nome</option>
            </select>
            {filter !== 'all' && (
              <button 
                onClick={() => setFilter('all')}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-colors"
                title="Limpar filtros"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">📭</p>
              <p className="text-gray-600 mt-2">
                {filter === 'pending' ? 'Nenhuma despesa pendente!' : 
                 filter === 'paid' ? 'Nenhuma despesa paga ainda.' :
                 'Nenhuma despesa encontrada.'}
              </p>
              {filter !== 'all' && (
                <button 
                  onClick={() => setFilter('all')}
                  className="mt-3 text-blue-600 text-sm font-medium"
                >
                  Ver todas as despesas
                </button>
              )}
            </div>
          ) : (
            filteredExpenses.map(expense => (
              <div 
                key={expense.id} 
                data-expense-id={expense.id}
                className={`bg-white rounded-lg shadow-md p-4 relative transition-all duration-200 hover:shadow-lg ${
                  !expense.isPaid ? 'border-l-4 border-orange-400' : ''
                } ${
                  showActionMenu === expense.id ? 'ring-2 ring-blue-200' : ''
                }`}
              >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{expense.title}</h3>
                    {!expense.isPaid && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                        Pendente
                      </span>
                    )}
                    {expense.isPaid && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        ✓ Pago
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{expense.date} • Pago por {expense.paidBy}</p>
                  <p className={`text-xs ${
                    expense.splitType === 'equal' ? 'text-blue-600' : 
                    expense.splitType === 'me' ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    {expense.splitType === 'equal' ? 'Compartilhado 50/50' : 
                     expense.splitType === 'me' ? 'Só você' : 'Divisão personalizada'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">R$ {expense.amount.toFixed(2)}</p>
                  <p className={`text-xs ${
                    expense.splitType === 'equal' ? 
                      (expense.paidBy === 'Você' ? 'text-green-600' : 'text-orange-600') :
                      expense.splitType === 'me' ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    Sua parte: R$ {expense.splitType === 'equal' ? (expense.amount / 2).toFixed(2) : 
                                  expense.splitType === 'me' && expense.paidBy === 'Você' ? expense.amount.toFixed(2) : '0,00'}
                  </p>
                </div>
                
                {/* Botão de menu de ações */}
                <button 
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowActionMenu(showActionMenu === expense.id ? null : expense.id)}
                >
                  ⋮
                </button>
              </div>

              {/* Menu de ações */}
              {showActionMenu === expense.id && (
                <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                  <button
                    onClick={() => openEditModal(expense)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => togglePaidStatus(expense.id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {expense.isPaid ? '⏳ Marcar pendente' : '✅ Marcar como pago'}
                  </button>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              )}
            </div>
          ))
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <button 
            className="bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowModal(true)}
          >
            ➕ Adicionar Despesa
          </button>
          <button 
            className="bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={() => alert('📊 Relatórios em breve!')}
          >
            📊 Relatórios
          </button>
        </div>

        {/* Modal de Adicionar/Editar Despesa */}
        {showModal && (
          <AddExpenseModal 
            expense={editingExpense}
            onAdd={addExpense} 
            onEdit={editExpense}
            onClose={() => {
              setShowModal(false)
              setEditingExpense(null)
            }} 
          />
        )}

        {/* Modal de Convite Gerado */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">🎉 Convite Gerado!</h3>
                <p className="text-gray-600 text-sm mb-4">Compartilhe este código para convidar pessoas:</p>
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-3xl font-bold text-blue-600 tracking-wider">{inviteCode}</p>
                </div>
                
                <div className="text-left bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium text-gray-700">Como usar:</p>
                  <p className="text-gray-600">1. Compartilhe o código acima</p>
                  <p className="text-gray-600">2. A pessoa deve clicar em "🔗 Entrar"</p>
                  <p className="text-gray-600">3. Inserir o código e confirmar</p>
                  <p className="text-gray-600">4. Pronto! Despesas compartilhadas ao vivo!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode)
                    alert('Código copiado!')
                  }}
                  className="py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
                >
                  📋 Copiar
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Ingressar via Código */}
        {showJoinModal && (
          <JoinHouseholdModal 
            onJoin={joinByCode}
            onClose={() => setShowJoinModal(false)}
          />
        )}

        <div className="mt-6 p-4 bg-green-100 rounded-lg">
          <p className="text-green-800 font-medium text-center">
            {connected ? '✅ Sistema Compartilhado Ativo!' : '📱 Modo Offline'}
          </p>
          <p className="text-green-600 text-sm text-center mt-1">
            {connected ? 'Despesas sincronizadas em tempo real' : 'Sincronizará quando conectar à internet'}
          </p>
        </div>

        {/* Overlay para fechar menu de ações */}
        {showActionMenu && (
          <div 
            className="fixed inset-0 z-5"
            onClick={() => setShowActionMenu(null)}
          />
        )}
      </>
      )}
      </div>
    </div>
  )
}

// Modal de adicionar/editar despesa
function AddExpenseModal({ 
  expense, 
  onAdd, 
  onEdit, 
  onClose 
}: { 
  expense?: any
  onAdd: (expense: any) => void
  onEdit: (expense: any) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    amount: expense?.amount?.toString() || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    category: expense?.category || '🍽️ Alimentação',
    splitType: expense?.splitType || 'equal'
  })

  const isEditing = !!expense

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.amount) {
      const expenseData = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        date: 'Hoje',
        paidBy: 'Você',
        splitType: formData.splitType,
        category: formData.category
      }

      if (isEditing) {
        onEdit({ ...expense, ...expenseData })
      } else {
        onAdd(expenseData)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? '✏️ Editar Despesa' : '➕ Nova Despesa'}
          </h3>
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input 
              type="text" 
              placeholder="Ex: Supermercado, Aluguel..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option>🍽️ Alimentação</option>
              <option>🚗 Transporte</option>
              <option>🏠 Casa</option>
              <option>🎬 Entretenimento</option>
              <option>⚕️ Saúde</option>
              <option>📚 Educação</option>
              <option>💰 Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Como dividir?</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="split" 
                  value="equal" 
                  checked={formData.splitType === 'equal'}
                  onChange={(e) => setFormData({...formData, splitType: e.target.value})}
                  className="mr-2"
                />
                <span>👫 Dividir igualmente (50/50)</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="split" 
                  value="me" 
                  checked={formData.splitType === 'me'}
                  onChange={(e) => setFormData({...formData, splitType: e.target.value})}
                  className="mr-2"
                />
                <span>🙋‍♂️ Só eu pago</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="split" 
                  value="custom" 
                  checked={formData.splitType === 'custom'}
                  onChange={(e) => setFormData({...formData, splitType: e.target.value})}
                  className="mr-2"
                />
                <span>⚖️ Divisão personalizada</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              {isEditing ? '💾 Salvar Alterações' : '➕ Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para ingressar via código
function JoinHouseholdModal({ 
  onJoin, 
  onClose 
}: { 
  onJoin: (code: string) => void
  onClose: () => void 
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim().length !== 6) {
      setError('O código deve ter 6 caracteres')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await onJoin(code.trim().toUpperCase())
    } catch (err) {
      setError('Erro ao ingressar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">🔗 Ingressar na Household</h3>
          <p className="text-gray-600 text-sm mb-4">
            Digite o código de 6 dígitos que você recebeu:
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="ABC123"
              maxLength={6}
              className="w-full p-4 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none tracking-wider"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Código de 6 caracteres (letras e números)
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1 text-center">
                ⚠️ {error}
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-blue-800 mb-1">ℹ️ Como funciona:</p>
            <p className="text-blue-700">Ao ingressar, você verá todas as despesas compartilhadas em tempo real e poderá adicionar/editar junto com outros membros.</p>
          </div>

          {loading && (
            <div className="bg-yellow-50 rounded-lg p-3 text-sm text-center">
              <p className="text-yellow-700">⏳ Processando convite...</p>
              <p className="text-yellow-600 text-xs mt-1">Aguarde um momento</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              disabled={loading || code.trim().length !== 6}
            >
              {loading ? '⏳ Ingressando...' : '🚀 Ingressar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import LoginPage from '@/features/auth/pages/LoginPage'
import InvitePage from '@/pages/InvitePage'
import HomePage from '@/pages/HomePage'
import { MobileExpensesPage } from '@/pages/UltraSimplePage'
import { NewSettingsPage } from '@/pages/NewSettingsPage'
import AuthLayout from '@/components/layouts/AuthLayout'
import { SimpleLayout } from '@/components/SimpleLayout'

// Componente temporário para registro
const RegisterPage = () => <div>Register Page - Em desenvolvimento</div>

export const router = createBrowserRouter([
  // Rota de teste direta
  {
    path: '/test',
    element: <div className="p-8 bg-green-100 min-h-screen">
      <h1 className="text-3xl font-bold text-green-800">🎉 TESTE FUNCIONANDO!</h1>
      <p className="text-lg text-green-600 mt-4">Router e Vite funcionando perfeitamente!</p>
    </div>
  },
  
  // Auth routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      },
      {
        path: '/convite/:code',
        element: <InvitePage />
      }
    ]
  },

  // SISTEMA PRINCIPAL com Layout completo
  {
    path: '/expenses',
    element: <ExpenseApp />
  },
  {
    path: '/settings',
    element: <SimpleLayout />,
    children: [
      {
        path: '',
        element: <NewSettingsPage />
      }
    ]
  }
])