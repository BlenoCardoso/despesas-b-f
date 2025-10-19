import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { auth } from '@/config/firebase'

export default function AuthLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Se estiver autenticado, redireciona para /app, EXCETO se estiver:
      // - Em páginas de convite
      // - Em páginas de diagnóstico/teste
      // - Já estiver na home page (para evitar loop)
      const isConvitePage = location.pathname.startsWith('/convite')
      const isDiagnosticPage = location.pathname.includes('diagnostic') || location.pathname.includes('test') || location.pathname.includes('debug')
      const isHomePage = location.pathname === '/'
      
      if (user && !isConvitePage && !isDiagnosticPage && !isHomePage) {
        navigate('/app')
      }
    })

    return () => unsubscribe()
  }, [navigate, location.pathname])

  return (
    <div className="min-h-screen bg-background pt-[env(safe-area-inset-top)]">
      <Outlet />
    </div>
  )
}