import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import { 
  CalendarIcon, 
  X, 
  Filter,
  RefreshCw,
  DollarSign,
  CreditCard,
  Tag
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExpenseFilter } from '../types'
import { PaymentMethod } from '@/types/global'
import { formatCurrency } from '@/core/utils/formatters'

interface ExpenseFiltersFormProps {
  filters: ExpenseFilter
  categories: Array<{ id: string; name: string; icon: string; color: string }>
  onFiltersChange: (filters: ExpenseFilter) => void
  onReset: () => void
  activeFilterCount: number
}

export function ExpenseFiltersForm({
  filters,
  categories,
  onFiltersChange,
  onReset,
  activeFilterCount
}: ExpenseFiltersFormProps) {
  const [tempFilters, setTempFilters] = useState<ExpenseFilter>(filters)

  const paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
    { value: 'pix', label: 'PIX', icon: '📱' },
    { value: 'transferencia', label: 'Transferência', icon: '🏦' },
    { value: 'boleto', label: 'Boleto', icon: '📄' }
  ]

  const handleCategoryToggle = (categoryId: string) => {
    const currentIds = tempFilters.categoryIds || []
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter(id => id !== categoryId)
      : [...currentIds, categoryId]
    
    setTempFilters(prev => ({
      ...prev,
      categoryIds: newIds.length > 0 ? newIds : undefined
    }))
  }

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    const currentMethods = tempFilters.paymentMethods || []
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method]
    
    setTempFilters(prev => ({
      ...prev,
      paymentMethods: newMethods.length > 0 ? newMethods : undefined
    }))
  }

  const handleAmountChange = (field: 'minAmount' | 'maxAmount', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setTempFilters(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: date
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters)
  }

  const handleResetFilters = () => {
    const emptyFilters: ExpenseFilter = {}
    setTempFilters(emptyFilters)
    onReset()
  }

  const getSelectedCategoriesCount = () => tempFilters.categoryIds?.length || 0
  const getSelectedPaymentMethodsCount = () => tempFilters.paymentMethods?.length || 0

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header com contadores */}
      <div className="shrink-0 flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleResetFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Período */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <Label className="font-medium text-base">Período</Label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Data inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {tempFilters.startDate ? (
                        <span className="text-foreground">
                          {format(tempFilters.startDate, "dd/MM/yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilters.startDate}
                      onSelect={(date: Date | undefined) => handleDateChange('startDate', date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Data final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {tempFilters.endDate ? (
                        <span className="text-foreground">
                          {format(tempFilters.endDate, "dd/MM/yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilters.endDate}
                      onSelect={(date: Date | undefined) => handleDateChange('endDate', date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(tempFilters.startDate || tempFilters.endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleDateChange('startDate', undefined)
                  handleDateChange('endDate', undefined)
                }}
                className="text-xs text-muted-foreground h-7 px-2 hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar período
              </Button>
            )}
          </div>

          <Separator className="my-6" />

          {/* Valores */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950">
                <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <Label className="font-medium text-base">Faixa de valores</Label>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Valor mínimo</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={tempFilters.minAmount || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange('minAmount', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Valor máximo</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={tempFilters.maxAmount || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange('maxAmount', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {(tempFilters.minAmount || tempFilters.maxAmount) && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-sm font-medium text-foreground">
                  Faixa selecionada
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(tempFilters.minAmount || 0)} até {formatCurrency(tempFilters.maxAmount || 999999)}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Categorias */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                  <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <Label className="font-medium text-base">Categorias</Label>
              </div>
              {getSelectedCategoriesCount() > 0 && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  {getSelectedCategoriesCount()}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto overscroll-contain">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50
                    ${tempFilters.categoryIds?.includes(category.id) 
                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' 
                      : 'bg-background border-border hover:border-border/60'
                    }
                  `}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    id={category.id}
                    checked={tempFilters.categoryIds?.includes(category.id) || false}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Formas de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-950">
                  <CreditCard className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <Label className="font-medium text-base">Formas de Pagamento</Label>
              </div>
              {getSelectedPaymentMethodsCount() > 0 && (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {getSelectedPaymentMethodsCount()}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <div 
                  key={method.value}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50
                    ${tempFilters.paymentMethods?.includes(method.value) 
                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' 
                      : 'bg-background border-border hover:border-border/60'
                    }
                  `}
                  onClick={() => handlePaymentMethodToggle(method.value)}
                >
                  <Checkbox
                    id={method.value}
                    checked={tempFilters.paymentMethods?.includes(method.value) || false}
                    onCheckedChange={() => handlePaymentMethodToggle(method.value)}
                    className="pointer-events-none"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">{method.icon}</span>
                    <span className="font-medium text-sm">{method.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Opções adicionais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-950">
                <Filter className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              <Label className="font-medium text-base">Opções Especiais</Label>
            </div>
            
            <div className="space-y-3">
              <div 
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50
                  ${tempFilters.hasRecurrence 
                    ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' 
                    : 'bg-background border-border hover:border-border/60'
                  }
                `}
                onClick={() => setTempFilters(prev => ({
                  ...prev,
                  hasRecurrence: !prev.hasRecurrence ? true : undefined
                }))}
              >
                <Checkbox
                  id="hasRecurrence"
                  checked={tempFilters.hasRecurrence || false}
                  onCheckedChange={(checked: boolean) => 
                    setTempFilters(prev => ({
                      ...prev,
                      hasRecurrence: checked ? true : undefined
                    }))
                  }
                  className="pointer-events-none"
                />
                <div className="flex flex-col">
                  <Label htmlFor="hasRecurrence" className="font-medium text-sm cursor-pointer">
                    Despesas recorrentes
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Apenas despesas que se repetem
                  </span>
                </div>
              </div>

              <div 
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50
                  ${tempFilters.hasInstallments 
                    ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' 
                    : 'bg-background border-border hover:border-border/60'
                  }
                `}
                onClick={() => setTempFilters(prev => ({
                  ...prev,
                  hasInstallments: !prev.hasInstallments ? true : undefined
                }))}
              >
                <Checkbox
                  id="hasInstallments"
                  checked={tempFilters.hasInstallments || false}
                  onCheckedChange={(checked: boolean) => 
                    setTempFilters(prev => ({
                      ...prev,
                      hasInstallments: checked ? true : undefined
                    }))
                  }
                  className="pointer-events-none"
                />
                <div className="flex flex-col">
                  <Label htmlFor="hasInstallments" className="font-medium text-sm cursor-pointer">
                    Despesas parceladas
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Apenas despesas divididas em parcelas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="shrink-0 bg-background border-t p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleApplyFilters}
            className="flex-1 h-11 text-base font-medium"
            size="lg"
          >
            <Filter className="w-4 h-4 mr-2" />
            Aplicar Filtros
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-background/20 text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            className="sm:flex-none px-4 h-11"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      </div>
    </div>
  )
}