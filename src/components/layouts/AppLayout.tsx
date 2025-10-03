import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'

export default function AppLayout() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Dar um tempo para o authService sincronizar
    const checkAuth = () => {
      const user = authService.getCurrentUser()
      if (!user) {
        navigate('/login')
      }
      setIsChecking(false)
    }

    // Aguardar um pouco para a sincronização
    const timeout = setTimeout(checkAuth, 1000)

    return () => clearTimeout(timeout)
  }, [navigate])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}