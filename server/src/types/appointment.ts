
export type AppointmentStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed'

type FirestoreTimestamp =
  | FirebaseFirestore.Timestamp
  | FirebaseFirestore.FieldValue

export interface Appointment {
  appointmentId: string

  patientId: string
  patientName: string

  doctorId: string
  doctorName: string

  accessGrantId: string

  appointmentDate: string
  appointmentTime: string

  reason: string

  status: AppointmentStatus

  doctorResponse: string | null

  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
  respondedAt: FirestoreTimestamp | null
}
