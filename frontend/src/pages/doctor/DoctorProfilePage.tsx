import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Stethoscope,
  User,
  Mail,
  Phone,
  Award,
  Building2,
  MapPin,
  FileCheck2,
  ShieldCheck,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import {
  getDoctorProfile,
  updateDoctorProfile,
  type DoctorProfile,
  type UpdateDoctorProfileInput,
} from '../../services/doctorProfileService'
import { logoutUser } from '../../services/authService'
import { ROUTES } from '../../routes/routePaths'

const specializationsList = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Psychiatrist',
  'Gynecologist',
  'Ophthalmologist',
  'ENT Specialist',
  'Gastroenterologist',
  'Pulmonologist',
  'Oncologist',
  'Endocrinologist',
  'Nephrologist',
  'Urologist',
  'Radiologist',
  'General Surgeon',
]

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700'
const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm'

export default function DoctorProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [initialProfile, setInitialProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDoctorProfile() {
      setLoading(true)
      setError('')

      try {
        const data = await getDoctorProfile()
        if (cancelled) return

        setProfile(data)
        setInitialProfile(data)
      } catch (err) {
        console.error('Failed to load doctor profile:', err)
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load profile. Please refresh and try again.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadDoctorProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleFieldChange = (field: keyof UpdateDoctorProfileInput, value: string) => {
    if (!profile) return
    setProfile({
      ...profile,
      [field]: value,
    })
    setError('')
    setSuccess('')
  }

  const handleReset = () => {
    if (initialProfile) {
      setProfile({ ...initialProfile })
      setError('')
      setSuccess('')
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    try {
      setLoggingOut(true)
      await logoutUser()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log out.')
      setLoggingOut(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!profile) return

    if (!profile.name.trim()) {
      setError('Please provide your full legal name.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload: UpdateDoctorProfileInput = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        specialization: profile.specialization.trim(),
        qualification: profile.qualification.trim(),
        experience: profile.experience.trim(),
        registrationNumber: profile.registrationNumber.trim(),
        issuingCouncil: profile.issuingCouncil.trim(),
        workplaceName: profile.workplaceName.trim(),
        workplaceAddress: profile.workplaceAddress.trim(),
        bio: profile.bio.trim(),
      }

      await updateDoctorProfile(payload)
      setInitialProfile({ ...profile })
      setSuccess('Your professional profile has been successfully saved.')
    } catch (err) {
      console.error('Failed to save doctor profile:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update profile. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const doctorName =
    profile?.name ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'Doctor'

  const initials = doctorName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isPending = profile?.accountStatus === 'pending'

  return (
    <main className="min-h-screen bg-slate-50">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.DOCTOR_DASHBOARD}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Return to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm">
                <Stethoscope size={20} />
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900">
                  HealP Doctor Portal
                </p>
                <p className="text-xs text-slate-500">Professional Profile</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Dr. {doctorName}
              </p>
              <p className="text-xs text-slate-500">
                {profile?.specialization || 'Healthcare Professional'}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {initials}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            to={ROUTES.DOCTOR_DASHBOARD}
            className="hover:text-blue-600 transition"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-800">Doctor Profile</span>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 size={36} className="animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading doctor credentials and profile...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Fetching verified records from Firebase.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && !profile && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-600" />
            <p className="font-semibold">Unable to load profile</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* PROFILE CONTENT */}
        {!loading && profile && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* HERO / BADGE CARD */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">
                    {initials}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold sm:text-3xl">
                        Dr. {doctorName}
                      </h1>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-100 backdrop-blur">
                          <Clock size={13} />
                          Verification Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur">
                          <ShieldCheck size={14} />
                          Verified Doctor
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-blue-100">
                      {profile.specialization || 'Specialization not set'}
                      {profile.qualification ? ` • ${profile.qualification}` : ''}
                    </p>

                    <p className="mt-1 text-xs text-blue-200">
                      Registration No:{' '}
                      <span className="font-mono font-medium text-white">
                        {profile.registrationNumber || 'Not specified'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur">
                    <p className="text-xs text-blue-200">Experience</p>
                    <p className="text-base font-semibold text-white">
                      {profile.experience ? `${profile.experience}` : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur">
                    <p className="text-xs text-blue-200">Workplace</p>
                    <p className="text-base font-semibold text-white truncate max-w-[150px]">
                      {profile.workplaceName || 'Private Practice'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Background decorative circles */}
              <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[30px] border-white/10" />
            </section>

            {/* ALERT BANNERS */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <AlertCircle size={18} className="shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <p>{success}</p>
              </div>
            )}

            {/* SECTION 1: PERSONAL & CONTACT */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Personal & Contact Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your public professional identification and contact details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <User size={15} className="text-slate-400" />
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Will appear on prescriptions and consultation summaries.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    <Mail size={15} className="text-slate-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={profile.email}
                    className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Account email is managed via Firebase Authentication.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    <Phone size={15} className="text-slate-400" />
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Used for clinic coordination and emergency inquiries.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    <ShieldCheck size={15} className="text-slate-400" />
                    Account Verification Status
                  </label>
                  <div className="flex h-[46px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isPending ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="capitalize">
                      {profile.accountStatus || 'Active'}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      RBAC Enforced
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: PROFESSIONAL & LICENSING */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                  <Award size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Medical Licensing & Credentials
                  </h2>
                  <p className="text-xs text-slate-500">
                    Regulatory registration and specialization details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Stethoscope size={15} className="text-slate-400" />
                    Primary Specialization
                  </label>
                  <input
                    type="text"
                    list="specialization-options"
                    value={profile.specialization}
                    onChange={(e) =>
                      handleFieldChange('specialization', e.target.value)
                    }
                    placeholder="Select or enter specialization"
                    className={inputClass}
                  />
                  <datalist id="specialization-options">
                    {specializationsList.map((spec) => (
                      <option key={spec} value={spec} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className={labelClass}>
                    <Award size={15} className="text-slate-400" />
                    Medical Qualifications
                  </label>
                  <input
                    type="text"
                    value={profile.qualification}
                    onChange={(e) =>
                      handleFieldChange('qualification', e.target.value)
                    }
                    placeholder="e.g. MBBS, MD (Internal Medicine)"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <FileCheck2 size={15} className="text-slate-400" />
                    Medical Registration Number
                  </label>
                  <input
                    type="text"
                    value={profile.registrationNumber}
                    onChange={(e) =>
                      handleFieldChange('registrationNumber', e.target.value)
                    }
                    placeholder="e.g. MCI-2015-987456"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Official registration number with your medical council.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    <Building2 size={15} className="text-slate-400" />
                    Issuing Medical Council
                  </label>
                  <input
                    type="text"
                    value={profile.issuingCouncil}
                    onChange={(e) =>
                      handleFieldChange('issuingCouncil', e.target.value)
                    }
                    placeholder="e.g. National Medical Commission / State Council"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <Clock size={15} className="text-slate-400" />
                    Years of Clinical Experience
                  </label>
                  <input
                    type="text"
                    value={profile.experience}
                    onChange={(e) =>
                      handleFieldChange('experience', e.target.value)
                    }
                    placeholder="e.g. 10 years"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: WORKPLACE & CLINIC */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Workplace & Clinical Practice
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hospital affiliation or clinic address for consultations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    <Building2 size={15} className="text-slate-400" />
                    Hospital / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={profile.workplaceName}
                    onChange={(e) =>
                      handleFieldChange('workplaceName', e.target.value)
                    }
                    placeholder="e.g. City General Hospital or Care Clinic"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    <MapPin size={15} className="text-slate-400" />
                    Workplace / Clinic Address
                  </label>
                  <input
                    type="text"
                    value={profile.workplaceAddress}
                    onChange={(e) =>
                      handleFieldChange('workplaceAddress', e.target.value)
                    }
                    placeholder="e.g. 45 Healthcare Avenue, Suite 300"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 4: PROFESSIONAL BIO */}
            <section className={sectionClass}>
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Professional Biography & Clinical Focus
                  </h2>
                  <p className="text-xs text-slate-500">
                    Brief introduction shown to patients when reviewing your credentials.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Doctor Biography & Clinical Interests
                </label>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={profile.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Share your areas of clinical focus, subspecialty interests, and patient care philosophy..."
                  className={inputClass}
                />
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Maximum 1,000 characters</span>
                  <span>{profile.bio.length} / 1000</span>
                </div>
              </div>
            </section>

            {/* ACTION BAR */}
            <div className="flex flex-col-reverse items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>
                  Updates are recorded securely and linked to your verified credentials.
                </span>
              </div>

              <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Discard Changes
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Doctor Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

