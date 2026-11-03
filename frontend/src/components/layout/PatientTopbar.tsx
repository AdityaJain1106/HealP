
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  Menu,
  X,
  Loader2,
  FileText,
  Pill,
  UserRound,
  Activity,
  LogOut,
  Check,
  CheckCheck,
  CalendarClock,
  AlertCircle,
} from 'lucide-react'

import {
  searchPatientRecords,
  type PatientSearchResult,
} from '../../services/patientSearchService'

import {
  subscribeToNotifications,
  subscribeToUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type HealPNotification,
} from '../../services/notificationService'

import { logoutUser } from '../../services/authService'
import { ROUTES } from '../../routes/routePaths'

interface PatientTopbarProps {
  patientName?: string
  onMenuClick?: () => void
}

function formatNotificationTime(
  timestamp: HealPNotification['createdAt'],
) {
  if (!timestamp) return 'Recently'

  const date = timestamp.toDate()
  const now = Date.now()
  const difference = Math.max(0, now - date.getTime())

  const minutes = Math.floor(difference / 60000)
  const hours = Math.floor(difference / 3600000)
  const days = Math.floor(difference / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear()
      ? 'numeric'
      : undefined,
  })
}

function PatientTopbar({
  patientName = 'Patient',
  onMenuClick,
}: PatientTopbarProps) {
  const navigate = useNavigate()

  const searchRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<PatientSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)

  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const [notifications, setNotifications] = useState<HealPNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationError, setNotificationError] = useState('')
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)

  const initial = patientName.charAt(0).toUpperCase()

  // Search records with a short debounce.
  useEffect(() => {
    const term = searchTerm.trim()

    if (term.length < 2) {
      setResults([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError('')

        const searchResults = await searchPatientRecords(term)

        if (!cancelled) {
          setResults(searchResults)
        }
      } catch (err) {
        if (!cancelled) {
          setResults([])
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to search health records.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  // Subscribe to the patient's notifications and unread count.
  useEffect(() => {
    setNotificationsLoading(true)
    setNotificationError('')

    let notificationsLoaded = false
    let unreadCountLoaded = false

    const handleReady = () => {
      if (notificationsLoaded && unreadCountLoaded) {
        setNotificationsLoading(false)
      }
    }

    const unsubscribeNotifications = subscribeToNotifications(
      (items) => {
        setNotifications(items)
        notificationsLoaded = true
        handleReady()
      },
      (err) => {
        setNotificationError(err.message || 'Unable to load notifications.')
        setNotificationsLoading(false)
      },
    )

    const unsubscribeUnreadCount = subscribeToUnreadNotificationCount(
      (count) => {
        setUnreadCount(count)
        unreadCountLoaded = true
        handleReady()
      },
      (err) => {
        setNotificationError(err.message || 'Unable to load unread count.')
        setNotificationsLoading(false)
      },
    )

    return () => {
      unsubscribeNotifications()
      unsubscribeUnreadCount()
    }
  }, [])

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowResults(false)
      }

      if (accountRef.current && !accountRef.current.contains(target)) {
        setShowAccountMenu(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Close menus using Escape.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowResults(false)
        setShowAccountMenu(false)
        setShowNotifications(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleResultClick = (result: PatientSearchResult) => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    navigate(result.route)
  }

  const handleProfileClick = () => {
    setShowAccountMenu(false)
    navigate(ROUTES.PATIENT_PROFILE)
  }

  const handleLogout = async () => {
    if (loggingOut) return

    try {
      setLoggingOut(true)
      setLogoutError('')
      await logoutUser()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      setLogoutError(
        err instanceof Error
          ? err.message
          : 'Unable to log out. Please try again.',
      )
      setLoggingOut(false)
    }
  }

  const handleNotificationClick = async (
    notification: HealPNotification,
  ) => {
    try {
      setNotificationError('')
      setMarkingReadId(notification.id)

      if (!notification.isRead) {
        await markNotificationAsRead(notification.id)
      }

      setShowNotifications(false)

      // Only allow navigation to patient portal routes.
      if (notification.route?.startsWith('/patient/')) {
        navigate(notification.route)
      } else if (notification.route === ROUTES.PATIENT_DASHBOARD) {
        navigate(ROUTES.PATIENT_DASHBOARD)
      }
    } catch (err) {
      setNotificationError(
        err instanceof Error
          ? err.message
          : 'Unable to update this notification.',
      )
    } finally {
      setMarkingReadId(null)
    }
  }

  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return

    try {
      setMarkingAllRead(true)
      setNotificationError('')
      await markAllNotificationsAsRead()
    } catch (err) {
      setNotificationError(
        err instanceof Error
          ? err.message
          : 'Unable to mark notifications as read.',
      )
    } finally {
      setMarkingAllRead(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Medical History':
        return <Activity size={17} />
      case 'Report / Document':
        return <FileText size={17} />
      case 'AI Prescription':
        return <Pill size={17} />
      case 'Profile':
        return <UserRound size={17} />
      default:
        return <FileText size={17} />
    }
  }

  const getNotificationIcon = (type: HealPNotification['type']) => {
    switch (type) {
      case 'prescription':
        return <Pill size={19} />
      case 'medical_record':
        return <Activity size={19} />
      case 'appointment':
        return <CalendarClock size={19} />
      case 'document':
        return <FileText size={19} />
      default:
        return <Bell size={19} />
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-white px-5 sm:px-8">
      {/* LEFT SECTION */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Patient Dashboard
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Manage your healthcare in one place
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* GLOBAL SEARCH */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex w-64 items-center gap-2 rounded-xl border border-transparent bg-slate-50 px-4 py-2 transition focus-within:border-primary-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 lg:w-80">
            {loading ? (
              <Loader2 size={17} className="shrink-0 animate-spin text-primary-500" />
            ) : (
              <Search size={17} className="shrink-0 text-slate-400" />
            )}

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search health records..."
              aria-label="Search health records"
              aria-expanded={showResults}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm('')
                  setResults([])
                  setError('')
                }}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {showResults && searchTerm.trim().length >= 2 && (
            <div className="absolute right-0 top-full z-50 mt-2 max-h-[420px] w-[340px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl lg:w-[400px]">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search Results
                </p>
              </div>

              {loading && results.length === 0 && (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2 size={17} className="animate-spin" />
                  Searching your health records...
                </div>
              )}

              {!loading && error && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!loading && !error && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Search size={25} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    No records found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try another name, medicine or keyword.
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="py-2">
                  {results.map((result) => (
                    <button
                      key={`${result.category}-${result.id}`}
                      type="button"
                      onClick={() => handleResultClick(result)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        {getCategoryIcon(result.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {result.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {result.subtitle}
                        </p>
                        <span className="mt-1.5 inline-block text-[10px] font-medium uppercase tracking-wide text-primary-600">
                          {result.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 px-4 py-2">
                <p className="text-[11px] text-slate-400">
                  Showing up to 20 matching records
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            onClick={() => {
              setShowNotifications((previous) => !previous)
              setShowAccountMenu(false)
            }}
            className={`relative rounded-xl p-2.5 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
              showNotifications ? 'bg-slate-100 text-primary-600' : 'text-slate-500'
            }`}
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-full z-50 mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Notifications
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={markingAllRead}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-primary-600 transition hover:bg-primary-50 disabled:opacity-50"
                    >
                      {markingAllRead ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={14} />
                      )}
                      Mark all read
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {notificationError && (
                <div className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{notificationError}</span>
                </div>
              )}

              <div className="max-h-[380px] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                    <Loader2 size={18} className="animate-spin text-primary-500" />
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <Bell size={22} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      You're all caught up
                    </p>
                    <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
                      New updates about prescriptions, medical records and follow-ups will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        disabled={markingReadId === notification.id}
                        onClick={() => void handleNotificationClick(notification)}
                        className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50 disabled:opacity-60 ${
                          !notification.isRead ? 'bg-blue-50/40' : 'bg-white'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          !notification.isRead
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-[11px] text-slate-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>

                        {markingReadId === notification.id ? (
                          <Loader2 size={15} className="mt-1 shrink-0 animate-spin text-primary-500" />
                        ) : !notification.isRead ? (
                          <Check size={15} className="mt-1 shrink-0 text-primary-500" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
                <p className="text-center text-[11px] text-slate-400">
                  Your notifications are private to your account
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCOUNT AVATAR AND DROPDOWN */}
        <div
          ref={accountRef}
          className="relative"
          onMouseEnter={() => setShowAccountMenu(true)}
          onMouseLeave={() => setShowAccountMenu(false)}
        >
          <button
            type="button"
            onClick={handleProfileClick}
            onFocus={() => setShowAccountMenu(true)}
            aria-label={`Open profile for ${patientName}`}
            aria-haspopup="true"
            aria-expanded={showAccountMenu}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 transition hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            title={patientName}
          >
            {initial}
          </button>

          {showAccountMenu && (
            <div className="absolute right-0 top-full z-50 w-52 pt-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {patientName}
                  </p>
                  <p className="text-xs text-slate-400">Patient Account</p>
                </div>

                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-primary-600"
                >
                  <UserRound size={17} />
                  My Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <LogOut size={17} />
                  )}
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>

                {logoutError && (
                  <p className="px-4 py-2 text-xs text-red-600">
                    {logoutError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default PatientTopbar
