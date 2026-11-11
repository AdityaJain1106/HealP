
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  UserRound,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import {
  getDoctorAppointments,
  respondToAppointment,
} from '../../services/doctorAppointmentService'

import type {
  PatientAppointment,
  AppointmentStatus,
} from '../../services/patientAppointmentService'
import { usePageTitle } from '../../hooks/usePageTitle'

type StatusFilter = 'all' | AppointmentStatus

function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [activeResponseId, setActiveResponseId] = useState<string | null>(null)
  const [doctorResponse, setDoctorResponse] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const loadAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')
      const data = await getDoctorAppointments()
      setAppointments(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load appointments.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadAppointments()
  }, [loadAppointments])

  const filteredAppointments = useMemo(() => {
    if (filter === 'all') return appointments

    return appointments.filter(
      (appointment) => appointment.status === filter
    )
  }, [appointments, filter])

  const counts = useMemo(() => ({
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    accepted: appointments.filter((a) => a.status === 'accepted').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  }), [appointments])

  const handleResponse = async (
    appointmentId: string,
    status: 'accepted' | 'rejected'
  ) => {
    try {
      setProcessingId(appointmentId)
      setError('')
      setSuccessMessage('')

      await respondToAppointment(appointmentId, {
        status,
        doctorResponse: doctorResponse.trim() || undefined,
      })

      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.appointmentId === appointmentId
            ? {
              ...appointment,
              status,
              doctorResponse: doctorResponse.trim() || null,
            }
            : appointment
        )
      )

      setActiveResponseId(null)
      setDoctorResponse('')
      setSuccessMessage(
        status === 'accepted'
          ? 'Appointment accepted successfully.'
          : 'Appointment rejected successfully.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update appointment.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (date: string) => {
  usePageTitle('Appointments')
    const parsed = new Date(`${date}T00:00:00`)

    if (Number.isNaN(parsed.getTime())) return date

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed)
  }

  const formatTime = (time: string) => {
  usePageTitle('Appointments')
    const [hours, minutes] = time.split(':').map(Number)

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return time
    }

    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const getStatusStyle = (status: AppointmentStatus) => {
  usePageTitle('Appointments')
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

  const filters: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Pending', value: 'pending', count: counts.pending },
    { label: 'Accepted', value: 'accepted', count: counts.accepted },
    { label: 'Rejected', value: 'rejected', count: counts.rejected },
  ]

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" size={22} />
          Loading appointments...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/doctor"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Doctor Dashboard
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Appointment Inbox
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review and manage appointment requests from your patients.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAppointments(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={19} />
            {successMessage}
          </div>
        )}

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-xl border p-4 text-left transition ${filter === item.value
                  ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <p className="text-xs font-medium text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {item.count}
              </p>
            </button>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {filter === 'all'
                ? 'All Appointments'
                : `${filter.charAt(0).toUpperCase()}${filter.slice(1)} Appointments`}
            </h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {filteredAppointments.length}
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <CalendarDays
                size={38}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-semibold text-slate-800">
                No appointments found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {filter === 'pending'
                  ? 'You have no pending appointment requests.'
                  : 'Appointments matching this filter will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const isProcessing =
                  processingId === appointment.appointmentId

                return (
                  <article
                    key={appointment.appointmentId}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                          <UserRound size={22} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {appointment.patientName}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            Patient ID: {appointment.patientId}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(appointment.status)}`}
                      >
                        {appointment.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <CalendarDays size={18} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-400">Date</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(appointment.appointmentDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <Clock size={18} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-400">Time</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatTime(appointment.appointmentTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Reason for consultation
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {appointment.reason}
                      </p>
                    </div>

                    {appointment.doctorResponse && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <MessageSquare size={15} />
                          Your response
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {appointment.doctorResponse}
                        </p>
                      </div>
                    )}

                    {appointment.status === 'pending' && (
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        {activeResponseId === appointment.appointmentId ? (
                          <div>
                            <label
                              htmlFor={`response-${appointment.appointmentId}`}
                              className="text-sm font-medium text-slate-700"
                            >
                              Optional response to patient
                            </label>

                            <textarea
                              id={`response-${appointment.appointmentId}`}
                              rows={3}
                              maxLength={500}
                              value={doctorResponse}
                              onChange={(event) =>
                                setDoctorResponse(event.target.value)
                              }
                              placeholder="Add a message about the appointment..."
                              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="mt-3 flex flex-wrap gap-3">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  void handleResponse(
                                    appointment.appointmentId,
                                    'accepted'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {isProcessing ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                                Accept
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  void handleResponse(
                                    appointment.appointmentId,
                                    'rejected'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                              >
                                <XCircle size={16} />
                                Reject
                              </button>

                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  setActiveResponseId(null)
                                  setDoctorResponse('')
                                }}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveResponseId(appointment.appointmentId)
                              setDoctorResponse('')
                              setSuccessMessage('')
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            <MessageSquare size={16} />
                            Respond to Request
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DoctorAppointmentsPage
