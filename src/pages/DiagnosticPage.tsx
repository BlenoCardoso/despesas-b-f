import { useState, useEffect } from 'react'
import { authService } from '@/services/authService'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { householdService } from '@/features/households/services/householdService'
import { InviteService } from '@/features/households/services/inviteService'

export default function DiagnosticPage() {
  const [authServiceUser, setAuthServiceUser] = useState<any>(null)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addLog('Página de diagnóstico carregada')
    
    // Verificar estados de autenticação
    const checkAuthStates = () => {
      const serviceUser = authService.getCurrentUser()
      const fbUser = auth.currentUser
      
      setAuthServiceUser(serviceUser)
      setFirebaseUser(fbUser)
      
      addLog(`AuthService user: ${serviceUser ? serviceUser.email : 'null'}`)
      addLog(`Firebase user: ${fbUser ? fbUser.email : 'null'}`)
    }

    checkAuthStates()
    
    // Verificar periodicamente
    const interval = setInterval(checkAuthStates, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const testLogin = async () => {
    try {
      addLog('Tentando fazer login...')
      const user = await authService.signInWithGoogle()
      addLog(`Login bem-sucedido: ${user.email}`)
      setError(null)
    } catch (err: any) {
      const errorMsg = err.message || 'Erro desconhecido'
      setError(errorMsg)
      addLog(`Erro no login: ${errorMsg}`)
    }
  }

  const testLogout = async () => {
    try {
      addLog('Fazendo logout...')
      await authService.signOut()
      addLog('Logout bem-sucedido')
      setError(null)
    } catch (err: any) {
      const errorMsg = err.message || 'Erro desconhecido'
      setError(errorMsg)
      addLog(`Erro no logout: ${errorMsg}`)
    }
  }

  const testInviteGeneration = async () => {
    try {
      addLog('🎟️ Testando geração de convite...')
      
      const user = authService.getCurrentUser()
      if (!user) {
        addLog('❌ Usuário não autenticado')
        return
      }

      // Criar convite de teste
      const invite = await householdService.createInvite({
        householdId: 'test-household-id',
        createdBy: user.id,
        expiresInHours: 24,
        maxUses: 1
      })

      addLog(`✅ Convite criado: ${invite.code}`)
      addLog(`🔗 Link: ${invite.link}`)

    } catch (err: any) {
      const errorMsg = err.message || 'Erro desconhecido'
      addLog(`💥 Erro ao gerar convite: ${errorMsg}`)
    }
  }

  const testInviteValidation = async () => {
    try {
      addLog('🔍 Testando validação de convite...')
      
      const testCode = 'ABC123' // código de teste
      const result = await InviteService.validate(testCode)
      
      addLog(`📋 Resultado: ${JSON.stringify(result)}`)

    } catch (err: any) {
      const errorMsg = err.message || 'Erro desconhecido'
      addLog(`💥 Erro na validação: ${errorMsg}`)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnóstico de Autenticação</CardTitle>
          <CardDescription>
            Esta página ajuda a identificar problemas de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status da Autenticação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AuthService</CardTitle>
              </CardHeader>
              <CardContent>
                {authServiceUser ? (
                  <div className="text-green-600">
                    <p>✅ Logado</p>
                    <p className="text-xs">{authServiceUser.email}</p>
                    <p className="text-xs">ID: {authServiceUser.id}</p>
                  </div>
                ) : (
                  <p className="text-red-600">❌ Não logado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Firebase Auth</CardTitle>
              </CardHeader>
              <CardContent>
                {firebaseUser ? (
                  <div className="text-green-600">
                    <p>✅ Logado</p>
                    <p className="text-xs">{firebaseUser.email}</p>
                    <p className="text-xs">UID: {firebaseUser.uid}</p>
                  </div>
                ) : (
                  <p className="text-red-600">❌ Não logado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testLogin} variant="default">
              Testar Login
            </Button>
            <Button onClick={testLogout} variant="outline">
              Testar Logout
            </Button>
            <Button onClick={testInviteGeneration} variant="secondary">
              🎟️ Gerar Convite
            </Button>
            <Button onClick={testInviteValidation} variant="secondary">
              🔍 Validar Convite
            </Button>
          </div>

          {/* Erros */}
          {error && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">❌ Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ℹ️ Info do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
              <p><strong>Localhost:</strong> {window.location.hostname === 'localhost' ? 'Sim' : 'Não'}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}