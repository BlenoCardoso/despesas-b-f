import { format, isToday, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, BellRing, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionLoading } from '@/components/ui/loading'
import { useEventsWithRemindersDue, useUpcomingEvents } from '@/features/calendar/hooks/useCalendar'
import { useOverdueTasks, useTasksDueToday } from '@/features/tasks/hooks/useTasks'
import type { CalendarEvent } from '@/features/calendar/types'
import type { Task } from '@/features/tasks/types'

function normalizeDate(date?: Date | string) {
  if (!date) return null
  return typeof date === 'string' ? new Date(date) : date
}

function formatEventDate(event: CalendarEvent) {
  const startDate = normalizeDate(event.startDate)
  if (!startDate) return 'Sem data'
  const isSingleDay = !event.isAllDay && !!event.endDate && normalizeDate(event.endDate)?.getTime() === startDate.getTime()

  if (isToday(startDate)) {
    return `Hoje • ${format(startDate, "HH'h'mm", { locale: ptBR })}`
  }

  const dayLabel = format(startDate, "dd 'de' MMMM", { locale: ptBR })
  const timeLabel = event.isAllDay || isSingleDay
    ? 'Dia inteiro'
    : format(startDate, "HH'h'mm", { locale: ptBR })

  return `${dayLabel} • ${timeLabel}`
}

function formatTaskDueDate(task: Task) {
  if (!task.dueDate) return 'Sem prazo definido'
  const dueDate = normalizeDate(task.dueDate)
  if (!dueDate) return 'Sem prazo definido'

  if (isToday(dueDate)) {
    return `Hoje • ${format(dueDate, "HH'h'mm", { locale: ptBR })}`
  }

  const label = format(dueDate, "dd 'de' MMMM", { locale: ptBR })
  return isPast(dueDate) ? `${label} • atrasada` : label
}

export function RemindersPage() {
  const { data: dueReminders = [], isLoading: remindersLoading } = useEventsWithRemindersDue()
  const { data: upcomingEvents = [], isLoading: upcomingLoading } = useUpcomingEvents(14)
  const { data: todayTasks = [], isLoading: todayLoading } = useTasksDueToday()
  const { data: overdueTasks = [], isLoading: overdueLoading } = useOverdueTasks()

  const hasContent =
    dueReminders.length > 0 ||
    upcomingEvents.length > 0 ||
    todayTasks.length > 0 ||
    overdueTasks.length > 0

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <BellRing className="h-3.5 w-3.5" />
          Central de Lembretes
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Não perca nenhum compromisso importante</h1>
        <p className="max-w-3xl text-gray-600 dark:text-gray-300">
          Consolidamos eventos com alertas ativos, tarefas urgentes e pendências críticas em um painel único para você agir
          rapidamente.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {dueReminders.length}
            </Badge>
            <div>
              <CardTitle className="text-base font-semibold">Alertas disparados</CardTitle>
              <CardDescription className="text-xs">Eventos que precisam de atenção agora</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {upcomingEvents.length}
            </Badge>
            <div>
              <CardTitle className="text-base font-semibold">Próximos 14 dias</CardTitle>
              <CardDescription className="text-xs">Compromissos e reuniões planejadas</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {todayTasks.length}
            </Badge>
            <div>
              <CardTitle className="text-base font-semibold">Tarefas de hoje</CardTitle>
              <CardDescription className="text-xs">Itens que expiram até o final do dia</CardDescription>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {overdueTasks.length}
            </Badge>
            <div>
              <CardTitle className="text-base font-semibold">Pendências atrasadas</CardTitle>
              <CardDescription className="text-xs">Priorize esses itens o quanto antes</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </section>

      {(remindersLoading || upcomingLoading || todayLoading || overdueLoading) && !hasContent ? (
        <SectionLoading message="Carregando seus lembretes" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BellRing className="h-5 w-5 text-amber-600" />
                Alertas disparados recentemente
              </CardTitle>
              <CardDescription>Eventos com lembretes acionados nos últimos minutos</CardDescription>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <SectionLoading message="Buscando alertas" />
              ) : dueReminders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-6 text-sm text-amber-800">
                  Nenhum lembrete acionado por enquanto. Fique tranquilo!
                </div>
              ) : (
                <div className="space-y-4">
                  {dueReminders.map(({ event, reminder }) => (
                    <div
                      key={`${event.id}-${reminder.id}`}
                      className="rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatEventDate(event)}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700">
                          {reminder.type === 'notification' ? 'Notificação' : 'Lembrete'}
                        </Badge>
                      </div>
                      {reminder.message && (
                        <p className="mt-3 text-sm text-gray-600">{reminder.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Próximos compromissos
                </CardTitle>
                <CardDescription>Eventos importantes que acontecem em breve</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingLoading ? (
                  <SectionLoading message="Carregando eventos" />
                ) : upcomingEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-6 text-sm text-blue-700">
                    Nenhum evento programado para as próximas duas semanas.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {upcomingEvents.slice(0, 6).map((event) => (
                      <li key={event.id} className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white/80 p-4">
                        <div className="mt-1 h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {format(normalizeDate(event.startDate) || new Date(), 'dd', { locale: ptBR })}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatEventDate(event)}</p>
                          {event.location && (
                            <p className="text-xs text-gray-400">{event.location}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                  Tarefas urgentes
                </CardTitle>
                <CardDescription>O que precisa ser concluído hoje ou já está atrasado</CardDescription>
              </CardHeader>
              <CardContent>
                {todayLoading && overdueLoading ? (
                  <SectionLoading message="Carregando tarefas" />
                ) : todayTasks.length === 0 && overdueTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-green-200 bg-green-50/60 p-6 text-sm text-green-700">
                    Nenhuma tarefa urgente. Excelente trabalho!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overdueTasks.map((task) => (
                      <div key={`overdue-${task.id}`} className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-red-800">{task.title}</p>
                            <p className="text-xs text-red-700">{formatTaskDueDate(task)}</p>
                          </div>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                        {task.description && (
                          <p className="mt-2 text-xs text-red-700/80">{task.description}</p>
                        )}
                      </div>
                    ))}
                    {todayTasks.map((task) => (
                      <div key={`today-${task.id}`} className="rounded-xl border border-green-100 bg-green-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-green-800">{task.title}</p>
                            <p className="text-xs text-green-700">{formatTaskDueDate(task)}</p>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        {task.description && (
                          <p className="mt-2 text-xs text-green-700/80">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
