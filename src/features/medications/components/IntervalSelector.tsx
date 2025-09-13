import { useState } from 'react'
import { Clock, Plus, X } from 'lucide-react'

interface IntervalSelectorProps {
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed'
  times: string[]
  onTimesChange: (times: string[]) => void
}

const COMMON_INTERVALS = [
  { label: 'A cada 4 horas', times: ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00'] },
  { label: 'A cada 6 horas', times: ['06:00', '12:00', '18:00', '00:00'] },
  { label: 'A cada 8 horas', times: ['06:00', '14:00', '22:00'] },
  { label: 'A cada 12 horas', times: ['08:00', '20:00'] },
  { label: '3x ao dia (refeições)', times: ['08:00', '13:00', '19:00'] },
  { label: '2x ao dia', times: ['08:00', '20:00'] },
  { label: '1x ao dia (manhã)', times: ['08:00'] },
  { label: '1x ao dia (noite)', times: ['22:00'] },
]

export function IntervalSelector({ frequency, times, onTimesChange }: IntervalSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [newTime, setNewTime] = useState('08:00')

  const handleIntervalSelect = (intervalTimes: string[]) => {
    onTimesChange(intervalTimes)
    setShowCustom(false)
  }

  const handleAddCustomTime = () => {
    if (!times.includes(newTime)) {
      const updatedTimes = [...times, newTime].sort()
      onTimesChange(updatedTimes)
    }
    setNewTime('08:00')
  }

  const handleRemoveTime = (timeToRemove: string) => {
    onTimesChange(times.filter(time => time !== timeToRemove))
  }

  if (frequency === 'as_needed') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          💊 <strong>Conforme necessário:</strong> Não há horários fixos. Você pode registrar as tomadas quando precisar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="h-4 w-4 inline mr-1" />
          Horários de Tomada
        </label>
        
        {frequency === 'daily' && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">Escolha um intervalo comum:</p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_INTERVALS.map((interval) => (
                <button
                  key={interval.label}
                  type="button"
                  onClick={() => handleIntervalSelect(interval.times)}
                  className="text-left p-3 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{interval.label}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {interval.times.join(', ')}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setShowCustom(!showCustom)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showCustom ? '← Voltar aos intervalos comuns' : '⚙️ Personalizar horários'}
            </button>
          </div>
        )}
      </div>

      {/* Current times display */}
      {times.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horários configurados:
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {times.map((time, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <Clock className="h-3 w-3" />
                <span>{time}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTime(time)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          
          {times.length > 1 && (
            <div className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
              <strong>📅 Cronograma:</strong> Remédio será tomado {times.length}x por dia, 
              com intervalo de aproximadamente {Math.round(24 / times.length)} horas entre as doses.
              <br />
              <strong>⏰ Próximas doses:</strong> {times.slice(0, 3).join(', ')}{times.length > 3 ? '...' : ''}
            </div>
          )}
        </div>
      )}

      {/* Custom time input */}
      {(showCustom || frequency !== 'daily') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {frequency === 'daily' ? 'Adicionar horário personalizado:' : 'Horário:'}
          </label>
          <div className="flex space-x-2">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleAddCustomTime}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Helpful tips */}
      {frequency === 'daily' && times.length === 0 && (
        <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          💡 <strong>Dica:</strong> Para tratamentos com antibióticos, escolha intervalos regulares como "A cada 8 horas" 
          para manter níveis constantes do medicamento no sangue.
        </div>
      )}
    </div>
  )
}