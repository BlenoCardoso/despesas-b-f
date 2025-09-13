import { useState } from 'react'
import { X, Calendar, Clock, MapPin, Users, Bell, Star, Repeat } from 'lucide-react'
import { CalendarEventFormData, EventReminder } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEventCategories } from '../hooks/useCalendar'

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CalendarEventFormData) => void
  initialData?: Partial<CalendarEventFormData>
  selectedDate?: Date
}

export function EventForm({ isOpen, onClose, onSubmit, initialData, selectedDate }: EventFormProps) {
  const { data: categories = [] } = useEventCategories()
  
  const [formData, setFormData] = useState<CalendarEventFormData>(() => {
    const baseDate = selectedDate || new Date()
    const startDate = new Date(baseDate)
    startDate.setHours(9, 0, 0, 0) // Default to 9:00 AM
    
    const endDate = new Date(baseDate)
    endDate.setHours(10, 0, 0, 0) // Default to 10:00 AM

    return {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startDate: initialData?.startDate || startDate,
      endDate: initialData?.endDate || endDate,
      isAllDay: initialData?.isAllDay || false,
      location: initialData?.location || '',
      category: initialData?.category || 'Pessoal',
      color: initialData?.color || '#3b82f6',
      attendees: initialData?.attendees || [],
      reminders: initialData?.reminders || [],
      isImportant: initialData?.isImportant || false,
    }
  })

  const [newAttendee, setNewAttendee] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Por favor, insira um título para o evento')
      return
    }

    if (formData.endDate < formData.startDate) {
      alert('A data/hora de fim deve ser posterior à data/hora de início')
      return
    }

    onSubmit(formData)
    onClose()
  }

  const handleDateTimeChange = (field: 'startDate' | 'endDate', value: string, isTime: boolean = false) => {
    const currentDate = formData[field]
    let newDate: Date

    if (isTime) {
      // Handle time change
      const [hours, minutes] = value.split(':').map(Number)
      newDate = new Date(currentDate)
      newDate.setHours(hours, minutes)
    } else {
      // Handle date change
      newDate = new Date(value)
      // Preserve the time
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes())
    }

    setFormData(prev => ({
      ...prev,
      [field]: newDate
    }))

    // Adjust end date if it becomes earlier than start date
    if (field === 'startDate' && newDate >= formData.endDate) {
      const adjustedEndDate = new Date(newDate)
      adjustedEndDate.setHours(newDate.getHours() + 1)
      setFormData(prev => ({
        ...prev,
        endDate: adjustedEndDate
      }))
    }
  }

  const toggleAllDay = () => {
    setFormData(prev => {
      const newIsAllDay = !prev.isAllDay
      if (newIsAllDay) {
        // Set to all day - start of day to end of day
        const startOfDay = new Date(prev.startDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(prev.endDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        return {
          ...prev,
          isAllDay: newIsAllDay,
          startDate: startOfDay,
          endDate: endOfDay
        }
      }
      return {
        ...prev,
        isAllDay: newIsAllDay
      }
    })
  }

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees?.includes(newAttendee.trim())) {
      setFormData(prev => ({
        ...prev,
        attendees: [...(prev.attendees || []), newAttendee.trim()]
      }))
      setNewAttendee('')
    }
  }

  const removeAttendee = (attendee: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees?.filter(a => a !== attendee) || []
    }))
  }

  const addReminder = (minutesBefore: number) => {
    const reminder: EventReminder = {
      id: Date.now().toString(),
      type: 'notification',
      minutesBefore
    }
    
    setFormData(prev => ({
      ...prev,
      reminders: [...(prev.reminders || []), reminder]
    }))
  }

  const removeReminder = (reminderId: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders?.filter(r => r.id !== reminderId) || []
    }))
  }

  const selectedCategory = categories.find(cat => cat.name === formData.category)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              placeholder="Ex: Reunião com cliente"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              placeholder="Detalhes do evento..."
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Data e Horário
              </label>
              <button
                type="button"
                onClick={toggleAllDay}
                className={`
                  flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors
                  ${formData.isAllDay 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <Calendar className="h-4 w-4" />
                <span>Dia inteiro</span>
              </button>
            </div>

            {/* Start Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={format(formData.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleDateTimeChange('startDate', e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    style={{
                      colorScheme: 'light',
                      color: '#111827 !important',
                      backgroundColor: '#ffffff !important',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                  {!formData.isAllDay && (
                    <input
                      type="time"
                      value={format(formData.startDate, 'HH:mm')}
                      onChange={(e) => handleDateTimeChange('startDate', e.target.value, true)}
                      className="px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                      style={{
                        colorScheme: 'light',
                        color: '#111827 !important',
                        backgroundColor: '#ffffff !important',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fim
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={format(formData.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleDateTimeChange('endDate', e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    style={{
                      colorScheme: 'light',
                      color: '#111827 !important',
                      backgroundColor: '#ffffff !important',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  />
                  {!formData.isAllDay && (
                    <input
                      type="time"
                      value={format(formData.endDate, 'HH:mm')}
                      onChange={(e) => handleDateTimeChange('endDate', e.target.value, true)}
                      className="px-3 py-2 border-2 border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                      style={{
                        colorScheme: 'light',
                        color: '#111827 !important',
                        backgroundColor: '#ffffff !important',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category and Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const category = categories.find(cat => cat.name === e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    color: category?.color || prev.color
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="space-y-3">
                {/* Color Preview and Hex Display */}
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: formData.color }}
                    title={`Cor atual: ${formData.color}`}
                  />
                  <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {formData.color?.toUpperCase() || '#3B82F6'}
                  </span>
                </div>

                {/* Quick Color Presets */}
                <div className="grid grid-cols-8 gap-2">
                  {[
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
                    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
                    '#f97316', '#6b7280', '#dc2626', '#059669',
                    '#7c3aed', '#db2777', '#0891b2', '#65a30d'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`
                        w-6 h-6 rounded-full border-2 transition-all hover:scale-110
                        ${formData.color === color ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-300'}
                      `}
                      style={{ backgroundColor: color }}
                      title={color.toUpperCase()}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded-md cursor-pointer border border-gray-300 bg-white"
                    title="Selecionar cor personalizada"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                    Personalizada
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Local
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
              placeholder="Ex: Sala de reuniões, Casa, etc."
            />
          </div>

          {/* Important toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <Star className={`h-5 w-5 ${formData.isImportant ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">Marcar como importante</span>
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isImportant: !prev.isImportant }))}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${formData.isImportant ? 'bg-yellow-500' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${formData.isImportant ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas'}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Participantes
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Nome do participante"
                  />
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>
                {formData.attendees && formData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.attendees.map((attendee) => (
                      <span
                        key={attendee}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {attendee}
                        <button
                          type="button"
                          onClick={() => removeAttendee(attendee)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminders */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bell className="inline h-4 w-4 mr-1" />
                  Lembretes
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[5, 15, 30, 60, 1440].map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => addReminder(minutes)}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {minutes < 60 ? `${minutes} min` : minutes === 60 ? '1 hora' : '1 dia'} antes
                    </button>
                  ))}
                </div>
                {formData.reminders && formData.reminders.length > 0 && (
                  <div className="space-y-1">
                    {formData.reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm">
                          {reminder.minutesBefore < 60 
                            ? `${reminder.minutesBefore} minutos antes`
                            : reminder.minutesBefore === 60 
                            ? '1 hora antes'
                            : `${Math.floor(reminder.minutesBefore / 60)} horas antes`
                          }
                        </span>
                        <button
                          type="button"
                          onClick={() => removeReminder(reminder.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {initialData ? 'Atualizar' : 'Criar'} Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}