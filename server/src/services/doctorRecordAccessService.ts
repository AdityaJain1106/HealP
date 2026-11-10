
import { adminDb } from '../config/firebaseAdmin.js'

import type {
  DoctorAccessPermission,
} from './doctorAccessService.js'

export interface DoctorPatientAccessGrant {
  grantId: string
  doctorId: string
  patientId: string
  permissions: DoctorAccessPermission[]
}

export class DoctorPatientAccessError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 403) {
    super(message)
    this.name = 'DoctorPatientAccessError'
    this.statusCode = statusCode
  }
}

export async function verifyDoctorPatientPermission(
  doctorId: string,
  patientId: string,
  requiredPermission: DoctorAccessPermission
): Promise<DoctorPatientAccessGrant> {
  if (!doctorId || !patientId || doctorId === patientId) {
    throw new DoctorPatientAccessError(
      'Invalid doctor or patient account.',
      400
    )
  }

  // Find an active grant belonging to this exact doctor-patient pair.
  const grantsSnapshot = await adminDb
    .collection('doctorPatientAccess')
    .where('doctorId', '==', doctorId)
    .where('patientId', '==', patientId)
    .where('status', '==', 'active')
    .limit(1)
    .get()

  if (grantsSnapshot.empty) {
    throw new DoctorPatientAccessError(
      'You do not have active access to this patient.'
    )
  }

  const grantDocument = grantsSnapshot.docs[0]
  const grantData = grantDocument.data()

  // Verify the requested permission is explicitly granted.
  if (
    !Array.isArray(grantData.permissions) ||
    !grantData.permissions.includes(requiredPermission)
  ) {
    throw new DoctorPatientAccessError(
      'You do not have permission to access this patient information.'
    )
  }

  // Verify the patient account is still active.
  const patientSnapshot = await adminDb
    .collection('users')
    .doc(patientId)
    .get()

  if (
    !patientSnapshot.exists ||
    patientSnapshot.data()?.role !== 'patient' ||
    patientSnapshot.data()?.accountStatus !== 'active'
  ) {
    throw new DoctorPatientAccessError(
      'This patient account is unavailable.'
    )
  }

  return {
    grantId: grantDocument.id,
    doctorId,
    patientId,
    permissions: grantData.permissions as DoctorAccessPermission[],
  }
}

// Retrieve medical history only when the doctor has explicit consent.
export async function getDoctorPatientMedicalHistory(
  doctorId: string,
  patientId: string
) {
  await verifyDoctorPatientPermission(
    doctorId,
    patientId,
    'medicalHistory'
  )

  const historySnapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('medicalHistory')
    .orderBy('date', 'desc')
    .get()

  return historySnapshot.docs.map((document) => {
    const data = document.data()

    // Return only fields belonging to the medical-history record.
    return {
      id: document.id,
      type:
        typeof data.type === 'string' ? data.type : '',
      title:
        typeof data.title === 'string' ? data.title : '',
      description:
        typeof data.description === 'string'
          ? data.description
          : '',
      date:
        typeof data.date === 'string' ? data.date : '',
      hospital:
        typeof data.hospital === 'string'
          ? data.hospital
          : undefined,
      doctor:
        typeof data.doctor === 'string'
          ? data.doctor
          : undefined,
      diagnosis:
        typeof data.diagnosis === 'string'
          ? data.diagnosis
          : undefined,
      medicines: Array.isArray(data.medicines)
        ? data.medicines.filter(
            (item: unknown): item is string =>
              typeof item === 'string'
          )
        : undefined,
      notes:
        typeof data.notes === 'string'
          ? data.notes
          : undefined,
      createdAt:
        data.createdAt?.toDate?.().toISOString() ?? null,
      updatedAt:
        data.updatedAt?.toDate?.().toISOString() ?? null,
    }
  })
}
