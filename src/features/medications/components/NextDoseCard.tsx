import { useState, useEffect } from 'react'
import { Clock, Pill, AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react'
import { Medication, MedicationIntake } from '../types'
import { medicationService } from '../services/medicationService'
import { format, addHours, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NextDoseCardProps {
  medications: Medication[]
  onRecordIntake?: (medicationId: string, dosage: number, time?: Date, notes?: string) => void
}

interface NextDose {
  medication: Medication
  datetime: Date
  dosage: number
  timeUntil: string
  isOverdue: boolean
}

export function NextDoseCard({ medications, onRecordIntake }: NextDoseCardProps) {
  const [nextDoses, setNextDoses] = useState<NextDose[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNextDoses()
    
    // Update every minute
    const interval = setInterval(loadNextDoses, 60000)
    return () => clearInterval(interval)
  }, [medications])

  const loadNextDoses = async () => {
    setLoading(true)
    try {
      const upcoming: NextDose[] = []
      const now = new Date()
      
      for (const medication of medications) {
        if (!medication.isActive || medication.frequency === 'as_needed') continue
        
        // Get next scheduled dose for this medication
        const nextDose = await getNextScheduledDose(medication)
        if (nextDose) {
          const timeDiff = nextDose.getTime() - now.getTime()
          const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60))
          const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
          
          let timeText = ''
          if (timeDiff < 0) {
            const overdue = Math.abs(timeDiff)
            const overdueHours = Math.floor(overdue / (1000 * 60 * 60))
            const overdueMinutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
            
            if (overdueHours > 0) {
              timeText = `Atrasado ${overdueHours}h ${overdueMinutes}min`
            } else {
              timeText = `Atrasado ${overdueMinutes}min`
            }
          } else if (hoursUntil > 0) {
            timeText = `Em ${hoursUntil}h ${minutesUntil}min`
          } else if (minutesUntil > 0) {
            timeText = `Em ${minutesUntil} minutos`
          } else {
            timeText = 'Agora'
          }
          
          upcoming.push({
            medication,
            datetime: nextDose,
            dosage: medication.dosage,
            timeUntil: timeText,
            isOverdue: timeDiff < 0
          })
        }
      }
      
      // Sort by datetime (soonest first)
      upcoming.sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
      setNextDoses(upcoming.slice(0, 3)) // Show top 3
      
    } catch (error) {
      console.error('Erro ao carregar próximas doses:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNextScheduledDose = async (medication: Medication): Promise<Date | null> => {
    const now = new Date()
    const startDate = new Date(medication.startDate)
    const endDate = medication.endDate ? new Date(medication.endDate) : addHours(startDate, 24 * 30)
    
    // Get existing intakes to check what's already taken
    const intakes = await medicationService.getIntakesForDateRange(medication.id, startDate, endDate)
    const takenTimes = new Set(intakes
      .filter(intake => intake.status === 'taken')
      .map(intake => new Date(intake.dateTimePlanned).getTime())
    )
    
    // Generate schedule and find next untaken dose
    let currentDate = new Date(Math.max(now.getTime(), startDate.getTime()))
    
    // Calculate interval
    let intervalHours = 24
    if (medication.frequency === 'daily' && medication.times.length > 1) {
      intervalHours = 24 / medication.times.length
    }
    
    // Check today's scheduled times first
    if (medication.times.length > 0 && medication.frequency === 'daily') {
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number)
        const doseTime = new Date(today)
        doseTime.setHours(hours, minutes, 0, 0)
        
        if (doseTime > now && !takenTimes.has(doseTime.getTime())) {
          return doseTime
        }
      }
      
      // Check tomorrow's times
      const tomorrow = addHours(today, 24)
      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number)
        const doseTime = new Date(tomorrow)
        doseTime.setHours(hours, minutes, 0, 0)
        
        if (!takenTimes.has(doseTime.getTime())) {
          return doseTime
        }
      }
    } else {
      // For interval-based dosing, find next interval from last dose
      const lastIntake = intakes
        .filter(intake => intake.status === 'taken')
        .sort((a, b) => new Date(b.dateTimeTaken!).getTime() - new Date(a.dateTimeTaken!).getTime())[0]
      
      if (lastIntake && lastIntake.dateTimeTaken) {
        const nextDoseTime = addHours(new Date(lastIntake.dateTimeTaken), intervalHours)
        if (nextDoseTime <= endDate) {
          return nextDoseTime
        }
      } else {
        // No doses taken yet, use first scheduled time
        if (medication.times.length > 0) {
          const [hours, minutes] = medication.times[0].split(':').map(Number)
          const firstDose = new Date(startDate)
          firstDose.setHours(hours, minutes, 0, 0)
          if (firstDose > now) {
            return firstDose
          }
        }
      }
    }
    
    return null
  }

  const handleQuickIntake = async (nextDose: NextDose) => {
    if (onRecordIntake) {
      await onRecordIntake(nextDose.medication.id, nextDose.dosage, new Date(), 'Tomada rápida')
      // Reload next doses after recording
      setTimeout(loadNextDoses, 1000)
    }
  }

  const getDayText = (datetime: Date) => {
    if (isToday(datetime)) {
      return 'Hoje'
    } else if (isTomorrow(datetime)) {
      return 'Amanhã'
    } else {
      return format(datetime, 'dd/MM', { locale: ptBR })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (nextDoses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Próximas Doses
          </h3>
        </div>
        <div className="text-center py-4 text-gray-500">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-400" />
          <p>Nenhuma dose programada no momento</p>
          <p className="text-sm mt-1">Todas as doses estão em dia!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Próximas Doses
        </h3>
        <span className="text-sm text-gray-600">
          {nextDoses.length} medicamento{nextDoses.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {nextDoses.map((nextDose, index) => (
          <div
            key={`${nextDose.medication.id}-${index}`}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              nextDose.isOverdue 
                ? 'border-red-200 bg-red-50' 
                : index === 0 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                nextDose.isOverdue 
                  ? 'bg-red-100' 
                  : index === 0 
                    ? 'bg-blue-100' 
                    : 'bg-gray-100'
              }`}>
                {nextDose.isOverdue ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : index === 0 ? (
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {nextDose.medication.name}
                </div>
                <div className="text-sm text-gray-600">
                  {nextDose.dosage} {nextDose.medication.unit} • {getDayText(nextDose.datetime)} às {format(nextDose.datetime, 'HH:mm')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  nextDose.isOverdue ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {nextDose.timeUntil}
                </div>
                {index === 0 && (
                  <div className="text-xs text-gray-500">
                    Próximo
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleQuickIntake(nextDose)}
                className={`p-2 rounded-md transition-colors ${
                  nextDose.isOverdue
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title="Tomada rápida"
              >
                <Pill className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}