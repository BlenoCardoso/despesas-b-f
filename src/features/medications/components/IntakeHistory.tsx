import { useState, useEffect } from 'react'
import { Clock, Check, X, AlertCircle, Calendar, Pill } from 'lucide-react'
import { MedicationIntake, Medication } from '../types'
import { medicationService } from '../services/medicationService'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface IntakeHistoryProps {
  medication: Medication
  isOpen: boolean
  onClose: () => void
}

export function IntakeHistory({ medication, isOpen, onClose }: IntakeHistoryProps) {
  const [intakes, setIntakes] = useState<MedicationIntake[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    if (isOpen && medication) {
      loadIntakeHistory()
    }
  }, [isOpen, medication, dateRange])

  const loadIntakeHistory = async () => {
    setLoading(true)
    try {
      let startDate: Date
      const endDate = endOfDay(new Date())

      switch (dateRange) {
        case 'week':
          startDate = startOfDay(subDays(new Date(), 7))
          break
        case 'month':
          startDate = startOfDay(subDays(new Date(), 30))
          break
        case 'all':
          startDate = new Date(0) // Beginning of time
          break
      }

      const intakeHistory = await medicationService.getIntakesForDateRange(
        medication.id,
        startDate,
        endDate
      )

      setIntakes(intakeHistory.sort((a, b) => 
        new Date(b.dateTimePlanned).getTime() - new Date(a.dateTimePlanned).getTime()
      ))
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: MedicationIntake['status']) => {
    switch (status) {
      case 'taken':
        return <Check className="h-4 w-4 text-green-600" />
      case 'skipped':
        return <X className="h-4 w-4 text-gray-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
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
      case 'taken': return 'bg-green-50 border-green-200'
      case 'skipped': return 'bg-gray-50 border-gray-200'
      case 'pending': return 'bg-blue-50 border-blue-200'
      default: return 'bg-yellow-50 border-yellow-200'
    }
  }

  const getTotalStats = () => {
    const total = intakes.length
    const taken = intakes.filter(i => i.status === 'taken').length
    const skipped = intakes.filter(i => i.status === 'skipped').length
    const pending = intakes.filter(i => i.status === 'pending').length
    const adherenceRate = total > 0 ? Math.round((taken / (taken + skipped)) * 100) : 0

    return { total, taken, skipped, pending, adherenceRate }
  }

  const stats = getTotalStats()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Histórico de Tomadas</h2>
              <p className="text-sm text-gray-600">{medication.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'week', label: 'Última Semana' },
            { key: 'month', label: 'Último Mês' },
            { key: 'all', label: 'Todos' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDateRange(tab.key as 'week' | 'month' | 'all')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                dateRange === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Statistics */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.taken}</div>
              <div className="text-sm text-gray-600">Tomados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.skipped}</div>
              <div className="text-sm text-gray-600">Pulados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.adherenceRate}%</div>
              <div className="text-sm text-gray-600">Adesão</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando histórico...</p>
            </div>
          ) : intakes.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma tomada registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {intakes.map((intake) => (
                <div
                  key={intake.id}
                  className={`border rounded-lg p-4 ${getStatusColor(intake.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStatusIcon(intake.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getStatusText(intake.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(intake.dateTimePlanned), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>
                              <Clock className="h-3 w-3 inline mr-1" />
                              Planejado: {format(new Date(intake.dateTimePlanned), 'HH:mm')}
                            </span>
                            {intake.dateTimeTaken && (
                              <span>
                                <Check className="h-3 w-3 inline mr-1" />
                                Tomado: {format(new Date(intake.dateTimeTaken), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span>
                              <Pill className="h-3 w-3 inline mr-1" />
                              Dosagem: {intake.dosageTaken} {medication.unit}
                            </span>
                          </div>
                          
                          {intake.note && (
                            <p className="text-gray-700 bg-white bg-opacity-50 rounded p-2 mt-2">
                              <strong>Observações:</strong> {intake.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {intake.status === 'taken' && intake.dateTimeTaken && (
                      <div className="text-right text-xs text-gray-500">
                        {format(new Date(intake.dateTimeTaken), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}