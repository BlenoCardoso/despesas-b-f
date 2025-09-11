import React, { useState } from 'react'
import { 
  Calendar,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  CheckSquare,
  Pill,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { 
  useExpenseReport, 
  useTaskReport, 
  useMedicationReport, 
  useOverallReport,
  useExportReport,
  useChartData,
  useRealtimeMetrics
} from '../hooks/useReports'
import { ReportFilters, ReportPeriod } from '../services/reportService'
import {
  ChartContainer,
  KPICard,
  ExpenseCategoryChart,
  MonthlyTrendChart,
  BudgetAnalysisChart,
  TaskStatusChart,
  ProductivityChart,
  AdherenceChart,
  MedicationTypesChart,
  StockAlertChart
} from '../components/Charts'
import { formatCurrency } from '@/core/utils/formatters'
import { toast } from 'sonner'

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'month',
    includeIncome: true
  })

  const [activeTab, setActiveTab] = useState('overview')

  // Data hooks
  const overallReport = useOverallReport(filters)
  const expenseReport = useExpenseReport(filters)
  const taskReport = useTaskReport(filters)
  const medicationReport = useMedicationReport(filters)
  const realtimeMetrics = useRealtimeMetrics()
  const exportReport = useExportReport()

  // Chart data
  const expenseChartData = useChartData('expense', filters)
  const taskChartData = useChartData('task', filters)
  const medicationChartData = useChartData('medication', filters)

  const handlePeriodChange = (period: ReportPeriod) => {
    setFilters(prev => ({ ...prev, period, startDate: undefined, endDate: undefined }))
  }

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      period: 'custom',
      startDate, 
      endDate 
    }))
  }

  const handleExport = async (format: 'csv' | 'pdf', reportType: string) => {
    try {
      let data: any[] = []
      let filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}`

      switch (reportType) {
        case 'expenses':
          if (expenseReport.data) {
            data = expenseReport.data.expensesByCategory
            filename = `relatorio_despesas_${new Date().toISOString().split('T')[0]}`
          }
          break
        case 'tasks':
          if (taskReport.data) {
            data = taskReport.data.tasksByUser
            filename = `relatorio_tarefas_${new Date().toISOString().split('T')[0]}`
          }
          break
        case 'medications':
          if (medicationReport.data) {
            data = medicationReport.data.medicationsByType
            filename = `relatorio_medicamentos_${new Date().toISOString().split('T')[0]}`
          }
          break
        default:
          if (overallReport.data) {
            data = [overallReport.data.summary]
            filename = `relatorio_geral_${new Date().toISOString().split('T')[0]}`
          }
      }

      await exportReport.mutateAsync({ data, format, filename })
      toast.success(`Relatório exportado como ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    }
  }

  const isLoading = overallReport.isLoading || realtimeMetrics.isLoading

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análise detalhada das suas finanças, tarefas e medicamentos
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv', activeTab)}
            disabled={exportReport.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf', activeTab)}
            disabled={exportReport.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filters.period} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.period === 'custom' && (
              <div className="flex-1 min-w-[300px]">
                <label className="text-sm font-medium mb-2 block">Data</label>
                <DatePickerWithRange
                  from={filters.startDate}
                  to={filters.endDate}
                  onSelect={(range) => {
                    handleDateRangeChange(range?.from, range?.to)
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      {realtimeMetrics.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Saldo do Mês"
            value={formatCurrency(realtimeMetrics.data.balance)}
            color={realtimeMetrics.data.balance >= 0 ? 'green' : 'red'}
            icon={<DollarSign className="h-6 w-6" />}
          />
          <KPICard
            title="Tarefas Pendentes"
            value={realtimeMetrics.data.pendingTasks}
            subtitle={`${realtimeMetrics.data.overdueTasks} em atraso`}
            color={realtimeMetrics.data.overdueTasks > 0 ? 'red' : 'green'}
            icon={<CheckSquare className="h-6 w-6" />}
          />
          <KPICard
            title="Aderência Medicamentos"
            value={`${realtimeMetrics.data.adherenceRate.toFixed(1)}%`}
            color={realtimeMetrics.data.adherenceRate >= 80 ? 'green' : 'yellow'}
            icon={<Pill className="h-6 w-6" />}
          />
          <KPICard
            title="Alertas Ativos"
            value={realtimeMetrics.data.alerts.length}
            subtitle="Requerem atenção"
            color={realtimeMetrics.data.alerts.length > 0 ? 'red' : 'green'}
            icon={<AlertTriangle className="h-6 w-6" />}
          />
        </div>
      )}

      {/* Alerts */}
      {realtimeMetrics.data?.alerts && realtimeMetrics.data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeMetrics.data.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity === 'high' ? 'Alto' : 'Médio'}
                    </Badge>
                    <span>{alert.message}</span>
                  </div>
                  <Badge variant="outline">{alert.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="medications">Medicamentos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {overallReport.data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Despesas Totais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(overallReport.data.expenses.totalExpenses)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {overallReport.data.period}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Taxa de Conclusão
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {overallReport.data.tasks.completionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {overallReport.data.tasks.completedTasks} de {overallReport.data.tasks.totalTasks} tarefas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Aderência Medicamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {overallReport.data.medications.adherenceRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {overallReport.data.medications.totalIntakes - overallReport.data.medications.missedIntakes} de {overallReport.data.medications.totalIntakes} tomadas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer
                  title="Despesas por Categoria"
                  isLoading={expenseChartData.isLoading}
                  error={expenseChartData.error}
                >
                  {expenseChartData.data && (
                    <ExpenseCategoryChart data={expenseChartData.data.categoryChart.data} />
                  )}
                </ChartContainer>

                <ChartContainer
                  title="Status das Tarefas"
                  isLoading={taskChartData.isLoading}
                  error={taskChartData.error}
                >
                  {taskChartData.data && (
                    <TaskStatusChart data={taskChartData.data.statusChart.data} />
                  )}
                </ChartContainer>
              </div>
            </>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {expenseReport.data && expenseChartData.data && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Despesas por Categoria">
                  <ExpenseCategoryChart data={expenseChartData.data.categoryChart.data} />
                </ChartContainer>

                <ChartContainer title="Análise de Orçamento">
                  <BudgetAnalysisChart data={expenseChartData.data.budgetChart.data} />
                </ChartContainer>
              </div>

              <ChartContainer title="Tendência Mensal">
                <MonthlyTrendChart data={expenseChartData.data.trendChart.data} />
              </ChartContainer>

              {/* Top Expenses Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Maiores Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-left p-2">Categoria</th>
                          <th className="text-left p-2">Data</th>
                          <th className="text-right p-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenseReport.data.topExpenses.slice(0, 10).map((expense) => (
                          <tr key={expense.id} className="border-b">
                            <td className="p-2">{expense.description}</td>
                            <td className="p-2">
                              <Badge variant="outline">
                                {/* Category name would be resolved here */}
                                Categoria
                              </Badge>
                            </td>
                            <td className="p-2">
                              {new Date(expense.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(expense.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {taskReport.data && taskChartData.data && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Status das Tarefas">
                  <TaskStatusChart data={taskChartData.data.statusChart.data} />
                </ChartContainer>

                <ChartContainer title="Produtividade">
                  <ProductivityChart data={taskChartData.data.productivityChart.data} />
                </ChartContainer>
              </div>

              {/* Tasks by User */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taskReport.data.tasksByUser.map((user) => (
                      <div key={user.userId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <h4 className="font-medium">{user.userName}</h4>
                          <p className="text-sm text-gray-600">
                            {user.completed} de {user.total} tarefas concluídas
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {user.completionRate.toFixed(1)}%
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${user.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-6">
          {medicationReport.data && medicationChartData.data && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Aderência ao Tratamento">
                  <AdherenceChart data={medicationChartData.data.adherenceChart.data} />
                </ChartContainer>

                <ChartContainer title="Medicamentos por Tipo">
                  <MedicationTypesChart data={medicationChartData.data.typeChart.data} />
                </ChartContainer>
              </div>

              {medicationReport.data.upcomingRefills.length > 0 && (
                <ChartContainer title="Alertas de Estoque">
                  <StockAlertChart data={medicationChartData.data.stockChart.data} />
                </ChartContainer>
              )}

              {/* Upcoming Refills */}
              {medicationReport.data.upcomingRefills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Medicamentos com Estoque Baixo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {medicationReport.data.upcomingRefills.map((refill) => (
                        <div key={refill.medicationId} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div>
                            <h4 className="font-medium">{refill.medicationName}</h4>
                            <p className="text-sm text-gray-600">
                              Estoque atual: {refill.currentStock} unidades
                            </p>
                          </div>
                          <Badge variant={refill.daysRemaining <= 3 ? 'destructive' : 'secondary'}>
                            {refill.daysRemaining} dias restantes
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

