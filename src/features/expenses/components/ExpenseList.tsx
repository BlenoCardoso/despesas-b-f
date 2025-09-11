import React, { useState } from 'react'
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
  Tag
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency, formatDateGroup, formatPaymentMethod } from '@/core/utils/formatters'
import { Expense, ExpenseGroup } from '../types'
import { cn } from '@/lib/utils'
import { parseISO, format } from 'date-fns'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onEdit?: (expense: Expense) => void
  onDuplicate?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  onViewAttachments?: (expense: Expense) => void
  isLoading?: boolean
  emptyMessage?: string
}

export function ExpenseList({
  expenses,
  categories,
  onEdit,
  onDuplicate,
  onDelete,
  onViewAttachments,
  isLoading = false,
  emptyMessage = "Nenhuma despesa encontrada",
}: ExpenseListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group expenses by date
  const groupedExpenses = React.useMemo(() => {
    const groups: Record<string, ExpenseGroup> = {}

    expenses.forEach(expense => {
      const expenseDate = typeof expense.date === 'string' ? parseISO(expense.date) : expense.date
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
    })

    // Sort groups by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [expenses])

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
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

  if (groupedExpenses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma despesa</p>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {groupedExpenses.map(group => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-left">{group.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {group.expenses.length} {group.expenses.length === 1 ? 'despesa' : 'despesas'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(group.total)}</span>
                  <motion.div
                    animate={{ rotate: expandedGroups.has(group.date) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar className="h-4 w-4" />
                  </motion.div>
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
                          category={getCategoryInfo(expense.categoryId)}
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
    </div>
  )
}

interface ExpenseItemProps {
  expense: Expense
  category: { name: string; icon: string; color: string }
  onEdit?: (expense: Expense) => void
  onDuplicate?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  onViewAttachments?: (expense: Expense) => void
  isLast?: boolean
}

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
        "p-4 hover:bg-gray-50 transition-colors",
        !isLast && "border-b"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Category icon */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: category.color }}
          >
            <Tag className="h-5 w-5" />
          </div>

          {/* Expense details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{expense.title}</h4>
              {hasAttachments && (
                <button
                  onClick={() => onViewAttachments?.(expense)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{category.name}</span>
              <span>•</span>
              <CreditCard className="h-3 w-3" />
              <span>{formatPaymentMethod(expense.paymentMethod)}</span>
              
              {hasRecurrence && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">Recorrente</Badge>
                </>
              )}
              
              {hasInstallment && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {expense.installment?.count}/{expense.installment?.total}
                  </Badge>
                </>
              )}
            </div>

            {expense.notes && (
              <p className="text-sm text-gray-600 mt-1 truncate">{expense.notes}</p>
            )}
          </div>
        </div>

        {/* Amount and actions */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">{formatCurrency(expense.amount)}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  Ver anexos
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
      </div>
    </motion.div>
  )
}

