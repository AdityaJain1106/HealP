import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  UserRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'

import {
  getDoctorApprovedPatients,
} from '../../services/doctorPatientService'

import type {
  DoctorApprovedPatient,
  DoctorAccessPermission,
} from '../../services/doctorPatientService'

import { ROUTES } from '../../routes/routePaths'

const permissionLabels: Record<DoctorAccessPermission, string> = {
  profile: 'Patient Profile',
  medicalHistory: 'Medical History',
  documents: 'Reports & Documents',
  prescriptions: 'Prescription Records',
  prescriptionCreation: 'Create New Prescriptions',
}

function DoctorMyPatientsPage() {
  const [patients, setPatients] = useState<DoctorApprovedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadPatients(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const result = await getDoctorApprovedPatients()
      setPatients(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your patients.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadPatients()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to={ROUTES.DOCTOR_DASHBOARD}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Doctor Dashboard
        </Link>

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                My Patients
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Patients who have granted you access to their records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadPatients(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="text-emerald-600" size={22} />
              <p className="text-sm font-medium text-slate-500">
                Approved Patients
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? '—' : patients.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={22} />
              <p className="text-sm font-medium text-slate-500">
                Consent Protected
              </p>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Every patient listed here has an active access grant.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 size={30} className="animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500">
              Loading your approved patients...
            </p>
          </div>
        ) : !error && patients.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <UserRound size={30} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No approved patients yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Patients will appear here after they approve your access requests.
            </p>

            <Link
              to={ROUTES.DOCTOR_PATIENT_SEARCH}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search Patients
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Your Patient List
              </h2>

              <span className="text-sm text-slate-500">
                {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
              </span>
            </div>

            {patients.map((patient) => (
              <article
                key={patient.grantId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <UserCircle size={27} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {patient.name}
                      </h3>

                      <p className="mt-1 break-all text-xs text-slate-500">
                        Patient ID: {patient.patientId}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={14} />
                    Access Active
                  </span>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      Approved Permissions
                    </h4>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {patient.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                      >
                        {permissionLabels[permission]}
                      </span>
                    ))}
                  </div>

                  {patient.grantedAt && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={14} />
                      Access granted:{' '}
                      {new Date(
                        typeof patient.grantedAt === 'object'
                          ? (patient.grantedAt._seconds ??
                            patient.grantedAt.seconds ??
                            0) * 1000
                          : patient.grantedAt
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                  <Link
                    to={ROUTES.DOCTOR_PATIENT_WORKSPACE.replace(
                      ':patientId',
                      encodeURIComponent(patient.patientId)
                    )}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Open Patient Record
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default DoctorMyPatientsPage