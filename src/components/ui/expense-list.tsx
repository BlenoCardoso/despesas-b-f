import { useState } from 'react'
import { Expense } from '@/services/expenseService'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent } from './mobile-card'
import { MoreVertical, Calendar, User, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSpring, animated } from '@react-spring/web'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  groupByDate?: boolean
  showPaidBy?: boolean
}

const categoryIcons = {
  food: '🍽️',
  transport: '🚗',
  home: '🏠',
  entertainment: '🎬',
  health: '⚕️',
  education: '📚',
  other: '💰',
}

const categoryColors = {
  food: 'bg-red-50 text-red-700 border-red-200',
  transport: 'bg-blue-50 text-blue-700 border-blue-200',
  home: 'bg-green-50 text-green-700 border-green-200',
  entertainment: 'bg-purple-50 text-purple-700 border-purple-200',
  health: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  education: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
}

function ExpenseItem({ 
  expense, 
  onEdit, 
  onDelete, 
  showPaidBy = false 
}: { 
  expense: Expense
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  showPaidBy?: boolean
}) {
  const [isPressed, setIsPressed] = useState(false)

  const springProps = useSpring({
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    config: { tension: 300, friction: 10 }
  })

  // Determinar categoria baseada no título (como proxy)
  const getCategory = (title: string): keyof typeof categoryColors => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('comida') || lowerTitle.includes('alimentação') || lowerTitle.includes('restaurante')) return 'food'
    if (lowerTitle.includes('transporte') || lowerTitle.includes('combustível') || lowerTitle.includes('uber')) return 'transport'
    if (lowerTitle.includes('casa') || lowerTitle.includes('aluguel') || lowerTitle.includes('condomínio')) return 'home'
    if (lowerTitle.includes('cinema') || lowerTitle.includes('show') || lowerTitle.includes('festa')) return 'entertainment'
    if (lowerTitle.includes('saúde') || lowerTitle.includes('médico') || lowerTitle.includes('farmácia')) return 'health'
    if (lowerTitle.includes('educação') || lowerTitle.includes('curso') || lowerTitle.includes('livro')) return 'education'
    return 'other'
  }

  const category = getCategory(expense.title)

  return (
    <animated.div style={springProps}>
      <Card 
        className={cn(
          "mb-3 hover:shadow-medium transition-all duration-200",
          "active:shadow-soft touch:active:shadow-soft"
        )}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{categoryIcons[category]}</span>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium border",
                  categoryColors[category]
                )}>
                  {category === 'food' && 'Alimentação'}
                  {category === 'transport' && 'Transporte'}
                  {category === 'home' && 'Casa'}
                  {category === 'entertainment' && 'Entretenimento'}
                  {category === 'health' && 'Saúde'}
                  {category === 'education' && 'Educação'}
                  {category === 'other' && 'Outros'}
                </div>
              </div>
              
              <h3 className="font-medium text-fluid-base text-foreground truncate mb-1">
                {expense.title}
              </h3>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatRelativeTime(expense.date)}</span>
                </div>
                {showPaidBy && expense.paidBy && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Por você</span>
                  </div>
                )}
              </div>
              
              {expense.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {expense.notes}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-3">
              <div className="text-right">
                <p className="font-bold text-fluid-lg text-foreground">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted/50 touch-target"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={() => onEdit(expense)}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(expense)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </animated.div>
  )
}

export function ExpenseList({ 
  expenses, 
  onEdit, 
  onDelete, 
  groupByDate = true,
  showPaidBy = false 
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-fluid-lg font-medium text-muted-foreground mb-2">
          Nenhuma despesa encontrada
        </h3>
        <p className="text-fluid-sm text-muted-foreground">
          Adicione sua primeira despesa para começar
        </p>
      </div>
    )
  }

  if (!groupByDate) {
    return (
      <div className="space-y-0">
        {expenses.map(expense => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            showPaidBy={showPaidBy}
          />
        ))}
      </div>
    )
  }

  // Agrupar por data
  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = new Date(expense.date).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(expense)
    return groups
  }, {} as Record<string, Expense[]>)

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6">
      {sortedDates.map(dateStr => {
        const date = new Date(dateStr)
        const dateExpenses = groupedExpenses[dateStr]
        const total = dateExpenses.reduce((sum, expense) => sum + expense.amount, 0)

        return (
          <div key={dateStr}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="font-medium text-fluid-base text-foreground">
                {formatRelativeTime(date)}
              </h4>
              <span className="text-fluid-sm font-medium text-muted-foreground">
                {formatCurrency(total)}
              </span>
            </div>
            
            <div className="space-y-0">
              {dateExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(expense => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showPaidBy={showPaidBy}
                  />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}