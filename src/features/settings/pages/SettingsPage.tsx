import { useState } from 'react'
import { useUserPreferences, useUpdatePreferences, useExportData, useCreateBackup } from '../hooks/useSettings'
import { ThemeSelector } from '../components/ThemeSelector'
import { 
  Settings, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Database, 
  Moon,
  Sun,
  Monitor,
  Lock,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  
  // Hooks para configurações
  const { data: preferences } = useUserPreferences()
  const updatePreferences = useUpdatePreferences()
  const exportData = useExportData()
  const createBackup = useCreateBackup()
  
  const [notifications, setNotifications] = useState({
    push: preferences?.notifications.push ?? true,
    email: preferences?.notifications.email ?? true,
    sms: preferences?.notifications.sms ?? false,
    budgetAlerts: preferences?.notifications.budgetAlerts ?? true,
    medicationReminders: preferences?.notifications.medicationReminders ?? true,
    taskDeadlines: preferences?.notifications.taskDeadlines ?? true
  })

  const sections = [
    {
      id: 'profile',
      title: 'Perfil',
      icon: User,
      description: 'Informações pessoais e conta'
    },
    {
      id: 'appearance',
      title: 'Aparência',
      icon: Palette,
      description: 'Tema, idioma e personalização'
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      description: 'Configurar alertas e lembretes'
    },
    {
      id: 'security',
      title: 'Segurança',
      icon: Shield,
      description: 'Senha, biometria e privacidade'
    },
    {
      id: 'data',
      title: 'Dados',
      icon: Database,
      description: 'Backup, sincronização e exportação'
    },
    {
      id: 'about',
      title: 'Sobre',
      icon: HelpCircle,
      description: 'Versão, suporte e licenças'
    }
  ]

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair da sua conta?')) {
      toast.success('Logout realizado com sucesso!')
      // Implementar logout aqui
    }
  }

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
            <input
              type="text"
              defaultValue="João Silva"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue="joao@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
            <input
              type="tel"
              defaultValue="(11) 99999-9999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto do Perfil</h3>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Alterar Foto
            </button>
            <p className="text-sm text-gray-500 mt-1">JPG, PNG até 5MB</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tema</h3>
        <ThemeSelector />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Idioma e Região</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Data</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="dd/MM/yyyy">DD/MM/AAAA</option>
              <option value="MM/dd/yyyy">MM/DD/AAAA</option>
              <option value="yyyy-MM-dd">AAAA-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Notificação</h3>
        
        <div className="space-y-4">
          {[
            { key: 'push', label: 'Notificações Push', description: 'Receber alertas no dispositivo' },
            { key: 'email', label: 'Email', description: 'Receber notificações por email' },
            { key: 'sms', label: 'SMS', description: 'Receber alertas por mensagem de texto' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Específicos</h3>
        
        <div className="space-y-4">
          {[
            { key: 'budgetAlerts', label: 'Alertas de Orçamento', description: 'Avisar quando ultrapassar limites' },
            { key: 'medicationReminders', label: 'Lembretes de Medicação', description: 'Horários dos medicamentos' },
            { key: 'taskDeadlines', label: 'Prazos de Tarefas', description: 'Lembretes de tarefas pendentes' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Autenticação</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Autenticação Biométrica</h4>
              <p className="text-sm text-gray-500">Usar impressão digital ou Face ID</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Bloqueio Automático</h4>
              <p className="text-sm text-gray-500">Bloquear app após inatividade</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <Lock className="w-4 h-4" />
            <span>Alterar Senha</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacidade</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Compartilhar Dados</h4>
              <p className="text-sm text-gray-500">Permitir análise para melhorar o app</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Analytics</h4>
              <p className="text-sm text-gray-500">Dados de uso anônimos</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDataSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup e Sincronização</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Backup Automático</h4>
              <p className="text-sm text-gray-500">Fazer backup dos dados regularmente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequência do Backup</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-4">
          <button 
            onClick={() => {
              createBackup.mutate(undefined, {
                onSuccess: (data) => {
                  toast.success(`Backup criado: ${data.filename}`)
                },
                onError: () => {
                  toast.error('Erro ao criar backup')
                }
              })
            }}
            disabled={createBackup.isPending}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createBackup.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{createBackup.isPending ? 'Criando...' : 'Fazer Backup'}</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Dados</h3>
        
        <div className="space-y-4">
          <button 
            onClick={() => {
              exportData.mutate('expenses')
              toast.success('Exportando despesas...')
            }}
            disabled={exportData.isPending}
            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Exportar Despesas</h4>
                <p className="text-sm text-gray-500">Baixar em formato Excel ou PDF</p>
              </div>
            </div>
            {exportData.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          <button 
            onClick={() => {
              exportData.mutate('reports')
              toast.success('Exportando relatórios...')
            }}
            disabled={exportData.isPending}
            className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <Download className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Exportar Relatórios</h4>
                <p className="text-sm text-gray-500">Relatórios financeiros completos</p>
              </div>
            </div>
            {exportData.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Zona de Perigo</h3>
        
        <button 
          onClick={() => {
            if (window.confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
              toast.error('Todos os dados foram excluídos!')
            }
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir Todos os Dados</span>
        </button>
      </div>
    </div>
  )

  const renderAboutSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do App</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Build</span>
            <span className="font-medium">2025.01.001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Desenvolvedor</span>
            <span className="font-medium">Sua Empresa</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suporte</h3>
        
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Central de Ajuda</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Contatar Suporte</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Reportar Bug</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal</h3>
        
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Termos de Uso</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Política de Privacidade</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Licenças de Terceiros</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection()
      case 'appearance':
        return renderAppearanceSection()
      case 'notifications':
        return renderNotificationsSection()
      case 'security':
        return renderSecuritySection()
      case 'data':
        return renderDataSection()
      case 'about':
        return renderAboutSection()
      default:
        return renderProfileSection()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                        ${activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {section.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  )
}