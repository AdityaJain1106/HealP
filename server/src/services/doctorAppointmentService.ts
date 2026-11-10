
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../config/firebaseAdmin.js'
import type {
  Appointment,
  AppointmentStatus,
} from '../types/appointment.js'

export class DoctorAppointmentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message)
    this.name = 'DoctorAppointmentError'
  }
}

export interface RespondToAppointmentInput {
  status: 'accepted' | 'rejected'
  doctorResponse?: string
}

// Retrieve appointments assigned to the authenticated doctor
export async function getDoctorAppointments(
  doctorId: string
): Promise<Appointment[]> {
  if (!doctorId) {
    throw new DoctorAppointmentError(
      'Doctor authentication is required.',
      401
    )
  }

  const snapshot = await adminDb
    .collection('appointments')
    .where('doctorId', '==', doctorId)
    .get()

  const appointments = snapshot.docs.map((doc) => ({
    ...(doc.data() as Appointment),
    appointmentId: doc.id,
  }))

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

// Accept or reject a pending appointment request
export async function respondToAppointment(
  doctorId: string,
  appointmentId: string,
  input: RespondToAppointmentInput
): Promise<void> {
  if (!doctorId || !appointmentId) {
    throw new DoctorAppointmentError(
      'Required appointment information is missing.'
    )
  }

  if (
    !input ||
    !['accepted', 'rejected'].includes(input.status)
  ) {
    throw new DoctorAppointmentError(
      'Invalid appointment response.'
    )
  }

  const doctorResponse = input.doctorResponse?.trim() ?? ''

  if (doctorResponse.length > 500) {
    throw new DoctorAppointmentError(
      'Doctor response cannot exceed 500 characters.'
    )
  }

  const appointmentRef = adminDb
    .collection('appointments')
    .doc(appointmentId)

  await adminDb.runTransaction(async (transaction) => {
    const appointmentSnapshot = await transaction.get(
      appointmentRef
    )

    if (!appointmentSnapshot.exists) {
      throw new DoctorAppointmentError(
        'Appointment not found.',
        404
      )
    }

    const appointment = appointmentSnapshot.data()!

    if (appointment.doctorId !== doctorId) {
      throw new DoctorAppointmentError(
        'You cannot respond to this appointment.',
        403
      )
    }

    if (appointment.status !== 'pending') {
      throw new DoctorAppointmentError(
        'This appointment has already been processed.',
        409
      )
    }

    const doctorRef = adminDb
      .collection('users')
      .doc(doctorId)

    const doctorSnapshot = await transaction.get(doctorRef)

    if (
      !doctorSnapshot.exists ||
      doctorSnapshot.data()?.role !== 'doctor' ||
      doctorSnapshot.data()?.accountStatus !== 'active'
    ) {
      throw new DoctorAppointmentError(
        'Doctor account is not active.',
        403
      )
    }

    const patientId = appointment.patientId

    if (typeof patientId !== 'string' || !patientId) {
      throw new DoctorAppointmentError(
        'Appointment patient information is invalid.'
      )
    }

    const notificationRef = adminDb
      .collection('patients')
      .doc(patientId)
      .collection('notifications')
      .doc()

    const timestamp = FieldValue.serverTimestamp()

    const status: AppointmentStatus = input.status

    transaction.update(appointmentRef, {
      status,
      doctorResponse: doctorResponse || null,
      respondedAt: timestamp,
      updatedAt: timestamp,
    })

    transaction.set(notificationRef, {
      title:
        status === 'accepted'
          ? 'Appointment Accepted'
          : 'Appointment Rejected',
      message:
        status === 'accepted'
          ? `${appointment.doctorName} has accepted your appointment request.`
          : `${appointment.doctorName} has rejected your appointment request.`,
      type: 'general',
      route: '/patient/appointments',
      isRead: false,
      createdAt: timestamp,
    })
  })
}
