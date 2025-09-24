import * as React from 'react'
import { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Badge replaced by lightweight chip spans to match new brand styles
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Paperclip,
  CreditCard,
  Tag,
  ChevronDown,
  
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Dynamically import react-window in the browser (avoid using require which breaks in Vite/browser)
const useVirtualList = () => {
  const [ListComp, setListComp] = React.useState<any | null>(null)

  React.useEffect(() => {
    let mounted = true
    import('react-window')
      .then(mod => {
        if (mounted) setListComp(() => (mod as any).FixedSizeList || (mod as any).default || (mod as any))
      })
      .catch(err => {
        // optional: log for debugging
        console.debug('react-window not available (will fallback to non-virtualized list)', err)
      })

    return () => { mounted = false }
  }, [])

  return ListComp
}

// Local minimal type for the list child props used here. Keeps us independent from
// possibly-mismatched @types/react-window in the repo and is sufficient for our renderer.
type ListChildComponentProps = {
  index: number
  style?: React.CSSProperties
  data?: any
}
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrentUser } from '@/core/store'
import { Spinner } from '@/components/ui/spinner'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { formatCurrency, formatDateGroup, formatPaymentMethod } from '@/core/utils/formatters'
// import type { Expense } from '@/types' (not used in focused check)
import type { ExpenseGroup, FlexibleExpense } from '../types/expense'
import { cn } from '@/lib/utils'
import { parseISO, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useExpensesInfinite } from '../hooks/useExpensesInfinite'
import { highlightText } from '@/core/utils/highlight'

// Default payment method when not specified
const DEFAULT_PAYMENT_METHOD = "dinheiro"

// Interfaces específicas para este componente

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
  expenses?: FlexibleExpense[] // Added this line to define the correct prop name
  isLoading?: boolean
  emptyMessage?: string
}

