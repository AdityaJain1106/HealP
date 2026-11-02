
import { Navigate, Outlet } from 'react-router-dom'

import {
  useAuth,
  type UserRole,
} from '../../context/AuthContext'

import { ROUTES } from '../../routes/routePaths'
import PendingApprovalPage from '../../pages/auth/PendingApprovalPage'

interface ProtectedRouteProps {
  allowedRole: UserRole
}

function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, role, accountStatus, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!role || role !== allowedRole) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Show the approval screen to pending doctors.
  if (role === 'doctor' && accountStatus === 'pending') {
    return <PendingApprovalPage />
  }

  // Deny access if account status is missing or invalid.
  if (role === 'doctor' && accountStatus !== 'active') {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
