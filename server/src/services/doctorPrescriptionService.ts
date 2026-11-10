
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../config/firebaseAdmin.js'
import {
  verifyDoctorPatientPermission,
  DoctorPatientAccessError,
} from './doctorRecordAccessService.js'
import type {
  DoctorPrescription,
  DoctorPrescriptionMedicine,
  DoctorPrescriptionVersion,
} from '../types/doctorPrescription.js'

export interface CreateDoctorPrescriptionInput {
  diagnosis: string
  hospitalName?: string | null
  prescriptionDate: string
  followUpDate?: string | null
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions?: string[]
}

export class DoctorPrescriptionError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message)
    this.name = 'DoctorPrescriptionError'
  }
}

const MAX_MEDICINES = 30
const MAX_INSTRUCTIONS = 20

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  )
}

function optionalText(
  value: unknown,
  maxLength: number
): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw new DoctorPrescriptionError('Invalid text field.')
  }

  const normalized = value.trim()

  if (normalized.length > maxLength) {
    throw new DoctorPrescriptionError('Text field is too long.')
  }

  return normalized || null
}

function validateInput(input: CreateDoctorPrescriptionInput) {
  if (!input || typeof input !== 'object') {
    throw new DoctorPrescriptionError('Invalid prescription data.')
  }

  if (
    typeof input.diagnosis !== 'string' ||
    !input.diagnosis.trim() ||
    input.diagnosis.length > 1000
  ) {
    throw new DoctorPrescriptionError(
      'Diagnosis must contain 1–1000 characters.'
    )
  }

  if (
    typeof input.prescriptionDate !== 'string' ||
    !validDate(input.prescriptionDate)
  ) {
    throw new DoctorPrescriptionError('Invalid prescription date.')
  }

  if (
    input.followUpDate != null &&
    input.followUpDate !== '' &&
    (typeof input.followUpDate !== 'string' ||
      !validDate(input.followUpDate))
  ) {
    throw new DoctorPrescriptionError('Invalid follow-up date.')
  }

  if (
    !Array.isArray(input.medicines) ||
    input.medicines.length === 0 ||
    input.medicines.length > MAX_MEDICINES
  ) {
    throw new DoctorPrescriptionError(
      'A prescription must contain 1–30 medicines.'
    )
  }

  const medicines = input.medicines.map((medicine) => {
    if (
      !medicine ||
      typeof medicine !== 'object' ||
      typeof medicine.name !== 'string' ||
      !medicine.name.trim() ||
      medicine.name.length > 200
    ) {
      throw new DoctorPrescriptionError('Invalid medicine name.')
    }

    const details = medicine.prescriptionDetails

    if (!details || typeof details !== 'object') {
      throw new DoctorPrescriptionError(
        'Medicine prescription details are required.'
      )
    }

    const normalizedDetails = {
      strength: optionalText(details.strength, 100),
      dosage: optionalText(details.dosage, 200),
      route: optionalText(details.route, 100),
      frequency: optionalText(details.frequency, 200),
      duration: optionalText(details.duration, 200),
      instructions: optionalText(details.instructions, 1000),
    }

    if (!normalizedDetails.dosage || !normalizedDetails.frequency) {
      throw new DoctorPrescriptionError(
        'Each medicine requires dosage and frequency.'
      )
    }

    return {
      name: medicine.name.trim(),
      prescriptionDetails: normalizedDetails,
    }
  })

  const instructions = input.additionalInstructions ?? []

  if (
    !Array.isArray(instructions) ||
    instructions.length > MAX_INSTRUCTIONS ||
    instructions.some(
      (item) =>
        typeof item !== 'string' ||
        !item.trim() ||
        item.length > 1000
    )
  ) {
    throw new DoctorPrescriptionError(
      'Invalid additional instructions.'
    )
  }

  return {
    diagnosis: input.diagnosis.trim(),
    hospitalName: optionalText(input.hospitalName, 200),
    prescriptionDate: input.prescriptionDate,
    followUpDate: input.followUpDate || null,
    medicines,
    additionalInstructions: instructions.map((item) => item.trim()),
  }
}

