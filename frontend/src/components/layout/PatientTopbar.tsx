import {
  Bell,
  Search,
  Menu,
} from 'lucide-react'

interface PatientTopbarProps {
  patientName?: string
  onMenuClick?: () => void
}

function PatientTopbar({
  patientName = 'Patient',
  onMenuClick,
}: PatientTopbarProps) {
  const initial = patientName.charAt(0).toUpperCase()

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

        {/* SEARCH */}

        <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 md:flex">
          <Search size={17} className="text-slate-400" />

          <span className="text-sm text-slate-400">
            Search health records
          </span>
        </div>

        {/* NOTIFICATIONS */}

        <div
          role="img"
          aria-label="Notifications indicator"
          className="relative rounded-xl p-2.5 text-slate-500"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </div>

        {/* PATIENT AVATAR */}

        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700"
          title={patientName}
          aria-label={`Patient avatar for ${patientName}`}
        >
          {initial}
        </div>

      </div>

    </header>
  )
}

export default PatientTopbar