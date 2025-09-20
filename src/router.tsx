import { createBrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import InvitePage from '@/pages/InvitePage'
import AuthLayout from '@/components/layouts/AuthLayout'
import AppLayout from '@/components/layouts/AppLayout'
import HouseholdPage from '@/pages/HouseholdPage'
import MembersPage from '@/pages/MembersPage'
import { routes as expenseRoutes } from '@/features/expenses/routes'

export const router = createBrowserRouter([
  // Auth routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />
      },
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        path: '/register',
        element: <RegisterPage />
      },
      {
        path: '/convite/:code',
        element: <InvitePage />
      }
    ]
  },

  // App routes
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        path: 'h/:id',
        element: <HouseholdPage />
      },
      {
        path: 'h/:id',
        children: [
          ...expenseRoutes,
          {
            path: 'membros',
            element: <MembersPage />
          }
        ]
      }
    ]
  }
])