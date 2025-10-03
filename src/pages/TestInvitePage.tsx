import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { InviteService } from '@/features/households/services/inviteService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestInvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  const [inviteData, setInviteData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  useEffect(() => {
    const testInvite = async () => {
      try {
        addLog(`🚀 Iniciando teste para código: ${code}`)
        
        // 1. Verificar autenticação
        const user = authService.getCurrentUser()
        addLog(`👤 Usuário: ${user ? user.email : 'NÃO AUTENTICADO'}`)
        
        if (!user) {
          addLog('❌ Redirecionando para login...')
          navigate('/login')
          return
        }

        // 2. Testar validação
        addLog('🔍 Validando convite...')
        const result = await InviteService.validate(code)
        addLog(`📋 Resultado da validação: ${JSON.stringify(result)}`)
        
        setInviteData(result)

        if (result.valid) {
          addLog('✅ CONVITE VÁLIDO - Deveria continuar')
        } else {
          addLog(`❌ CONVITE INVÁLIDO: ${result.error}`)
          addLog('🔄 Deveria voltar para home, mas vou ficar aqui para debug')
          setError(result.error || 'Código inválido')
        }

      } catch (err: any) {
        const errorMsg = err.message || 'Erro desconhecido'
        addLog(`💥 ERRO: ${errorMsg}`)
        setError(errorMsg)
      } finally {
        setLoading(false)
        addLog('🏁 Teste finalizado')
      }
    }

    testInvite()
  }, [code, navigate])

  const handleAccept = async () => {
    try {
      addLog('🎯 Tentando aceitar convite...')
      
      // Simular aceitação
      await InviteService.use(code)
      addLog('✅ Convite usado com sucesso')
      
      // Redirecionar para diagnóstico
      navigate('/diagnostic')
      toast.success('Convite aceito!')
      
    } catch (err: any) {
      addLog(`💥 Erro ao aceitar: ${err.message}`)
      toast.error('Erro ao aceitar convite')
    }
  }

  const handleGoBack = () => {
    addLog('🔙 Voltando para home')
    navigate('/')
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste de Convite</CardTitle>
          <CardDescription>
            Código: <code className="bg-gray-100 px-2 py-1 rounded">{code}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`border-2 ${loading ? 'border-yellow-300' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Testando...</span>
                  </div>
                ) : (
                  <span className={`text-sm font-medium ${inviteData?.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {inviteData?.valid ? '✅ Válido' : '❌ Inválido'}
                  </span>
                )}
              </CardContent>
            </Card>

            <Card className={`border-2 ${error ? 'border-red-300' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-sm">
                  {error || 'Nenhum erro'}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs font-mono">
                  {inviteData ? JSON.stringify(inviteData, null, 2) : 'Nenhum dado'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          {!loading && (
            <div className="flex gap-2">
              {inviteData?.valid ? (
                <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700">
                  ✅ Aceitar Convite
                </Button>
              ) : (
                <Button onClick={handleGoBack} variant="outline">
                  🔙 Voltar para Home
                </Button>
              )}
              <Button onClick={() => window.location.reload()} variant="outline">
                🔄 Testar Novamente
              </Button>
            </div>
          )}

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Logs Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded text-xs font-mono max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {logs.length === 0 && <div>Aguardando logs...</div>}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}