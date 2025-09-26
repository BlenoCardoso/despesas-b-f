import * as React from 'react'
import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Copy, Trash2, Paperclip, CreditCard, Tag, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrentUser } from '@/core/store'
import { useQueryClient } from '@tanstack/react-query'
import { togglePaymentStatus } from '@/features/expenses/services/expense-service'
import { Spinner } from '@/components/ui/spinner'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { formatCurrency, formatDateGroup, formatPaymentMethod } from '@/core/utils/formatters'
import type { ExpenseGroup, FlexibleExpense } from '../types/expense'
import { cn } from '@/lib/utils'
import { parseISO, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useExpensesInfinite } from '../hooks/useExpensesInfinite'
import { highlightText } from '@/core/utils/highlight'

const DEFAULT_PAYMENT_METHOD = 'dinheiro'

interface ExpenseListProps {
  householdId: string
  month?: string
  categoryId?: string
  memberId?: string
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onEdit?: (expense: any) => void
  onDuplicate?: (expense: any) => void
  onDelete?: (expense: any) => void
  onViewAttachments?: (expense: any) => void
  onCreate?: () => void
  activeFilters?: string[]
  searchText?: string
  filter?: any
  expenses?: FlexibleExpense[]
  isLoading?: boolean
  emptyMessage?: string
}

