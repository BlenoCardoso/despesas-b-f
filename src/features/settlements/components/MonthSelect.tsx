import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Props {
  date: Date
  onSelect: (date: Date) => void
  className?: string
}

export function MonthSelect({ date, onSelect, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, "MMMM 'de' yyyy", { locale: ptBR })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && onSelect(date)}
          disabled={(date) => 
            date > new Date() || 
            date < addMonths(new Date(), -12)
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}