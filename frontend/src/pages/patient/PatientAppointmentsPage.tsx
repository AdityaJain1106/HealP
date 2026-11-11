
import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  UserRound,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ClipboardList,
} from 'lucide-react'

import {
  getPatientDoctorAccess,
} from '../../services/patientAccessManagementService'

import type {
  PatientDoctorAccess,
} from '../../services/patientAccessManagementService'

import {
  createPatientAppointment,
  getPatientAppointments,
} from '../../services/patientAppointmentService'

import type {
  PatientAppointment,
} from '../../services/patientAppointmentService'
import { usePageTitle } from '../../hooks/usePageTitle'

function getLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusStyle(status: PatientAppointment['status']) {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border-slate-200'
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

function PatientAppointmentsPage() {
  usePageTitle('Appointments')
  const [accesses, setAccesses] = useState<PatientDoctorAccess[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])

  const [doctorId, setDoctorId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [reason, setReason] = useState('')

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [accessResults, appointmentResults] = await Promise.all([
        getPatientDoctorAccess(),
        getPatientAppointments(),
      ])

      const eligibleDoctors = accessResults.filter(
        (access) => access.permissions.includes('medicalHistory')
      )

      setAccesses(eligibleDoctors)
      setAppointments(appointmentResults)

      setDoctorId((previous) => {
        if (eligibleDoctors.some((doctor) => doctor.doctorId === previous)) {
          return previous
        }

        return eligibleDoctors[0]?.doctorId ?? ''
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load appointment information.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!doctorId || !appointmentDate || !appointmentTime || !reason.trim()) {
      setError('Please complete all appointment details.')
      return
    }

    const selectedDoctor = accesses.find(
      (access) => access.doctorId === doctorId
    )

    if (!selectedDoctor) {
      setError('Please select an eligible doctor.')
      return
    }

    try {
      setBooking(true)
      setError('')
      setSuccess('')

      await createPatientAppointment({
        doctorId: selectedDoctor.doctorId,
        accessGrantId: selectedDoctor.grantId,
        appointmentDate,
        appointmentTime,
        reason: reason.trim(),
      })

      setSuccess('Appointment request submitted successfully!')
      setAppointmentDate('')
      setAppointmentTime('')
      setReason('')

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit appointment request.'
      )
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 pt-6">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-blue-600" size={25} />
            <h1 className="text-2xl font-bold text-slate-900">
              Appointments
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Book consultations with doctors authorized to access your medical history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={19} />
          <p>{success}</p>
        </div>
      )}

      {/* Booking form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Book an Appointment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a request for your selected doctor.
            </p>
          </div>
        </div>

        {accesses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Stethoscope size={30} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-800">
              No eligible doctors available
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You need to approve a doctor's access request with Medical History permission before booking an appointment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-5">

            {/* Doctor selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Doctor
              </label>

              <select
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {accesses.map((doctor) => (
                  <option key={doctor.grantId} value={doctor.doctorId}>
                    {doctor.doctorName}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Only doctors with active Medical History permission are listed.
              </p>
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={appointmentDate}
                    min={getLocalDate()}
                    onChange={(event) => setAppointmentDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment Time
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(event) => setAppointmentTime(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Reason for Consultation
              </label>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Briefly describe why you need this appointment..."
                rows={4}
                minLength={5}
                maxLength={500}
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {reason.length}/500 characters
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={booking || !doctorId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {booking ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CalendarDays size={17} />
                )}
                {booking ? 'Submitting Request...' : 'Request Appointment'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Appointment history */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              My Appointments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Track your appointment requests and their status.
            </p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CalendarDays size={30} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-800">
              No appointments yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Your appointment requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article
                key={appointment.appointmentId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <UserRound size={21} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {appointment.doctorName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(appointment.appointmentDate)}
                        {' · '}
                        {appointment.appointmentTime}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(appointment.status)}`}
                  >
                    {appointment.status === 'accepted' ? (
                      <CheckCircle2 size={13} />
                    ) : appointment.status === 'rejected' ? (
                      <XCircle size={13} />
                    ) : (
                      <Clock size={13} />
                    )}
                    {appointment.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Reason for consultation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {appointment.reason}
                  </p>
                </div>

                {appointment.doctorResponse && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-xs font-semibold text-blue-700">
                      Doctor's Response
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {appointment.doctorResponse}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PatientAppointmentsPage
