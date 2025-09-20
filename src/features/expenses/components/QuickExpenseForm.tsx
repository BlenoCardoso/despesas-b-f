import { useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  const handleCategorySelect = async (categoryId: string) => {
    try {
      // Pegar valor em centavos
      const amountInCents = parseInt(form.getValues('amount'))
      if (!amountInCents) return

      // Criar despesa
      await expenseMutation.mutateAsync({
        householdId,
        amount: amountInCents / 100,
        categoryId,
        date: new Date().toISOString(),
        title: categories?.find(c => c.id === categoryId)?.name || 'Nova despesa'
      })

      // Limpar form
      form.reset()
      setStep('amount')

      // Notificar sucesso
      toast.success('Despesa adicionada')

    } catch (error) {
      toast.error('Erro ao adicionar despesa')
    }
  }

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
                render={({ field }) => (
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

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('amount')}
              >
                Voltar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </Form>
  )
}