import { Medication, MedicationIntake } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Calendar,
  Clock,
  Pill,
  CheckCircle,
  XCircle,
  Pause,
  AlertTriangle
} from 'lucide-react'

interface MedicationHistoryProps {
  medication: Medication
  intakes?: MedicationIntake[]
}

export function MedicationHistory({ medication, intakes = [] }: MedicationHistoryProps) {

  const getStatusIcon = (status: MedicationIntake['status']) => {
    switch (status) {
      case 'taken':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'skipped':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: MedicationIntake['status']) => {
    switch (status) {
      case 'taken': return 'Tomado'
      case 'skipped': return 'Pulado'
      case 'pending': return 'Pendente'
      default: return 'Desconhecido'
    }
  }

  const getStatusColor = (status: MedicationIntake['status']) => {
    switch (status) {
      case 'taken': return 'text-green-600 bg-green-50'
      case 'skipped': return 'text-red-600 bg-red-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Group intakes by date
  const groupedIntakes = intakes.reduce((groups, intake) => {
    const date = format(new Date(intake.dateTimePlanned), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(intake)
    return groups
  }, {} as Record<string, MedicationIntake[]>)

  const sortedDates = Object.keys(groupedIntakes).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-4">
      {/* Medication Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Status do Medicamento</h3>
          <div className="flex items-center space-x-2">
            {medication.isActive ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Ativo</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">Parado</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Criado em:</span>
            <div className="font-medium">
              {format(new Date(medication.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>
          
          {medication.endDate && (
            <div>
              <span className="text-gray-500">Término previsto:</span>
              <div className="font-medium">
                {format(
                  typeof medication.endDate === 'string' 
                    ? new Date(medication.endDate) 
                    : medication.endDate,
                  'dd/MM/yyyy',
                  { locale: ptBR }
                )}
              </div>
            </div>
          )}

          {!medication.isActive && medication.updatedAt && (
            <div>
              <span className="text-gray-500">Parado em:</span>
              <div className="font-medium">
                {format(new Date(medication.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Intake History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Histórico de Tomadas</h3>
        </div>

        {intakes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma tomada registrada ainda</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {sortedDates.map((date) => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {format(new Date(date), 'dd/MM/yyyy - EEEE', { locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                <div className="px-4 py-2 space-y-2">
                  {groupedIntakes[date]
                    .sort((a, b) => new Date(a.dateTimePlanned).getTime() - new Date(b.dateTimePlanned).getTime())
                    .map((intake) => (
                    <div key={intake.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(intake.status)}
                        
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(intake.dateTimePlanned), 'HH:mm')}
                          </div>
                          {intake.note && (
                            <div className="text-xs text-gray-500 mt-1">
                              {intake.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getStatusColor(intake.status)}
                        `}>
                          {getStatusText(intake.status)}
                        </span>
                        
                        {intake.dateTimeTaken && (
                          <div className="text-xs text-gray-500">
                            {format(new Date(intake.dateTimeTaken), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}