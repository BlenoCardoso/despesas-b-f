import { createBrowserRouter, Link, useNavigate } from 'react-router-dom'
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
// Ícones para uma UI mais "app"
import {
  Home as HomeIcon,
  CreditCard,
  Settings as SettingsIcon,
  Plus,
  MoreVertical,
  Edit3,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  BarChart3,
  UserPlus,
  LogIn,
  Calendar
} from 'lucide-react'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

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
  const navigate = useNavigate()
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
  // Membros da household e presença online
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [onlineNow, setOnlineNow] = useState<any[]>([])
  const [showOnlyOnlineHome, setShowOnlyOnlineHome] = useState(false)
  // Cache de membros por household (para o modal "Trocar de Casa")
  const [householdMembersMap, setHouseholdMembersMap] = useState<Record<string, any[]>>({})
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

  // Janela de presença: considera online quem foi visto nos últimos 2 minutos
  const ONLINE_WINDOW_MS = 2 * 60 * 1000

  // Helpers de presença
  const isUserOnline = (u: any) => {
    const seen = u?.lastSeen instanceof Date ? u.lastSeen.getTime() : (u?.lastSeen?.toMillis?.() || 0)
    if (!seen) return false
    return (Date.now() - seen) <= ONLINE_WINDOW_MS
  }

  const formatLastSeenPt = (u: any) => {
    const seenMs = u?.lastSeen instanceof Date ? u.lastSeen.getTime() : (u?.lastSeen?.toMillis?.() || 0)
    if (!seenMs) return 'visto há muito tempo'
    const diff = Date.now() - seenMs
    if (diff < 30_000) return 'visto agora mesmo'
    const mins = Math.floor(diff / 60_000)
    if (mins < 60) return `visto há ${mins} min${mins !== 1 ? 's' : ''}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `visto há ${hours}h`
    const days = Math.floor(hours / 24)
    return `visto há ${days}d`
  }

  // Converte "nome.sobrenome" (ou parte local do email) em "Nome Sobrenome"
  const nameFromEmailLocalPart = (local: string) => {
    const cleaned = (local || '').replace(/[._-]+/g, ' ').trim()
    return cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  // Calcula quantos membros estão online por household (lastSeen < 2min), exceto você
  const computeOnlineCounts = async (households: any[], currentUid: string) => {
    const counts: Record<string, number> = {}
    const now = Date.now()
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

  // Carregar membros para cada household (usado no modal "Trocar de Casa")
  const loadMembersForHouseholds = async (households: any[]) => {
    const map: Record<string, any[]> = {}
    for (const hh of households) {
      try {
        const users = await firebaseUserService.getHouseholdMembers(hh.id)
        map[hh.id] = users
      } catch {
        map[hh.id] = []
      }
    }
    setHouseholdMembersMap(map)
    return map
  }

  // Assinar lista de membros da household atual e calcular quem está online (em tempo real)
  useEffect(() => {
    if (!currentHousehold?.id) {
      setHouseholdMembers([])
      setOnlineNow([])
      return
    }
    let unsubscribe: undefined | (() => void)
    try {
      unsubscribe = firebaseUserService.subscribeToHouseholdMembers(currentHousehold.id, (users) => {
        setHouseholdMembers(users)
        const now = Date.now()
        // Include current user as well so everyone (including the owner) sees online badges consistently
        const online = users.filter((u: any) => {
          const seen = u.lastSeen instanceof Date ? u.lastSeen.getTime() : (u as any).lastSeen?.toMillis?.() || 0
          return seen && (now - seen) <= ONLINE_WINDOW_MS
        })
        setOnlineNow(online)
      })
    } catch {}
    return () => { try { unsubscribe && unsubscribe() } catch {} }
  }, [currentHousehold?.id, currentUser?.uid])

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
      try { await Haptics.notification({ type: NotificationType.Success }) } catch {}
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
      try { await Haptics.notification({ type: NotificationType.Error }) } catch {}
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
      try { await Haptics.notification({ type: NotificationType.Success }) } catch {}
    } catch (error) {
      console.error('❌ Erro ao editar despesa:', error)
      // Fallback local
      setExpenses(expenses.map(exp => 
        exp.id === updatedExpense.id ? updatedExpense : exp
      ))
      setEditingExpense(null)
      setShowModal(false)
      try { await Haptics.notification({ type: NotificationType.Error }) } catch {}
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
        try { await Haptics.notification({ type: NotificationType.Success }) } catch {}
      } catch (error) {
        console.error('❌ Erro ao deletar despesa:', error)
        // Fallback local
        setExpenses(expenses.filter(exp => exp.id !== id))
        setShowActionMenu(null)
        try { await Haptics.notification({ type: NotificationType.Error }) } catch {}
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
      try { await Haptics.impact({ style: ImpactStyle.Light }) } catch {}
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
  <div className="w-full max-w-full overflow-x-hidden bg-blue-50 dark:bg-gray-900 min-h-screen">
      {/* AppBar / Cabeçalho */}
      <header className="appbar sticky top-0 z-30 border-b border-gray-200 supports-[backdrop-filter]:backdrop-blur bg-gradient-to-r from-white/90 via-blue-50/70 to-indigo-50/60 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/70">
        <div className="appbar-inner px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" aria-label="Início" className="button-icon-touch text-gray-700 hover:text-blue-600">
              <HomeIcon className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="appbar-title text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-300 dark:to-indigo-300">Despesas</h1>
              {currentHousehold && (
                <p className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800 truncate">{
                  (() => {
                    const raw = currentHousehold?.name || 'Casa B&F'
                    const lower = raw.toLowerCase()
                    if (lower.startsWith('casa de ') && raw.includes('@')) {
                      const owner = householdMembers.find((m: any) => m.id === currentHousehold?.ownerId)
                      const isYou = currentHousehold?.ownerId === currentUser?.uid
                      const ownerDisplay = isYou
                        ? (currentUser?.displayName || owner?.name || owner?.email)
                        : (owner?.name || owner?.email)
                      let clean = ownerDisplay || raw.substring('Casa de '.length)
                      if (clean?.includes?.('@')) {
                        const local = clean.split('@')[0]
                        clean = nameFromEmailLocalPart(local)
                      }
                      return `Casa de ${clean}`
                    }
                    return raw
                  })()
                }</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Abrir modal de ingresso */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="button-icon-touch text-gray-700 hover:text-blue-600"
              title="Ingressar em uma casa"
              aria-label="Ingressar"
            >
              <LogIn className="h-5 w-5" />
            </button>
            {/* Gerar convite (somente owner) */}
            {isOwner && (
              <button
                onClick={generateInviteCode}
                disabled={!currentHousehold || inviteGenerating}
                className="button-icon-touch text-gray-700 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="Gerar convite"
                aria-label="Gerar convite"
              >
                <UserPlus className="h-5 w-5" />
              </button>
            )}
            {/* Relatórios -> navegar para página de relatório */}
            <button
              onClick={() => navigate('/report')}
              className="button-icon-touch text-gray-700 hover:text-blue-600"
              title="Relatórios"
              aria-label="Relatórios"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <ConnectionStatus connected={connected} />
          </div>
        </div>
      </header>

      <div className="w-full max-w-md mx-auto px-3 sm:px-0 pb-24 content-with-fab">
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
            {/* Cabeçalho antigo substituído pelo AppBar acima */}
            {/* Household Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 w-full border border-blue-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 border border-pink-200 dark:from-pink-900/20 dark:to-pink-800/10 dark:text-pink-200 dark:border-pink-900/40">🏠</span>
                      <span>{(() => {
                    const raw = currentHousehold?.name || 'Casa B&F'
                    // Se o nome for do tipo "Casa de <email>", substitui o email por um nome amigável
                    const lower = raw.toLowerCase()
                    if (lower.startsWith('casa de ') && raw.includes('@')) {
                      // Tenta usar o nome do proprietário
                      const owner = householdMembers.find((m: any) => m.id === currentHousehold?.ownerId)
                      const isYou = currentHousehold?.ownerId === currentUser?.uid
                      const ownerDisplay = isYou
                        ? (currentUser?.displayName || owner?.name || owner?.email)
                        : (owner?.name || owner?.email)
                      let clean = ownerDisplay || raw.substring('Casa de '.length)
                      if (clean?.includes?.('@')) {
                        const local = clean.split('@')[0]
                        clean = nameFromEmailLocalPart(local)
                      }
                      return `Casa de ${clean}`
                    }
                    return raw
                  })()}</span>
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {currentHousehold?.members?.length || 2} pessoas compartilhando
                    </span>
                  </p>
                  {currentHousehold && (
                    <div className="mt-2 space-y-1">
                      {/* Toggle mostrar apenas online */}
                      <label className="inline-flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-emerald-600"
                          checked={showOnlyOnlineHome}
                          onChange={(e) => setShowOnlyOnlineHome(e.target.checked)}
                        />
                        Mostrar apenas quem está online
                      </label>

                      {/* Lista de membros com avatar/inicial e badge de presença */}
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {(() => {
                          const onlineIds = new Set(onlineNow.map((u: any) => u.id))
                          // Show all household members (including the current user) so everyone sees the same list
                          const members = householdMembers.filter((m: any) => !showOnlyOnlineHome || onlineIds.has(m.id))
                          if (members.length === 0) {
                            return (
                              <span className="text-[11px] text-gray-500">{showOnlyOnlineHome ? 'Ninguém online agora' : 'Nenhum membro'}</span>
                            )
                          }
                          return members.map((m: any) => {
                            const name = m.name || m.email || (m.id ? String(m.id).slice(0, 8) : 'Membro')
                            const initial = (name?.trim?.()?.[0] || 'M').toUpperCase()
                            const online = onlineIds.has(m.id)
                            const title = `${name} • ${formatLastSeenPt(m)}`
                            return (
                              <div key={m.id} className="relative flex items-center gap-2" title={title}>
                                {m.avatarUrl ? (
                                  <img src={m.avatarUrl} alt={name} className="h-7 w-7 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-semibold border border-gray-200">
                                    {initial}
                                  </div>
                                )}
                                {/* Badge de presença (inline, à esquerda do nome) */}
                                <span className={`inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white mr-2 self-center ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} aria-hidden="true" />
                                <span className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap">{name}</span>
                              </div>
                            )
                          })
                        })()}
                      </div>

                      {/* Mostra proprietário de forma amigável */}
                      {currentHousehold.ownerId && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                          Proprietário: {
                            (() => {
                              const owner = householdMembers.find((m: any) => m.id === currentHousehold.ownerId)
                              const isYou = currentHousehold.ownerId === currentUser?.uid
                              // Se for você, prioriza o displayName do usuário autenticado
                              if (isYou) {
                                return (
                                  currentUser?.displayName || owner?.name || owner?.email || 'Você'
                                )
                              }
                              // Caso contrário, usa nome/e-mail do owner; evita mostrar apenas o ID
                              return owner?.name || owner?.email || String(currentHousehold.ownerId).slice(0,8)
                            })()
                          }{currentHousehold.ownerId === currentUser?.uid ? ' (você)' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Ações principais movidas para o AppBar. Mantemos Transferir/Trocar/Sair aqui. */}
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
                        // Carregar membros de cada household para exibir avatares
                        try { await loadMembersForHouseholds(list) } catch {}
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
        
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">📊 Resumo</h2>
            <button 
              onClick={() => setShowStats(!showStats)}
              className="text-blue-600 text-xs sm:text-sm font-medium flex-shrink-0"
            >
              {showStats ? '📊 Ocultar' : '📈 Ver Mais'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 break-words">R$ {total.toFixed(2)}</p>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Total das despesas</p>
            <div className="mt-3 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
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
                  <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">🏆 Top Categorias:</p>
                  {Object.entries(categoriesStats)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm py-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{cat.replace('alimentacao', '🍽️ Alimentação').replace('transporte', '🚗 Transporte').replace('casa', '🏠 Casa').replace('entretenimento', '🎬 Entretenimento')}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">R$ {(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtros e Ordenação */}
        {/* Seção de Solicitações removida - usando sistema direto de convites */}

  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 w-full">
          <div className="flex flex-wrap gap-2 mb-3">
            <button 
              onClick={() => setFilter('all')}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              📋 Todas ({expenses.length})
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              ⏳ Pendentes ({pendingExpenses.length})
            </button>
            <button 
              onClick={() => setFilter('paid')}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
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
              className="flex-1 p-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:border-blue-500 focus:outline-none min-w-0"
            >
              <option value="date">📅 Por Data</option>
              <option value="amount">💰 Por Valor</option>
              <option value="title">🔤 Por Nome</option>
            </select>
            {filter !== 'all' && (
              <button 
                onClick={() => setFilter('all')}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs sm:text-sm hover:bg-red-200 transition-colors flex-shrink-0 inline-flex items-center gap-1"
                title="Limpar filtros"
              >
                <X className="h-4 w-4" /> Limpar
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 w-full">
          {filteredExpenses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 text-center w-full">
              <p className="text-gray-500 text-lg">📭</p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
                {filter === 'pending' ? 'Nenhuma despesa pendente!' : 
                 filter === 'paid' ? 'Nenhuma despesa paga ainda.' :
                 'Nenhuma despesa encontrada.'}
              </p>
              {filter !== 'all' && (
                <button 
                  onClick={() => setFilter('all')}
                  className="mt-3 text-blue-600 text-xs sm:text-sm font-medium"
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
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 relative transition-all duration-200 hover:shadow-lg w-full ${
                  !expense.isPaid ? 'border-l-4 border-orange-400' : ''
                } ${
                  showActionMenu === expense.id ? 'ring-2 ring-blue-200' : ''
                }`}
              >
              <div className="flex justify-between items-start sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-100 truncate">{expense.title}</h3>
                    {!expense.isPaid && (
                      <span className="text-[10px] sm:text-xs bg-orange-100 text-orange-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                        Pendente
                      </span>
                    )}
                    {expense.isPaid && (
                      <span className="text-[10px] sm:text-xs bg-green-100 text-green-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                        ✓ Pago
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{expense.date} • Pago por {expense.paidBy}</p>
                  <p className={`text-[10px] sm:text-xs ${
                    expense.splitType === 'equal' ? 'text-blue-600' : 
                    expense.splitType === 'me' ? 'text-red-600' : 'text-purple-600'
                  }`}>
                    {expense.splitType === 'equal' ? 'Compartilhado 50/50' : 
                     expense.splitType === 'me' ? 'Só você' : 'Divisão personalizada'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-100 whitespace-nowrap">R$ {expense.amount.toFixed(2)}</p>
                  <p className={`text-[10px] sm:text-xs whitespace-nowrap ${
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
                  aria-label="Mais ações"
                  className="ml-2 button-icon-touch text-gray-400 hover:text-gray-600"
                  onClick={() => setShowActionMenu(showActionMenu === expense.id ? null : expense.id)}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Menu de ações */}
              {showActionMenu === expense.id && (
                <div className="absolute right-2 sm:right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px] sm:min-w-[150px]">
                  <button
                    onClick={() => openEditModal(expense)}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => togglePaidStatus(expense.id)}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    {expense.isPaid ? (
                      <>
                        <Clock className="h-4 w-4" /> Marcar pendente
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Marcar como pago
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))
          )}
        </div>

        {/* Ações principais: manter no desktop, usar FAB no mobile */}
        <div className="hidden sm:grid mt-4 sm:mt-6 grid-cols-2 gap-3 sm:gap-4 w-full">
          <button 
            className="bg-blue-600 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base inline-flex items-center justify-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus className="h-5 w-5" /> Adicionar Despesa
          </button>
          <button 
            className="bg-gray-100 text-gray-700 font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base inline-flex items-center justify-center gap-2"
            onClick={() => toast('📊 Relatórios em breve!')}
          >
            <BarChart3 className="h-5 w-5" /> Relatórios
          </button>
        </div>

        {/* Ações em massa */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <div>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors text-xs sm:text-sm"
            >
              🗑️ Excluir todas as despesas
            </button>
            <p className="text-[10px] sm:text-[11px] text-red-500 mt-1 text-center">Somente desta household • ação reversível (soft delete)</p>
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
              className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors text-xs sm:text-sm"
            >
              ♻️ Restaurar todas
            </button>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 mt-1 text-center">Reverte o soft delete de todas as despesas</p>
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
            <div className="bg-white rounded-2xl w-full max-w-sm mx-auto p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">🗑️ Excluir todas as despesas?</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Isso vai mover todas as despesas desta household para a lixeira (soft delete). Você pode restaurar depois se necessário.</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
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
                  className="py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-red-700 disabled:opacity-50 shadow"
                  disabled={deletingAll}
                >
                  {deletingAll ? '⏳ Excluindo...' : 'Excluir todas'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lixeira */}
        {showTrash && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-4 my-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">🧺 Lixeira</h3>
                <button onClick={() => setShowTrash(false)} className="text-gray-500 text-2xl flex-shrink-0">×</button>
              </div>
              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  placeholder="Pesquisar descrição"
                  value={trashSearch}
                  onChange={(e) => setTrashSearch(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-xs sm:text-sm w-full"
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
                        try { await loadMembersForHouseholds(myHouseholds) } catch {}
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
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{hh.name || 'Casa'}</p>
                        <p className="text-xs text-gray-500">membros: {hh.members?.length || 1} {hh.ownerId === currentUser?.uid ? '• você é o owner' : ''} {typeof onlineCounts[hh.id] !== 'undefined' && (<span className="ml-1 text-emerald-600">• online: {onlineCounts[hh.id]}</span>)}</p>
                        <div className="mt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                          {(() => {
                            const members = (householdMembersMap[hh.id] || []).filter((m: any) => m.id !== currentUser?.uid)
                            if (!members.length) return <span className="text-[11px] text-gray-400">sem membros</span>
                            const max = 6
                            const display = members.slice(0, max)
                            const rest = members.length - display.length
                            return (
                              <>
                                {display.map((m: any) => {
                                  const name = m.name || m.email || (m.id ? String(m.id).slice(0, 8) : 'Membro')
                                  const initial = (name?.trim?.()?.[0] || 'M').toUpperCase()
                                  const online = isUserOnline(m)
                                  const title = `${name} • ${formatLastSeenPt(m)}`
                                  return (
                                    <div key={m.id} className="relative" title={title}>
                                      {m.avatarUrl ? (
                                        <img src={m.avatarUrl} alt={name} className="h-7 w-7 rounded-full object-cover border border-gray-200" />
                                      ) : (
                                        <div className="h-7 w-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold border border-gray-200">
                                          {initial}
                                        </div>
                                      )}
                                      <span className={`absolute z-10 left-0 top-0 -translate-x-1/3 -translate-y-1/3 h-2.5 w-2.5 rounded-full ring-2 ring-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`} aria-hidden="true"></span>
                                    </div>
                                  )
                                })}
                                {rest > 0 && (
                                  <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[11px] border border-gray-200" title={`+${rest} mais`}>
                                    +{rest}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
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
                <h3 className="text-xl font-bold text-gray-800">🔑 Transferir propriedade</h3>
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
                  className="py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-orange-700 disabled:opacity-50 shadow"
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
                  className="py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-red-700 disabled:opacity-50 shadow"
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

      {/* FAB: Adicionar Despesa (mobile-first) */}
      <button
        aria-label="Adicionar despesa"
        className="fixed right-5 z-40 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition fab-safe-bottom btn-touch-safe sm:hidden"
        onClick={() => setShowModal(true)}
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur safe-bottom sm:hidden">
        <div className="grid grid-cols-2">
          <Link to="/expenses" className="flex flex-col items-center justify-center py-2.5 text-blue-600">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs mt-0.5">Despesas</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center justify-center py-2.5 text-gray-500 hover:text-gray-700">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-xs mt-0.5">Configurações</span>
          </Link>
        </div>
      </nav>
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
  const formatBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const parseBRL = (s: string) => {
    const digits = (s || '').replace(/\D+/g, '')
    return digits ? parseInt(digits, 10) / 100 : 0
  }
  const initialAmountStr = typeof expense?.amount === 'number' ? formatBRL(expense.amount) : ''
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    amount: initialAmountStr,
    date: expense?.date || new Date().toISOString().split('T')[0],
    category: expense?.category || '🍽️ Alimentação',
    splitType: expense?.splitType || 'equal'
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const isEditing = !!expense

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.amount) {
      const amountNumber = parseBRL(formData.amount)
      if (!formData.title.trim() || amountNumber <= 0) {
        setSubmitAttempted(true)
        try { await Haptics.notification({ type: 'ERROR' as any }) } catch {}
        return
      }
      const expenseData = {
        title: formData.title,
        amount: amountNumber,
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

  // Utility to normalize date strings to yyyy-mm-dd (ISO) which is required by input[type=date]
  const normalizeDateToISO = (val: string) => {
    if (!val) return val
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    // dd/mm/yyyy -> convert
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
      const [, d, mo, y] = m
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    // try Date parse fallback
    const dt = new Date(val)
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0]
    return val
  }

  // On mount normalize date in state in case other code populated it in dd/mm/yyyy
  useEffect(() => {
    if (formData.date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      setFormData((s) => ({ ...s, date: normalizeDateToISO(s.date) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto p-5 sm:p-6 pb-[calc(5rem+env(safe-area-inset-bottom))] space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/20 dark:text-blue-200 dark:border-blue-900/40">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{isEditing ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Preencha os detalhes abaixo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none">×</button>
        </div>
        {/* Handle de arraste visual (estilo bottom sheet) */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onClose() }
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') { e.preventDefault(); handleSubmit(e as any) }
        }}>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input 
                type="text" 
                placeholder="Ex: Supermercado, Aluguel..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full pl-14 sm:pl-16 p-2.5 sm:p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                autoFocus
                required
              />
            </div>
            {submitAttempted && !formData.title.trim() && (
              <p className="mt-1 text-xs text-red-600">Informe um título.</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-18 sm:w-20 flex items-center justify-center text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-l-lg pointer-events-none select-none text-sm sm:text-base" aria-hidden="true">R$</div>
                <input 
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D+/g, '')
                    const cents = digits ? parseInt(digits, 10) : 0
                    const formatted = formatBRL(cents / 100)
                    setFormData({ ...formData, amount: formatted })
                  }}
                  className="w-full pl-22 sm:pl-24 p-2.5 sm:p-3 pr-12 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base tracking-wide"
                  aria-label="Valor da despesa"
                />
                {formData.amount && (
                  <button type="button" aria-label="Limpar valor" onClick={() => setFormData({ ...formData, amount: '' })} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">×</button>
                )}
              </div>
              {submitAttempted && parseBRL(formData.amount) <= 0 && (
                <p className="mt-1 text-xs text-red-600">Informe um valor maior que zero.</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <div className="flex gap-2 min-w-0">
                <div className="relative w-0 flex-1 min-w-0">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
                  <input 
                    type="date"
                    value={normalizeDateToISO(formData.date)}
                    onChange={(e) => setFormData({...formData, date: normalizeDateToISO(e.target.value)})}
                    className="w-full pl-12 sm:pl-14 p-2.5 sm:p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const today = new Date().toISOString().split('T')[0]
                    setFormData({ ...formData, date: today })
                    try { await Haptics.impact({ style: 'LIGHT' as any }) } catch {}
                  }}
                  className="flex-shrink-0 px-2.5 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                  aria-label="Definir data para hoje"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar py-1">
              {['🍽️ Alimentação','🚗 Transporte','🏠 Casa'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={async () => {
                    setFormData({ ...formData, category: c })
                    try { await Haptics.impact({ style: 'LIGHT' as any }) } catch {}
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition shadow-sm ${formData.category === c ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 dark:ring-blue-800/40' : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                >{c}</button>
              ))}
            </div>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none text-sm sm:text-base"
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Como dividir?</label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { key: 'equal', label: '👫 Dividir igualmente (50/50)' },
                { key: 'me', label: '🙋‍♂️ Só eu pago' },
                { key: 'custom', label: '⚖️ Divisão personalizada' }
              ] as const).map(opt => (
                <label key={opt.key} className={`flex items-center min-h-[46px] rounded-xl border p-2.5 cursor-pointer transition ${formData.splitType === opt.key ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <input
                    type="radio"
                    name="split"
                    value={opt.key}
                    checked={formData.splitType === opt.key}
                    onChange={async (e) => { setFormData({ ...formData, splitType: e.target.value }); try { await Haptics.impact({ style: 'LIGHT' as any }) } catch {} }}
                    className="mr-2 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Barra fixa de ações no rodapé do modal */}
          <div className="sticky bottom-0 left-0 right-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 safe-bottom">
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={async () => { try { await Haptics.impact({ style: 'LIGHT' as any }) } catch {}; onClose() }}
                className="w-full py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition"
              >
                {isEditing ? (<><CheckCircle2 className="h-4 w-4" /> Salvar</>) : (<><Plus className="h-4 w-4" /> Adicionar</>)}
              </button>
            </div>
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

          {/* feedback adicional pode ser mostrado aqui, se necessário */}

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
import ReportPage from '@/pages/Report'
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
  ,
  {
    path: '/report',
    element: <ReportPage />
  }
])