import { Link } from 'react-router-dom'
import {
  Stethoscope,
  Users,
  CalendarDays,
  FileText,
} from 'lucide-react'
import { ROUTES } from '../../routes/routePaths'

function DoctorDashboardPage() {
  const modules = [
    {
      title: 'Patient Search',
      description: 'Find and access authorized patient records.',
      icon: Users,
    },
    {
      title: 'Appointments',
      description: 'Manage appointments and follow-ups.',
      icon: CalendarDays,
    },
    {
      title: 'Patient Records',
      description: 'Review medical history and uploaded reports.',
      icon: FileText,
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to={ROUTES.HOME}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Home
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <Stethoscope className="text-emerald-600" size={32} />

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Doctor Dashboard
            </h1>

            <p className="mt-1 text-slate-500">
              Your healthcare management workspace.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {modules.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Icon className="text-emerald-600" size={28} />

              <h2 className="mt-4 font-semibold text-slate-900">
                {title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default DoctorDashboardPage