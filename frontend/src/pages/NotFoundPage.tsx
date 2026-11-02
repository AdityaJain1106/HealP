import { Link } from 'react-router-dom'
import { ROUTES } from '../routes/routePaths'

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-7xl font-bold text-blue-600">404</h1>

      <h2 className="mt-4 text-2xl font-semibold text-slate-900">
        Page Not Found
      </h2>

      <p className="mt-2 text-slate-500">
        The page you are looking for doesn't exist.
      </p>

      <Link
        to={ROUTES.HOME}
        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Return Home
      </Link>
    </main>
  )
}

export default NotFoundPage