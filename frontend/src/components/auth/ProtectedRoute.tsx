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

  // Account suspended check
  if (accountStatus === 'suspended') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Account Suspended</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your HealP account has been suspended by an administrator. Please contact support for assistance.
          </p>
          <a
            href={ROUTES.LOGIN}
            className="mt-6 inline-block rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  // Show the approval screen to pending or rejected doctors.
  if (role === 'doctor' && (accountStatus === 'pending' || accountStatus === 'rejected')) {
    return <PendingApprovalPage isRejected={accountStatus === 'rejected'} />
  }

  // Deny access if doctor account status is not active.
  if (role === 'doctor' && accountStatus !== 'active') {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
