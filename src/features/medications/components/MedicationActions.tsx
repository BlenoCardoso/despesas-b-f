import { useState } from 'react'
import { Trash2, StopCircle, AlertTriangle, X } from 'lucide-react'
import { Medication } from '../types'

interface MedicationActionsProps {
  medication: Medication
  onStop: (medicationId: string, reason?: string) => void
  onDelete: (medicationId: string) => void
}

export function MedicationActions({ medication, onStop, onDelete }: MedicationActionsProps) {
  const [showStopModal, setShowStopModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [stopReason, setStopReason] = useState('')

  const handleStop = () => {
    onStop(medication.id, stopReason || undefined)
    setShowStopModal(false)
    setStopReason('')
  }

  const handleDelete = () => {
    onDelete(medication.id)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className="flex space-x-2">
        {medication.isActive && (
          <button
            onClick={() => setShowStopModal(true)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
            title="Parar medicamento"
          >
            <StopCircle className="h-4 w-4" />
          </button>
        )}
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Excluir medicamento"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <StopCircle className="h-6 w-6 text-orange-600" />
                <h3 className="text-lg font-medium text-gray-900">Parar Medicamento</h3>
              </div>
              <button
                onClick={() => setShowStopModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja parar o medicamento <strong>{medication.name}</strong>?
                </p>
                <p className="text-sm text-gray-600">
                  ⚠️ Esta ação irá marcar o medicamento como inativo e cancelar todas as doses futuras.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="Ex: Efeitos colaterais, fim do tratamento, orientação médica..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowStopModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleStop}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                Parar Medicamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-medium text-gray-900">Excluir Medicamento</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja excluir permanentemente o medicamento <strong>{medication.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div className="text-sm text-red-700">
                      <strong>⚠️ ATENÇÃO:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>Esta ação não pode ser desfeita</li>
                        <li>Todo o histórico de tomadas será perdido</li>
                        <li>Todas as doses futuras serão canceladas</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>Sugestão:</strong> Se você quer manter o histórico, use a opção "Parar" em vez de excluir.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}