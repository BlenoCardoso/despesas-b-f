import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useHouseholds } from '@/hooks/useHouseholds'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Users, Home } from 'lucide-react'
import { toast } from 'sonner'

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { acceptInvite } = useHouseholds()
  const [loading, setLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!user) {
      navigate('/login')
      return
    }

    // Se já aceitou, não fazer nada
    if (accepted) return

    // Auto-aceitar se tiver código e usuário logado
    if (code && user && !loading) {
      handleAcceptInvite()
    }
  }, [code, user, accepted, loading])

  const handleAcceptInvite = async () => {
    if (!code || !user) return

    setLoading(true)
    setError(null)

    try {
      await acceptInvite(code)
      setAccepted(true)
      
      // Redirecionar para as despesas após 2 segundos
      setTimeout(() => {
        navigate('/expenses')
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aceitar convite'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToApp = () => {
    navigate('/expenses')
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Convite para Despesas Compartilhadas</CardTitle>
            <CardDescription>
              Você foi convidado para participar de uma household de despesas compartilhadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Para aceitar este convite, você precisa fazer login primeiro.
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
              <h2 className="text-xl font-semibold">Aceitando convite...</h2>
              <p className="text-gray-600">Aguarde enquanto processamos seu convite.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-green-700">Convite aceito!</h2>
              <p className="text-gray-600">
                Você agora faz parte da household. Redirecionando para as despesas...
              </p>
              <Button onClick={handleGoToApp} className="w-full">
                Ir para Despesas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-red-700">Erro ao aceitar convite</h2>
              <p className="text-gray-600">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Tentar Novamente
                </Button>
                <Button onClick={handleGoToApp} className="w-full">
                  Ir para o App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Você foi convidado para participar de uma household de despesas compartilhadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Código do convite: <span className="font-mono font-bold">{code}</span>
            </p>
          </div>
          <Button onClick={handleAcceptInvite} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Aceitando...
              </>
            ) : (
              'Aceitar Convite'
            )}
          </Button>
          <Button onClick={handleGoToApp} variant="outline" className="w-full">
            Ir para o App
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}