export async function createDoctorPrescription(
  doctorId: string,
  patientId: string,
  input: CreateDoctorPrescriptionInput
): Promise<string> {
  const validated = validateInput(input)

  // Preliminary authorization; repeated inside transaction.
  await verifyDoctorPatientPermission(
    doctorId,
    patientId,
    'prescriptionCreation'
  )

  const doctorRef = adminDb.collection('users').doc(doctorId)
  const patientRef = adminDb.collection('users').doc(patientId)

  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc()

  const versionRef = prescriptionRef
    .collection('versions')
    .doc()

  const notificationRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('notifications')
    .doc()

  const grantQuery = adminDb
    .collection('doctorPatientAccess')
    .where('doctorId', '==', doctorId)
    .where('patientId', '==', patientId)
    .where('status', '==', 'active')

  await adminDb.runTransaction(async (transaction) => {
    const grants = await transaction.get(grantQuery)

    const authorized = grants.docs.some((grant) => {
      const permissions = grant.data().permissions
      return (
        Array.isArray(permissions) &&
        permissions.includes('prescriptionCreation')
      )
    })

    if (!authorized) {
      throw new DoctorPatientAccessError(
        'Prescription creation permission is missing or revoked.'
      )
    }

    const doctorSnapshot = await transaction.get(doctorRef)
    const patientSnapshot = await transaction.get(patientRef)

    if (
      !doctorSnapshot.exists ||
      doctorSnapshot.data()?.role !== 'doctor' ||
      doctorSnapshot.data()?.accountStatus !== 'active'
    ) {
      throw new DoctorPrescriptionError(
        'Doctor account is not active.',
        403
      )
    }

    if (
      !patientSnapshot.exists ||
      patientSnapshot.data()?.role !== 'patient' ||
      patientSnapshot.data()?.accountStatus !== 'active'
    ) {
      throw new DoctorPrescriptionError(
        'Patient account is not active.',
        403
      )
    }

    const doctorName = doctorSnapshot.data()?.name

    if (
      typeof doctorName !== 'string' ||
      !doctorName.trim()
    ) {
      throw new DoctorPrescriptionError(
        'Doctor display name is unavailable.'
      )
    }

    const timestamp = FieldValue.serverTimestamp()

    const prescription = {
      prescriptionId: prescriptionRef.id,
      patientId,
      doctorId,
      doctorName: doctorName.trim(),
      ...validated,
      status: 'pending_patient_review',
      clarificationRequest: null,
      clarificationResponse: null,
      acceptedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    } satisfies DoctorPrescription

    const initialVersion = {
      versionId: versionRef.id,
      prescriptionId: prescriptionRef.id,
      versionNumber: 1,
      changedBy: doctorId,
      changeReason: 'Initial prescription',
      prescriptionData: {
        prescriptionId: prescriptionRef.id,
        patientId,
        doctorId,
        doctorName: doctorName.trim(),
        ...validated,
        status: 'pending_patient_review',
        clarificationRequest: null,
        clarificationResponse: null,
      },
      createdAt: timestamp,
    } satisfies DoctorPrescriptionVersion

    transaction.set(prescriptionRef, prescription)
    transaction.set(versionRef, initialVersion)

    transaction.set(notificationRef, {
      title: 'New Prescription',
      message:
        `${doctorName.trim()} has created a prescription for your review.`,
      type: 'prescription',
      route: '/patient/doctor-prescriptions',
      isRead: false,
      createdAt: timestamp,
    })
  })

  return prescriptionRef.id
}




export async function getDoctorPrescriptionInbox(
  doctorId: string
): Promise<DoctorPrescription[]> {
  const snapshot = await adminDb
    .collectionGroup('doctorPrescriptions')
    .where('doctorId', '==', doctorId)
    .get()

  const prescriptions: DoctorPrescription[] = snapshot.docs.map(
    (document) => ({
      ...(document.data() as DoctorPrescription),
      prescriptionId: document.id,
    })
  )

  return prescriptions
    .filter(
      (prescription) =>
        prescription.status === 'clarification_requested' &&
        !prescription.clarificationResponse
    )
    .sort((a, b) => {
      const aTime =
        a.updatedAt && 'toMillis' in a.updatedAt
          ? a.updatedAt.toMillis()
          : 0

      const bTime =
        b.updatedAt && 'toMillis' in b.updatedAt
          ? b.updatedAt.toMillis()
          : 0

      return bTime - aTime
    })
}

/**
 * Retrieves prescription version history for its original doctor.
 * Only the doctor who created the prescription can access its versions.
 */
export async function getDoctorPrescriptionVersions(
  doctorId: string,
  patientId: string,
  prescriptionId: string
): Promise<DoctorPrescriptionVersion[]> {
  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)

  const prescriptionSnapshot = await prescriptionRef.get()

  if (!prescriptionSnapshot.exists) {
    throw new DoctorPrescriptionError(
      'Prescription not found.',
      404
    )
  }

  const prescription = prescriptionSnapshot.data()!

  if (
    prescription.doctorId !== doctorId ||
    prescription.patientId !== patientId
  ) {
    throw new DoctorPrescriptionError(
      'You cannot access this prescription history.',
      403
    )
  }

  const versionsSnapshot = await prescriptionRef
    .collection('versions')
    .orderBy('versionNumber', 'desc')
    .get()

  return versionsSnapshot.docs.map((document) => ({
    ...(document.data() as DoctorPrescriptionVersion),
    versionId: document.id,
  }))
}

export interface AmendDoctorPrescriptionInput
  extends CreateDoctorPrescriptionInput {
  changeReason: string
}

