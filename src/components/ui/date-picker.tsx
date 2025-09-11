import * as React from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps {
  from?: Date
  to?: Date
  onSelect?: (range: { from?: Date; to?: Date } | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  from,
  to,
  onSelect,
  className
}: DatePickerWithRangeProps) {
  const [fromDate, setFromDate] = React.useState(from?.toISOString().split('T')[0] || '')
  const [toDate, setToDate] = React.useState(to?.toISOString().split('T')[0] || '')

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromDate(value)
    
    const newFrom = value ? new Date(value) : undefined
    onSelect?.({ from: newFrom, to: toDate ? new Date(toDate) : undefined })
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToDate(value)
    
    const newTo = value ? new Date(value) : undefined
    onSelect?.({ from: fromDate ? new Date(fromDate) : undefined, to: newTo })
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative">
        <Input
          type="date"
          value={fromDate}
          onChange={handleFromChange}
          placeholder="Data inicial"
          className="pl-10"
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      <span className="text-gray-500">até</span>
      <div className="relative">
        <Input
          type="date"
          value={toDate}
          onChange={handleToChange}
          placeholder="Data final"
          className="pl-10"
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}