export function ExpenseList({
  householdId,
  month,
  categoryId,
  memberId,
  categories,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAttachments,
  onCreate,
  // emptyMessage removed (not used) to avoid unused local errors
  activeFilters = [],
  searchText = '',
  filter = undefined,
}: ExpenseListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Setup infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  // error and refetch intentionally not captured here to avoid unused variable errors
  } = useExpensesInfinite({
    householdId,
    month,
    categoryId,
    memberId,
    filter
  })

  // Setup intersection observer for infinite scroll
  const { ref } = useInView({
    threshold: 0.1,
    onChange: (visible: boolean) => {
      if (visible && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  })

  // Group expenses by date
  const groupedExpenses = React.useMemo(() => {
    if (!data) return []

    const groups: Record<string, ExpenseGroup> = {}

    const pages: any[] = Array.isArray((data as any).pages) ? (data as any).pages : []
    pages.forEach((page: any) => {
      (page.expenses || []).forEach((expense: any) => { // Changed 'items' to 'expenses'
        try {
          // Parse date string to Date object
          const expenseDate = parseISO(expense.date)
          
          // Skip if date is invalid
          if (isNaN(expenseDate.getTime())) {
            console.warn('⚠️ Data inválida encontrada na despesa:', expense.id)
            return
          }
          
          const dateKey = format(expenseDate, 'yyyy-MM-dd')
          const dateLabel = formatDateGroup(expenseDate)

          if (!groups[dateKey]) {
            groups[dateKey] = {
              date: dateKey,
              label: dateLabel,
              expenses: [],
              total: 0,
            }
          }

          groups[dateKey].expenses.push(expense)
          groups[dateKey].total += expense.amount
        } catch (error) {
          console.error('❌ Erro ao processar despesa no agrupamento:', expense.id, error);
          // Pular esta despesa se há erro
        }
      })
    })

    // Sort groups by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [data])

  // Flatten groups into rows for virtualization: header rows and item rows
  const flattenedRows = React.useMemo(() => {
    const rows: Array<{ type: 'header' | 'item'; key: string; data?: any }> = []
    ;(groupedExpenses || []).forEach(group => {
      rows.push({ type: 'header', key: `h-${group.date}`, data: group })
      group.expenses.forEach((expense: any) => {
        rows.push({ type: 'item', key: `i-${expense.id}`, data: { expense, group } })
      })
    })
    return rows
  }, [groupedExpenses])

  const toggleGroup = (dateKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Attempt to load react-window for virtualization; we'll fallback gracefully if it's missing
  const VirtualList = useVirtualList()

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || {
      name: 'Categoria não encontrada',
      icon: 'help-circle',
      color: '#6b7280'
    }
  }

  // Apply client-side filters (chips) to grouped expenses
  const filteredGroups = React.useMemo(() => {
    if (!groupedExpenses || groupedExpenses.length === 0) return []
    if (!activeFilters || activeFilters.length === 0) return groupedExpenses

    const now = new Date()
    return groupedExpenses
      .map(g => ({
        ...g,
        expenses: g.expenses.filter(exp => {
          try {
            const expDate = parseISO(exp.date)
            for (const f of activeFilters) {
              if (f === 'today') {
                if (format(expDate, 'yyyy-MM-dd') !== format(now, 'yyyy-MM-dd')) return false
              } else if (f === 'yesterday') {
                const y = new Date(now)
                y.setDate(now.getDate() - 1)
                if (format(expDate, 'yyyy-MM-dd') !== format(y, 'yyyy-MM-dd')) return false
              } else if (f === 'this_week') {
                const start = startOfWeek(now)
                const end = endOfWeek(now)
                if (expDate < start || expDate > end) return false
              } else if (f === 'this_month') {
                const mStart = startOfMonth(now)
                const mEnd = endOfMonth(now)
                if (expDate < mStart || expDate > mEnd) return false
              } else if (f === 'personal') {
                if (exp.isShared) return false
              } else if (f === 'shared') {
                if (!exp.isShared) return false
              } else if (f === 'paid') {
                if ((exp.paymentStatus || 'unpaid') !== 'paid') return false
              } else if (f === 'pending') {
                if ((exp.paymentStatus || 'unpaid') === 'paid') return false
              }
            }
            return true
          } catch (e) {
            return true
          }
        })
      }))
      .filter(g => g.expenses && g.expenses.length > 0)
  }, [groupedExpenses, activeFilters])

  // Loading state
  if (isLoading && (!data || !Array.isArray((data as any).pages) || (data as any).pages.length === 0)) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-100 rounded mb-2 w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // If there are no expenses at all, show an empty state with CTA
  const effectiveGroups = (filteredGroups && filteredGroups.length > 0) ? filteredGroups : groupedExpenses
  if (!isLoading && effectiveGroups.length === 0) {
    return (
      <div className="py-8">
        <Card>
          <CardContent>
            <div className="flex flex-col items-start gap-3">
              <h3 className="text-lg font-semibold">Nenhuma despesa encontrada</h3>
              <p className="text-sm text-gray-600">Ainda não há despesas neste período. Você pode criar a primeira despesa agora.</p>
              <div className="mt-4">
                <Button onClick={() => onCreate?.()} className="mr-2">Criar primeira despesa</Button>
                <Button variant="ghost" onClick={() => window.location.reload()}>Recarregar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  const totalRows = (filteredGroups.length ? filteredGroups : groupedExpenses).reduce((acc, g) => acc + 1 + (g.expenses?.length || 0), 0)

  // If many rows, try to virtualize. If react-window hasn't loaded yet, render non-virtualized fallback.
  if (totalRows > 80) {
    if (VirtualList) {
      const List = VirtualList as any
      return (
        <List
          height={600}
          itemCount={flattenedRows.length}
          itemSize={64}
          width="100%"
        >
          {({ index, style }: ListChildComponentProps) => {
            const row = flattenedRows[index]
            if (!row) return null
            if (row.type === 'header') {
              const group = row.data
              return (
                <div style={style} key={row.key} className="p-2 bg-white border-b">
                  <button onClick={() => toggleGroup(group.date)} className="w-full text-left flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-sm">{group.label}</h3>
                      <span className="text-xs text-gray-500">{group.expenses.length} {group.expenses.length === 1 ? 'despesa' : 'despesas'}</span>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(group.total)}</div>
                  </button>
                </div>
              )
            }

            // item row
            const { expense } = row.data
            return (
              <div style={style} key={row.key} className="p-2 border-b">
                <ExpenseItem
                  expense={expense}
                  category={getCategoryInfo(expense.categoryId || expense.category || '')}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onViewAttachments={onViewAttachments}
                  searchText={searchText}
                />
              </div>
            )
          }}
        </List>
      )
    }

    // Fallback: react-window not loaded yet — render regular list so user can still see content
    return (
      <div className="space-y-3">
        {(filteredGroups.length ? filteredGroups : groupedExpenses).map(group => (
          <div key={group.date}>
            <div className="p-2 bg-white border-b">
              <button onClick={() => toggleGroup(group.date)} className="w-full text-left flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-sm">{group.label}</h3>
                  <span className="text-xs text-gray-500">{group.expenses.length} {group.expenses.length === 1 ? 'despesa' : 'despesas'}</span>
                </div>
                <div className="text-sm font-semibold">{formatCurrency(group.total)}</div>
              </button>
            </div>
            <div>
              {group.expenses.map(expense => (
                <div key={(expense as any).id} className="p-2 border-b">
                  <ExpenseItem
                    expense={expense}
                    category={getCategoryInfo(expense.categoryId || (expense as any).category || '')}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onViewAttachments={onViewAttachments}
                    searchText={searchText}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {(filteredGroups.length ? filteredGroups : groupedExpenses).map(group => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {/* Compact Group Header */}
              <button
                onClick={() => toggleGroup(group.date)}
                className="w-full flex items-center justify-between py-3 px-3 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <motion.div
                    animate={{ rotate: expandedGroups.has(group.date) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </motion.div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="font-medium text-sm truncate">{group.label}</h3>
                    <span className="text-gray-400 shrink-0">•</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {group.expenses.length} {group.expenses.length === 1 ? 'despesa' : 'despesas'}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  <span className="text-sm font-semibold">{formatCurrency(group.total)}</span>
                </div>
              </button>

              {/* Group expenses */}
              <AnimatePresence>
                {expandedGroups.has(group.date) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t">
                      {group.expenses.map((expense, index) => (
                        <ExpenseItem
                          key={(expense as any).id}
                          expense={expense}
                          category={getCategoryInfo(expense.categoryId || (expense as any).category || '')}
                          onEdit={onEdit}
                          onDuplicate={onDuplicate}
                          onDelete={onDelete}
                          onViewAttachments={onViewAttachments}
                          isLast={index === group.expenses.length - 1}
                          searchText={searchText}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Infinite scroll trigger and loading indicator */}
      <div ref={ref} className="h-8 overflow-hidden">
        {isFetchingNextPage && (
          <div className="flex justify-center items-center p-4">
            <Spinner />
          </div>
        )}
      </div>
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
              <div className="text-right shrink-0">
                <div className="monetary-value font-semibold">{formatCurrency(expense.amount)}</div>
              </div>
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

