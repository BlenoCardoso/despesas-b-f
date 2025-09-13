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
  Zap
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
  
  // Ativar atalhos de teclado globais
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Connectivity Status */}
      <ConnectivityStatus />
      
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Despesas B&F
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {currentHousehold?.name || 'Carregando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 mt-4">
            <GlobalSearch />
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
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

          {/* User section */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            {/* User info */}
            <div className="flex items-center gap-3 p-4">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Usuário
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  usuario@exemplo.com
                </p>
              </div>
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

      {/* Mobile sidebar */}
      <div className="md:hidden">
        {/* TODO: Implement mobile sidebar */}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Despesas
              </h1>
            </div>
            <NotificationButton />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

