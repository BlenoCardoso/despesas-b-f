import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
    <div className="space-y-6 py-4">
      {/* Header com contador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">Filtros Avançados</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleResetFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      </div>

      <ScrollArea className="h-[60vh]">
        <div className="space-y-6 pr-4">
          {/* Período */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <Label className="font-medium">Período</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilters.startDate ? (
                        format(tempFilters.startDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-gray-500">Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tempFilters.startDate}
                      onSelect={(date) => handleDateChange('startDate', date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilters.endDate ? (
                        format(tempFilters.endDate, "dd/MM/yyyy")
                      ) : (
                        <span className="text-gray-500">Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={tempFilters.endDate}
                      onSelect={(date) => handleDateChange('endDate', date)}
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
                className="text-xs text-gray-500 h-6 px-2"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar datas
              </Button>
            )}
          </div>

          <Separator />

          {/* Valores */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <Label className="font-medium">Valores</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Valor mínimo</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={tempFilters.minAmount || ''}
                  onChange={(e) => handleAmountChange('minAmount', e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Valor máximo</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={tempFilters.maxAmount || ''}
                  onChange={(e) => handleAmountChange('maxAmount', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {(tempFilters.minAmount || tempFilters.maxAmount) && (
              <div className="text-xs text-gray-600 mt-1">
                Faixa: {formatCurrency(tempFilters.minAmount || 0)} até {formatCurrency(tempFilters.maxAmount || 999999)}
              </div>
            )}
          </div>

          <Separator />

          {/* Categorias */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <Label className="font-medium">Categorias</Label>
              </div>
              {getSelectedCategoriesCount() > 0 && (
                <Badge variant="outline" className="text-xs">
                  {getSelectedCategoriesCount()} selecionada{getSelectedCategoriesCount() > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={tempFilters.categoryIds?.includes(category.id) || false}
                    onCheckedChange={() => handleCategoryToggle(category.id)}
                  />
                  <Label
                    htmlFor={category.id}
                    className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.name}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Formas de Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <Label className="font-medium">Formas de Pagamento</Label>
              </div>
              {getSelectedPaymentMethodsCount() > 0 && (
                <Badge variant="outline" className="text-xs">
                  {getSelectedPaymentMethodsCount()} selecionada{getSelectedPaymentMethodsCount() > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div key={method.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.value}
                    checked={tempFilters.paymentMethods?.includes(method.value) || false}
                    onCheckedChange={() => handlePaymentMethodToggle(method.value)}
                  />
                  <Label
                    htmlFor={method.value}
                    className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                  >
                    <span>{method.icon}</span>
                    <span>{method.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Opções adicionais */}
          <div className="space-y-3">
            <Label className="font-medium">Opções Adicionais</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasRecurrence"
                  checked={tempFilters.hasRecurrence || false}
                  onCheckedChange={(checked) => 
                    setTempFilters(prev => ({
                      ...prev,
                      hasRecurrence: checked ? true : undefined
                    }))
                  }
                />
                <Label htmlFor="hasRecurrence" className="text-sm cursor-pointer">
                  Apenas despesas recorrentes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasInstallments"
                  checked={tempFilters.hasInstallments || false}
                  onCheckedChange={(checked) => 
                    setTempFilters(prev => ({
                      ...prev,
                      hasInstallments: checked ? true : undefined
                    }))
                  }
                />
                <Label htmlFor="hasInstallments" className="text-sm cursor-pointer">
                  Apenas despesas parceladas
                </Label>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Botões de ação */}
      <div className="flex gap-2 pt-4 border-t">
        <Button 
          onClick={handleApplyFilters}
          className="flex-1"
        >
          Aplicar Filtros
        </Button>
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
          className="flex-none px-3"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}