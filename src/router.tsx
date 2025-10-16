import { createBrowserRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { useState, useEffect, useRef } from 'react'
import { ConnectionStatus } from './components/ConnectionStatus'
import { firebaseExpenseService } from './services/firebaseExpenseService'
import { firebaseHouseholdService } from './services/firebaseHouseholdService'
import { firebaseHouseholdService as firebaseHouseholdServiceComplete } from './services/firebaseHouseholdServiceComplete'
import { firebaseUserService } from './services/firebaseUserService'
import { householdService } from './services/householdService'
import { shareInviteService } from './services/shareInviteService'
import { auth } from './config/firebase'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
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
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [trashLoading, setTrashLoading] = useState(false)
  const [trashItems, setTrashItems] = useState<any[]>([])
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([])
  const [trashFilterCategory, setTrashFilterCategory] = useState<string>('')
  const [trashFilterFrom, setTrashFilterFrom] = useState<string>('')
  const [trashFilterTo, setTrashFilterTo] = useState<string>('')
  const [trashSearch, setTrashSearch] = useState<string>('')
  const [trashVisible, setTrashVisible] = useState<number>(50)
  const [filter, setFilter] = useState('all') // all, paid, pending, category
  const [sortBy, setSortBy] = useState('date') // date, amount, title
  const [showStats, setShowStats] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [myHouseholds, setMyHouseholds] = useState<any[]>([])
  const [showOnlyOnline, setShowOnlyOnline] = useState(false)
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({})
  const [showTransferModal, setShowTransferModal] = useState<{open: boolean; household?: any; note?: string}>({ open: false })
  const [transferCandidates, setTransferCandidates] = useState<any[]>([])
  const [transferTo, setTransferTo] = useState<string>('')
  const [transferring, setTransferring] = useState(false)
  const [pendingLeaveAfterTransferHouseholdId, setPendingLeaveAfterTransferHouseholdId] = useState<string | null>(null)
  // Guardar unsubscribe do listener de despesas para podermos trocar de household
  const expensesUnsubRef = useRef<null | (() => void)>(null)
  
  // Estados do Firebase
  const [expenses, setExpenses] = useState<any[]>([])  // Temporariamente any[] para compatibilidade
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentHousehold, setCurrentHousehold] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [inviteGenerating, setInviteGenerating] = useState(false)
  const [joinInfo, setJoinInfo] = useState<{ status: 'idle' | 'requested' | 'joined'; message?: string }>({ status: 'idle' })

  // Autenticação anônima em vez de mock
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        if (!currentHousehold) {
          await initializeDemo(user.uid)
        }
        // Iniciar heartbeat de presença (atualiza lastSeen periodicamente)
        try { await firebaseUserService.updateLastSeen(user.uid) } catch {}
        const id = window.setInterval(() => {
          firebaseUserService.updateLastSeen(user.uid).catch(() => {})
        }, 30_000)
        // Cleanup do heartbeat
        return () => window.clearInterval(id)
      } else {
        try {
          await signInAnonymously(auth)
          console.log('🔐 Autenticado anonimamente')
        } catch (e) {
          console.error('❌ Erro auth anônima', e)
        }
      }
    })
    return () => unsub()
  }, [])

  // Inicializar demo com dados
  const initializeDemo = async (userId: string) => {
    try {
      setLoading(true)
      console.log('🚀 Inicializando aplicativo...')
      // 1. Tentar reutilizar householdId persistido
      let storedHouseholdId: string | null = null
      if (typeof window !== 'undefined') {
        storedHouseholdId = localStorage.getItem('currentHouseholdId')
        if (storedHouseholdId) {
          console.log('💾 HouseholdId encontrado em localStorage:', storedHouseholdId)
        }
      }
      
      // Verificar se já existe uma household
      let households: any[] = []
      try {
        if (storedHouseholdId) {
          const hh = await firebaseHouseholdService.getHouseholdById(storedHouseholdId)
          if (hh) {
            households = [hh]
            console.log('✅ Household carregada via stored id')
          } else {
            console.log('ℹ️ Household armazenada não encontrada, buscando por membro...')
            households = await firebaseHouseholdService.getUserHouseholds(userId)
          }
        } else {
          households = await firebaseHouseholdService.getUserHouseholds(userId)
        }
      } catch (err: any) {
        const msg = err?.message || ''
        console.warn('⚠️ Falha ao buscar households, tentando criar nova. Motivo:', msg)
        if (msg.includes('Missing or insufficient permissions')) {
          console.warn('Tentando criar household mesmo com erro de leitura (fallback).')
        } else {
          console.warn('Erro não previsto, ainda assim tentando criar household de demo.')
        }
        households = []
      }
      let householdId: string
      
      if (households.length === 0) {
        console.log('🏠 Nenhuma household existente. Criando nova casa...')
        householdId = await firebaseHouseholdService.createHousehold('Casa B&F', userId)
        if (typeof window !== 'undefined') localStorage.setItem('currentHouseholdId', householdId)
        // Criar despesas demo apenas se ainda não criadas para esta household
        await createDemoExpenses(householdId, userId)
      } else {
        householdId = households[0].id
        console.log('🏠 Carregando casa existente:', householdId)
        if (typeof window !== 'undefined') localStorage.setItem('currentHouseholdId', householdId)
      }
      
      const household = await firebaseHouseholdService.getHouseholdById(householdId)
      setCurrentHousehold(household)
      
      // Configurar listener em tempo real usando helper
      console.log('🔄 Ativando sincronização...')
      startExpensesListener(householdId, userId)
      
      setLoading(false)
      return expensesUnsubRef.current || undefined
      
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error)
      setLoading(false)
      // Fallback para dados locais se Firebase falhar
      setExpenses(getLocalExpenses())
    }
  }

  // Inicia (ou reinicia) o listener de despesas para uma household específica
  const startExpensesListener = (householdId: string, userId: string) => {
    // Cancelar listener anterior se existir
    if (expensesUnsubRef.current) {
      try { expensesUnsubRef.current() } catch {}
      expensesUnsubRef.current = null
    }
    setConnected(false)
    const unsub = firebaseExpenseService.subscribeToExpenses(householdId, (expensesData) => {
      console.log('📡 Dados atualizados:', expensesData.length)
      // Adaptar dados Firebase para UI preservando estado local (isPaid, splitType)
      setExpenses(prev => {
        const prevMap = new Map(prev.map(p => [p.id, p]))
        const adaptedExpenses = expensesData.map(exp => {
          const prevItem = prevMap.get(exp.id)
          return {
            ...exp,
            title: exp.description,
            date: formatDate(exp.createdAt),
            paidBy: exp.createdBy === userId ? 'Você' : 'Parceiro',
            splitType: prevItem?.splitType || 'equal',
            isPaid: prevItem?.isPaid ?? false
          }
        })
        return adaptedExpenses
      })
      setConnected(true)
    })
    expensesUnsubRef.current = unsub
  }

  // Calcula quantos membros estão online por household (lastSeen < 2min), exceto você
  const computeOnlineCounts = async (households: any[], currentUid: string) => {
    const counts: Record<string, number> = {}
    const now = Date.now()
    const ONLINE_WINDOW_MS = 2 * 60 * 1000
    for (const hh of households) {
      try {
        const users = await firebaseUserService.getHouseholdMembers(hh.id)
        const online = users.filter(u => {
          if (u.id === currentUid) return false
          const seen = (u as any).lastSeen instanceof Date ? (u as any).lastSeen.getTime() : (u as any).lastSeen?.toMillis?.() || 0
          return seen && (now - seen) <= ONLINE_WINDOW_MS
        }).length
        counts[hh.id] = online
      } catch {
        counts[hh.id] = 0
      }
    }
    setOnlineCounts(counts)
    return counts
  }

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (expensesUnsubRef.current) {
        try { expensesUnsubRef.current() } catch {}
        expensesUnsubRef.current = null
      }
    }
  }, [])

  // Ativar uma household como atual (persistir + listener + prefetch)
  const setActiveHousehold = async (householdId: string, userId: string) => {
    try { if (typeof window !== 'undefined') localStorage.setItem('currentHouseholdId', householdId) } catch {}
    const hh = await firebaseHouseholdService.getHouseholdById(householdId)
    setCurrentHousehold(hh)
    startExpensesListener(householdId, userId)
    try {
      const initial = await firebaseExpenseService.getExpenses(householdId)
      setExpenses(initial.map(exp => ({
        ...exp,
        title: exp.description,
        date: formatDate(exp.createdAt),
        paidBy: exp.createdBy === userId ? 'Você' : 'Parceiro',
        splitType: 'equal',
        isPaid: false
      })))
    } catch {}
  }

  // Criar despesas demo no Firebase
  const createDemoExpenses = async (householdId: string, userId: string) => {
    // Evitar recriar demo se já foi criada uma vez para esta household
    if (typeof window !== 'undefined') {
      const demoKey = `demoCreated:${householdId}`
      const already = localStorage.getItem(demoKey)
      if (already) {
        console.log('⏭️ Despesas demo já criadas anteriormente. Pulando.')
        return
      }
      localStorage.setItem(demoKey, '1')
    }
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
      const id = await firebaseExpenseService.createExpense(expenseData)
      // Atualização otimista (será substituída pelo listener em seguida)
      setExpenses(prev => [{
        id,
        title: newExpense.title,
        amount: newExpense.amount,
        date: 'Hoje',
        paidBy: 'Você',
        splitType: newExpense.splitType || 'equal',
        category: newExpense.category,
        isPaid: false,
        createdAt: new Date()
      }, ...prev.filter(e => e.id !== id)])
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
      // Atualização otimista mantendo demais campos locais
      setExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? {
        ...exp,
        title: updatedExpense.title,
        amount: updatedExpense.amount,
        category: updatedExpense.category,
        // date permanece baseada em createdAt, não alterar aqui
      } : exp))
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
    if (!currentHousehold) {
      console.warn('⚠️ Nenhuma household atual para gerar convite')
  toast.info('Ainda carregando a casa. Tente de novo em alguns segundos.')
      return
    }
    if (!currentUser) {
  toast.info('Usuário não autenticado ainda. Aguarde...')
      return
    }
    if (!navigator.onLine) {
  toast.error('Você está offline. Conecte-se à internet para gerar convite.')
      return
    }
    if (currentHousehold.ownerId !== currentUser.uid) {
  toast.error('Apenas o proprietário (ou admin) pode gerar convites.')
      return
    }
    console.log('🧪 Clique em Convidar. Household:', currentHousehold.id, 'User:', currentUser.uid)
    setShowInviteModal(true)
    setInviteCode('••••••')
    setInviteGenerating(true)
    try {
      // Usar apenas householdService que funciona 100%
      console.log('🎟️ Gerando código via householdService...')
      const code = await householdService.generateInviteCode(currentHousehold.id)
      console.log('✅ Código gerado:', code)
      setInviteCode(code)
      
      // Copiar para clipboard
      try {
        await navigator.clipboard.writeText(code)
        console.log('✅ Código copiado para clipboard')
      } catch (e) {
        console.warn('Não foi possível copiar automaticamente')
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar código:', error)
      setInviteCode('ERRO')
  toast.error(`Erro ao gerar convite: ${error?.message || 'Erro desconhecido'}`)
    } finally {
      setInviteGenerating(false)
    }
  }

  // Ingressar via código - USANDO APENAS SISTEMA QUE FUNCIONA
  const joinByCode = async (code: string) => {
    if (!currentUser || !code) return
    const upper = code.trim().toUpperCase()
    
    console.log('🔗 Tentando ingressar com código:', upper)
    
    try {
      // Usar apenas householdService que funciona 100%
      const householdId = await householdService.acceptInvite(upper)
      
      if (householdId) {
        console.log('✅ Convite aceito! Household ID:', householdId)
        setJoinInfo({ status: 'joined', message: 'Ingressou com sucesso!' })
        
        // Buscar dados da household
        const household = await householdService.getHousehold(householdId)
        if (household) {
          setCurrentHousehold(household)
        }
        // Persistir household atual para recarregamentos futuros
        try { if (typeof window !== 'undefined') localStorage.setItem('currentHouseholdId', householdId) } catch {}

        // Reiniciar o listener de despesas para a nova household
        if (currentUser?.uid) {
          startExpensesListener(householdId, currentUser.uid)
          // Fazer um fetch imediato para popular a lista enquanto o listener inicializa
          try {
            const initial = await firebaseExpenseService.getExpenses(householdId)
            setExpenses(initial.map(exp => ({
              ...exp,
              title: exp.description,
              date: formatDate(exp.createdAt),
              paidBy: exp.createdBy === currentUser.uid ? 'Você' : 'Parceiro',
              splitType: 'equal',
              isPaid: false
            })))
          } catch (e) {
            console.warn('Falha no fetch imediato de despesas após join:', e)
          }
        }
        
        setShowJoinModal(false)
  toast.success('Você entrou na household com sucesso!')
      } else {
  toast.error('Código inválido ou expirado.')
      }
    } catch (error: any) {
      console.error('❌ Erro ao aceitar convite:', error)
  toast.error(`Erro: ${error?.message || 'Código inválido'}`)
    }
  }

  // ----- Solicitações Pendentes -----
  // DESATIVADO TEMPORARIAMENTE - Sistema antigo com problemas de permissão
  // Usando apenas householdService.acceptInvite() que funciona 100%
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const isOwner = currentHousehold && currentUser && currentHousehold.ownerId === currentUser.uid
  
  /* CÓDIGO DESATIVADO - Causava erros de permissão
  if (currentHousehold && currentUser) {
    console.debug('[DEBUG] ownerId:', currentHousehold.ownerId, 'user:', currentUser.uid, 'isOwner?', isOwner)
  }

  const loadRequests = async () => {
    if (!isOwner || !currentHousehold) return
    setLoadingRequests(true)
    try {
      const list = await shareInviteService.listPendingRequests(currentHousehold.id)
      setPendingRequests(list)
    } catch (e) {
      console.error('Erro ao listar requests', e)
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadRequests()
    const id = setInterval(loadRequests, 10000)
    return () => clearInterval(id)
  }, [isOwner, currentHousehold?.id])
  */

  /* FUNÇÕES DESATIVADAS - Sistema antigo
  const approveRequest = async (r: any) => {
    try {
      await shareInviteService.approveRequest({
        requestId: r.id,
        inviteId: r.inviteId,
        householdId: r.householdId,
        requesterUid: r.requesterUid
      })
      setPendingRequests(reqs => reqs.filter(x => x.id !== r.id))
      alert('✅ Aprovado!')
    } catch (e) {
      console.error('Erro ao aprovar', e)
      alert('Erro ao aprovar')
    }
  }

  const rejectRequest = async (r: any) => {
    try {
      await shareInviteService.rejectRequest(r.id)
      setPendingRequests(reqs => reqs.filter(x => x.id !== r.id))
      alert('🚫 Rejeitado')
    } catch (e) {
      console.error('Erro ao rejeitar', e)
      alert('Erro ao rejeitar')
    }
  }
  */

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
                <ConnectionStatus connected={connected} />
              </div>
            </div>
            {/* Household Info */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">🏠 {currentHousehold?.name || 'Casa B&F'}</h2>
                  <p className="text-sm text-gray-500">{currentHousehold?.members?.length || 2} pessoas compartilhando</p>
                  {currentHousehold && currentUser && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-gray-400">uid: {currentUser.uid.slice(0,8)} • owner: {String(currentHousehold.ownerId).slice(0,8)} {currentHousehold.ownerId === currentUser.uid ? '(owner)' : ''}</p>
                      <p className="text-[10px] text-gray-400">hh: {String(currentHousehold.id).slice(0,8)}…</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <button 
                      onClick={generateInviteCode}
                      disabled={!currentHousehold || inviteGenerating}
                      className="text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded"
                    >
                      {inviteGenerating ? '⏳...' : '👥 Convidar'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400" title="Apenas proprietário ou admin pode gerar convites">sem permissão</span>
                  )}
                  {isOwner && (
                    <button
                      onClick={async () => {
                        if (!currentUser || !currentHousehold) return
                        try {
                          const users = await firebaseUserService.getHouseholdMembers(currentHousehold.id)
                          const candidates = users.filter(u => u.id !== currentUser.uid)
                          setTransferCandidates(candidates)
                          setTransferTo(candidates[0]?.id || '')
                          setShowTransferModal({ open: true, household: currentHousehold })
                        } catch (e) {
                          console.error('Erro ao carregar membros', e)
                          toast.error('Não foi possível carregar os membros para transferir')
                        }
                      }}
                      className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-sm font-medium px-2 py-1 rounded"
                      title="Transferir propriedade"
                    >
                      🔑 Transferir
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!currentUser) return
                      setShowSwitcher(true)
                      try {
                        const list = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                        setMyHouseholds(list)
                        // Recalcular presença online dos membros (sem contar você)
                        try { await computeOnlineCounts(list, currentUser.uid) } catch {}
                      } catch (e) {
                        console.error('Erro ao carregar households do usuário', e)
                      }
                    }}
                    className="text-gray-700 text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded"
                    title="Trocar de casa"
                  >
                    ⇄ Trocar
                  </button>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="text-red-600 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded"
                    title="Sair do compartilhamento desta household"
                  >
                    🚪 Sair
                  </button>
                </div>
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
        {/* Seção de Solicitações removida - usando sistema direto de convites */}

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
            onClick={() => toast('📊 Relatórios em breve!')}
          >
            📊 Relatórios
          </button>
        </div>

        {/* Ações em massa */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              🗑️ Excluir todas as despesas
            </button>
            <p className="text-[11px] text-red-500 mt-1 text-center">Somente desta household • ação reversível (soft delete)</p>
          </div>
          <div>
            <button
              onClick={async () => {
                if (!currentHousehold) return
                try {
                  const count = await firebaseExpenseService.restoreAllExpenses(currentHousehold.id)
                  toast.success(`♻️ ${count} despesas restauradas`)
                } catch (e) {
                  console.error('Erro ao restaurar todas', e)
                  toast.error('Erro ao restaurar despesas')
                }
              }}
              className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
            >
              ♻️ Restaurar todas
            </button>
            <p className="text-[11px] text-emerald-600 mt-1 text-center">Reverte o soft delete de todas as despesas</p>
          </div>
          <div className="md:col-span-2">
            <button
              onClick={async () => {
                if (!currentHousehold) return
                setShowTrash(true)
                setTrashLoading(true)
                try {
                  const items = await firebaseExpenseService.getDeletedExpenses(currentHousehold.id)
                  setTrashItems(items)
                  setSelectedTrashIds([])
                } catch (e) {
                  console.error('Erro ao abrir lixeira', e)
                  toast.error('Erro ao carregar lixeira')
                  setShowTrash(false)
                } finally {
                  setTrashLoading(false)
                }
              }}
              className="w-full py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              🧺 Abrir Lixeira
            </button>
          </div>
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

        {/* Modal de confirmar EXCLUIR TODAS */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Excluir todas as despesas?</h3>
                <p className="text-gray-600 text-sm">Isso vai mover todas as despesas desta household para a lixeira (soft delete). Você pode restaurar depois se necessário.</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Esta ação não afeta outras households e pode levar alguns segundos se houver muitas despesas.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium disabled:opacity-50"
                  disabled={deletingAll}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!currentHousehold || !currentUser) return
                    setDeletingAll(true)
                    try {
                      const count = await firebaseExpenseService.deleteAllExpenses(currentHousehold.id, currentUser.uid)
                      toast.success(`✅ ${count} despesas movidas para a lixeira`)
                      setShowDeleteAllModal(false)
                    } catch (e) {
                      console.error('Erro ao excluir todas', e)
                      toast.error('Erro ao excluir todas as despesas')
                    } finally {
                      setDeletingAll(false)
                    }
                  }}
                  className="py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                  disabled={deletingAll}
                >
                  {deletingAll ? '⏳ Excluindo...' : '🗑️ Excluir todas'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lixeira */}
        {showTrash && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">🧺 Lixeira</h3>
                <button onClick={() => setShowTrash(false)} className="text-gray-500 text-2xl">×</button>
              </div>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  placeholder="Pesquisar descrição"
                  value={trashSearch}
                  onChange={(e) => setTrashSearch(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={trashFilterCategory}
                  onChange={(e) => setTrashFilterCategory(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todas categorias</option>
                  {Array.from(new Set(trashItems.map(i => i.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{String(cat).toString()}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={trashFilterFrom}
                  onChange={(e) => setTrashFilterFrom(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={trashFilterTo}
                  onChange={(e) => setTrashFilterTo(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              {trashLoading ? (
                <p className="text-gray-600">Carregando...</p>
              ) : trashItems.length === 0 ? (
                <p className="text-gray-600">Nenhuma despesa na lixeira.</p>
              ) : (
                <div className="max-h-80 overflow-auto border rounded-lg">
                  {(() => {
                    // Aplicar filtros
                    let list = trashItems.slice()
                    if (trashSearch.trim()) {
                      const s = trashSearch.trim().toLowerCase()
                      list = list.filter(i => String(i.description || '').toLowerCase().includes(s))
                    }
                    if (trashFilterCategory) {
                      list = list.filter(i => i.category === trashFilterCategory)
                    }
                    if (trashFilterFrom) {
                      const from = new Date(trashFilterFrom)
                      list = list.filter(i => new Date(i.createdAt) >= from)
                    }
                    if (trashFilterTo) {
                      const to = new Date(trashFilterTo)
                      to.setHours(23,59,59,999)
                      list = list.filter(i => new Date(i.createdAt) <= to)
                    }
                    const display = list.slice(0, trashVisible)
                    return (
                      <>
                        <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="p-2 w-10"><input type="checkbox" onChange={(e) => {
                          if (e.target.checked) setSelectedTrashIds(display.map((i) => i.id))
                          else setSelectedTrashIds([])
                        }} checked={display.length > 0 && selectedTrashIds.length === display.length} /></th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                        <tbody>
                      {display.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={selectedTrashIds.includes(item.id)} onChange={(e) => {
                              setSelectedTrashIds((prev) => e.target.checked ? [...new Set([...prev, item.id])] : prev.filter(id => id !== item.id))
                            }} />
                          </td>
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right">R$ {Number(item.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                        </tbody>
                      </table>
                      {display.length < list.length && (
                        <div className="p-2 flex justify-center">
                          <button
                            onClick={() => setTrashVisible(v => v + 50)}
                            className="px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                          >
                            Carregar mais
                          </button>
                        </div>
                      )}
                      </>
                    )
                  })()}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={async () => {
                    try {
                      const count = await firebaseExpenseService.restoreExpenses(selectedTrashIds)
                      setTrashItems(items => items.filter(i => !selectedTrashIds.includes(i.id)))
                      setSelectedTrashIds([])
                      toast.success(`♻️ ${count} restauradas`)
                    } catch (e) {
                      console.error('Erro ao restaurar selecionadas', e)
                      toast.error('Falha ao restaurar selecionadas')
                    }
                  }}
                  className="py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  disabled={selectedTrashIds.length === 0}
                >
                  ♻️ Restaurar selecionadas
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Tem certeza? Esta ação remove definitivamente os itens selecionados.')) return
                    try {
                      const count = await firebaseExpenseService.hardDeleteExpenses(selectedTrashIds)
                      setTrashItems(items => items.filter(i => !selectedTrashIds.includes(i.id)))
                      setSelectedTrashIds([])
                      toast.success(`🗑️ ${count} removidas definitivamente`)
                    } catch (e) {
                      console.error('Erro ao apagar definitivamente', e)
                      alert('❌ Falha ao apagar definitivamente')
                    }
                  }}
                  className="py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                  disabled={selectedTrashIds.length === 0}
                >
                  🗑️ Apagar definitivamente
                </button>
                <button
                  onClick={async () => {
                    try {
                      const allIds = trashItems.map(i => i.id)
                      if (!allIds.length) return
                      if (!confirm('Esvaziar a lixeira? Esta ação não pode ser desfeita.')) return
                      const count = await firebaseExpenseService.hardDeleteExpenses(allIds)
                      setTrashItems([])
                      setSelectedTrashIds([])
                      alert(`🧹 Lixeira esvaziada: ${count} itens`) 
                    } catch (e) {
                      console.error('Erro ao esvaziar lixeira', e)
                      alert('❌ Falha ao esvaziar lixeira')
                    }
                  }}
                  className="py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  🧹 Esvaziar lixeira
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Trocar de Casa */}
        {showSwitcher && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">⇄ Trocar de Casa</h3>
                <button onClick={() => setShowSwitcher(false)} className="text-gray-500 text-2xl">×</button>
              </div>
              {(!myHouseholds || myHouseholds.length === 0) ? (
                <div className="text-center text-gray-600">
                  <p>Você ainda não tem outras casas.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {/* Filtro: Somente com alguém online */}
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                      <input type="checkbox" checked={showOnlyOnline} onChange={(e) => setShowOnlyOnline(e.target.checked)} />
                      Somente com alguém online
                    </label>
                    <button
                      onClick={async () => {
                        if (!currentUser) return
                        try { await computeOnlineCounts(myHouseholds, currentUser.uid) } catch {}
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Atualizar
                    </button>
                  </div>
                  {myHouseholds
                    .filter(hh => !showOnlyOnline || (onlineCounts[hh.id] || 0) > 0)
                    .map((hh) => (
                    <div key={hh.id} className={`p-3 border rounded-lg flex items-center justify-between ${currentHousehold?.id === hh.id ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                      <div>
                        <p className="font-medium text-gray-800">{hh.name || 'Casa'}</p>
                        <p className="text-xs text-gray-500">membros: {hh.members?.length || 1} {hh.ownerId === currentUser?.uid ? '• você é o owner' : ''} {typeof onlineCounts[hh.id] !== 'undefined' && (<span className="ml-1 text-emerald-600">• online: {onlineCounts[hh.id]}</span>)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (!currentUser) return
                            setSwitching(true)
                            try {
                              await setActiveHousehold(hh.id, currentUser.uid)
                              setShowSwitcher(false)
                            } finally { setSwitching(false) }
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          disabled={switching || currentHousehold?.id === hh.id}
                        >
                          {currentHousehold?.id === hh.id ? 'Atual' : 'Usar'}
                        </button>
                        {currentUser && hh.ownerId === currentUser.uid && (
                          <button
                            onClick={async () => {
                              if (!currentUser) return
                              try {
                                // Carregar membros candidatos (todos menos você)
                                const users = await firebaseUserService.getHouseholdMembers(hh.id)
                                const candidates = users.filter(u => u.id !== currentUser.uid)
                                setTransferCandidates(candidates)
                                setTransferTo(candidates[0]?.id || '')
                                setShowTransferModal({ open: true, household: hh })
                              } catch (e) {
                                console.error('Erro ao carregar membros', e)
                                toast.error('Não foi possível carregar os membros para transferir')
                              }
                            }}
                            className="px-3 py-1 text-sm bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
                          >
                            Transferir
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!currentUser) return
                            if (hh.ownerId === currentUser.uid) {
                              // Abrir modal de transferência e, após transferir, sair automaticamente
                              try {
                                const users = await firebaseUserService.getHouseholdMembers(hh.id)
                                const candidates = users.filter(u => u.id !== currentUser.uid)
                                setTransferCandidates(candidates)
                                setTransferTo(candidates[0]?.id || '')
                                setPendingLeaveAfterTransferHouseholdId(hh.id)
                                setShowTransferModal({ open: true, household: hh, note: 'Após transferir a propriedade, você sairá automaticamente desta casa.' })
                              } catch (e) {
                                console.error('Erro ao carregar membros', e)
                                toast.error('Não foi possível carregar os membros para transferir')
                              }
                              return
                            }
                            if (!confirm(`Sair de "${hh.name || 'Casa'}"?`)) return
                            setSwitching(true)
                            try {
                              // Se for a casa atual, reaproveitar o fluxo de sair do compartilhamento
                              if (currentHousehold?.id === hh.id) {
                                await householdService.leaveHousehold(hh.id)
                                const list = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                                let nextId: string
                                if (list.length > 0) nextId = list[0].id
                                else nextId = await firebaseHouseholdService.createHousehold('Minha Casa', currentUser.uid)
                                await setActiveHousehold(nextId, currentUser.uid)
                              } else {
                                // Sair de uma casa que não é a atual
                                await firebaseHouseholdService.removeMemberFromHousehold(hh.id, currentUser.uid)
                                const list = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                                setMyHouseholds(list)
                              }
                              toast.success('🚪 Você saiu da casa selecionada.')
                            } catch (e) {
                              console.error('Erro ao sair da casa', e)
                              toast.error('Falha ao sair da casa')
                            } finally {
                              setSwitching(false)
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={async () => {
                    if (!currentUser) return
                    setSwitching(true)
                    try {
                      const newId = await firebaseHouseholdService.createHousehold('Nova Casa', currentUser.uid)
                      await setActiveHousehold(newId, currentUser.uid)
                      setShowSwitcher(false)
                    } catch (e) { console.error('Erro ao criar nova casa', e) }
                    finally { setSwitching(false) }
                  }}
                  className="w-full py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                  disabled={switching}
                >
                  ➕ Criar nova casa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Transferir Propriedade */}
        {showTransferModal.open && showTransferModal.household && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Transferir propriedade</h3>
                <button onClick={() => setShowTransferModal({ open: false })} className="text-gray-500 text-2xl">×</button>
              </div>
              <p className="text-sm text-gray-600">Selecione um membro para se tornar o novo proprietário da casa “{showTransferModal.household.name || 'Casa'}”.</p>
              {showTransferModal.note && (
                <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2">{showTransferModal.note}</div>
              )}
              {transferCandidates.length === 0 ? (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  É necessário ao menos um outro membro para transferir a propriedade.
                </div>
              ) : (
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  {transferCandidates.map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowTransferModal({ open: false })}
                  className="py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  disabled={transferring}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!currentUser || !showTransferModal.household) return
                    if (!transferTo) { toast('Escolha um membro'); return }
                    setTransferring(true)
                    try {
                      await firebaseHouseholdServiceComplete.transferOwnership(showTransferModal.household.id, currentUser.uid, transferTo)
                      // Atualizar lista e household atual, se pertinente
                      const list = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                      setMyHouseholds(list)
                      if (currentHousehold?.id === showTransferModal.household.id) {
                        const hh = await firebaseHouseholdService.getHouseholdById(showTransferModal.household.id)
                        setCurrentHousehold(hh)
                      }
                      // Se estava marcado para sair após transferir, executa a saída agora
                      const shouldLeave = pendingLeaveAfterTransferHouseholdId === showTransferModal.household.id
                      setShowTransferModal({ open: false })
                      if (shouldLeave) {
                        try {
                          // Se é a casa atual, usar fluxo de saída com mudança para outra casa
                          if (currentHousehold?.id === showTransferModal.household.id) {
                            await householdService.leaveHousehold(showTransferModal.household.id)
                            const list2 = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                            let nextId: string
                            if (list2.length > 0) nextId = list2[0].id
                            else nextId = await firebaseHouseholdService.createHousehold('Minha Casa', currentUser.uid)
                            await setActiveHousehold(nextId, currentUser.uid)
                          } else {
                            await firebaseHouseholdService.removeMemberFromHousehold(showTransferModal.household.id, currentUser.uid)
                            const list2 = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                            setMyHouseholds(list2)
                          }
                          toast.success('🚪 Você saiu da casa após transferir a propriedade.')
                        } catch (e) {
                          console.error('Erro ao sair após transferir', e)
                          toast.error('Propriedade transferida, mas houve falha ao sair. Tente sair novamente.')
                        } finally {
                          setPendingLeaveAfterTransferHouseholdId(null)
                        }
                      } else {
                        toast.success('✅ Propriedade transferida! Agora você pode sair, se quiser.')
                      }
                    } catch (e: any) {
                      console.error('Erro ao transferir propriedade', e)
                      toast.error(`Falha ao transferir: ${e?.message || 'erro'}`)
                    } finally {
                      setTransferring(false)
                    }
                  }}
                  className="py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
                  disabled={transferring || transferCandidates.length === 0}
                >
                  {transferring ? '⏳ Transferindo...' : 'Transferir'}
                </button>
              </div>
            </div>
          </div>
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

        {/* Modal Sair do Compartilhamento */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Sair do modo compartilhado?</h3>
                {isOwner ? (
                  <p className="text-sm text-red-600">Você é o proprietário desta household e não pode sair diretamente. Transfira a propriedade para outro membro antes de sair.</p>
                ) : (
                  <p className="text-sm text-gray-600">Você deixará de ver e compartilhar as despesas desta household. Vamos te mover para uma casa pessoal (privada) automaticamente.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium"
                  disabled={leaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!currentHousehold || !currentUser) return
                    if (isOwner) { setShowLeaveModal(false); return }
                    setLeaving(true)
                    try {
                      await householdService.leaveHousehold(currentHousehold.id)
                      // Escolher próxima household (se houver) ou criar uma pessoal
                      const list = await firebaseHouseholdService.getUserHouseholds(currentUser.uid)
                      let nextId: string
                      if (list.length > 0) {
                        nextId = list[0].id
                      } else {
                        nextId = await firebaseHouseholdService.createHousehold('Minha Casa', currentUser.uid)
                      }
                      // Persistir e reconfigurar listener
                      try { if (typeof window !== 'undefined') localStorage.setItem('currentHouseholdId', nextId) } catch {}
                      const nextHh = await firebaseHouseholdService.getHouseholdById(nextId)
                      setCurrentHousehold(nextHh)
                      startExpensesListener(nextId, currentUser.uid)
                      setExpenses([])
                      setShowLeaveModal(false)
                      alert('🚪 Você saiu do compartilhamento. Agora está na sua casa pessoal.')
                    } catch (e: any) {
                      console.error('Erro ao sair do compartilhamento', e)
                      alert(`❌ ${e?.message || 'Falha ao sair'}`)
                    } finally {
                      setLeaving(false)
                    }
                  }}
                  className="py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                  disabled={leaving || isOwner}
                >
                  {leaving ? '⏳ Saindo...' : '🚪 Sair do compartilhamento'}
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