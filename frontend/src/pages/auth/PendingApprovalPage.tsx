import { useNavigate } from 'react-router-dom'
import { Clock, ShieldCheck, LogOut, HeartPulse, XCircle } from 'lucide-react'

import { logoutUser } from '../../services/authService'

interface PendingApprovalPageProps {
  isRejected?: boolean
  rejectionReason?: string
}

function PendingApprovalPage({
  isRejected = false,
  rejectionReason,
}: PendingApprovalPageProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <HeartPulse size={34} />
        </div>

        {isRejected ? (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle size={30} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Registration Not Approved
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Thank you for your interest in HealP. Unfortunately, your doctor
              registration could not be verified by our administration team.
            </p>

            <div className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-left">
              <p className="text-sm font-semibold text-red-900">
                Application Status: Declined
              </p>
              <p className="mt-1 text-xs leading-5 text-red-800">
                {rejectionReason ||
                  'The medical council registration number or credential details could not be validated against official registries.'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock size={30} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Verification Pending
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Thank you for registering as a doctor on HealP. Your account is
              currently awaiting verification and approval by our
              administration team.
            </p>

            <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={21}
                />

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Your account is under review
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Doctor portal access will become available after your
                    credentials have been verified and your account has been
                    approved.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleLogout}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut size={17} />
          Sign Out
        </button>

        <p className="mt-6 text-xs text-slate-400">
          HealP · Your Digital Healthcare Companion
        </p>
      </div>
    </main>
  )
}

export default PendingApprovalPage
