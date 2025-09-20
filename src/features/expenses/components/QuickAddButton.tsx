import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { QuickExpenseForm } from './QuickExpenseForm'
import { Plus } from 'lucide-react'

interface QuickAddButtonProps {
  householdId: string
}

export function QuickAddButton({ householdId }: QuickAddButtonProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="size-14 rounded-full shadow-lg fixed bottom-6 right-6 z-50"
          aria-label="Adicionar despesa"
        >
          <Plus className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <QuickExpenseForm householdId={householdId} />
      </SheetContent>
    </Sheet>
  )
}