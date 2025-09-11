import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, Star } from 'lucide-react'
import { useEventsForMonth, useUpcomingEvents, useImportantEvents } from '../hooks/useCalendar'
import { CalendarEvent } from '../types'

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Queries
  const { data: monthEvents = [], isLoading: eventsLoading } = useEventsForMonth(currentDate)
  const { data: upcomingEvents = [] } = useUpcomingEvents(7)
  const { data: importantEvents = [] } = useImportantEvents()

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

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return monthEvents.filter(event => {
      const eventStart = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate
      const eventEnd = typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate
      
      // Check if event spans this day
      return eventStart <= date && eventEnd >= date
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
          min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
          ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`
            text-sm font-medium
            ${isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
          `}>
            {format(date, 'd')}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-xs text-gray-500">
              {dayEvents.length}
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className="text-xs p-1 rounded truncate"
              style={{ backgroundColor: event.color + '20', color: event.color }}
              title={event.title}
            >
              {event.isAllDay ? (
                <span>{event.title}</span>
              ) : (
                <span>
                  {format(
                    typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate,
                    'HH:mm'
                  )} {event.title}
                </span>
              )}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500">
              +{dayEvents.length - 3} mais
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
              
              {/* Month Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h2 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`
                    flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Mês
                </button>
                <button
                  onClick={() => setView('agenda')}
                  className={`
                    flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors
                    ${view === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <List className="h-4 w-4 mr-1" />
                  Agenda
                </button>
              </div>
              
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'month' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {monthDays.map(renderCalendarDay)}
            </div>
          </div>
        ) : (
          renderAgendaView()
        )}

        {/* Selected Date Events */}
        {selectedDate && view === 'month' && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Eventos de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            
            {getEventsForDay(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDay(selectedDate).map((event) => (
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
                      {!event.isAllDay && (
                        <div className="text-sm text-gray-600">
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
                        <div className="text-sm text-gray-500">📍 {event.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum evento neste dia</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

