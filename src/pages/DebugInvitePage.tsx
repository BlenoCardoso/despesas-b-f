import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { authService } from '@/services/authService'
import { auth } from '@/config/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugInvitePage() {
  const { code = '' } = useParams()
  const [logs, setLogs] = useState<string[]>([])
  const [authState, setAuthState] = useState({
    authServiceUser: null as any,
    firebaseUser: null as any,
    loading: true
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  useEffect(() => {
    addLog(`🔍 Iniciando debug para código: ${code}`)
    
    // Verificar estados de auth
    const checkAuth = () => {
      const serviceUser = authService.getCurrentUser()
      const fbUser = auth.currentUser
      
      addLog(`🔐 AuthService user: ${serviceUser ? serviceUser.email : 'null'}`)
      addLog(`🔥 Firebase user: ${fbUser ? fbUser.email : 'null'}`)
      
      setAuthState({
        authServiceUser: serviceUser,
        firebaseUser: fbUser,
        loading: false
      })
    }

    // Verificar imediatamente
    checkAuth()
    
    // Verificar após um delay (caso ainda esteja carregando)
    const timer = setTimeout(checkAuth, 2000)
    
    return () => clearTimeout(timer)
  }, [code])

  const testAuth = async () => {
    try {
      addLog('🧪 Testando login...')
      const user = await authService.signInWithGoogle()
      addLog(`✅ Login OK: ${user.email}`)
      
      // Recheck auth state
      const serviceUser = authService.getCurrentUser()
      const fbUser = auth.currentUser
      
      setAuthState({
        authServiceUser: serviceUser,
        firebaseUser: fbUser,
        loading: false
      })
      
    } catch (error: any) {
      addLog(`❌ Erro no login: ${error.message}`)
    }
  }

  const testDirectFirebase = async () => {
    try {
      addLog('🔥 Testando Firebase direto...')
      const { InviteService } = await import('@/features/households/services/inviteService')
      const result = await InviteService.validate(code)
      addLog(`📋 Resultado direto: ${JSON.stringify(result)}`)
    } catch (error: any) {
      addLog(`❌ Erro Firebase: ${error.message}`)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug - Convite {code}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Estado de Auth */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-3">
              <h3 className="font-bold text-sm">AuthService</h3>
              <p className="text-xs">
                {authState.authServiceUser ? 
                  `✅ ${authState.authServiceUser.email}` : 
                  '❌ Não autenticado'
                }
              </p>
            </Card>
            <Card className="p-3">
              <h3 className="font-bold text-sm">Firebase Auth</h3>
              <p className="text-xs">
                {authState.firebaseUser ? 
                  `✅ ${authState.firebaseUser.email}` : 
                  '❌ Não autenticado'
                }
              </p>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button onClick={testAuth} size="sm">
              🧪 Testar Login
            </Button>
            <Button onClick={testDirectFirebase} size="sm" variant="outline">
              🔥 Testar Firebase
            </Button>
            <Button onClick={() => setLogs([])} size="sm" variant="outline">
              🗑️ Limpar
            </Button>
          </div>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-gray-500">Aguardando...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}