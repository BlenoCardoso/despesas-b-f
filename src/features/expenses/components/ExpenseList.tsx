import React, { useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Trash2, 
  Paperclip,
  Calendar,
  CreditCard,
  Tag,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { formatCurrency, formatDateGroup, formatPaymentMethod } from '@/core/utils/formatters'
import type { Expense } from '@/types'
import type { ExpenseGroup, FlexibleExpense } from '../types/expense'
import { cn } from '@/lib/utils'
import { parseISO, format } from 'date-fns'
import { useExpensesInfinite } from '../hooks/useExpensesInfinite'
import { deleteExpense, undoExpenseDelete } from '../services/expense-service'

// Default payment method when not specified
const DEFAULT_PAYMENT_METHOD = "dinheiro"

// Interfaces específicas para este componente
interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface ExpenseListProps {
  householdId: string
  month?: string
  categoryId?: string
  memberId?: string
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onEdit?: (expense: FlexibleExpense) => void
  onDuplicate?: (expense: FlexibleExpense) => void
  onDelete?: (expense: FlexibleExpense) => void
  onViewAttachments?: (expense: FlexibleExpense) => void
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
  emptyMessage = "Nenhuma despesa encontrada",
}: ExpenseListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Setup infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch
  } = useExpensesInfinite({
    householdId,
    month,
    categoryId,
    memberId
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

    data.pages.forEach((page: { items: Expense[] }) => {
      page.items.forEach((expense) => {
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

  const toggleGroup = (dateKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedGroups(newExpanded)
  }

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || {
      name: 'Categoria não encontrada',
      icon: 'help-circle',
      color: '#6b7280'
    }
  }

  // Loading state
  if (isLoading && !data?.pages?.length) {
    return (
      <div className="space-consistent">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="padding-consistent">
              <div className="space-consistent-sm">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-consistent-sm">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="padding-consistent-lg text-center">
          <div className="text-destructive">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-medium mb-2">Erro ao carregar despesas</p>
            <p className="text-sm mb-4">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!data?.pages[0]?.items.length) {
    return (
      <Card>
        <CardContent className="padding-consistent-lg text-center">
          <div className="text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Nenhuma despesa</p>
            <p>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {groupedExpenses.map(group => (
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
                          key={expense.id}
                          expense={expense}
                          category={getCategoryInfo(expense.categoryId || (expense as any).category || '')}
                          onEdit={onEdit}
                          onDuplicate={onDuplicate}
                          onDelete={onDelete}
                          onViewAttachments={onViewAttachments}
                          isLast={index === group.expenses.length - 1}
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
}: ExpenseItemProps) {
  const hasAttachments = expense.attachments && expense.attachments.length > 0
  const hasRecurrence = !!expense.recurrence
  const hasInstallment = !!expense.installment

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "padding-consistent-sm hover:bg-gray-50 transition-colors",
        !isLast && "border-b"
      )}
    >
      {/* Mobile-optimized layout */}
      <div className="flex items-start justify-between gap-consistent">
        <div className="flex items-start gap-consistent flex-1 min-w-0">
          {/* Compact category icon */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shrink-0"
            style={{ backgroundColor: category.color }}
          >
            <Tag className="h-4 w-4" />
          </div>

          {/* Expense details - mobile optimized */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-consistent-sm mb-1">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate leading-tight">
                  {expense.title || (expense as any).description || 'Despesa sem título'}
                </h4>
                
                {/* Mobile-friendly details */}
                <div className="flex items-center gap-consistent-sm text-gray-500 mt-1">
                  <span className="truncate max-w-20">{category.name}</span>
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
                <div className="flex items-center gap-consistent-sm text-gray-500 mt-0.5">
                  <CreditCard className="h-3 w-3" />
                  <span className="truncate">{formatPaymentMethod(expense.paymentMethod || DEFAULT_PAYMENT_METHOD)}</span>
                  
                  {(hasRecurrence || hasInstallment) && (
                    <>
                      <span>•</span>
                      {hasRecurrence && (
                        <Badge variant="outline" className="badge px-1 py-0">Rec</Badge>
                      )}
                      {hasInstallment && (
                        <Badge variant="outline" className="badge px-1 py-0">
                          {expense.installment?.count}/{expense.installment?.total}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                
                {expense.notes && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{expense.notes}</p>
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

