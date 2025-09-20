import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { formatDateRange } from '@/utils/dateFormat'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormField, FormControl, FormLabel, FormItem } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { format, subMonths } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ptBR } from 'date-fns/locale'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useExpenseExport } from '../hooks/useExpenseExport'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Schema de validação do form
const exportFormSchema = z.object({
  format: z.enum(['csv', 'pdf', 'image']),
  startDate: z.date(),
  endDate: z.date(),
  includeCategories: z.boolean().default(true),
  includePayers: z.boolean().default(true),
  includeNotes: z.boolean().default(false)
})

type ExportFormValues = z.infer<typeof exportFormSchema>

interface ExportButtonProps {
  householdId: string
}

export function ExportButton({ householdId }: ExportButtonProps) {
  // Estado e funções de exportação
  const { isExporting, exportExpenses } = useExpenseExport(householdId)

  // Form de exportação 
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: 'csv',
      startDate: subMonths(new Date(), 1),
      endDate: new Date(),
      includeCategories: true,
      includePayers: true,
      includeNotes: false
    }
  })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" title="Exportar despesas">
          <FileDown className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Exportar Despesas</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(exportExpenses)} className="space-y-6">
              {/* Formato */}
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Período */}
              <div className="grid gap-4">
                <Label>Período</Label>

                {/* Data inicial */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Data inicial</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {/* Data final */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Data final</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />

                {form.watch('startDate') && form.watch('endDate') && (
                  <div className="text-sm text-muted-foreground">
                    {formatDateRange(form.watch('startDate'), form.watch('endDate'))}
                  </div>
                )}
              </div>

              {/* Opções */}
              <div className="space-y-4">
                <Label>Incluir</Label>

                <FormField
                  control={form.control}
                  name="includeCategories"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Categorias
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includePayers"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Pagadores
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeNotes"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Notas
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isExporting}>
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}