import React, { useState } from 'react'
import { X, Plus, Pill, Clock, Package, AlertTriangle } from 'lucide-react'
import { useCreateMedication, useMedicationForms, useMedicationUnits } from '../hooks/useMedications'
import { MedicationFormData } from '../types'

interface MedicationFormProps {
  isOpen: boolean
  onClose: () => void
}

export function MedicationForm({ isOpen, onClose }: MedicationFormProps) {
  const [formData, setFormData] = useState<{
    name: string
    dosage: string
    unit: string
    form: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
    times: string[]
    startDate: string
    endDate: string
    stockQuantity: string
    lowStockThreshold: string
    prescribedBy: string
    description: string
    isActive: boolean
  }>({
    name: '',
    dosage: '',
    unit: 'mg',
    form: 'comprimido',
    frequency: 'daily',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    stockQuantity: '',
    lowStockThreshold: '5',
    prescribedBy: '',
    description: '',
    isActive: true,
  })

  const [timeInput, setTimeInput] = useState('')

  const createMedication = useCreateMedication()
  const { data: forms = [] } = useMedicationForms()
  const { data: units = [] } = useMedicationUnits()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome do medicamento')
      return
    }

    if (!formData.dosage || isNaN(Number(formData.dosage))) {
      alert('Por favor, informe uma dosagem válida')
      return
    }

    try {
      const medicationData: any = {
        name: formData.name.trim(),
        dosage: Number(formData.dosage),
        unit: formData.unit,
        form: formData.form,
        frequency: formData.frequency,
        times: formData.times,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        stockQuantity: formData.stockQuantity ? Number(formData.stockQuantity) : 0,
        lowStockThreshold: Number(formData.lowStockThreshold),
        prescribedBy: formData.prescribedBy.trim() || undefined,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      }

      await createMedication.mutateAsync(medicationData)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Erro ao criar medicamento:', error)
      alert('Erro ao criar medicamento')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      unit: 'mg',
      form: 'comprimido',
      frequency: 'daily',
      times: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      stockQuantity: '',
      lowStockThreshold: '5',
      prescribedBy: '',
      description: '',
      isActive: true,
    })
    setTimeInput('')
  }

  const addTime = () => {
    if (timeInput && !formData.times.includes(timeInput)) {
      setFormData(prev => ({
        ...prev,
        times: [...prev.times, timeInput].sort()
      }))
      setTimeInput('')
    }
  }

  const removeTime = (timeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter(time => time !== timeToRemove)
    }))
  }

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'as_needed', label: 'Conforme necessário' },
  ]

  const formOptions = [
    'comprimido', 'cápsula', 'xarope', 'spray', 'injeção', 'pomada', 'gotas', 'outro'
  ]

  const unitOptions = [
    'mg', 'ml', 'comprimidos', 'gotas', 'aplicações', 'doses', 'outro'
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Novo Medicamento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Medicamento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Ex: Paracetamol"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma Farmacêutica
              </label>
              <select
                value={formData.form}
                onChange={(e) => setFormData(prev => ({ ...prev, form: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {formOptions.map(form => (
                  <option key={form} value={form}>
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dosage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosagem *
              </label>
              <input
                type="number"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="500"
                required
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          {formData.frequency !== 'as_needed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horários
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.times.map((time, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                    <button
                      type="button"
                      onClick={() => removeTime(time)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={addTime}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim (opcional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade em Estoque
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="30"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alerta de Estoque Baixo
              </label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="5"
                min="0"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prescrito por
            </label>
            <input
              type="text"
              value={formData.prescribedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, prescribedBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Dr. João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instruções/Observações
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="Tomar com alimentos, evitar álcool..."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="flex items-center text-sm font-medium text-gray-700">
              <Pill className="h-4 w-4 mr-1 text-blue-500" />
              Medicamento ativo
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMedication.isPending || !formData.name.trim() || !formData.dosage}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMedication.isPending ? 'Salvando...' : 'Salvar Medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}