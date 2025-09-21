import { useState } from 'react'
import { cn } from '@/lib/utils'
// date-fns not needed in this small component
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { useExpenseMutation } from '../hooks/useExpenseMutation'
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Schema de validação
const formSchema = z.object({
  amount: z.string().min(1, 'Informe o valor'),
  categoryId: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface QuickExpenseFormProps {
  householdId: string
}

export function QuickExpenseForm({ householdId }: QuickExpenseFormProps) {
  // Estado do form
  const [step, setStep] = useState<'amount' | 'category'>('amount')
  // helper state removed (was unused)
  
  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      categoryId: undefined
    }
  })

  // Mutation para criar despesa
  const expenseMutation = useExpenseMutation()

  // Persistência simples de último valor/categoria e templates
  const LAST_KEY = `quick-expense-last:${householdId}`
  const QUEUE_KEY = `quick-expense-queue:${householdId}`

  const loadLast = () => {
    try {
      const raw = localStorage.getItem(LAST_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const saveLast = (data: { amount: string; categoryId?: string } | null) => {
    try {
      if (!data) localStorage.removeItem(LAST_KEY)
      else localStorage.setItem(LAST_KEY, JSON.stringify(data))
    } catch {}
  }

  const enqueueOffline = (payload: any) => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      const arr = raw ? JSON.parse(raw) : []
      arr.push(payload)
      localStorage.setItem(QUEUE_KEY, JSON.stringify(arr))
    } catch {}
  }

  const flushQueue = async () => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      const arr = raw ? JSON.parse(raw) : []
      if (!arr.length) return
      // Try to send each item sequentially
      for (const p of arr) {
        try {
          await expenseMutation.mutateAsync(p)
        } catch {
          // stop on first permanent failure
          return
        }
      }
      localStorage.removeItem(QUEUE_KEY)
      toast.success('Pendências sincronizadas')
    } catch {}
  }

  // Try flush when coming online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      flushQueue()
    })
  }

  // Buscar categorias
  const { data: categories } = useExpenseCategories(householdId)

  // Formatar valor como moeda
  const formatCurrency = (value: string) => {
    // Remover tudo exceto números
    const numbers = value.replace(/\D/g, '')
    
    // Converter para centavos
    const cents = parseInt(numbers) / 100
    
    // Formatar como moeda
    return cents.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Lidar com mudança no valor
  const handleAmountChange = (value: string) => {
    // Limpar valor para apenas números
    const numbers = value.replace(/\D/g, '')
    form.setValue('amount', numbers)

    // Se tem valor válido, ir para seleção de categoria
    if (numbers.length > 0 && parseInt(numbers) > 0) {
      setStep('category')
    }
  }

  // Selecionar categoria e salvar
  const handleCategorySelect = async (categoryId: string, opts?: { addAnother?: boolean }) => {
    try {
      // Pegar valor em centavos
      const amountInCents = parseInt(form.getValues('amount'))
      if (!amountInCents) return

      // Criar despesa
      const payload = {
        householdId,
        amount: amountInCents / 100,
        categoryId,
        date: new Date().toISOString(),
        title: categories?.find(c => c.id === categoryId)?.name || 'Nova despesa'
      }

      if (!navigator.onLine) {
        // queue locally
        enqueueOffline(payload)
        toast('Salvo localmente — será sincronizado quando online')
      } else {
        await expenseMutation.mutateAsync(payload)
      }

      // store last used
      saveLast({ amount: form.getValues('amount'), categoryId })

      // Notificar sucesso
      toast.success('Despesa adicionada')

      if (opts && opts.addAnother) {
        // keep last and prefill
        setIsSavingMultiple(true)
        form.setValue('amount', form.getValues('amount'))
        setStep('amount')
        // small delay to reset UI state
        setTimeout(() => setIsSavingMultiple(false), 200)
      } else {
        // Limpar form
        form.reset()
        setStep('amount')
      }

    } catch (error) {
      toast.error('Erro ao adicionar despesa')
    }
  }

  // Load last used and templates for quick shortcuts
  const last = loadLast()
  const templates = [
    { id: 't-mercado', label: 'Mercado', amount: '15000', categoryKey: categories?.[0]?.id },
    { id: 't-aluguel', label: 'Aluguel', amount: '120000', categoryKey: categories?.[1]?.id }
  ]

  return (
    <Form {...form}>
      <form className="space-y-4">
        <AnimatePresence mode="wait">
          {step === 'amount' ? (
            <motion.div
              key="amount"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }: any) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="R$ 0,00"
                        className="text-2xl text-center h-16"
                        value={field.value ? formatCurrency(field.value) : ''}
                        onChange={e => handleAmountChange(e.target.value)}
                        autoFocus
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              key="category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="text-center text-2xl font-medium mb-6">
                {formatCurrency(form.getValues('amount'))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex gap-2 mb-2">
                  {last && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        form.setValue('amount', last.amount)
                        setStep('category')
                      }}
                    >
                      Último: {formatCurrency(last.amount)}
                    </Button>
                  )}

                  {templates.map(t => (
                    <Button
                      key={t.id}
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        form.setValue('amount', t.amount)
                        // if category known, go straight to finalize
                        if (t.categoryKey) handleCategorySelect(t.categoryKey)
                        else setStep('category')
                      }}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
                {categories?.map(category => (
                  <Button
                    key={category.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-auto py-4 px-3 flex flex-col items-center gap-2',
                      'hover:bg-muted/50 active:scale-95 transition-all'
                    )}
                    style={{
                      '--category-color': category.color
                    } as any}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <span 
                      className="text-2xl"
                      style={{ color: category.color }}
                    >
                      {category.icon}
                    </span>
                    <span className="text-sm font-normal">
                      {category.name}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep('amount')}
                >
                  Voltar
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    // Save current with same category as last used or first category
                    const preCat = categories?.[0]?.id
                    const cat = form.getValues('categoryId') || preCat
                    if (cat) handleCategorySelect(cat, { addAnother: true })
                  }}
                >
                  Salvar e adicionar outra
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  )
}