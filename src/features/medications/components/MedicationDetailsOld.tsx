import { useState } from 'react'
import { X, Pill, Clock, User, Calendar, Package, Plus, Check, AlertTriangle, History, TrendingUp } from 'lucide-react'
import { Medication } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { IntakeHistory } from './IntakeHistory'
import { TreatmentProgress } from './TreatmentProgress'
import { MedicationActions } from './MedicationActions'

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
    setShowIntakeForm(false)
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
            <Pill className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{medication.name}</h2>
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

          {/* Intake Form */}
          {showIntakeForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Registrar Tomada</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosagem
                  </label>
                  <input
                    type="number"
                    value={intakeData.dosage}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder={medication.dosage.toString()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe vazio para usar dosagem padrão</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={intakeData.time}
                    onChange={(e) => setIntakeData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={intakeData.notes}
                  onChange={(e) => setIntakeData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Observações sobre esta tomada..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleRecordIntake}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Confirmar Tomada
                </button>
                <button
                  onClick={() => setShowIntakeForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Medication Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informações</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Frequência:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {medication.frequency === 'daily' ? 'Diário' :
                     medication.frequency === 'weekly' ? 'Semanal' :
                     medication.frequency === 'monthly' ? 'Mensal' :
                     'Conforme necessário'}
                  </span>
                </div>

                {medication.times && medication.times.length > 0 && (
                  <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-sm text-gray-600">Horários:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {medication.times.map((time, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {medication.prescribedBy && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Prescrito por:</span>
                    <span className="text-sm font-medium text-gray-900">{medication.prescribedBy}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Início:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(medication.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>

                {medication.endDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Fim:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(medication.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Estoque</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Quantidade:</span>
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    {medication.stockQuantity} {medication.unit}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.status}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Alerta estoque:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {medication.lowStockThreshold} {medication.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {medication.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Instruções</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {medication.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {medication.tags && medication.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {medication.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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

      {/* Treatment Progress Modal */}
      {medication && showProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Progresso do Tratamento</h2>
              <button
                onClick={() => setShowProgress(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <TreatmentProgress medication={medication} />
            </div>
          </div>
        </div>
      )}

      {/* Intake History Modal */}
      {medication && (
        <IntakeHistory
          medication={medication}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}