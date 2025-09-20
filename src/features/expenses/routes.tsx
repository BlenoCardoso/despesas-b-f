import { lazy, Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { expenseRoutes } from './paths'
import { Spinner } from '@/components/ui/spinner'

// Lazy loaded components
const ManageExpense = lazy(() => import('./pages/ManageExpense'))

// Expense related routes
export const routes = [
  {
    path: expenseRoutes.root,
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Navigate to={expenseRoutes.list()} replace />
      },
      {
        path: expenseRoutes.list(),
        element: (
          <Suspense fallback={<div className="p-4 flex justify-center"><Spinner /></div>}>
            <ManageExpense />
          </Suspense>
        )
      }
    ]
  }
]