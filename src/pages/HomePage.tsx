import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/services/authService'

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar se há usuário autenticado
    const user = authService.getCurrentUser()
    console.log('HomePage - Usuário atual:', user)
    
    if (user) {
      // Se autenticado, redirecionar para sistema principal (despesas)
      console.log('HomePage - Redirecionando usuário autenticado para /expenses')
      navigate('/expenses', { replace: true })
    }
  }, [navigate])

  const handleLogin = async () => {
    try {
      console.log('HomePage - Iniciando login...')
      await authService.signInWithGoogle()
      console.log('HomePage - Login bem-sucedido, redirecionando para sistema principal...')
      navigate('/expenses')
    } catch (error) {
      console.error('HomePage - Erro no login:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            💰 Despesas Compartilhadas
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Gerencie suas despesas de forma colaborativa
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full"
            size="lg"
          >
            🔐 Entrar com Google
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">Ou</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/diagnostic')}
                size="sm"
                className="flex-1"
              >
                🔧 Diagnóstico
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app')}
                size="sm"
                className="flex-1"
              >
                🧪 Testes
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              ✅ Sistema funcionando corretamente!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}