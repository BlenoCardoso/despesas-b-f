import { useState } from 'react'
import { X, Pill, Clock, User, Calendar, Package, Plus, AlertTriangle, History, TrendingUp } from 'lucide-react'
import { Medication } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { IntakeHistory } from './IntakeHistory'
import { TreatmentProgress } from './TreatmentProgress'
import { MedicationActions } from './MedicationActions'
import { MedicationHistory } from './MedicationHistory'

interface MedicationDetailsProps {
  medication: Medication | null
  isOpen: boolean
  onClose: () => void
  onRecordIntake?: (medicationId: string, dosage: number, time?: Date, notes?: string) => void
  onStopMedication?: (medicationId: string, reason?: string) => void
  onDeleteMedication?: (medicationId: string) => void
}

export function MedicationDetails({ medication, isOpen, onClose, onRecordIntake, onStopMedication, onDeleteMedication }: MedicationDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'intake' | 'progress' | 'history'>('details')
  const [intakeData, setIntakeData] = useState({
    dosage: '',
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    notes: ''
  })

  if (!isOpen || !medication) return null

  const handleRecordIntake = () => {
    const dosage = Number(intakeData.dosage) || medication.dosage
    const now = new Date()
    const [hours, minutes] = intakeData.time.split(':')
    const intakeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes))
    
    onRecordIntake?.(medication.id, dosage, intakeTime, intakeData.notes || undefined)
    
    // Reset form
    setIntakeData({
      dosage: '',
      time: new Date().toTimeString().slice(0, 5),
      notes: ''
    })
  }

  const getStockStatus = () => {
    if (medication.stockQuantity <= 0) return { color: 'text-red-600', status: 'Sem estoque' }
    if (medication.stockQuantity <= medication.lowStockThreshold) return { color: 'text-yellow-600', status: 'Estoque baixo' }
    return { color: 'text-green-600', status: 'Estoque ok' }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Pill className={`h-6 w-6 ${!medication.isActive ? 'text-gray-400' : 'text-blue-600'}`} />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-gray-900">{medication.name}</h2>
                {!medication.isActive && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                    Parado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{medication.dosage} {medication.unit} - {medication.form}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(onStopMedication || onDeleteMedication) && (
              <MedicationActions
                medication={medication}
                onStop={onStopMedication || (() => {})}
                onDelete={onDeleteMedication || (() => {})}
              />
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'details', name: 'Detalhes', icon: Pill },
              { id: 'intake', name: 'Registrar', icon: Plus },
              { id: 'progress', name: 'Progresso', icon: TrendingUp },
              { id: 'history', name: 'Histórico', icon: History }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Prescrito por</span>
                    </div>
                    <p className="text-gray-900">{medication.prescribedBy || 'Não informado'}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Frequência</span>
                    </div>
                    <p className="text-gray-900">
                      {medication.frequency === 'daily' ? 'Diário' :
                       medication.frequency === 'weekly' ? 'Semanal' :
                       medication.frequency === 'monthly' ? 'Mensal' :
                       'Conforme necessário'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Período</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-900">
                        Início: {format(new Date(medication.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      {medication.endDate && (
                        <p className="text-gray-900">
                          Fim: {format(
                            typeof medication.endDate === 'string' ? new Date(medication.endDate) : medication.endDate,
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Estoque</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">Quantidade atual:</span>
                        <span className={`font-medium ${stockStatus.color}`}>
                          {medication.stockQuantity} {medication.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">Limite mínimo:</span>
                        <span className="text-gray-700">
                          {medication.lowStockThreshold} {medication.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          medication.stockQuantity <= 0 ? 'text-red-800 bg-red-100' :
                          medication.stockQuantity <= medication.lowStockThreshold ? 'text-yellow-800 bg-yellow-100' :
                          'text-green-800 bg-green-100'
                        }`}>
                          {stockStatus.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {medication.sideEffects && medication.sideEffects.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">Efeitos colaterais</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {medication.sideEffects.map((effect, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                          >
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {medication.indications && medication.indications.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Indicações</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {medication.indications.map((indication, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {indication}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {medication.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Observações</h4>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{medication.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'intake' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Registrar Tomada</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosagem ({medication.unit})
                    </label>
                    <input
                      type="number"
                      value={intakeData.dosage}
                      onChange={(e) => setIntakeData(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder={medication.dosage.toString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={intakeData.time}
                      onChange={(e) => setIntakeData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={intakeData.notes}
                      onChange={(e) => setIntakeData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setActiveTab('details')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRecordIntake}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <TreatmentProgress medication={medication} />
          )}

          {activeTab === 'history' && (
            <MedicationHistory medication={medication} />
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