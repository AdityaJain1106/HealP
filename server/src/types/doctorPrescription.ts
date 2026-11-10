
import type { PrescriptionDetails } from './prescription.js'

export type DoctorPrescriptionStatus =
  | 'pending_patient_review'
  | 'accepted'
  | 'clarification_requested'

export interface DoctorPrescriptionMedicine {
  name: string
  prescriptionDetails: PrescriptionDetails
}

type FirestoreTimestamp =
  | FirebaseFirestore.Timestamp
  | FirebaseFirestore.FieldValue

export interface DoctorPrescription {
  prescriptionId: string
  patientId: string
  doctorId: string

  doctorName: string
  hospitalName: string | null

  diagnosis: string
  prescriptionDate: string
  followUpDate: string | null

  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions: string[]

  status: DoctorPrescriptionStatus

  clarificationRequest: string | null
  clarificationResponse: string | null

  acceptedAt: FirestoreTimestamp | null
  createdAt: FirestoreTimestamp
  updatedAt: FirestoreTimestamp
}

export interface DoctorPrescriptionVersion {
  versionId: string
  prescriptionId: string
  versionNumber: number

  changedBy: string
  changeReason: string

  prescriptionData: Omit<
    DoctorPrescription,
    'createdAt' | 'updatedAt' | 'acceptedAt'
  >

  createdAt: FirestoreTimestamp
}
