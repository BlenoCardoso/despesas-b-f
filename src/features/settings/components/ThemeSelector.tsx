import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useSettings'
import { UserPreferences } from '../types'

export function ThemeSelector() {
  const { theme, setTheme, isLoading } = useTheme()

  const themes: Array<{
    key: UserPreferences['theme']
    label: string
    icon: typeof Sun
    description: string
  }> = [
    {
      key: 'light',
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro para melhor visibilidade durante o dia'
    },
    {
      key: 'dark',
      label: 'Escuro',
      icon: Moon,
      description: 'Tema escuro para reduzir cansaço visual'
    },
    {
      key: 'system',
      label: 'Sistema',
      icon: Monitor,
      description: 'Seguir configuração do sistema operacional'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isSelected = theme === themeOption.key
          
          return (
            <button
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              disabled={isLoading}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200 disabled:opacity-50
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }
              `}
            >
              <Icon 
                className={`
                  w-6 h-6 mx-auto mb-2
                  ${isSelected ? 'text-blue-600' : 'text-gray-600'}
                `} 
              />
              <div className="text-sm font-medium mb-1">{themeOption.label}</div>
              <div className="text-xs text-gray-500 hidden sm:block">
                {themeOption.description}
              </div>
            </button>
          )
        })}
      </div>
      
      {isLoading && (
        <div className="text-center">
          <div className="inline-flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Aplicando tema...
          </div>
        </div>
      )}
    </div>
  )
}