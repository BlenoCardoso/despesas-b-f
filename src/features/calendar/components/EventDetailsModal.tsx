import React from 'react'
import { X, Calendar, Clock, MapPin, Tag, Trash2, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarEvent } from '../types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface EventDetailsModalProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (event: CalendarEvent) => void
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: EventDetailsModalProps) {
  if (!event) return null

  const startDate = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate
  const endDate = typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate

  const formatEventTime = () => {
    if (event.isAllDay) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - Dia inteiro`
      }
      return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })} (Dia inteiro)`
    }

    if (startDate.toDateString() === endDate.toDateString()) {
      return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} das ${format(startDate, 'HH:mm', { locale: ptBR })} às ${format(endDate, 'HH:mm', { locale: ptBR })}`
    }

    return `${format(startDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />
            {event.title}
            {event.isImportant && (
              <Badge variant="destructive" className="text-xs">
                Importante
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data e Hora */}
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Data e Hora</p>
              <p className="text-sm text-muted-foreground">
                {formatEventTime()}
              </p>
            </div>
          </div>

          {/* Categoria */}
          <div className="flex items-start gap-3">
            <Tag className="w-4 h-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Categoria</p>
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            </div>
          </div>

          {/* Localização */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Descrição */}
          {event.description && (
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-1" /> {/* Spacer */}
              <div>
                <p className="text-sm font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Lembretes */}
          {event.reminders && event.reminders.length > 0 && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Lembretes</p>
                <div className="space-y-1">
                  {event.reminders.map((reminder, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {reminder.minutesBefore} min antes
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Participantes */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-1" /> {/* Spacer */}
              <div>
                <p className="text-sm font-medium">Participantes</p>
                <div className="flex flex-wrap gap-1">
                  {event.attendees.map((attendee, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {attendee}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(event)}
              className="flex-1"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(event)}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}