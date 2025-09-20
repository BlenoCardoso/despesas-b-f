import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'

interface Props {
  onExport: (range: { start: Date; end: Date }) => void
  trigger?: React.ReactNode
}

export function ExportRangeDialog({ onExport, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<{
    start?: Date
    end?: Date
  }>({})

  // Handler de exportação
  const handleExport = () => {
    if (!range.start || !range.end) return

    onExport({
      start: range.start,
      end: range.end
    })

    setOpen(false)
  }

  // Reseta seleção ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRange({})
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Exportar Período
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Despesas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Início</span>
                <Calendar
                  mode="single"
                  selected={range.start}
                  onSelect={(date) => setRange(r => ({ ...r, start: date }))}
                  disabled={(date) => range.end ? date > range.end : false}
                  initialFocus
                />
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Fim</span>
                <Calendar
                  mode="single"
                  selected={range.end}
                  onSelect={(date) => setRange(r => ({ ...r, end: date }))}
                  disabled={(date) => range.start ? date < range.start : false}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {range.start && range.end ? (
              <>
                Exportar despesas de{' '}
                <span className="font-medium">
                  {format(range.start, 'dd/MM/yyyy')}
                </span>
                {' '}até{' '}
                <span className="font-medium">
                  {format(range.end, 'dd/MM/yyyy')}
                </span>
              </>
            ) : (
              'Selecione o período para exportar'
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleExport}
            disabled={!range.start || !range.end}
          >
            Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}