function AmountWithPaidToggle({ expense }: { expense: any }) {
  const qc = useQueryClient()
  const [loading, setLoading] = React.useState(false)
  const isPaid = ((expense.paymentStatus || 'unpaid') === 'paid')

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      const nextStatus = isPaid ? 'unpaid' : 'paid'
      qc.setQueriesData({ queryKey: ['expenses'], exact: false }, (old: any) => {
        if (!old) return old
        try {
          if (old && typeof old === 'object' && Array.isArray(old.pages)) {
            return { ...old, pages: old.pages.map((p: any) => ({ ...p, expenses: (p.expenses || []).map((it: any) => it.id === expense.id ? { ...it, paymentStatus: nextStatus } : it) })) }
          }
          if (Array.isArray(old)) return old.map((it: any) => it.id === expense.id ? { ...it, paymentStatus: nextStatus } : it)
          return old
        } catch (e) {
          return old
        }
      })
      await togglePaymentStatus(expense.id)
      qc.invalidateQueries({ queryKey: ['expenses'], exact: false })
    } catch (e) {
      qc.invalidateQueries({ queryKey: ['expenses'], exact: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-right shrink-0 flex items-center gap-3">
      <button
        aria-pressed={isPaid}
        aria-label={isPaid ? 'Despesa marcada como paga. Clique para desmarcar.' : 'Marcar despesa como paga'}
        title={isPaid ? 'Pago — clique para desmarcar' : 'Marcar como pago'}
        onClick={handleToggle}
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 ${isPaid ? 'bg-green-500 hover:scale-105' : 'bg-gray-100 hover:bg-gray-200'}`}
      >
        {loading ? <Spinner className="h-4 w-4 text-white" /> : (
          isPaid ? <Check className="h-4 w-4 text-white" /> : <span className="block w-2 h-2 rounded-full bg-gray-400" />
        )}
      </button>
      <div className="monetary-value font-semibold">{formatCurrency(expense.amount)}</div>
    </div>
  )
}

export function ExpenseList(props: ExpenseListProps) {
  const { householdId, month, categoryId, memberId, categories, onEdit, onDuplicate, onDelete, onViewAttachments, onCreate, activeFilters = [], searchText = '', filter } = props
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useExpensesInfinite({ householdId, month, categoryId, memberId, filter })
  const { ref } = useInView({ threshold: 0.1, onChange: (v) => { if (v && hasNextPage && !isFetchingNextPage) fetchNextPage() } })

  const groupedExpenses = React.useMemo(() => {
    if (!data) return []
    const groups: Record<string, ExpenseGroup> = {}
    const pages: any[] = Array.isArray((data as any).pages) ? (data as any).pages : []
    pages.forEach(page => {
      (page.expenses || []).forEach((expense: any) => {
        const d = expense.date ? parseISO(String(expense.date)) : new Date(NaN)
        if (isNaN(d.getTime())) return
        const key = format(d, 'yyyy-MM-dd')
        const label = formatDateGroup(d)
        if (!groups[key]) groups[key] = { date: key, label, expenses: [], total: 0 }
        groups[key].expenses.push(expense)
        groups[key].total += Number(expense.amount || 0)
      })
    })
    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data])

  const filteredGroups = React.useMemo(() => {
    if (!groupedExpenses || groupedExpenses.length === 0) return []
    if (!activeFilters || activeFilters.length === 0) return groupedExpenses
    const now = new Date()
    return groupedExpenses.map(g => ({
      ...g,
      expenses: g.expenses.filter((exp: any) => {
        try {
          const expDate = parseISO(String(exp.date))
          for (const f of activeFilters) {
            if (f === 'today' && format(expDate, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd')) return false
            if (f === 'yesterday') { const y = new Date(now); y.setDate(now.getDate() - 1); if (format(expDate, 'yyyy-MM-dd') !== format(y, 'yyyy-MM-dd')) return false }
            if (f === 'this_week') { const s = startOfWeek(now); const e = endOfWeek(now); if (expDate < s || expDate > e) return false }
            if (f === 'this_month') { const s = startOfMonth(now); const e = endOfMonth(now); if (expDate < s || expDate > e) return false }
            if (f === 'personal' && exp.isShared) return false
            if (f === 'shared' && !exp.isShared) return false
            if (f === 'paid' && (exp.paymentStatus || 'unpaid') !== 'paid') return false
            if (f === 'pending' && (exp.paymentStatus || 'unpaid') === 'paid') return false
          }
          return true
        } catch (e) { return true }
      })
    })).filter(g => g.expenses && g.expenses.length > 0)
  }, [groupedExpenses, activeFilters])

  const effectiveGroups = (filteredGroups && filteredGroups.length > 0) ? filteredGroups : groupedExpenses

  const toggleGroup = (key: string) => {
    const s = new Set(expandedGroups)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    setExpandedGroups(s)
  }

  const getCategoryInfo = (id?: string) => categories.find(c => c.id === id) || { id: 'none', name: 'Categoria', icon: '', color: '#6b7280' }

  if (isLoading && (!data || !Array.isArray((data as any).pages) || (data as any).pages.length === 0)) {
    return <div className="space-y-3">{[1,2,3].map(i => <Card key={i}><CardContent className="p-4"><div className="h-4 bg-gray-100 rounded mb-2 w-2/3"/><div className="h-3 bg-gray-100 rounded w-1/2"/></CardContent></Card>)}</div>
  }

  if (!isLoading && effectiveGroups.length === 0) {
    return (
      <div className="py-8">
        <Card>
          <CardContent>
            <div className="flex flex-col items-start gap-3">
              <h3 className="text-lg font-semibold">Nenhuma despesa encontrada</h3>
              <p className="text-sm text-gray-600">Ainda não há despesas neste período. Você pode criar a primeira despesa agora.</p>
              <div className="mt-4"><Button onClick={() => onCreate?.()} className="mr-2">Criar primeira despesa</Button><Button variant="ghost" onClick={() => window.location.reload()}>Recarregar</Button></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {effectiveGroups.map(group => (
        <motion.div key={group.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <Card>
            <CardContent className="p-0">
              <button onClick={() => toggleGroup(group.date)} className="w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <motion.div animate={{ rotate: expandedGroups.has(group.date) ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0"><ChevronDown className="h-4 w-4 text-gray-500" /></motion.div>
                  <div className="flex items-center gap-2 min-w-0 flex-1"><h3 className="font-medium text-sm truncate">{group.label}</h3><span className="text-xs text-gray-500">{group.expenses.length} {group.expenses.length === 1 ? 'despesa' : 'despesas'}</span></div>
                </div>
                <div className="shrink-0 ml-2"><span className="text-sm font-semibold">{formatCurrency(group.total)}</span></div>
              </button>

              <AnimatePresence>
                {expandedGroups.has(group.date) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t">
                      {group.expenses.map((expense, idx) => (
                        <div key={(expense as any).id} className={`p-3 ${idx !== group.expenses.length - 1 ? 'border-b' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: getCategoryInfo(expense.categoryId || expense.category).color }}>
                                {getCategoryInfo(expense.categoryId || expense.category).icon || <Tag className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{highlightText(expense.title || expense.description || 'Despesa sem título', searchText)}</div>
                                <div className="text-xs text-gray-500 mt-1">{formatPaymentMethod(expense.paymentMethod || DEFAULT_PAYMENT_METHOD)} • {format(new Date(expense.date), 'dd/MM/yyyy')}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <AmountWithPaidToggle expense={expense} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="button-icon-touch"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {onEdit && <DropdownMenuItem onClick={() => onEdit(expense)}><Edit className="h-4 w-4 mr-2"/>Editar</DropdownMenuItem>}
                                  {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(expense)}><Copy className="h-4 w-4 mr-2"/>Duplicar</DropdownMenuItem>}
                                  {expense.attachments && expense.attachments.length > 0 && onViewAttachments && <DropdownMenuItem onClick={() => onViewAttachments(expense)}><Paperclip className="h-4 w-4 mr-2"/>Ver anexos</DropdownMenuItem>}
                                  {onDelete && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => onDelete(expense)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2"/>Excluir</DropdownMenuItem></>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      <div ref={ref} className="h-8 overflow-hidden">{isFetchingNextPage && <div className="flex justify-center items-center p-4"><Spinner /></div>}</div>
    </div>
  )
}


interface ExpenseItemProps {
  expense: FlexibleExpense
  category: { name: string; icon: string; color: string }
  onEdit?: (expense: FlexibleExpense) => void
  onDuplicate?: (expense: FlexibleExpense) => void
  onDelete?: (expense: FlexibleExpense) => void
  onViewAttachments?: (expense: FlexibleExpense) => void
  isLast?: boolean
  searchText?: string
}

// Using the imported FlexibleExpense type

function ExpenseItem({
  expense,
  category,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAttachments,
  isLast = false,
  searchText = '',
}: ExpenseItemProps) {
  const hasAttachments = expense.attachments && expense.attachments.length > 0
  const hasRecurrence = !!expense.recurrence
  const hasInstallment = !!expense.installment

  // Offline sync status
  const { offlineData, isSyncing } = useOfflineSync()

  const isQueuedActionForThis = React.useMemo(() => {
    try {
      if (!offlineData) return false
      const inExpenses = (offlineData.expenses || []).some((e: any) => e.id === (expense as any).id)
      const inQueue = (offlineData.syncQueue || []).some((a: any) => (a && a.data && a.data.id) === (expense as any).id)
      return inExpenses || inQueue || !!(expense as any).isOffline || String((expense as any).id || '').startsWith('offline-')
    } catch (e) {
      return false
    }
  }, [offlineData, expense])

  // Determine if the expense is "new": created by someone else within the last 24 hours
  const currentUser = useCurrentUser()
  const createdBy = (expense as any).createdBy || (expense as any).userId || (expense as any).createdById
  const createdAtRaw = (expense as any).createdAt || (expense as any).date
  let isNew = false
  try {
    const createdDate = createdAtRaw ? new Date(createdAtRaw) : null
    if (createdDate && currentUser && currentUser.id) {
      const hours = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60)
      if (createdBy && createdBy !== currentUser.id && hours <= 24) {
        isNew = true
      }
    }
  } catch (e) {
    // ignore parsing errors and keep isNew = false
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "py-2 md:py-3 hover:bg-gray-50 transition-colors",
        !isLast && "border-b"
      )}
    >
      {/* Mobile-optimized layout (more compact) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Compact category icon */}
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white font-medium shrink-0"
            style={{ backgroundColor: category.color || '#6b7280' }}
            title={category.name}
          >
            {/* If icon is emoji or simple string show it, otherwise show generic Tag icon */}
            {typeof category.icon === 'string' && category.icon.length <= 2 ? (
              <span className="text-sm md:text-base">{category.icon}</span>
            ) : (
              <Tag className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </div>

          {/* Expense details - mobile optimized */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate leading-tight text-sm md:text-base">
                  {/* Highlight search term in title */}
                  {highlightText(expense.title || (expense as any).description || 'Despesa sem título', searchText)}
                </h4>
                    <div className="mt-1 flex items-center gap-2">
                      {isNew && (
                        <span className="chip-primary text-xs">Novo</span>
                      )}
                      {isQueuedActionForThis && (
                        <div className="flex items-center gap-1">
                          <span className="chip-primary text-xs">Pendente</span>
                          {isSyncing && <Spinner className="h-3 w-3" />}
                        </div>
                      )}
                    </div>
                
                {/* Mobile-friendly details */}
                <div className="flex items-center gap-2 text-gray-500 mt-1 text-xs md:text-sm">
                  <span className="truncate max-w-[120px] md:max-w-40">{category.name}</span>
                  {hasAttachments && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => onViewAttachments?.(expense)}
                        className="text-gray-400 hover:text-gray-600 touch-target-small inline-flex items-center gap-1"
                        aria-label={`Ver ${expense.attachments?.length || 0} anexos`}
                        title={`Ver anexos (${expense.attachments?.length || 0})`}
                      >
                        <span aria-hidden>👁️</span>
                        <Paperclip className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Payment method - compact */}
                <div className="flex items-center gap-2 text-gray-500 mt-0.5 text-xs md:text-sm">
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate max-w-[130px] md:max-w-none">{formatPaymentMethod(expense.paymentMethod || DEFAULT_PAYMENT_METHOD)}</span>
                  
                  {(hasRecurrence || hasInstallment) && (
                    <>
                      <span>•</span>
                      {hasRecurrence && (
                        <span className="chip-primary text-[10px] px-2 py-0">Rec</span>
                      )}
                      {hasInstallment && (
                        <span className="chip-primary text-[10px] px-2 py-0">
                          {expense.installment?.count}/{expense.installment?.total}
                        </span>
                      )}
                    </>
                  )}
                </div>
                
                {expense.notes && (
                  <p className="text-xs text-gray-600 mt-1 truncate max-w-[220px] md:max-w-none">{highlightText(expense.notes, searchText)}</p>
                )}
              </div>
              
              {/* Amount - right aligned */}
              <AmountWithPaidToggle expense={expense} />
            </div>
          </div>
        </div>

        {/* Compact actions button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="button-icon-touch shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(expense)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
            )}
            {hasAttachments && onViewAttachments && (
              <DropdownMenuItem onClick={() => onViewAttachments(expense)}>
                <Paperclip className="h-4 w-4 mr-2" />
                👁️ Ver anexos
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(expense)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

