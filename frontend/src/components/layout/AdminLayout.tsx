import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  Users,
  UserCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../services/authService'
import { getAdminStats } from '../../services/adminService'
import { ROUTES } from '../../routes/routePaths'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [loggingOut, setLoggingOut] = useState(false)

  const adminName =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'Administrator'

  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    let cancelled = false
    async function loadStats() {
      try {
        const stats = await getAdminStats()
        if (!cancelled) {
          setPendingCount(stats.pendingDoctors)
        }
      } catch (err) {
        console.warn('Could not fetch pending count for admin navigation:', err)
      }
    }

    void loadStats()
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  const handleLogout = async () => {
    if (loggingOut) return
    try {
      setLoggingOut(true)
      await logoutUser()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
      setLoggingOut(false)
    }
  }

  const navItems = [
    {
      to: ROUTES.ADMIN_DASHBOARD,
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: ROUTES.ADMIN_DOCTORS,
      label: 'Doctor Verifications',
      icon: UserCheck,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      to: ROUTES.ADMIN_USERS,
      label: 'Account Directory',
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-2.5">
              <div className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    HealP
                  </p>
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                    Admin Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  System Administration & Verification
                </p>
              </div>
            </Link>

            {/* DESKTOP NAV TABS */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* ADMIN USER ACTIONS */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800">
                {adminName}
              </p>
              <p className="text-[11px] font-medium text-indigo-600">
                System Administrator
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {initials}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              <LogOut size={14} />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>

            {/* MOBILE MENU TOGGLE */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl p-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded-xl p-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} HealP Administration & Governance Portal.</p>
      </footer>
    </div>
  )
}
