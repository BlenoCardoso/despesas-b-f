import { useQuery, useMutation } from '@tanstack/react-query'
import { useAppStore } from '@/core/store'
import { 
  reportService, 
  ExpenseReport, 
  TaskReport, 
  MedicationReport, 
  OverallReport,
  ReportFilters 
} from '../services/reportService'

export function useExpenseReport(filters: ReportFilters) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: ['expense-report', currentHousehold?.id, filters],
    queryFn: () => {
      if (!currentHousehold) throw new Error('No household selected')
      return reportService.generateExpenseReport(currentHousehold.id, filters)
    },
    enabled: !!currentHousehold,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTaskReport(filters: ReportFilters) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: ['task-report', currentHousehold?.id, filters],
    queryFn: () => {
      if (!currentHousehold) throw new Error('No household selected')
      return reportService.generateTaskReport(currentHousehold.id, filters)
    },
    enabled: !!currentHousehold,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useMedicationReport(filters: ReportFilters) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: ['medication-report', currentHousehold?.id, filters],
    queryFn: () => {
      if (!currentHousehold) throw new Error('No household selected')
      return reportService.generateMedicationReport(currentHousehold.id, filters)
    },
    enabled: !!currentHousehold,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useOverallReport(filters: ReportFilters) {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: ['overall-report', currentHousehold?.id, filters],
    queryFn: () => {
      if (!currentHousehold) throw new Error('No household selected')
      return reportService.generateOverallReport(currentHousehold.id, filters)
    },
    enabled: !!currentHousehold,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({ 
      data, 
      format, 
      filename 
    }: { 
      data: any[], 
      format: 'csv' | 'pdf', 
      filename: string 
    }) => {
      if (format === 'csv') {
        const csvContent = await reportService.exportToCSV(data, filename)
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        return { success: true, format: 'csv' }
      } else {
        const pdfBlob = await reportService.exportToPDF(data, filename)
        
        // Create and download file
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        return { success: true, format: 'pdf' }
      }
    },
  })
}

// Hook for dashboard summary data
export function useDashboardSummary() {
  const { currentHousehold } = useAppStore()
  
  const filters: ReportFilters = {
    period: 'month'
  }

  const expenseReport = useExpenseReport(filters)
  const taskReport = useTaskReport(filters)
  const medicationReport = useMedicationReport(filters)

  return {
    isLoading: expenseReport.isLoading || taskReport.isLoading || medicationReport.isLoading,
    error: expenseReport.error || taskReport.error || medicationReport.error,
    data: {
      expenses: expenseReport.data,
      tasks: taskReport.data,
      medications: medicationReport.data
    },
    refetch: () => {
      expenseReport.refetch()
      taskReport.refetch()
      medicationReport.refetch()
    }
  }
}

// Hook for real-time metrics
export function useRealtimeMetrics() {
  const { currentHousehold } = useAppStore()

  return useQuery({
    queryKey: ['realtime-metrics', currentHousehold?.id],
    queryFn: async () => {
      if (!currentHousehold) throw new Error('No household selected')
      
      // Get current month data
      const filters: ReportFilters = { period: 'month' }
      const report = await reportService.generateOverallReport(currentHousehold.id, filters)
      
      return {
        totalExpenses: report.expenses.totalExpenses,
        totalIncome: report.expenses.totalIncome,
        balance: report.expenses.balance,
        pendingTasks: report.tasks.pendingTasks,
        overdueTasks: report.tasks.overdueTasks,
        completionRate: report.tasks.completionRate,
        adherenceRate: report.medications.adherenceRate,
        lowStockMedications: report.medications.upcomingRefills.length,
        alerts: report.summary.alerts
      }
    },
    enabled: !!currentHousehold,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Hook for chart data formatting
export function useChartData(reportType: 'expense' | 'task' | 'medication', filters: ReportFilters) {
  const expenseReport = useExpenseReport(filters)
  const taskReport = useTaskReport(filters)
  const medicationReport = useMedicationReport(filters)

  const formatExpenseChartData = (data: ExpenseReport) => ({
    categoryChart: {
      data: data.expensesByCategory.map(cat => ({
        name: cat.category,
        value: cat.amount,
        percentage: cat.percentage
      })),
      total: data.totalExpenses
    },
    trendChart: {
      data: data.monthlyTrend.map(month => ({
        month: month.month,
        expenses: month.expenses,
        income: month.income,
        balance: month.balance
      }))
    },
    budgetChart: {
      data: data.budgetAnalysis.map(budget => ({
        category: budget.categoryName,
        budget: budget.budgetAmount,
        spent: budget.spentAmount,
        percentage: budget.percentage,
        status: budget.status
      }))
    }
  })

  const formatTaskChartData = (data: TaskReport) => ({
    statusChart: {
      data: [
        { name: 'Concluídas', value: data.completedTasks, color: '#10b981' },
        { name: 'Pendentes', value: data.pendingTasks, color: '#f59e0b' },
        { name: 'Em Atraso', value: data.overdueTasks, color: '#ef4444' }
      ]
    },
    priorityChart: {
      data: data.tasksByPriority.map(priority => ({
        priority: priority.priority,
        total: priority.count,
        completed: priority.completed,
        percentage: priority.percentage
      }))
    },
    productivityChart: {
      data: data.productivityTrend.map(trend => ({
        period: trend.period,
        created: trend.created,
        completed: trend.completed,
        rate: trend.completionRate
      }))
    }
  })

  const formatMedicationChartData = (data: MedicationReport) => ({
    adherenceChart: {
      data: data.adherenceTrend.map(day => ({
        date: day.date,
        scheduled: day.scheduled,
        taken: day.taken,
        missed: day.missed,
        rate: day.adherenceRate
      }))
    },
    typeChart: {
      data: data.medicationsByType.map(type => ({
        type: type.type,
        count: type.count,
        adherence: type.adherenceRate
      }))
    },
    stockChart: {
      data: data.upcomingRefills.map(refill => ({
        medication: refill.medicationName,
        days: refill.daysRemaining,
        stock: refill.currentStock
      }))
    }
  })

  switch (reportType) {
    case 'expense':
      return {
        isLoading: expenseReport.isLoading,
        error: expenseReport.error,
        data: expenseReport.data ? formatExpenseChartData(expenseReport.data) : null
      }
    case 'task':
      return {
        isLoading: taskReport.isLoading,
        error: taskReport.error,
        data: taskReport.data ? formatTaskChartData(taskReport.data) : null
      }
    case 'medication':
      return {
        isLoading: medicationReport.isLoading,
        error: medicationReport.error,
        data: medicationReport.data ? formatMedicationChartData(medicationReport.data) : null
      }
    default:
      return { isLoading: false, error: null, data: null }
  }
}

