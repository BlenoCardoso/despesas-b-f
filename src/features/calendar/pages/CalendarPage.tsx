import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, Star } from 'lucide-react'
import { useEventsForMonth, useUpcomingEvents, useImportantEvents, useCreateEvent, useDeleteEvent, useUpdateEvent } from '../hooks/useCalendar'
import { CalendarEvent, CalendarEventFormData } from '../types'
import { EventForm } from '../components/EventForm'
import { EventDetailsModal } from '../components/EventDetailsModal'
import { toast } from 'sonner'

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // Queries
  const { data: monthEvents = [] } = useEventsForMonth(currentDate)
  const { data: upcomingEvents = [] } = useUpcomingEvents(7)
  const { data: importantEvents = [] } = useImportantEvents()

  // Mutations
  const createEventMutation = useCreateEvent()
  const deleteEventMutation = useDeleteEvent()
  const updateEventMutation = useUpdateEvent()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleCreateEvent = async (data: CalendarEventFormData) => {
    try {
      await createEventMutation.mutateAsync(data)
      toast.success('Evento criado com sucesso!')
      setShowEventForm(false)
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      toast.error('Erro ao criar evento. Tente novamente.')
    }
  }

  const handleFormSubmit = async (data: CalendarEventFormData) => {
    if (editingEvent) {
      await handleUpdateEvent(data)
    } else {
      await handleCreateEvent(data)
    }
  }

  const handleNewEventClick = () => {
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
      try {
        await deleteEventMutation.mutateAsync(event.id)
        toast.success('Evento excluído com sucesso!')
        setShowEventDetails(false)
        setSelectedEvent(null)
      } catch (error) {
        console.error('Erro ao excluir evento:', error)
        toast.error('Erro ao excluir evento. Tente novamente.')
      }
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setShowEventDetails(false)
    setSelectedEvent(null)
    setShowEventForm(true)
  }

  const handleUpdateEvent = async (data: CalendarEventFormData) => {
    if (!editingEvent) return

    try {
      await updateEventMutation.mutateAsync({
        id: editingEvent.id,
        data
      })
      toast.success('Evento atualizado com sucesso!')
      setShowEventForm(false)
      setEditingEvent(null)
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      toast.error('Erro ao atualizar evento. Tente novamente.')
    }
  }

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return monthEvents.filter(event => {
      const eventStart = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate
      const eventEnd = typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate
      
      // Normalize dates to compare only the date part (ignore time)
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
      const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
      
      // Check if event spans this day
      return eventStartDate <= dateOnly && eventEndDate >= dateOnly
    })
  }

  const renderCalendarDay = (date: Date) => {
    const dayEvents = getEventsForDay(date)
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const isTodayDate = isToday(date)

    return (
      <div
        key={date.toISOString()}
        onClick={() => setSelectedDate(date)}
        className={`
          min-h-[110px] p-3 cursor-pointer transition-all duration-200 relative group
          ${!isCurrentMonth 
            ? 'bg-gray-50/50 text-gray-400 hover:bg-gray-100/50' 
            : 'bg-white hover:bg-blue-50/30'
          }
          ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
          ${isTodayDate ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-200' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`
            text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center transition-all
            ${isTodayDate 
              ? 'bg-blue-600 text-white shadow-sm' 
              : isCurrentMonth 
                ? 'text-gray-900 hover:bg-blue-100 hover:text-blue-600' 
                : 'text-gray-400'
            }
          `}>
            {format(date, 'd')}
          </span>
          {dayEvents.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600">
                {dayEvents.length}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation()
                handleEventClick(event)
              }}
              className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: event.color + '20', color: event.color }}
              title={event.title}
            >
              {event.isAllDay ? (
                <span className="font-medium">{event.title}</span>
              ) : (
                <span>
                  <span className="font-mono text-[10px] opacity-75">
                    {format(
                      typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate,
                      'HH:mm'
                    )}
                  </span>
                  <span className="ml-1 font-medium">{event.title}</span>
                </span>
              )}
              {event.isImportant && (
                <span className="ml-1 text-red-500 text-[8px]">●</span>
              )}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div 
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                // Mostrar todos os eventos do dia em um modal ou expandir
                console.log('Mostrar todos os eventos:', dayEvents)
              }}
            >
              +{dayEvents.length - 3} mais
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    
    return (
      <div className="space-y-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Próximos Eventos</h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.isImportant && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(
                        typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate,
                        "EEEE, dd 'de' MMMM 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-500">📍 {event.location}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum evento próximo</p>
          )}
        </div>

        {/* Important Events */}
        {importantEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Eventos Importantes</h3>
            <div className="space-y-3">
              {importantEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg border border-yellow-100 bg-yellow-50">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="text-sm text-gray-600">
                      {format(
                        typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate,
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
              </div>
              
              {/* Month Navigation */}
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-1">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Mês anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center px-2">
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Próximo mês"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setView('month')}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${view === 'month' 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Mês
                </button>
                <button
                  onClick={() => setView('agenda')}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${view === 'agenda' 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <List className="h-4 w-4 mr-2" />
                  Agenda
                </button>
              </div>
              
              <button 
                onClick={handleNewEventClick}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'month' ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                <div 
                  key={day} 
                  className={`p-4 text-center text-sm font-semibold ${
                    index === 0 || index === 6 
                      ? 'text-blue-600' 
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {monthDays.map(renderCalendarDay)}
            </div>
          </div>
        ) : (
          renderAgendaView()
        )}

        {/* Selected Date Events */}
        {selectedDate && view === 'month' && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Eventos de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              {isToday(selectedDate) && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Hoje
                </span>
              )}
            </div>
            
            {getEventsForDay(selectedDate).length > 0 ? (
              <div className="space-y-4">
                {getEventsForDay(selectedDate).map((event) => (
                  <div 
                    key={event.id} 
                    onClick={() => handleEventClick(event)}
                    className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h4>
                        {event.isImportant && (
                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                        )}
                      </div>
                      {!event.isAllDay && (
                        <div className="text-sm text-gray-600 font-medium mt-1">
                          {format(
                            typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate,
                            'HH:mm'
                          )} - {format(
                            typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate,
                            'HH:mm'
                          )}
                        </div>
                      )}
                      {event.location && (
                        <div className="text-sm text-gray-500 mt-1">📍 {event.location}</div>
                      )}
                      {event.description && (
                        <div className="text-sm text-gray-500 mt-2 line-clamp-1">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum evento neste dia</p>
                <p className="text-gray-400 text-sm mt-1">
                  Clique em "Novo Evento" para adicionar um
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <EventForm
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false)
          setEditingEvent(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEvent ? {
          title: editingEvent.title,
          description: editingEvent.description,
          startDate: typeof editingEvent.startDate === 'string' ? new Date(editingEvent.startDate) : editingEvent.startDate,
          endDate: typeof editingEvent.endDate === 'string' ? new Date(editingEvent.endDate) : editingEvent.endDate,
          isAllDay: editingEvent.isAllDay,
          location: editingEvent.location,
          category: editingEvent.category,
          color: editingEvent.color,
          attendees: editingEvent.attendees,
          reminders: editingEvent.reminders,
          isImportant: editingEvent.isImportant,
        } : undefined}
        selectedDate={selectedDate || undefined}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={showEventDetails}
        onClose={() => {
          setShowEventDetails(false)
          setSelectedEvent(null)
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  )
}

