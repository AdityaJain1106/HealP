import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  createPatientProfile,
  getPatientProfile,
  updatePatientProfile,
} from '../../services/patientProfileService'
import type { PatientProfile } from '../../services/patientProfileService'

function createEmptyProfile(uid: string, name: string, email: string): PatientProfile {
  return {
    uid,
    name,
    email,
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    bloodGroup: '',
    height: '',
    weight: '',
    allergies: [],
    chronicConditions: [],
    currentMedicines: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    organDonor: false,
  }
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-2 block text-sm font-medium text-slate-700'
const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'

export default function PatientProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [profileExists, setProfileExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Capture the authenticated user's values after the null check.
    const uid = user.uid
    const name = user.displayName || ''
    const email = user.email || ''
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError('')
      try {
        const existingProfile = await getPatientProfile(uid)
        if (cancelled) return

        if (existingProfile) {
          setProfile(existingProfile)
          setProfileExists(true)
        } else {
          setProfile(createEmptyProfile(uid, name, email))
          setProfileExists(false)
        }
      } catch (err) {
        console.error('Error loading patient profile:', err)
        if (!cancelled) {
          setError('Unable to load your profile. Please refresh and try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user])

  function handleChange(
    field: keyof PatientProfile,
    value: string | boolean | string[],
  ) {
    setProfile((current) => (current ? { ...current, [field]: value } : current))
    setSuccess('')
    setError('')
  }

  function handleArrayChange(
    field: 'allergies' | 'chronicConditions' | 'currentMedicines',
    value: string,
  ) {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    handleChange(field, items)
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !profile) {
      setError('Please sign in again to save your profile.')
      return
    }
    if (!profile.name.trim()) {
      setError('Please enter your name.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (profileExists) {
        const {
          uid: _uid,
          email: _email,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...editableFields
        } = profile
        await updatePatientProfile(user.uid, editableFields)
      } else {
        await createPatientProfile({
          ...profile,
          uid: user.uid,
          email: user.email || '',
        })
        setProfileExists(true)
      }
      setSuccess('Your profile has been saved successfully.')
    } catch (err) {
      console.error('Error saving patient profile:', err)
      setError('Unable to save your profile. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Loading your health profile...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        {error || 'Unable to access your profile. Please sign in again.'}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div>
        <p className="text-sm font-medium text-blue-600">Account Settings</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information and medical details in one place.
        </p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <section className={sectionClass}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            <p className="mt-1 text-sm text-slate-500">Your basic personal and contact details.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input className={inputClass} value={profile.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter your full name" required />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input className={`${inputClass} cursor-not-allowed bg-slate-50`} value={profile.email} readOnly />
              <p className="mt-1 text-xs text-slate-400">Email is linked to your authenticated account.</p>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" className={inputClass} value={profile.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select className={inputClass} value={profile.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="tel" className={inputClass} value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Enter phone number" />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={profile.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Enter your address" />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Medical Information</h2>
            <p className="mt-1 text-sm text-slate-500">Important health information for your digital health record.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Blood Group</label>
              <select className={inputClass} value={profile.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input type="number" min="0" className={inputClass} value={profile.height} onChange={(e) => handleChange('height', e.target.value)} placeholder="e.g. 175" />
            </div>
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input type="number" min="0" step="0.1" className={inputClass} value={profile.weight} onChange={(e) => handleChange('weight', e.target.value)} placeholder="e.g. 68" />
            </div>
            <div>
              <label className={labelClass}>Known Allergies</label>
              <textarea rows={3} className={inputClass} value={profile.allergies.join(', ')} onChange={(e) => handleArrayChange('allergies', e.target.value)} placeholder="Separate multiple allergies with commas" />
            </div>
            <div>
              <label className={labelClass}>Chronic Conditions</label>
              <textarea rows={3} className={inputClass} value={profile.chronicConditions.join(', ')} onChange={(e) => handleArrayChange('chronicConditions', e.target.value)} placeholder="e.g. Diabetes, Asthma" />
            </div>
            <div>
              <label className={labelClass}>Current Medicines</label>
              <textarea rows={3} className={inputClass} value={profile.currentMedicines.join(', ')} onChange={(e) => handleArrayChange('currentMedicines', e.target.value)} placeholder="Separate medicines with commas" />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Emergency Information</h2>
            <p className="mt-1 text-sm text-slate-500">Details that may help during a medical emergency.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Emergency Contact Name</label>
              <input className={inputClass} value={profile.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} placeholder="Enter contact person's name" />
            </div>
            <div>
              <label className={labelClass}>Emergency Contact Phone</label>
              <input type="tel" className={inputClass} value={profile.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} placeholder="Enter emergency phone number" />
            </div>
            <div>
              <label className={labelClass}>Insurance Provider</label>
              <input className={inputClass} value={profile.insuranceProvider} onChange={(e) => handleChange('insuranceProvider', e.target.value)} placeholder="Enter insurance provider" />
            </div>
            <div>
              <label className={labelClass}>Insurance Policy Number</label>
              <input className={inputClass} value={profile.insurancePolicyNumber} onChange={(e) => handleChange('insurancePolicyNumber', e.target.value)} placeholder="Enter policy number" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Organ Donor</p>
              <p className="mt-1 text-xs text-slate-500">Indicate whether you are registered as an organ donor.</p>
            </div>
            <button type="button" role="switch" aria-checked={profile.organDonor} onClick={() => handleChange('organDonor', !profile.organDonor)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${profile.organDonor ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${profile.organDonor ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-400">Your profile information is saved to your authenticated account.</p>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
