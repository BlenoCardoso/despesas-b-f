import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, X } from 'lucide-react'
import { ExpenseList } from '../components/ExpenseList'
import { ExpenseForm } from '../components/ExpenseForm'
import FiltersPanel from '../components/FiltersPanel'
import { toast } from 'sonner'
import { deleteExpense as serviceDeleteExpense, undoExpenseDelete } from '../services/expense-service'
import { db } from '@/lib/db'
import { simpleExpenseService } from '../services/simpleExpenseService'
import { authService } from '@/services/authService'
import { ExpenseFormData } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { subMonths, addMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMonthlyExpenses, expenseKeys } from '../hooks/useExpenses'
import { formatCurrency } from '@/utils/formatters'
import { accountService } from '@/features/accounts/services/accountService'
import { useEffect as useReactEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore } from '@/core/store'
// DebugPanel registers a hidden dev API on window.__expenses_debug and renders no UI
import DebugPanel from '../components/DebugPanel'

export function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  // Get monthly expenses to compute total for header
  const monthlyRes = useMonthlyExpenses(selectedMonth)
  const monthExpenses = monthlyRes?.data || []
  const monthTotal = monthExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)

  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [savedFilters, setSavedFilters] = useState<Array<{ id: string; name: string; filters: any; search?: string }>>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [coupleMode, setCoupleMode] = useState<boolean>(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<any>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()
  const currentUser = authService.getCurrentUser()
  const { currentHousehold } = useAppStore()
  const householdIdForList = currentHousehold?.id || currentUser?.households?.[0] || 'default-household'
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  // Load saved filters from localStorage for this household
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`saved-expense-filters:${householdIdForList}`)
      if (raw) setSavedFilters(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [householdIdForList])

  // load couple mode preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`expense:coupleMode:${householdIdForList}`)
      if (raw) setCoupleMode(raw === 'true')
    } catch (e) {}
  }, [householdIdForList])

  const persistCoupleMode = (v: boolean) => {
    setCoupleMode(v)
    try { localStorage.setItem(`expense:coupleMode:${householdIdForList}`, String(v)) } catch (e) {}
  }

  const persistSavedFilters = (next: typeof savedFilters) => {
    setSavedFilters(next)
    try { localStorage.setItem(`saved-expense-filters:${householdIdForList}`, JSON.stringify(next)) } catch (e) {}
  }

  const handleApplySavedFilter = (entry: any) => {
    if (entry.filters) {
      // Merge or replace active filters depending on UX; here we replace
      // If filters contains activeFilters/list of chips, handle accordingly
      setActiveFilters(entry.filters.activeFilters || [])
      setSearchText(entry.search || '')
      // Apply other filter fields to select controls if present
      if (entry.filters.accountId) setSelectedAccount(entry.filters.accountId)
      if (entry.filters.participantIds) setSelectedParticipants(entry.filters.participantIds)
      // Invalidate Query to refresh
  queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    }
  }

  const handleDeleteSavedFilter = (id: string) => {
    const next = savedFilters.filter(s => s.id !== id)
    persistSavedFilters(next)
  }

  const handleRenameSavedFilter = (id: string) => {
    const current = savedFilters.find(s => s.id === id)
    if (!current) return
    const name = prompt('Renomear filtro', current.name)
    if (!name) return
    const next = savedFilters.map(s => s.id === id ? { ...s, name } : s)
    persistSavedFilters(next)
  }

  // Load accounts and members for selectors
  useReactEffect(() => {
    ;(async () => {
      try {
        const accs = await accountService.listAccounts(householdIdForList)
        setAccounts(accs.map(a => ({ id: a.id, name: a.name })))
      } catch (e) {
        // ignore
      }

      try {
        // simple user list via authService (synchronous) or DB
        const { db } = await import('@/core/db/database')
        const users = (await db.users.toArray?.()) || []
        setMembers(users.map((u: any) => ({ id: u.id, name: u.name })))
      } catch (e) {
        // ignore
      }
    })()
  }, [householdIdForList])

  // Mock categories for now
  const categories = [
    { id: 'alimentacao', name: 'Alimentação', icon: '🍔', color: '#EF4444' },
    { id: 'transporte', name: 'Transporte', icon: '🚗', color: '#3B82F6' },
    { id: 'moradia', name: 'Moradia', icon: '🏠', color: '#10B981' },
    { id: 'lazer', name: 'Lazer', icon: '🎮', color: '#8B5CF6' }
  ]

  // Expense action handlers
  const handleEditExpense = (expense: any) => {
    console.log('✏️ Editing expense:', expense)
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleDuplicateExpense = async (expense: any) => {
    try {
      console.log('📋 Duplicating expense:', expense)
      
      const user = await authService.getCurrentUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      // Prefer household selected in app store so list and create/duplicate use same household
      const householdId = householdIdForList || (user.households?.[0] || 'default-household')
      
      // Create a duplicate with new ID and current date
      const duplicateData: ExpenseFormData = {
        title: `${expense.title} (cópia)`,
        amount: expense.amount,
        categoryId: expense.categoryId,
        date: new Date(), // Today's date as Date object
        notes: expense.notes || '',
        paymentMethod: expense.paymentMethod || 'dinheiro'
      }
      
      const duplicatedExpense = await simpleExpenseService.createExpense(duplicateData, householdId, user.id)
      
      console.log('✅ Expense duplicated successfully:', duplicatedExpense.id)
      toast.success('Despesa duplicada com sucesso!')

      // DEBUG TOAST: mostrar householdId e data gravada para a duplicata (temporário)
      try {
        const dupDate = duplicatedExpense?.date ? (new Date(duplicatedExpense.date)).toISOString().slice(0,10) : (duplicatedExpense?.createdAt ? (new Date(duplicatedExpense.createdAt)).toISOString().slice(0,10) : 'n/a')
        toast(`DEBUG DUP: household=${householdId}, date=${dupDate}`)
      } catch (e) {}
      // Debug: dump matching queries data so we can inspect why UI didn't update
      // removed temporary debug dump

      // Optimistic cache update for duplicated expense
      try {
        queryClient.setQueriesData({ queryKey: expenseKeys.lists() }, (old: any) => {
          if (!old) return old
          try {
            if (Array.isArray(old)) return [duplicatedExpense, ...old]
            if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
              return { ...old, data: [duplicatedExpense, ...((old as any).data || [])] }
            }
          } catch (e) {}
          return old
        })

        queryClient.setQueryData(expenseKeys.monthly(householdIdForList, selectedMonth), (old: any) => {
          if (!old) return old
          try {
            if (Array.isArray(old)) return [duplicatedExpense, ...old]
            if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
              return { ...old, data: [duplicatedExpense, ...((old as any).data || [])] }
            }
          } catch (e) {}
          return old
        })

        // Also update the global expenses cache
        try {
          queryClient.setQueryData(expenseKeys.all, (old: any) => {
            if (!old) return [duplicatedExpense]
            try {
              if (Array.isArray(old)) return [duplicatedExpense, ...old]
              if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
                return { ...old, data: [duplicatedExpense, ...((old as any).data || [])] }
              }
            } catch (e) {}
            return old
          })
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // fallback to invalidation if optimistic update cannot be applied
        queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      }
    } catch (error) {
      console.error('❌ Error duplicating expense:', error)
      toast.error('Erro ao duplicar despesa. Tente novamente.')
    }
  }

  const handleDeleteExpense = async (expense: any) => {
    try {
      console.log('🗑️ Deleting expense (raw):', expense)
      // Accept either an expense object or an id string
      const expenseIdCandidate = typeof expense === 'string' ? expense : (expense && (expense.id || expense._id || expense.uuid))
      let expenseId = expenseIdCandidate

      // Ensure the id exists in the local DB; if not, try numeric coercion or matching by fields
      try {
        let found = undefined
        if (expenseId) {
          found = await db.expenses.get(expenseId)
        }
        if (!found && expenseId) {
          // try numeric id
          const num = Number(expenseId)
          if (!Number.isNaN(num)) found = await db.expenses.get(num as any)
        }
        if (!found && expense && expense.title) {
          // fallback: try to match by title + amount + date (best-effort)
          const where = db.expenses.where('householdId').equals(householdIdForList)
          const arr = await where.toArray()
          found = arr.find((e: any) => {
            try {
              const sameTitle = String(e.title || '').trim() === String(expense.title || '').trim()
              const sameAmount = Number(e.amount || 0) === Number(expense.amount || 0)
              const eDate = e.date ? (new Date(e.date)).toISOString().slice(0,10) : ''
              const cDate = expense.date ? (new Date(expense.date)).toISOString().slice(0,10) : ''
              const sameDate = eDate && cDate ? eDate === cDate : true
              return sameTitle && sameAmount && sameDate
            } catch (e) {
              return false
            }
          })
        }

        if (found && found.id) expenseId = found.id
      } catch (e) {
        // ignore DB lookup errors and proceed with candidate id
      }
      if (!expenseId) {
        console.error('❌ Invalid expense id for delete:', expense)
        toast.error('Erro: ID da despesa inválido. A exclusão não foi executada.')
        return
      }

    // Soft delete - use centralized service which supports undo cache
    await serviceDeleteExpense(expenseId, () => {
        // show undo toast using local toast wrapper
        try {
          toast('Despesa removida — desfazer', {
            action: {
              label: 'Desfazer',
              onClick: async () => {
                try {
                  await undoExpenseDelete(expenseId)
                  toast.success('Despesa restaurada')
                  queryClient.invalidateQueries({ queryKey: ['expenses', 'infinite'] })
                } catch (err) {
                  console.error('Erro ao restaurar despesa', err)
                  toast.error('Erro ao restaurar despesa')
                }
              }
            }
          })
        } catch (e) {
          // ignore toast creation errors
        }

        try {
          // Invalidate broad 'expenses' namespace so lists/monthly/details refetch
          queryClient.invalidateQueries({ queryKey: expenseKeys.all, exact: false })
          // Also invalidate list and monthly caches explicitly
          try { queryClient.invalidateQueries({ queryKey: expenseKeys.lists(), exact: false }) } catch (e) {}
          try { queryClient.invalidateQueries({ queryKey: expenseKeys.monthly(householdIdForList, selectedMonth), exact: false }) } catch (e) {}
          try { queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expenseId), exact: false }) } catch (e) {}
        } catch (e) {}
      })
      // Optimistically remove expense from any cached lists so UI updates immediately
      try {
        // Update any queries under the 'expenses' namespace (including paginated infinite queries)
        queryClient.setQueriesData({ queryKey: expenseKeys.all, exact: false }, (old: any) => {
          if (!old) return old
          try {
            // react-query infinite query shape: { pages: [{ expenses: [...] , cursor }, ...], pageParams: [] }
            if (old && typeof old === 'object' && Array.isArray(old.pages)) {
              const newPages = old.pages.map((p: any) => {
                if (p && Array.isArray(p.expenses)) {
                  return { ...p, expenses: p.expenses.filter((it: any) => String(it.id) !== String(expenseId)) }
                }
                // fallback for pages that use items[] shape
                if (p && Array.isArray(p.items)) {
                  return { ...p, items: p.items.filter((it: any) => String(it.id) !== String(expenseId)) }
                }
                return p
              })
              return { ...old, pages: newPages }
            }

            // common list shape: array
            if (Array.isArray(old)) return old.filter((x: any) => String(x.id) !== String(expenseId))

            // common object with data array
            if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
              return { ...old, data: (old as any).data.filter((x: any) => String(x.id) !== String(expenseId)) }
            }
          } catch (e) {
            console.warn('Failed optimistic removal from cache', e)
          }
          return old
        })
      } catch (e) {}
    } catch (error) {
      console.error('❌ Error deleting expense:', error)
      try { toast.error('Erro ao excluir despesa. Tente novamente.') } catch (e) {}
    }
  }

  const handleViewAttachments = (expense: any) => {
    console.log('📎 Viewing attachments for expense:', expense)
    const attachmentCount = expense.attachments?.length || 0
    if (attachmentCount === 0) {
      toast.info('Esta despesa não possui anexos')
    } else {
      toast.info(`Esta despesa possui ${attachmentCount} anexo(s). Visualização em desenvolvimento...`)
    }
  }

  const handleCreateExpense = async (data: ExpenseFormData) => {
    try {
      if (editingExpense) {
        // Edit mode
        console.log('✏️ ExpensesPage - handleCreateExpense (EDIT MODE) called with data:', data)
        
        await simpleExpenseService.updateExpense(editingExpense.id, data)
        
        console.log('Expense updated successfully:', editingExpense.id)
        toast.success('Despesa atualizada com sucesso!')
        setEditingExpense(null)
      } else {
        // Create mode
        console.log('🚀 ExpensesPage - handleCreateExpense (CREATE MODE) called with data:', data)
        
        // Get current user
        const user = authService.getCurrentUser()
        console.log('👤 Current user:', user)
        
        if (!user) {
          console.log('❌ No user authenticated')
          toast.error('Usuário não autenticado')
          return
        }

        // Prefer household selected in app store so list and create/duplicate use same household
        const householdId = householdIdForList || (user.households?.[0] || 'default-household')
        console.log('🏠 Using householdId:', householdId)
        
        // Create the expense
        const expense = await simpleExpenseService.createExpense(data, householdId, user.id)
        
  console.log('✅ Expense created successfully:', expense.id)

        // DEBUG TOAST: mostrar householdId e data gravada (temporário)
        // debug toast removed

        // DEV DIAGNOSTIC: query Dexie to confirm saved records and membership (short summary)
        try {
          ;(async () => {
            try {
              const dbMod = await import('@/core/db/database')
              const localDb = (dbMod as any).db
              const localUser = await localDb.getCurrentUser?.()
              const hhMembers = await localDb.householdMembers.where('householdId').equals(householdId).toArray().catch(() => [])
              const isMember = typeof localDb.isHouseholdMember === 'function' ? await localDb.isHouseholdMember(householdId, localUser?.id) : (hhMembers.some((m: any) => m.userId === localUser?.id))
              const allExpenses = await localDb.expenses.where('householdId').equals(householdId).toArray().catch(() => [])
              const activeExpenses = await localDb.expenses.where('householdId').equals(householdId).and((e: any) => !e.deletedAt).toArray().catch(() => [])
              console.log('DEV DEBUG: localUser, isMember, hhMembers, activeExpenses', { localUser, isMember, hhMembers, activeExpenses })
              // DBG2 toast removed
                    // If no household members are present, auto-add the current user as a member (dev/local fallback)
                    try {
                      if ((hhMembers || []).length === 0 && localUser) {
                        // Only run this on local dev hosts to avoid surprising production writes
                        const host = typeof window !== 'undefined' ? window.location.hostname : ''
                        if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.') || host === '') {
                          try {
                            const exists = await localDb.householdMembers.where('householdId').equals(householdId).and((m: any) => m.userId === localUser.id).first().catch(() => null)
                              if (!exists) {
                              await localDb.householdMembers.add({ householdId, userId: localUser.id, role: 'owner', joinedAt: new Date().toISOString() })
                              console.log('DEV AUTO: added household member for local user', localUser.id)
                              // invalidate queries so the list can refetch with membership in place
                              try { queryClient.invalidateQueries({ queryKey: ['expenses', 'infinite'] }) } catch (e) {}
                              try { queryClient.invalidateQueries({ queryKey: expenseKeys.lists() }) } catch (e) {}
                            }
                          } catch (e) {
                            // ignore
                          }
                        }
                      }
                    } catch (e) {
                      // ignore
                    }
            } catch (e) {
              console.warn('DEV DEBUG inner failed', e)
            }
          })()
        } catch (e) {
          // ignore
        }

        // Optimistic cache update: add created expense to queries so UI shows it immediately
        try {
          // update any list caches
          queryClient.setQueriesData({ queryKey: expenseKeys.lists() }, (old: any) => {
            if (!old) return old
            try {
              if (Array.isArray(old)) return [expense, ...old]
              if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
                return { ...old, data: [expense, ...((old as any).data || [])] }
              }
            } catch (e) {
              // ignore
            }
            return old
          })

          // update monthly cache for the currently selected month
          queryClient.setQueryData(expenseKeys.monthly(householdIdForList, selectedMonth), (old: any) => {
            if (!old) return old
            try {
              if (Array.isArray(old)) return [expense, ...old]
              if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
                return { ...old, data: [expense, ...((old as any).data || [])] }
              }
            } catch (e) {}
            return old
          })

          // Also update the global expenses cache so UI hooks reading expenseKeys.all get the new item
          try {
            queryClient.setQueryData(expenseKeys.all, (old: any) => {
              if (!old) return [expense]
              try {
                if (Array.isArray(old)) return [expense, ...old]
                if (old && typeof old === 'object' && Array.isArray((old as any).data)) {
                  return { ...old, data: [expense, ...((old as any).data || [])] }
                }
              } catch (e) {}
              return old
            })
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.warn('Failed to optimistically update expense cache', e)
        }

        // If we're offline, show a clearer offline-saving message
        try {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            toast('Salvo localmente — será sincronizado quando online')
          }
        } catch (e) {
          // ignore
        }
        
  // Debug: expense created
  console.log('� Expense created id:', expense.id)
      }
      
      setShowExpenseForm(false)

      // Invalidate & refetch all expense-related queries to ensure the list updates
      // Use a single, broad invalidate + refetch for the 'expenses' root key so we
      // don't miss queries keyed with different argument shapes (infinite, monthly, lists...)
      try {
        console.log('🔄 Invalidating and refetching expense queries...')
        // Invalidate (mark stale)
        await queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false })
        // Immediately trigger refetch for any matching queries so UI updates without a full reload
        await queryClient.refetchQueries({ queryKey: ['expenses'], exact: false })
        console.log('🔁 Refetch completo')
      } catch (e) {
        console.warn('Falha ao invalidar/refetchar queries de despesas', e)
      }
    } catch (error) {
      console.error('Error processing expense:', error)
      const action = editingExpense ? 'atualizar' : 'criar'
      toast.error(`Erro ao ${action} despesa. Tente novamente.`)
    }
  }

  return (
    <main className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-gray-600 mt-1">Gerencie suas despesas mensais</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <button
              title="Modo Casal — dividir 50/50 por padrão"
              onClick={() => persistCoupleMode(!coupleMode)}
              className={`px-3 py-1 rounded-full text-sm border ${coupleMode ? 'chip-primary-filled text-on-primary' : 'bg-white text-gray-700'}`}
            >
              {coupleMode ? 'Modo Casal: ON' : 'Modo Casal: OFF'}
            </button>
          </div>
          <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2 bg-primary-solid text-on-primary">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <div className="flex items-center gap-2">
            {/* Mobile: compact filter + search row */}
            <div className="w-full flex items-center gap-2 md:hidden">
                    <button className="px-3 py-2 border rounded chip-primary-filled text-on-primary touch-target" onClick={() => setShowFiltersPanel(s => !s)}>
                <Search className="h-4 w-4 inline-block mr-2" />
                Filtros
              </button>
              <Input
                placeholder="Buscar despesas..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Desktop: search only */}
            <div className="hidden md:block relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar despesas..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Mobile filters panel (collapsible) */}
        {showFiltersPanel && (
          <div className="md:hidden">
            <FiltersPanel
              householdId={householdIdForList}
              searchText={searchText}
              accountId={selectedAccount}
              participantIds={selectedParticipants}
              onApply={(f) => {
                setSearchText(f.searchText || '')
                setSelectedAccount(f.accountId)
                setSelectedParticipants(f.participantIds || [])
                setShowFiltersPanel(false)
              }}
              onClear={() => {
                setSearchText('')
                setSelectedAccount(undefined)
                setSelectedParticipants([])
                setShowFiltersPanel(false)
              }}
            />
          </div>
        )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {savedFilters.map(sf => (
          <div key={sf.id} className="relative">
            <button
              onClick={() => handleApplySavedFilter(sf)}
              className="px-3 py-1 rounded-full text-sm border chip-primary"
              title={`Aplicar filtro salvo ${sf.name}`}
            >
              {sf.name}
            </button>
            <div className="inline-flex ml-2 gap-1">
              <button onClick={() => handleRenameSavedFilter(sf.id)} className="text-xs text-muted-foreground">Renomear</button>
              <button onClick={() => handleDeleteSavedFilter(sf.id)} className="text-xs text-red-500">Excluir</button>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const name = prompt('Nome do filtro (ex: Meu Mercado do mês)')
            if (!name) return
            const id = `${Date.now()}`
            const entry = { id, name, filters: { activeFilters, accountId: selectedAccount, participantIds: selectedParticipants }, search: searchText }
            const next = [entry, ...savedFilters]
            persistSavedFilters(next)
          }}
          className="px-3 py-1 rounded-full text-sm border chip-primary"
          title="Salvar filtros atuais"
        >
          Salvar filtros
        </button>
      </div>

      {/* Account and participants selectors (simple) */}
      <div className="flex gap-3 items-center mt-3 flex-wrap">
        <div>
          <label className="text-sm text-muted-foreground block">Conta</label>
          <select className="h-8 border rounded px-2" value={selectedAccount || ''} onChange={(e) => setSelectedAccount(e.target.value || undefined)}>
            <option value="">Todas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground block">Participantes</label>
          <select multiple className="h-8 border rounded px-2" value={selectedParticipants} onChange={(e) => setSelectedParticipants(Array.from(e.target.selectedOptions).map(o => o.value))}>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
  <div className="flex gap-2 flex-wrap mt-3">
        {[
          { id: 'today', label: 'Hoje' },
          { id: 'yesterday', label: 'Ontem' },
          { id: 'this_week', label: 'Esta semana' },
          { id: 'this_month', label: 'Este mês' },
          { id: 'personal', label: 'Pessoal' },
          { id: 'shared', label: 'Compartilhada' },
          { id: 'paid', label: 'Pago' },
          { id: 'pending', label: 'Pendente' },
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => {
              setActiveFilters(prev => prev.includes(chip.id) ? prev.filter(p => p !== chip.id) : [...prev, chip.id])
            }}
            className={`px-3 py-1 rounded-full text-sm border ${activeFilters.includes(chip.id) ? 'chip-primary-filled text-on-primary' : 'bg-white text-gray-700'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Expense List */}
          {/* Month header (sticky) + Expense List */}
          <div className="bg-white rounded-lg border">
            <div className="sticky top-6 bg-white z-20 border-b">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedMonth(m => subMonths(m, 1))}>&lt;</Button>
                  <div className="text-lg font-semibold">{format(selectedMonth, 'MMM • yyyy', { locale: ptBR })}</div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedMonth(m => addMonths(m, 1))}>&gt;</Button>
                </div>
                <div className="text-sm text-muted-foreground">Total do período: <strong>{formatCurrency(monthTotal)}</strong></div>
              </div>
            </div>

            {/* Build combined filter to pass into the ExpenseList / useExpensesInfinite hook */}
            {
              /* eslint-disable @typescript-eslint/no-explicit-any */
            }
            <ExpenseList
              householdId={householdIdForList}
              month={format(selectedMonth, 'yyyy-MM')}
              categories={categories}
              onEdit={handleEditExpense}
              onDuplicate={handleDuplicateExpense}
              onDelete={(e: any) => {
                // Open confirmation dialog and store candidate
                setDeleteCandidate(e)
                setConfirmOpen(true)
              }}
              onViewAttachments={handleViewAttachments}
              onCreate={() => setShowExpenseForm(true)}
                activeFilters={activeFilters}
                searchText={searchText}
                filter={{
                  accountId: selectedAccount,
                  participantIds: selectedParticipants && selectedParticipants.length > 0 ? selectedParticipants : undefined,
                  sharedOnly: activeFilters.includes('shared') ? true : undefined,
                  searchText: searchText || undefined,
                  paymentStatus: activeFilters.includes('paid') ? 'paid' : activeFilters.includes('pending') ? 'unpaid' : undefined,
                } as any}
            />
          </div>

      {/* Floating Action Button - Mobile */}
      <Button
        onClick={() => setShowExpenseForm(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 md:hidden bg-primary-solid text-on-primary flex items-center justify-center"
        size="default"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Floating Action Button - Desktop/Tablet (visible on md and up) */}
      <Button
        onClick={() => setShowExpenseForm(true)}
        aria-label="Adicionar nova despesa"
        title="Adicionar nova despesa"
        className="hidden md:flex fixed fab-safe-bottom right-5 h-14 w-14 rounded-full shadow-2xl hover:shadow-2xl transition-all duration-200 z-50 bg-primary text-white items-center justify-center"
        size="default"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Expense Form Modal (responsive): bottom-sheet on mobile, centered on desktop */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0">
          <div className="bg-white shadow-xl w-full h-[82vh] md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-lg md:mx-6 overflow-y-auto">
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
              <h2 className="text-xl font-bold">{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowExpenseForm(false)
                  setEditingExpense(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-3 md:p-4">
              <ExpenseForm
                categories={categories}
                expense={editingExpense || undefined}
                onSubmit={handleCreateExpense}
                onCancel={() => {
                  setShowExpenseForm(false)
                  setEditingExpense(null)
                }}
                isLoading={false}
                coupleMode={coupleMode}
                members={members}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      )}

      {/* Debug panel (dev only) */}
      <DebugPanel householdId={householdIdForList} onForceRefresh={async () => {
        try {
          await queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false })
          await queryClient.refetchQueries({ queryKey: ['expenses'], exact: false })
        } catch (e) {
          console.warn('Debug force refresh failed', e)
        }
      }} />

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
              <DialogDescription>
                {deleteCandidate ? (
                  <>
                    Você irá excluir a despesa <strong>{deleteCandidate.title || deleteCandidate.description || deleteCandidate.name || '—'}</strong>
                    {deleteCandidate.date ? (
                      <span> — {format(new Date(deleteCandidate.date), 'dd/MM/yyyy')}</span>
                    ) : null}
                    . Esta ação pode ser desfeita apenas pelo botão 'Desfazer' na notificação.
                  </>
                ) : (
                  'Tem certeza que deseja excluir esta despesa?'
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3 mt-4">
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                <Button onClick={async () => {
                  setConfirmOpen(false)
                  try {
                    await handleDeleteExpense(deleteCandidate)
                  } catch (e) {
                    // already handled
                  } finally {
                    setDeleteCandidate(null)
                  }
                }}>Excluir</Button>
              </DialogFooter>
            </div>
          </DialogContent>
      </Dialog>
    </main>
  )
}
