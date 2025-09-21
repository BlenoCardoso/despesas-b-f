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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarIcon,
  Plus,
  Repeat,
  CreditCard
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ExpenseFormData, Expense } from '../types'
import { accountService } from '@/features/accounts/services/accountService'
import { PaymentMethod } from '@/types/global'
import { formatCurrency, parseCurrency } from '@/core/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useHouseholdMembers } from '@/features/households/hooks/useHouseholdMembers'

const expenseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  paymentMethod: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'boleto']),
  date: z.date(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  accountId: z.string().optional(),
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
  categories = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  // Removido attachments via feature flag
  const [showRecurrence, setShowRecurrence] = useState(!!expense?.recurrence)
  const [showInstallment, setShowInstallment] = useState(!!expense?.installment)
  const [amountInput, setAmountInput] = useState('')
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let mounted = true
    async function loadAccounts() {
      try {
        const list = await accountService.listAccounts(expense?.householdId || '')
        if (!mounted) return
        setAccounts(list.map(a => ({ id: a.id, name: a.name })))
      } catch (e) {
        // ignore
      }
    }

    loadAccounts()
    return () => { mounted = false }
  }, [expense?.householdId])
  const { members } = useHouseholdMembers(expense?.householdId || '')
  // expense.split may be undefined or have a different shape across the app; normalize locally
  const split = (expense && (expense as any).split) || undefined
  const [splitMode, setSplitMode] = useState<'equal' | 'percentage' | 'exact'>(split?.mode || 'equal')
  const [splitVisibility, setSplitVisibility] = useState<'personal' | 'shared'>(split?.visibility || 'shared')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>((split && split.participants ? split.participants.map((p: any) => p.memberId) : []) as string[])
  const [participantValues, setParticipantValues] = useState<Record<string, { percentage?: number; amount?: number }>>(() => {
    const initial: Record<string, { percentage?: number; amount?: number }> = {}
    if (split && Array.isArray(split.participants)) {
      split.participants.forEach((p: any) => {
        initial[p.memberId] = { percentage: p.percentage, amount: p.amount }
      })
    }
    return initial
  })

  // Debug: verificar categorias no ExpenseForm
  React.useEffect(() => {
    console.log('=== DEBUG EXPENSE FORM ===');
    console.log('Categorias recebidas:', categories);
    console.log('Quantidade de categorias:', categories?.length);
    console.log('Primeira categoria:', categories?.[0]);
    console.log('===========================');
  }, [categories])

  // Use a relaxed any type for the form to bridge UI/schema differences without broad refactors
  const form = useForm<any>({
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
      // tags are stored as array; show as comma-separated in UI
      tags: expense?.tags ? expense.tags.join(', ') : '' as any,
      accountId: (expense as any)?.accountId || ''
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

  const handleSubmit = (data: ExpenseFormValues) => {
    console.log('📝 EXPENSE FORM - handleSubmit chamado');
    console.log('📝 Dados do form:', data);
    
    const formData: ExpenseFormData = {
      ...data,
      tags: (data as any).tags ? (String((data as any).tags).split(',').map(s => s.trim()).filter(Boolean)) : undefined,
      recurrence: showRecurrence ? data.recurrence : undefined,
      installment: showInstallment ? data.installment : undefined,
      split: {
        mode: splitMode,
        visibility: splitVisibility,
        participants: selectedParticipants.map(id => ({
          memberId: id,
          percentage: splitMode === 'percentage' ? (participantValues[id]?.percentage ?? 0) : undefined,
          amount: splitMode === 'exact' ? (participantValues[id]?.amount ?? 0) : undefined,
        }))
      }
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

              {/* Account / Wallet selection */}
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta / Carteira</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.length > 0 ? (
                          accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-account" disabled>Sem contas</SelectItem>
                        )}
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

            {/* Split options */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Divisão</h4>
              <div className="flex items-center gap-4">
                <RadioGroup value={splitMode} onValueChange={(v: any) => setSplitMode(v)}>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="equal" />
                      <span>Igual</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="percentage" />
                      <span>Por porcentagem</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="exact" />
                      <span>Valores exatos</span>
                    </label>
                  </div>
                </RadioGroup>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm">Visibilidade</span>
                  <Select onValueChange={(v) => setSplitVisibility(v as any)} defaultValue={splitVisibility}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">Só eu</SelectItem>
                      <SelectItem value="shared">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Participants list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(members || []).map(member => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedParticipants.includes(member.id)}
                      onCheckedChange={(v: any) => {
                        const checked = !!v
                        setSelectedParticipants(prev => checked ? [...prev, member.id] : prev.filter(id => id !== member.id))
                      }}
                    />
                    <span className="text-sm">{member.user?.name || member.user?.displayName || member.user?.email || member.id}</span>

                    {(splitMode === 'percentage' || splitMode === 'exact') && selectedParticipants.includes(member.id) && (
                      <div className="ml-auto">
                        {splitMode === 'percentage' ? (
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="%"
                            value={participantValues[member.id]?.percentage ?? ''}
                            onChange={(e) => setParticipantValues(prev => ({
                              ...prev,
                              [member.id]: { ...(prev[member.id] || {}), percentage: Number(e.target.value) }
                            }))}
                            className="w-24 text-right"
                          />
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            placeholder="R$"
                            value={participantValues[member.id]?.amount ?? ''}
                            onChange={(e) => setParticipantValues(prev => ({
                              ...prev,
                              [member.id]: { ...(prev[member.id] || {}), amount: Number(e.target.value) }
                            }))}
                            className="w-32 text-right"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments section removed via feature flag */}

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
                className="flex-1 btn-touch-safe"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 button-primary-touch"
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

