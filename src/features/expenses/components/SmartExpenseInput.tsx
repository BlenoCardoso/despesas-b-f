import React, { useState, useCallback } from 'react'
import { Scan, Check, Loader2 } from 'lucide-react'
import { ATTACHMENTS_ENABLED } from '../../../config/features'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

interface AttachmentFile {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  blob?: Blob
  isImage: boolean
  createdAt: Date
}

interface SmartExpenseInputProps {
  onSubmit: (data: {
    amount: number
    description: string
    category: string
    attachments: AttachmentFile[]
    ocrData?: any
  }) => Promise<void>
  categories: string[]
  isLoading?: boolean
}

export function SmartExpenseInput({ onSubmit, categories, isLoading }: SmartExpenseInputProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  // Feature flag desativa anexos
  const attachments: AttachmentFile[] = []

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description) {
      alert('Preencha valor e descrição')
      return
    }

    await onSubmit({
      amount: parseFloat(amount.replace(',', '.')),
      description,
      category,
      attachments
    })

    // Reset form
    setAmount('')
    setDescription('')
    setCategory('')
    setAttachments([])
  }, [amount, description, category, attachments, onSubmit])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Nova Despesa Inteligente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de Valor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Valor *
            </label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="text-lg"
              required
            />
          </div>

          {/* Input de Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrição *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a despesa..."
              className="min-h-20"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecionar categoria...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Área de Anexos removida via feature flag */}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Salvar Despesa
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}