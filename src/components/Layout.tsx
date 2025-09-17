import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  CheckSquare,
  FileText,
  Pill,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  User,
  Home,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentHousehold } from '@/core/store'
import { NotificationButton } from '@/features/notifications/components/NotificationButton'
import { GlobalSearch } from './GlobalSearch'
import { ErrorBoundary } from './ErrorBoundary'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ConnectivityStatus } from './ConnectivityStatus'
import { ThemeToggle } from './ThemeToggle'
import { NotificationCenter } from './NotificationCenter'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  {
    name: 'Despesas',
    href: '/expenses',
    icon: CreditCard,
    badge: 0,
  },
  {
    name: 'Tarefas',
    href: '/tasks',
    icon: CheckSquare,
    badge: 0,
  },
  {
    name: 'Documentos',
    href: '/documents',
    icon: FileText,
    badge: 0,
  },
  {
    name: 'Remédios',
    href: '/medications',
    icon: Pill,
    badge: 0,
  },
  {
    name: 'Calendário',
    href: '/calendar',
    icon: Calendar,
    badge: 0,
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
    badge: 0,
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    badge: 0,
  },
]

export function Layout() {
  const location = useLocation()
  const currentHousehold = useCurrentHousehold()
  const { user, signOut } = useAuth()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)
  
  // Ativar atalhos de teclado globais
  useKeyboardShortcuts()

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Fechar sidebar mobile ao navegar
  React.useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  // Fallback: permitir abrir a sidebar mobile via evento customizado
  React.useEffect(() => {
    const handleOpenSidebar = () => {
      console.debug('[Layout] received open-mobile-sidebar')
      setIsMobileSidebarOpen(true)
    }
    window.addEventListener('open-mobile-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-mobile-sidebar', handleOpenSidebar)
  }, [])

  // Forçar exibição temporária da sidebar mobile (útil quando o app está em desktop
  // mas queremos mostrar a navegação mobile como fallback). O evento 'open-mobile-sidebar-forced'
  // ativa esse modo por alguns segundos.
  const [forceMobileSidebarVisible, setForceMobileSidebarVisible] = React.useState(false)
  React.useEffect(() => {
    const handleForced = () => {
      console.debug('[Layout] received open-mobile-sidebar-forced')
      setForceMobileSidebarVisible(true)
      setIsMobileSidebarOpen(true)
      // desligar após 6 segundos
      const t = window.setTimeout(() => setForceMobileSidebarVisible(false), 6000)
      return () => window.clearTimeout(t)
    }
    window.addEventListener('open-mobile-sidebar-forced', handleForced)
    return () => window.removeEventListener('open-mobile-sidebar-forced', handleForced)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Connectivity Status */}
      <ConnectivityStatus />

          {/* Desktop Sidebar */}
          <div className="hidden lg:flex lg:w-64 xl:w-72 lg:flex-col flex-shrink-0">
            <div className="flex flex-col flex-grow pt-3 lg:pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              {/* Logo/Brand */}
              <div className="flex items-center flex-shrink-0 px-3 lg:px-4">
                <div className="flex items-center gap-2 lg:gap-3 w-full">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Home className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white truncate">
                      Despesas B&F
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                      {currentHousehold?.name || 'Carregando...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-3 lg:px-4 mt-3 lg:mt-4">
                <GlobalSearch />
              </div>

              {/* Navigation */}
              <nav className="mt-4 lg:mt-6 flex-1 px-2 lg:px-2 space-y-0.5 lg:space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  const Icon = item.icon
              
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-2 lg:px-3 py-2 lg:py-2.5 text-sm font-medium rounded-lg transition-all duration-200 touch-target',
                        isActive
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white hover:shadow-sm'
                      )}
                    >
                      <Icon
                        className={cn(
                          'mr-2 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                      {item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-4 w-4 lg:h-5 lg:w-5 p-0 flex items-center justify-center text-xs flex-shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* User section */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                {/* User info */}
                <div className="flex items-center gap-3 p-4">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'usuario@exemplo.com'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="Sair"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
            
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <NotificationCenter />
                  </div>
                  <NotificationButton />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile sidebar overlay */}
          {(isMobileSidebarOpen || forceMobileSidebarVisible) && (
            <div 
              className={cn(
                "fixed inset-0 z-40 bg-black bg-opacity-50",
                !forceMobileSidebarVisible && "lg:hidden"
              )}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Mobile sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out",
            !forceMobileSidebarVisible && "lg:hidden",
            (isMobileSidebarOpen || forceMobileSidebarVisible) ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 safe-top">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                    <Home className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-gray-900 dark:text-white">
                      Despesas B&F
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentHousehold?.name || 'Carregando...'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>

              {/* Mobile Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <GlobalSearch />
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  const Icon = item.icon
              
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-200 touch-target',
                        isActive
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                      )}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <Icon
                        className={cn(
                          'mr-3 h-5 w-5 flex-shrink-0',
                          isActive
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        )}
                      />
                      {item.name}
                      {item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile User Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'usuario@exemplo.com'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="p-1 h-6 w-6 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="Sair"
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
            
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <NotificationCenter />
                  </div>
                  <NotificationButton />
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 flex-shrink-0 safe-top">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-2 touch-target"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {navigation.find(nav => nav.href === location.pathname)?.name || 'Despesas'}
                    </h1>
                    {currentHousehold && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {currentHousehold.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <ThemeToggle />
                  <NotificationButton />
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 smooth-scroll">
              <ErrorBoundary>
                <div className="min-h-full">
                  <div className="container-central readable py-4">
                    <Outlet />
                  </div>
                </div>
              </ErrorBoundary>
            </main>

            {/* Floating hamburger (global) - always visible across routes */}
            <button
              aria-label="Abrir menu"
              className="fixed left-4 bottom-5 z-50 h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center focus-visible"
              onClick={() => {
                console.debug('[Layout] global floating hamburger clicked - forcing mobile sidebar')
                setForceMobileSidebarVisible(true)
                setIsMobileSidebarOpen(true)
                window.setTimeout(() => setForceMobileSidebarVisible(false), 6000)
              }}
            >
              <svg className="h-6 w-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )
    }