export async function amendDoctorPrescription(
  doctorId: string,
  patientId: string,
  prescriptionId: string,
  input: AmendDoctorPrescriptionInput
): Promise<string> {
  if (
    typeof input.changeReason !== 'string' ||
    input.changeReason.trim().length < 5 ||
    input.changeReason.trim().length > 500
  ) {
    throw new DoctorPrescriptionError(
      'Change reason must contain 5–500 characters.'
    )
  }

  const validated = validateInput(input)

  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)

  const versionsRef = prescriptionRef.collection('versions')
  const newVersionRef = versionsRef.doc()

  const notificationRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('notifications')
    .doc()

  await adminDb.runTransaction(async (transaction) => {
    const prescriptionSnapshot = await transaction.get(prescriptionRef)

    if (!prescriptionSnapshot.exists) {
      throw new DoctorPrescriptionError(
        'Prescription not found.',
        404
      )
    }

    const current = prescriptionSnapshot.data()!

    if (current.doctorId !== doctorId) {
      throw new DoctorPrescriptionError(
        'You cannot modify this prescription.',
        403
      )
    }

    if (current.patientId !== patientId) {
      throw new DoctorPrescriptionError(
        'Patient does not match this prescription.',
        403
      )
    }

    if (
      current.status !== 'clarification_requested' ||
      current.clarificationResponse
    ) {
      throw new DoctorPrescriptionError(
        'This prescription is not awaiting an unanswered clarification.',
        409
      )
    }

    const latestVersionQuery = versionsRef
      .orderBy('versionNumber', 'desc')
      .limit(1)

    const latestVersionSnapshot = await transaction.get(
      latestVersionQuery
    )

    const latestVersionNumber = latestVersionSnapshot.empty
      ? 1
      : Number(
        latestVersionSnapshot.docs[0].data().versionNumber
      )

    if (
      !Number.isInteger(latestVersionNumber) ||
      latestVersionNumber < 1
    ) {
      throw new DoctorPrescriptionError(
        'Unable to determine prescription version.'
      )
    }

    const nextVersionNumber = latestVersionNumber + 1
    const timestamp = FieldValue.serverTimestamp()

    const prescriptionData = {
      prescriptionId,
      patientId,
      doctorId,
      doctorName: current.doctorName,
      ...validated,
      status: 'pending_patient_review' as const,
      clarificationRequest: null,
      clarificationResponse: null,
    }

    const version: DoctorPrescriptionVersion = {
      versionId: newVersionRef.id,
      prescriptionId,
      versionNumber: nextVersionNumber,
      changedBy: doctorId,
      changeReason: input.changeReason.trim(),
      prescriptionData,
      createdAt: timestamp,
    }

    transaction.update(prescriptionRef, {
      ...prescriptionData,
      acceptedAt: null,
      updatedAt: timestamp,
    })

    transaction.set(newVersionRef, version)

    transaction.set(notificationRef, {
      title: 'Prescription Amended',
      message:
        `${current.doctorName} has amended your prescription. Please review the updated version.`,
      type: 'prescription',
      route: '/patient/doctor-prescriptions',
      isRead: false,
      createdAt: timestamp,
    })
  })

  return newVersionRef.id
}


export async function explainDoctorPrescription(
  doctorId: string,
  patientId: string,
  prescriptionId: string,
  explanation: string
): Promise<void> {
  if (
    typeof explanation !== 'string' ||
    explanation.trim().length < 5 ||
    explanation.trim().length > 2000
  ) {
    throw new DoctorPrescriptionError(
      'Explanation must contain 5–2000 characters.'
    )
  }

  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)

  const notificationRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('notifications')
    .doc()

  await adminDb.runTransaction(async (transaction) => {
    const prescriptionSnapshot = await transaction.get(
      prescriptionRef
    )

    if (!prescriptionSnapshot.exists) {
      throw new DoctorPrescriptionError(
        'Prescription not found.',
        404
      )
    }

    const prescription = prescriptionSnapshot.data()!

    if (
      prescription.doctorId !== doctorId ||
      prescription.patientId !== patientId
    ) {
      throw new DoctorPrescriptionError(
        'You cannot respond to this prescription.',
        403
      )
    }

    if (
      prescription.status !== 'clarification_requested' ||
      prescription.clarificationResponse
    ) {
      throw new DoctorPrescriptionError(
        'This prescription is not awaiting an unanswered clarification.',
        409
      )
    }

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(prescriptionRef, {
      clarificationResponse: explanation.trim(),
      updatedAt: timestamp,
    })

    transaction.set(notificationRef, {
      title: 'Doctor Responded to Your Question',
      message:
        `${prescription.doctorName} has responded to your prescription clarification request.`,
      type: 'prescription',
      route: '/patient/doctor-prescriptions',
      isRead: false,
      createdAt: timestamp,
    })
  })
}

/**
 * Retrieves a patient's doctor-issued prescriptions.
 * Requires explicit active prescriptions permission.
 */
export async function getDoctorPatientPrescriptions(
  doctorId: string,
  patientId: string
): Promise<DoctorPrescription[]> {
  // Verify active patient consent before retrieving prescriptions.
  await verifyDoctorPatientPermission(
    doctorId,
    patientId,
    'prescriptions'
  )

  const snapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .orderBy('prescriptionDate', 'desc')
    .get()

  return snapshot.docs.map((document) => ({
    ...(document.data() as DoctorPrescription),
    prescriptionId: document.id,
  }))
}