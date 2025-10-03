import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/authService'
import { useNavigate } from 'react-router-dom'

export default function AppHomePage() {
  const navigate = useNavigate()
  const user = authService.getCurrentUser()

  const handleLogout = async () => {
    try {
      await authService.signOut()
      navigate('/')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🏠 Área do Usuário</span>
              <Button variant="outline" onClick={handleLogout} size="sm">
                Sair
              </Button>
            </CardTitle>
            <p className="text-gray-600">
              Bem-vindo, {user?.email || user?.name || 'Usuário'}!
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">💰 Despesas</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Gerencie suas despesas compartilhadas
                </p>
                <Button size="sm" className="w-full">
                  Ver Despesas
                </Button>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">👥 Membros</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Convide pessoas para sua casa
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/invite-test')}
                >
                  Gerar Convite
                </Button>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">⚙️ Configurações</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ajuste suas preferências
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  Configurar
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🧪 Ferramentas de Teste</CardTitle>
          </CardHeader>
          <CardContent>
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
                onClick={() => navigate('/invite-test')}
              >
                🎟️ Testar Convites
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/debug')}
              >
                🐛 Debug
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}