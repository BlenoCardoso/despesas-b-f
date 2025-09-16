import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarIcon, 
  Upload, 
  X, 
  Plus,
  Repeat,
  CreditCard,
  FileText
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ExpenseFormData, Expense } from '../types'
import { PaymentMethod } from '@/types/global'
import { formatCurrency, parseCurrency } from '@/core/utils/formatters'

const expenseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  paymentMethod: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto']),
  date: z.date(),
  notes: z.string().optional(),
  recurrence: z.object({
    type: z.enum(['diario', 'semanal', 'mensal', 'anual']),
    interval: z.number().min(1).max(365),
    endDate: z.date().optional(),
  }).optional(),
  installment: z.object({
    count: z.number().min(1),
    total: z.number().min(1),
  }).optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  expense?: Expense
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onSubmit: (data: ExpenseFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
]

const recurrenceTypes = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
]

export function ExpenseForm({
  expense,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [attachments, setAttachments] = useState<File[]>([])
  const [showRecurrence, setShowRecurrence] = useState(!!expense?.recurrence)
  const [showInstallment, setShowInstallment] = useState(!!expense?.installment)
  const [amountInput, setAmountInput] = useState('')

  // Debug: verificar categorias no ExpenseForm
  React.useEffect(() => {
    console.log('=== DEBUG EXPENSE FORM ===');
    console.log('Categorias recebidas:', categories);
    console.log('Quantidade de categorias:', categories?.length);
    console.log('Primeira categoria:', categories?.[0]);
    console.log('===========================');
  }, [categories])

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || '',
      amount: expense?.amount || 0,
      categoryId: expense?.categoryId || '',
      paymentMethod: expense?.paymentMethod || 'dinheiro',
      date: expense?.date ? (typeof expense.date === 'string' ? new Date(expense.date) : expense.date) : new Date(),
      notes: expense?.notes || '',
      recurrence: expense?.recurrence,
      installment: expense?.installment,
    },
  })

  useEffect(() => {
    if (expense?.amount) {
      setAmountInput(formatCurrency(expense.amount))
    }
  }, [expense])

  const handleAmountChange = (value: string) => {
    setAmountInput(value)
    const numericValue = parseCurrency(value)
    form.setValue('amount', numericValue)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (data: ExpenseFormValues) => {
    console.log('📝 EXPENSE FORM - handleSubmit chamado');
    console.log('📝 Dados do form:', data);
    
    const formData: ExpenseFormData = {
      ...data,
      attachments: attachments.length > 0 ? attachments : undefined,
      recurrence: showRecurrence ? data.recurrence : undefined,
      installment: showInstallment ? data.installment : undefined,
    }
    
    console.log('📝 FormData final:', formData);
    console.log('📝 Chamando onSubmit...');
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {expense ? 'Editar Despesa' : 'Nova Despesa'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Supermercado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    value={amountInput}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="text-right"
                  />
                </FormControl>
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                )}
              </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories && categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="sem-categoria" disabled>
                            <div className="text-gray-500">Carregando categorias...</div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione observações sobre esta despesa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachments */}
            <div className="space-y-3">
              <Label>Anexos</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar arquivo
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Opções Avançadas</h3>
              
              {/* Recurrence */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 font-medium">
                    <div className="p-1 rounded bg-blue-100 dark:bg-blue-900">
                      <Repeat className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    Despesa recorrente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Criar automaticamente esta despesa em intervalos regulares
                  </p>
                </div>
                <Switch
                  checked={showRecurrence}
                  onCheckedChange={setShowRecurrence}
                />
              </div>

              {showRecurrence && (
                <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recurrence.type"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recurrenceTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recurrence.interval"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Intervalo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              placeholder="1"
                              {...field}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="recurrence.endDate"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Data final (opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Sem data final</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Installments */}
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 font-medium">
                    <div className="p-1 rounded bg-green-100 dark:bg-green-900">
                      <CreditCard className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    Parcelamento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Dividir esta despesa em parcelas
                  </p>
                </div>
                <Switch
                  checked={showInstallment}
                  onCheckedChange={setShowInstallment}
                />
              </div>

              {showInstallment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <FormField
                    control={form.control}
                    name="installment.count"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Parcela atual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installment.total"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Total de parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="999"
                            placeholder="12"
                            {...field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Salvando...' : expense ? 'Atualizar' : 'Criar Despesa'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

