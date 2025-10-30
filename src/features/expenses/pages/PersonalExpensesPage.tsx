import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useExpenses } from '@/hooks/useExpenses'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionLoading } from '@/components/ui/loading'
import { formatCurrency } from '@/utils/formatters'
import { PiggyBank, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { Progress } from '@/components/ui/accessibility'

function computePersonalShare(
  expenseAmount: number,
  userId: string,
  participants?: string[],
  sharedPercentages?: Record<string, number>
) {
  if (!userId) return 0
  if (sharedPercentages && sharedPercentages[userId] !== undefined) {
    return (expenseAmount * sharedPercentages[userId]) / 100
  }
  if (participants && participants.length > 0 && participants.includes(userId)) {
    return expenseAmount / participants.length
  }
  return expenseAmount
}

export function PersonalExpensesPage() {
  const { expenses, loading } = useExpenses()
  const { user } = useAuth()
  const userId = user?.id || user?.uid || ''

  const personalExpenses = useMemo(() => {
    if (!userId) return []
    return expenses.filter(
      (expense) => expense.participants?.includes?.(userId) || expense.createdBy === userId || expense.paidBy === userId
    )
  }, [expenses, userId])

  const stats = useMemo(() => {
    return personalExpenses.reduce(
      (acc, expense) => {
        const share = computePersonalShare(expense.amount, userId, expense.participants, expense.sharedPercentages)
        acc.total += share
        if (expense.paid) {
          acc.paid += share
        } else {
          acc.pending += share
        }
        return acc
      },
      { total: 0, paid: 0, pending: 0 }
    )
  }, [personalExpenses, userId])

  const recentExpenses = personalExpenses
    .slice()
    .sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0))
    .slice(0, 8)

  const paidProgress = stats.total ? (stats.paid / stats.total) * 100 : 0
  const pendingProgress = stats.total ? (stats.pending / stats.total) * 100 : 0

  const summaryCards = [
    {
      title: 'Total sob minha responsabilidade',
      description: 'Somatório proporcional das suas despesas pessoais.',
      value: formatCurrency(stats.total),
      icon: Wallet,
      accent: 'from-emerald-500/15 via-emerald-500/10 to-transparent',
      iconStyle: 'bg-emerald-500/15 text-emerald-600'
    },
    {
      title: 'Já quitado',
      description: 'Valores pagos ou concluídos recentemente.',
      value: formatCurrency(stats.paid),
      icon: ArrowUpRight,
      accent: 'from-blue-500/15 via-blue-500/10 to-transparent',
      iconStyle: 'bg-blue-500/15 text-blue-600'
    },
    {
      title: 'Ainda pendente',
      description: 'Organize-se para quitar nos próximos dias.',
      value: formatCurrency(stats.pending),
      icon: ArrowDownRight,
      accent: 'from-rose-500/15 via-rose-500/10 to-transparent',
      iconStyle: 'bg-rose-500/15 text-rose-600'
    }
  ]

  return (
    <div className="space-y-10 pb-6">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          <PiggyBank className="h-3.5 w-3.5" />
          Meu resumo financeiro
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Visualize o impacto direto no seu bolso</h1>
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-300">
            Acompanhe quanto você já pagou, o que ainda está pendente e as últimas movimentações relacionadas somente a você.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="relative overflow-hidden border border-slate-200/70 bg-white/80 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/80">
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}
              />
              <CardHeader className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-300">
                      {card.description}
                    </CardDescription>
                  </div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconStyle}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-0">
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="border border-emerald-200/70 bg-emerald-50/60 shadow-inner dark:border-emerald-900/40 dark:bg-emerald-900/30">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">Saúde financeira pessoal</CardTitle>
          <CardDescription className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
            Visualize o equilíbrio entre o que já foi quitado e o que ainda falta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={stats.paid} max={stats.total || 1} label="Percentual já quitado" />
          <Progress value={stats.pending} max={stats.total || 1} label="Percentual pendente" className="[&>div>div]:bg-amber-500" />
          <div className="flex flex-wrap gap-4 text-xs font-medium text-emerald-900/80 dark:text-emerald-100/80">
            <span>Quitado: {paidProgress.toFixed(0)}%</span>
            <span>Pendente: {pendingProgress.toFixed(0)}%</span>
            <span>Total: {formatCurrency(stats.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white/80 shadow-lg dark:border-gray-700/70 dark:bg-gray-900/80">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Movimentações recentes</CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-300">
            As oito últimas despesas que envolvem você diretamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SectionLoading message="Carregando suas despesas pessoais" />
          ) : recentExpenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-100">
              Nenhuma despesa vinculada a você foi encontrada. Aproveite para registrar uma nova!
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:hidden">
                {recentExpenses.map((expense) => {
                  const share = computePersonalShare(expense.amount, userId, expense.participants, expense.sharedPercentages)
                  const expenseDate = expense.date instanceof Date ? expense.date : expense.date ? new Date(expense.date) : null
                  const statusLabel = expense.paid ? 'Pago' : 'Pendente'

                  return (
                    <div key={`mobile-${expense.id}`} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/70">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{expense.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">
                            {expenseDate ? format(expenseDate, "dd/MM/yyyy", { locale: ptBR }) : '—'} · {expense.category || 'Outros'}
                          </p>
                        </div>
                        <Badge variant={expense.paid ? 'secondary' : 'outline'}
                          className={expense.paid ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-900/50' : 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-200 dark:border-amber-500/40 dark:bg-amber-900/40'}
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-300">Sua parte</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(share)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 sm:block dark:border-gray-700/70">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 bg-white dark:bg-gray-900">
                    <thead className="bg-slate-50 dark:bg-gray-900/80">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Despesa
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Sua parte
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {recentExpenses.map((expense) => {
                        const share = computePersonalShare(expense.amount, userId, expense.participants, expense.sharedPercentages)
                        const expenseDate = expense.date instanceof Date ? expense.date : expense.date ? new Date(expense.date) : null
                        const statusLabel = expense.paid ? 'Pago' : 'Pendente'

                        return (
                          <tr key={expense.id} className="hover:bg-slate-50/70 dark:hover:bg-gray-900/60">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{expense.title}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                              {expenseDate ? format(expenseDate, "dd/MM/yyyy", { locale: ptBR }) : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 capitalize">{expense.category || 'Outros'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900 dark:text-white">{formatCurrency(share)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <Badge
                                variant={expense.paid ? 'secondary' : 'outline'}
                                className={expense.paid ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-900/50' : 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-200 dark:border-amber-500/40 dark:bg-amber-900/40'}
                              >
                                {statusLabel}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
