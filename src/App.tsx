import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import { Layout } from './components/Layout'
import { InstallPrompt } from './components/PWAStatus'
import { ExpensesPage } from './features/expenses/pages/ExpensesPage'
import { TasksPage } from './features/tasks/pages/TasksPage'
import { DocumentsPage } from './features/docs/pages/DocumentsPage'
import { CalendarPage } from './features/calendar/pages/CalendarPage'
import { MedicationsPage } from './features/medications/pages/MedicationsPage'
import { ReportsPage } from './features/reports/pages/ReportsPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { useAppStore } from './core/store'
import { db } from './core/db/database'
import { categoryService } from './features/expenses/services/categoryService'
import { generateId } from './core/utils/id'
import './App.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const { 
    currentHousehold, 
    currentUser, 
    setCurrentHousehold, 
    setCurrentUser 
  } = useAppStore()

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if we have a household and user
        let household = await db.getCurrentHousehold()
        let user = await db.getCurrentUser()

        // Create default household and user if they don't exist
        if (!household) {
          const householdData = {
            id: generateId(),
            name: 'Minha Casa',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await db.households.add(householdData)
          household = householdData
        }

        if (!user) {
          const userData = {
            id: generateId(),
            name: 'Usuário',
            email: 'usuario@exemplo.com',
            householdId: household.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await db.users.add(userData)
          user = userData
        }

        // Set current household and user
        setCurrentHousehold(household)
        setCurrentUser(user)

        // Create default categories if none exist
        const existingCategories = await categoryService.getCategories(household.id)
        if (existingCategories.length === 0) {
          await categoryService.createDefaultCategories(household.id)
        }

        console.log('App initialized successfully')
      } catch (error) {
        console.error('Error initializing app:', error)
      }
    }

    initializeApp()
  }, [setCurrentHousehold, setCurrentUser])

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/expenses" replace />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="medications" element={<MedicationsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </div>
        </Router>
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        <Toaster 
          position="top-right"
          richColors
          closeButton
        />
        
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}



export default App
