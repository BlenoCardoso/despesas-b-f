import { useState } from 'react'
import { Download, FileText, Database, Calendar, Pills, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf'
  dateRange: 'all' | 'lastMonth' | 'lastYear' | 'custom'
  includeCategories: string[]
}

const categories = [
  { id: 'expenses', label: 'Despesas', icon: Receipt, color: 'bg-red-100 text-red-700' },
  { id: 'medications', label: 'Medicamentos', icon: Pills, color: 'bg-blue-100 text-blue-700' },
  { id: 'calendar', label: 'Eventos', icon: Calendar, color: 'bg-green-100 text-green-700' },
  { id: 'tasks', label: 'Tarefas', icon: FileText, color: 'bg-purple-100 text-purple-700' }
]

export function DataExporter() {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: 'all',
    includeCategories: categories.map(c => c.id)
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleCategoryToggle = (categoryId: string) => {
    setOptions(prev => ({
      ...prev,
      includeCategories: prev.includeCategories.includes(categoryId)
        ? prev.includeCategories.filter(id => id !== categoryId)
        : [...prev.includeCategories, categoryId]
    }))
  }

  const handleExport = async () => {
    if (options.includeCategories.length === 0) {
      toast.error('Selecione pelo menos uma categoria para exportar')
      return
    }

    setIsExporting(true)
    
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const filename = `despesas-backup-${new Date().toISOString().split('T')[0]}.${options.format}`
      
      // Criar dados fictícios para exportação
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: options.format,
          dateRange: options.dateRange,
          categories: options.includeCategories
        },
        data: {
          expenses: options.includeCategories.includes('expenses') ? [] : undefined,
          medications: options.includeCategories.includes('medications') ? [] : undefined,
          calendar: options.includeCategories.includes('calendar') ? [] : undefined,
          tasks: options.includeCategories.includes('tasks') ? [] : undefined
        }
      }

      // Criar e baixar arquivo
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Dados exportados com sucesso! Arquivo: ${filename}`)
    } catch (error) {
      toast.error('Erro ao exportar dados. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const getEstimatedSize = () => {
    const baseSize = options.includeCategories.length * 10 // KB base por categoria
    const formatMultiplier = options.format === 'pdf' ? 3 : options.format === 'csv' ? 0.5 : 1
    return Math.round(baseSize * formatMultiplier)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Download className="w-6 h-6 text-blue-500" />
        <div>
          <h3 className="text-lg font-semibold">Exportar Dados</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Baixe seus dados para backup ou migração
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Formato */}
        <div>
          <label className="text-sm font-medium mb-3 block">Formato</label>
          <RadioGroup
            value={options.format}
            onValueChange={(value) => setOptions(prev => ({ ...prev, format: value as any }))}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <label htmlFor="json" className="text-sm">JSON</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <label htmlFor="csv" className="text-sm">CSV</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <label htmlFor="pdf" className="text-sm">PDF</label>
            </div>
          </RadioGroup>
        </div>

        {/* Período */}
        <div>
          <label className="text-sm font-medium mb-3 block">Período</label>
          <RadioGroup
            value={options.dateRange}
            onValueChange={(value) => setOptions(prev => ({ ...prev, dateRange: value as any }))}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <label htmlFor="all" className="text-sm">Todos os dados</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lastMonth" id="lastMonth" />
              <label htmlFor="lastMonth" className="text-sm">Último mês</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lastYear" id="lastYear" />
              <label htmlFor="lastYear" className="text-sm">Último ano</label>
            </div>
          </RadioGroup>
        </div>

        {/* Categorias */}
        <div>
          <label className="text-sm font-medium mb-3 block">Categorias</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = options.includeCategories.includes(category.id)
              
              return (
                <div
                  key={category.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className={`p-2 rounded-full ${category.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Informações */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tamanho estimado:</span>
            <Badge variant="secondary">{getEstimatedSize()} KB</Badge>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">Categorias selecionadas:</span>
            <Badge variant="outline">{options.includeCategories.length}</Badge>
          </div>
        </div>

        {/* Botão de exportação */}
        <Button
          onClick={handleExport}
          disabled={isExporting || options.includeCategories.length === 0}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Database className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}