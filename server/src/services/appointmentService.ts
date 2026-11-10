
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../config/firebaseAdmin.js'
import type { Appointment } from '../types/appointment.js'

export interface CreateAppointmentInput {
  doctorId: string
  accessGrantId: string
  appointmentDate: string
  appointmentTime: string
  reason: string
}

export class AppointmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppointmentError'
  }
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export async function createAppointmentRequest(
  patientId: string,
  input: CreateAppointmentInput
): Promise<string> {
  const {
    doctorId,
    accessGrantId,
    appointmentDate,
    appointmentTime,
    reason,
  } = input

  if (!patientId || !doctorId || !accessGrantId) {
    throw new AppointmentError('Required appointment information is missing.')
  }

  if (patientId === doctorId) {
    throw new AppointmentError('Invalid patient or doctor account.')
  }

  if (!isValidDate(appointmentDate)) {
    throw new AppointmentError('Please provide a valid appointment date.')
  }

  if (!isValidTime(appointmentTime)) {
    throw new AppointmentError('Please provide a valid appointment time.')
  }

  const normalizedReason = reason?.trim() ?? ''

  if (normalizedReason.length < 5 || normalizedReason.length > 500) {
    throw new AppointmentError(
      'The appointment reason must contain 5–500 characters.'
    )
  }

  const patientUserRef = adminDb.collection('users').doc(patientId)
  const patientProfileRef = adminDb.collection('patients').doc(patientId)
  const doctorRef = adminDb.collection('users').doc(doctorId)
  const grantRef = adminDb
    .collection('doctorPatientAccess')
    .doc(accessGrantId)

  const appointmentRef = adminDb.collection('appointments').doc()

  const notificationRef = patientProfileRef
    .collection('notifications')
    .doc()

  await adminDb.runTransaction(async (transaction) => {
    const [
      patientUserSnapshot,
      patientProfileSnapshot,
      doctorSnapshot,
      grantSnapshot,
    ] = await Promise.all([
      transaction.get(patientUserRef),
      transaction.get(patientProfileRef),
      transaction.get(doctorRef),
      transaction.get(grantRef),
    ])

    if (
      !patientUserSnapshot.exists ||
      patientUserSnapshot.data()?.role !== 'patient' ||
      patientUserSnapshot.data()?.accountStatus !== 'active' ||
      !patientProfileSnapshot.exists
    ) {
      throw new AppointmentError('Active patient account was not found.')
    }

    if (
      !doctorSnapshot.exists ||
      doctorSnapshot.data()?.role !== 'doctor' ||
      doctorSnapshot.data()?.accountStatus !== 'active'
    ) {
      throw new AppointmentError('Active doctor account was not found.')
    }

    if (!grantSnapshot.exists) {
      throw new AppointmentError(
        'You do not have permission to book with this doctor.'
      )
    }

    const grant = grantSnapshot.data()!

    if (
      grant.patientId !== patientId ||
      grant.doctorId !== doctorId ||
      grant.status !== 'active' ||
      !Array.isArray(grant.permissions) ||
      !grant.permissions.includes('medicalHistory')
    ) {
      throw new AppointmentError(
        'Active medical history access is required to book this doctor.'
      )
    }

    const patientProfile = patientProfileSnapshot.data()!
    const doctor = doctorSnapshot.data()!

    const patientName =
      typeof patientProfile.name === 'string' &&
      patientProfile.name.trim()
        ? patientProfile.name.trim()
        : 'Patient'

    const doctorName =
      typeof doctor.name === 'string' && doctor.name.trim()
        ? doctor.name.trim()
        : 'Doctor'

    const timestamp = FieldValue.serverTimestamp()

    const appointment: Omit<
      Appointment,
      'createdAt' | 'updatedAt' | 'respondedAt'
    > & {
      createdAt: FirebaseFirestore.FieldValue
      updatedAt: FirebaseFirestore.FieldValue
      respondedAt: null
    } = {
      appointmentId: appointmentRef.id,
      patientId,
      patientName,
      doctorId,
      doctorName,
      accessGrantId,
      appointmentDate,
      appointmentTime,
      reason: normalizedReason,
      status: 'pending',
      doctorResponse: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      respondedAt: null,
    }

    transaction.set(appointmentRef, appointment)

    transaction.set(notificationRef, {
      title: 'Appointment Request Sent',
      message: `Your appointment request with ${doctorName} has been submitted and is awaiting confirmation.`,
      type: 'general',
      route: '/patient',
      isRead: false,
      createdAt: timestamp,
    })
  })

  return appointmentRef.id
}

// Get all appointments belonging to one patient
export async function getPatientAppointments(
  patientId: string
): Promise<Appointment[]> {
  if (!patientId) {
    throw new AppointmentError('Patient authentication is required.')
  }

  const snapshot = await adminDb
    .collection('appointments')
    .where('patientId', '==', patientId)
    .get()

  const appointments = snapshot.docs.map((doc) => {
    return doc.data() as Appointment
  })

  // Sort chronologically by appointment date and time
  appointments.sort((a, b) => {
    const dateComparison = a.appointmentDate.localeCompare(
      b.appointmentDate
    )

    if (dateComparison !== 0) {
      return dateComparison
    }

    return a.appointmentTime.localeCompare(b.appointmentTime)
  })

  return appointments
}
