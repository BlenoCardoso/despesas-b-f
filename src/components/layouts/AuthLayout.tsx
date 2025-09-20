import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'

export default function AuthLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Se estiver autenticado, redireciona para /app
      if (user) {
        navigate('/app')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}