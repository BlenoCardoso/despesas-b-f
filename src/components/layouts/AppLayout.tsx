import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'

export default function AppLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Se não estiver autenticado, redireciona para /login
      if (!user) {
        navigate('/login')
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