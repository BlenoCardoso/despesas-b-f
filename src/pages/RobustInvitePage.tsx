import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function RobustInvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'validating' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [household, setHousehold] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setLogs(prev => [...prev, logEntry])
    console.log(logEntry)
  }

  useEffect(() => {
    const processInvite = async () => {
      try {
        addLog(`🚀 Iniciando processamento do convite: ${code}`)
        
        if (!code || code.trim() === '') {
          addLog('❌ Código vazio')
          setError('Código de convite não fornecido')
          setStatus('error')
          return
        }

        // Etapa 1: Verificar autenticação
        setStatus('authenticating')
        addLog('🔐 Verificando autenticação...')
        
        let currentUser = null
        try {
          const { authService } = await import('@/services/authService')
          currentUser = authService.getCurrentUser()
          addLog(`👤 AuthService: ${currentUser ? currentUser.email : 'não autenticado'}`)
        } catch (authError: any) {
          addLog(`⚠️ Erro no AuthService: ${authError.message}`)
        }

        try {
          const { auth } = await import('@/config/firebase')
          const firebaseUser = auth.currentUser
          addLog(`🔥 Firebase: ${firebaseUser ? firebaseUser.email : 'não autenticado'}`)
          
          if (!currentUser && firebaseUser) {
            addLog('⏳ Usando Firebase user como fallback')
            currentUser = firebaseUser
          }
        } catch (firebaseError: any) {
          addLog(`⚠️ Erro no Firebase: ${firebaseError.message}`)
        }

        if (!currentUser) {
          addLog('❌ Usuário não autenticado, redirecionando...')
          navigate('/login', { state: { redirect: `/convite/${code}` } })
          return
        }

        setUser(currentUser)
        addLog(`✅ Usuário autenticado: ${currentUser.email}`)

        // Etapa 2: Validar convite
        setStatus('validating')
        addLog('🔍 Validando convite...')
        
        try {
          const { InviteService } = await import('@/features/households/services/inviteService')
          const result = await InviteService.validate(code.trim())
          addLog(`📋 Resultado: ${JSON.stringify(result)}`)
          
          if (!result.valid) {
            addLog(`❌ Convite inválido: ${result.error}`)
            setError(result.error || 'Convite inválido')
            setStatus('error')
            return
          }

          addLog(`✅ Convite válido! HouseholdId: ${result.householdId}`)
          
          // Etapa 3: Buscar household
          if (result.householdId) {
            try {
              const { DatabaseMiddleware } = await import('@/lib/databaseMiddleware')
              const householdData = await DatabaseMiddleware.get({
                collection: 'households',
                id: result.householdId
              })
              addLog(`🏠 Household encontrada: ${JSON.stringify(householdData)}`)
              setHousehold(householdData)
            } catch (householdError: any) {
              addLog(`⚠️ Erro ao buscar household: ${householdError.message}`)
              setHousehold({ name: 'Household não encontrada', id: result.householdId })
            }
          }

          setStatus('success')
          addLog('🎉 Processamento concluído com sucesso!')

        } catch (validationError: any) {
          addLog(`💥 Erro na validação: ${validationError.message}`)
          setError(`Erro na validação: ${validationError.message}`)
          setStatus('error')
        }

      } catch (error: any) {
        addLog(`💥 Erro geral: ${error.message}`)
        setError(`Erro geral: ${error.message}`)
        setStatus('error')
      }
    }

    processInvite()
  }, [code, navigate])

  const handleAccept = async () => {
    try {
      addLog('🎯 Aceitando convite...')
      
      const { InviteService } = await import('@/features/households/services/inviteService')
      const { DatabaseMiddleware } = await import('@/lib/databaseMiddleware')
      
      // Adicionar como membro
      await DatabaseMiddleware.create({
        collection: 'members',
        data: {
          householdId: household.id,
          userId: user.id || user.uid,
          role: 'member',
          joinedAt: new Date().toISOString(),
          status: 'active'
        }
      })

      // Marcar convite como usado
      await InviteService.use(code)
      
      addLog('✅ Convite aceito com sucesso!')
      toast.success('Bem-vindo à casa!')
      navigate('/')
      
    } catch (error: any) {
      addLog(`💥 Erro ao aceitar: ${error.message}`)
      toast.error(`Erro: ${error.message}`)
    }
  }

  if (status === 'loading' || status === 'authenticating' || status === 'validating') {
    return (
      <div className="container max-w-lg mx-auto py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="text-sm text-blue-600">
              {status === 'loading' && '⏳ Carregando...'}
              {status === 'authenticating' && '🔐 Verificando autenticação...'}
              {status === 'validating' && '🔍 Validando convite...'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container max-w-lg mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">❌ Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500">Ver logs detalhados</summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </details>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>🎉 Convite para {household?.name || 'Casa'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Você foi convidado para participar desta casa! 
            Ao aceitar, você poderá gerenciar despesas junto com outros membros.
          </p>
          
          <div className="text-sm text-gray-600 mb-4">
            <p>👤 Usuário: {user?.email}</p>
            <p>🏠 Casa: {household?.name}</p>
            <p>🎟️ Código: {code}</p>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500">Ver logs do processamento</summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </details>
        </CardContent>
        <CardFooter>
          <div className="flex gap-4 w-full">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              Recusar
            </Button>
            <Button onClick={handleAccept} className="flex-1">
              Aceitar Convite
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}