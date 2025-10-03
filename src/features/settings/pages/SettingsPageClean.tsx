import { useState, useEffect } from 'react'
import { useCurrentHousehold, useCurrentUser } from '@/core/store'
import { householdService } from '@/features/households/services/householdService'
import { authService } from '@/services/authService'
import { 
  Settings, 
  User, 
  LogOut,
  Download,
  Users,
  ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImprovedInviteSystem } from '@/features/households/components/ImprovedInviteSystem'
import { InviteSystemInfo } from '@/features/households/components/InviteSystemInfo'
import MembersManager from '@/features/households/components/MembersManager'
import { useNavigate } from 'react-router-dom'

export function SettingsPage() {
  const household = useCurrentHousehold()
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [canEditSetting, setCanEditSetting] = useState<string>('owner-admin')

  // Carregar configurações
  useEffect(() => {
    if (household?.settings) {
      setCanEditSetting((household as any).settings.canEditOthersExpenses || 'owner-admin')
    }
  }, [household])

  const canEdit = (() => {
    if (!household || !currentUser) return false
    const member = (household as any).members?.find((m: any) => m.userId === currentUser.id)
    return (household as any).ownerId === currentUser.id || member?.role === 'admin'
  })()

  const handleSavePermissions = async () => {
    if (!household) return
    setSaving(true)
    try {
      await householdService.updateHousehold(household.id, {
        settings: {
          ...((household as any).settings || {}),
          canEditOthersExpenses: canEditSetting as any
        }
      } as any)
      toast.success('Configuração salva')
    } catch (err) {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.signOut()
      navigate('/')
      toast.success('Logout realizado com sucesso')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const exportExpensesCSV = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento')
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações da casa e membros
          </p>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{currentUser?.email || 'Não disponível'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Casa atual:</span>
              <span className="font-medium">{household?.name || 'Nenhuma casa selecionada'}</span>
            </div>
            {household && (
              <div className="flex justify-between">
                <span className="text-gray-600">Seu papel:</span>
                <span className="font-medium">
                  {(household as any).ownerId === currentUser?.id ? 'Proprietário' : 
                   (household as any).members?.find((m: any) => m.userId === currentUser?.id)?.role === 'admin' ? 'Administrador' : 'Membro'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sistema de Convites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sistema de Convites
            </span>
            <InviteSystemInfo />
          </CardTitle>
          <CardDescription>
            Convide pessoas para participar da sua casa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImprovedInviteSystem />
        </CardContent>
      </Card>

      {/* Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Casa
          </CardTitle>
          <CardDescription>
            Gerencie os membros da sua casa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersManager />
        </CardContent>
      </Card>

      {/* Permissões */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Permissões
            </CardTitle>
            <CardDescription>
              Configure quem pode fazer o quê na casa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quem pode editar/excluir despesas de outros?
              </label>
              <select
                value={canEditSetting}
                onChange={(e) => setCanEditSetting(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="owner-admin">Somente Proprietário e Administradores</option>
                <option value="all">Todos os membros</option>
              </select>
            </div>
            <Button 
              onClick={handleSavePermissions}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exportar Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Baixe seus dados em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={exportExpensesCSV}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Despesas (CSV)
          </Button>
          <p className="text-sm text-gray-500">
            Outras funcionalidades de exportação estarão disponíveis em breve.
          </p>
        </CardContent>
      </Card>

      {/* Ferramentas de Desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Ferramentas de Desenvolvimento</CardTitle>
          <CardDescription>
            Funcionalidades para testar e debugar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/diagnostic')}
            >
              🔧 Diagnóstico
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/quick-invite')}
            >
              🎟️ Teste Convites
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/invite-test')}
            >
              📋 Sistema Convites Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}