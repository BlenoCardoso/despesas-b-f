import { useState, useEffect } from 'react'
import { Calendar, Clock, Pill, TrendingUp, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'
import { Medication, MedicationIntake } from '../types'
import { medicationService } from '../services/medicationService'
import { TreatmentScheduleService } from '../services/treatmentScheduleService'
import { format, addHours, isToday, isTomorrow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TreatmentProgressProps {
  medication: Medication
}

interface ScheduledDose {
  id: string
  datetime: Date
  dosage: number
  status: 'pending' | 'taken' | 'overdue'
  intake?: MedicationIntake
}

export function TreatmentProgress({ medication }: TreatmentProgressProps) {
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([])
  const [nextDose, setNextDose] = useState<ScheduledDose | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTreatmentSchedule()
  }, [medication])

  const loadTreatmentSchedule = async () => {
    setLoading(true)
    try {
      // Generate complete treatment schedule
      const schedule = generateTreatmentSchedule(medication)
      
      // Load actual intakes to match with schedule
      const startDate = new Date(medication.startDate)
      const endDate = medication.endDate ? new Date(medication.endDate) : addHours(startDate, 24 * 30) // 30 days default
      const intakes = await medicationService.getIntakesForDateRange(medication.id, startDate, endDate)
      
      // Match intakes with scheduled doses
      const dosesWithStatus = schedule.map(dose => {
        const matchingIntake = intakes.find(intake => 
          Math.abs(new Date(intake.dateTimePlanned).getTime() - dose.datetime.getTime()) < 30 * 60 * 1000 // 30 min tolerance
        )
        
        const now = new Date()
        let status: 'pending' | 'taken' | 'overdue' = 'pending'
        
        if (matchingIntake?.status === 'taken') {
          status = 'taken'
        } else if (dose.datetime < now) {
          status = 'overdue'
        }
        
        return {
          ...dose,
          status,
          intake: matchingIntake
        }
      })
      
      setScheduledDoses(dosesWithStatus)
      
      // Find next dose
      const next = dosesWithStatus.find(dose => dose.status === 'pending')
      setNextDose(next || null)
      
    } catch (error) {
      console.error('Erro ao carregar cronograma:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTreatmentSchedule = (med: Medication): ScheduledDose[] => {
    const treatmentSchedule = TreatmentScheduleService.generateTreatmentSchedule(med)
    
    return treatmentSchedule.doses.map(dose => ({
      id: dose.id,
      datetime: dose.datetime,
      dosage: dose.dosage,
      status: 'pending' as const
    }))
  }

  const getProgress = () => {
    const total = scheduledDoses.length
    const taken = scheduledDoses.filter(d => d.status === 'taken').length
    const remaining = total - taken
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0
    
    return { total, taken, remaining, percentage }
  }

  const getNextDoseInfo = () => {
    if (!nextDose) return null
    
    const now = new Date()
    const timeDiff = nextDose.datetime.getTime() - now.getTime()
    const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60))
    const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    
    let timeText = ''
    if (hoursUntil > 0) {
      timeText = `${hoursUntil}h ${minutesUntil}min`
    } else if (minutesUntil > 0) {
      timeText = `${minutesUntil} minutos`
    } else {
      timeText = 'Agora'
    }
    
    let dayText = ''
    if (isToday(nextDose.datetime)) {
      dayText = 'Hoje'
    } else if (isTomorrow(nextDose.datetime)) {
      dayText = 'Amanhã'
    } else {
      dayText = format(nextDose.datetime, 'dd/MM', { locale: ptBR })
    }
    
    return { timeText, dayText, hoursUntil, minutesUntil }
  }

  const getStatusIcon = (status: ScheduledDose['status']) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: ScheduledDose['status']) => {
    switch (status) {
      case 'taken': return 'border-green-200 bg-green-50'
      case 'overdue': return 'border-red-200 bg-red-50'
      case 'pending': return 'border-blue-200 bg-blue-50'
    }
  }

  const progress = getProgress()
  const nextDoseInfo = getNextDoseInfo()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Progresso do Tratamento
        </h3>
        <div className="text-sm text-gray-600">
          {scheduledDoses.length} doses programadas
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
          <div className="text-xs text-blue-700">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{progress.taken}</div>
          <div className="text-xs text-green-700">Tomadas</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{progress.remaining}</div>
          <div className="text-xs text-orange-700">Restantes</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{progress.percentage}%</div>
          <div className="text-xs text-purple-700">Completo</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm text-gray-600">{progress.taken}/{progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Next Dose */}
      {nextDose && nextDoseInfo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PlayCircle className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Próxima Dose</div>
                <div className="text-sm text-gray-600">
                  {nextDoseInfo.dayText} às {format(nextDose.datetime, 'HH:mm')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {nextDoseInfo.timeText}
              </div>
              <div className="text-sm text-gray-600">
                {nextDose.dosage} {medication.unit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Doses */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Últimas Doses
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {scheduledDoses.slice(0, 10).map((dose) => {
            const isPastDue = isPast(dose.datetime) && dose.status === 'pending'
            return (
              <div
                key={dose.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(dose.status)}`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(dose.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {format(dose.datetime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                    <div className="text-xs text-gray-600">
                      {dose.dosage} {medication.unit}
                      {dose.intake?.note && ` • ${dose.intake.note}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${
                    dose.status === 'taken' ? 'text-green-600' :
                    dose.status === 'overdue' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {dose.status === 'taken' ? 'Tomado' :
                     dose.status === 'overdue' ? 'Atrasado' :
                     isPastDue ? 'Pendente' : 'Agendado'}
                  </div>
                  {dose.intake?.dateTimeTaken && (
                    <div className="text-xs text-gray-500">
                      {format(new Date(dose.intake.dateTimeTaken), 'HH:mm')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {scheduledDoses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Pill className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Nenhuma dose programada encontrada</p>
          <p className="text-sm mt-1">Configure horários e frequência para ver o cronograma</p>
        </div>
      )}
    </div>
  )
}