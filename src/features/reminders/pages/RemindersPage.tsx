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

  const summaryCards = [
    {
      label: 'Alertas disparados',
      value: dueReminders.length,
      description: 'Eventos que precisam de atenção agora',
      icon: BellRing,
      accent: 'from-amber-500/20 via-amber-500/10 to-transparent',
      badgeClass: 'bg-amber-500/15 text-amber-700'
    },
    {
      label: 'Próximos 14 dias',
      value: upcomingEvents.length,
      description: 'Compromissos e reuniões planejadas',
      icon: Calendar,
      accent: 'from-blue-500/20 via-blue-500/10 to-transparent',
      badgeClass: 'bg-blue-500/15 text-blue-700'
    },
    {
      label: 'Tarefas de hoje',
      value: todayTasks.length,
      description: 'Itens que expiram até o final do dia',
      icon: Clock,
      accent: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      badgeClass: 'bg-emerald-500/15 text-emerald-700'
    },
    {
      label: 'Pendências atrasadas',
      value: overdueTasks.length,
      description: 'Priorize esses itens o quanto antes',
      icon: AlertTriangle,
      accent: 'from-rose-500/20 via-rose-500/10 to-transparent',
      badgeClass: 'bg-rose-500/15 text-rose-700'
    }
  ]

  return (
    <div className="space-y-10 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
            <BellRing className="h-3.5 w-3.5" />
            Central de Lembretes
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Não perca nenhum compromisso importante</h1>
            <p className="max-w-3xl text-sm text-amber-50/90">
              Eventos com alertas ativos, tarefas urgentes e pendências críticas reunidos em um único painel otimizado para telas pequenas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
              Tudo sincronizado com Firebase
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/40 bg-white/20 text-white">
              Atualização em tempo real
            </Badge>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-200/40 blur-3xl"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="relative overflow-hidden border border-white/80 bg-white/90 shadow-md dark:border-gray-700/60 dark:bg-gray-900/80">
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}
              />
              <CardHeader className="relative z-10 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-slate-700 shadow-sm dark:bg-gray-900/70 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                      {card.label}
                    </CardTitle>
                    <Badge variant="secondary" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.badgeClass}`}>
                      {card.value}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                    {card.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </section>

      {(remindersLoading || upcomingLoading || todayLoading || overdueLoading) && !hasContent ? (
        <SectionLoading message="Carregando seus lembretes" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <Card className="h-full border border-amber-200/70 bg-white/90 shadow-lg dark:border-amber-900/40 dark:bg-gray-900/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-200">
                <BellRing className="h-5 w-5" />
                Alertas disparados recentemente
              </CardTitle>
              <CardDescription className="text-sm text-amber-700/80 dark:text-amber-200/80">
                Eventos com lembretes acionados nos últimos minutos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <SectionLoading message="Buscando alertas" />
              ) : dueReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-100">
                  Nenhum lembrete acionado por enquanto. Fique tranquilo!
                </div>
              ) : (
                <div className="space-y-4">
                  {dueReminders.map(({ event, reminder }) => (
                    <div
                      key={`${event.id}-${reminder.id}`}
                      className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-amber-900/40 dark:bg-gray-900/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">{formatEventDate(event)}</p>
                        </div>
                        <Badge className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
                          {reminder.type === 'notification' ? 'Notificação' : 'Lembrete'}
                        </Badge>
                      </div>
                      {reminder.message && (
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{reminder.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-blue-200/70 bg-white/90 shadow-lg dark:border-blue-900/40 dark:bg-gray-900/85">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-200">
                  <Calendar className="h-5 w-5" />
                  Próximos compromissos
                </CardTitle>
                <CardDescription className="text-sm text-blue-700/80 dark:text-blue-200/80">
                  Eventos importantes que acontecem em breve
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingLoading ? (
                  <SectionLoading message="Carregando eventos" />
                ) : upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/80 p-6 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-100">
                    Nenhum evento programado para as próximas duas semanas.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {upcomingEvents.slice(0, 6).map((event) => (
                      <li key={event.id} className="flex items-start gap-3 rounded-2xl border border-blue-200/70 bg-white/90 p-4 shadow-sm dark:border-blue-900/40 dark:bg-gray-900/80">
                        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          {format(normalizeDate(event.startDate) || new Date(), 'dd', { locale: ptBR })}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">{formatEventDate(event)}</p>
                          {event.location && (
                            <p className="text-xs text-slate-400 dark:text-slate-400">{event.location}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border border-emerald-200/70 bg-white/90 shadow-lg dark:border-emerald-900/40 dark:bg-gray-900/85">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-200">
                  <Clock className="h-5 w-5" />
                  Tarefas urgentes
                </CardTitle>
                <CardDescription className="text-sm text-emerald-700/80 dark:text-emerald-200/80">
                  O que precisa ser concluído hoje ou já está atrasado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayLoading && overdueLoading ? (
                  <SectionLoading message="Carregando tarefas" />
                ) : todayTasks.length === 0 && overdueTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-100">
                    Nenhuma tarefa urgente. Excelente trabalho!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overdueTasks.map((task) => (
                      <div key={`overdue-${task.id}`} className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 shadow-sm dark:border-rose-900/40 dark:bg-rose-900/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-rose-800 dark:text-rose-100">{task.title}</p>
                            <p className="text-xs text-rose-700 dark:text-rose-200">{formatTaskDueDate(task)}</p>
                          </div>
                          <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-200" />
                        </div>
                        {task.description && (
                          <p className="mt-2 text-xs text-rose-700/80 dark:text-rose-200/80">{task.description}</p>
                        )}
                      </div>
                    ))}
                    {todayTasks.map((task) => (
                      <div key={`today-${task.id}`} className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/30">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">{task.title}</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-200">{formatTaskDueDate(task)}</p>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-200" />
                        </div>
                        {task.description && (
                          <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-200/80">{task.description}</p>
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
