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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <PiggyBank className="h-3.5 w-3.5" />
          Meu resumo financeiro
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visualize o impacto direto no seu bolso</h1>
        <p className="max-w-3xl text-gray-600 dark:text-gray-300">
          Acompanhe quanto você já pagou, o que ainda está pendente e as últimas movimentações relacionadas somente a você.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Total sob minha responsabilidade</CardTitle>
              <CardDescription className="text-xs">Somatório proporcional das suas despesas</CardDescription>
            </div>
            <Wallet className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
            <p className="text-xs text-gray-500">Considera apenas o que afeta diretamente você</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Já quitado</CardTitle>
              <CardDescription className="text-xs">Valores pagos ou concluídos</CardDescription>
            </div>
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.paid)}</p>
            <p className="text-xs text-blue-600/80">Excelente! Isso já saiu da sua lista.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Ainda pendente</CardTitle>
              <CardDescription className="text-xs">Organize-se para quitar nos próximos dias</CardDescription>
            </div>
            <ArrowDownRight className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.pending)}</p>
            <p className="text-xs text-red-500/80">Considere criar lembretes ou dividir com alguém.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Movimentações recentes</CardTitle>
          <CardDescription>As oito últimas despesas que envolvem você diretamente</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SectionLoading message="Carregando suas despesas pessoais" />
          ) : recentExpenses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-emerald-700">
              Nenhuma despesa vinculada a você foi encontrada. Aproveite para registrar uma nova!
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Despesa</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Categoria</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Sua parte</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentExpenses.map((expense) => {
                    const share = computePersonalShare(expense.amount, userId, expense.participants, expense.sharedPercentages)
                    const expenseDate = expense.date instanceof Date ? expense.date : expense.date ? new Date(expense.date) : null
                    const statusLabel = expense.paid ? 'Pago' : 'Pendente'

                    return (
                      <tr key={expense.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {expenseDate ? format(expenseDate, "dd/MM/yyyy", { locale: ptBR }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{expense.category || 'Outros'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">{formatCurrency(share)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Badge variant={expense.paid ? 'secondary' : 'outline'}
                            className={expense.paid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-orange-600 border-orange-200 bg-orange-50'}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
