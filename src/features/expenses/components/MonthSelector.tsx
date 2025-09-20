import { useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { addMonths, subMonths } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
  date: Date
  onDateChange: (date: Date) => void
}

export function MonthSelector({ date, onDateChange }: MonthSelectorProps) {
  // Navegar para mês anterior/próximo
  const handlePrevMonth = useCallback(() => {
    onDateChange(subMonths(date, 1))
  }, [date, onDateChange])

  const handleNextMonth = useCallback(() => {
    onDateChange(addMonths(date, 1))
  }, [date, onDateChange])

  // Gerar lista de meses
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(date.getFullYear(), i)
    return {
      value: format(monthDate, 'yyyy-MM'),
      label: format(monthDate, 'MMMM', { locale: ptBR })
    }
  })

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select
        value={format(date, 'yyyy-MM')}
        onValueChange={value => {
          const [year, month] = value.split('-')
          onDateChange(new Date(+year, +month - 1))
        }}
      >
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue>
            {format(date, "MMM'/'yyyy", { locale: ptBR })}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {months.map(month => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}