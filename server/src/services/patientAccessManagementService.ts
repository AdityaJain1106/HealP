import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../config/firebaseAdmin.js'
import {
    DOCTOR_ACCESS_PERMISSIONS,
    type DoctorAccessPermission,
} from './doctorAccessService.js'


export interface PatientDoctorAccess {
    grantId: string
    doctorId: string
    doctorName: string
    permissions: DoctorAccessPermission[]
    grantedAt?: FirebaseFirestore.Timestamp
}

export async function getPatientDoctorAccess(
    patientId: string
): Promise<PatientDoctorAccess[]> {
    if (!patientId) {
        throw new Error('Patient ID is required.')
    }

    const grantsSnapshot = await adminDb
        .collection('doctorPatientAccess')
        .where('patientId', '==', patientId)
        .where('status', '==', 'active')
        .get()

    const activeAccess = await Promise.all(
        grantsSnapshot.docs.map(async (grantDocument) => {
            const grant = grantDocument.data()

            if (
                typeof grant.doctorId !== 'string' ||
                !Array.isArray(grant.permissions)
            ) {
                return null
            }

            const permissions = grant.permissions.filter(
                (permission: unknown): permission is DoctorAccessPermission =>
                    DOCTOR_ACCESS_PERMISSIONS.includes(
                        permission as DoctorAccessPermission
                    )
            )

            if (permissions.length === 0) {
                return null
            }

            const doctorSnapshot = await adminDb
                .collection('users')
                .doc(grant.doctorId)
                .get()

            const doctor = doctorSnapshot.data()

            if (
                !doctorSnapshot.exists ||
                doctor?.role !== 'doctor' ||
                doctor?.accountStatus !== 'active'
            ) {
                return null
            }

            return {
                grantId: grantDocument.id,
                doctorId: grant.doctorId,
                doctorName:
                    typeof doctor.name === 'string' && doctor.name.trim()
                        ? doctor.name.trim()
                        : 'Doctor',
                permissions,
                grantedAt: grant.grantedAt,
            }
        })
    )

    return activeAccess.filter(
        (access) => access !== null
    ) as PatientDoctorAccess[]
}

export async function revokePatientDoctorAccess(
  patientId: string,
  grantId: string
): Promise<void> {
  if (!patientId || !grantId) {
    throw new Error('Patient ID and access grant ID are required.')
  }

  const grantRef = adminDb
    .collection('doctorPatientAccess')
    .doc(grantId)

  await adminDb.runTransaction(async (transaction) => {
    const grantSnapshot = await transaction.get(grantRef)

    if (!grantSnapshot.exists) {
      throw new Error('Access grant was not found.')
    }

    const grant = grantSnapshot.data()!

    if (grant.patientId !== patientId) {
      throw new Error('You are not authorized to revoke this access.')
    }

    if (grant.status !== 'active') {
      throw new Error('This access grant is no longer active.')
    }

    const requestId =
      typeof grant.sourceRequestId === 'string'
        ? grant.sourceRequestId
        : grantId

    const requestRef = adminDb
      .collection('doctorAccessRequests')
      .doc(requestId)

    const requestSnapshot = await transaction.get(requestRef)

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(grantRef, {
      status: 'revoked',
      revokedAt: timestamp,
      updatedAt: timestamp,
    })

    if (
      requestSnapshot.exists &&
      requestSnapshot.data()?.patientId === patientId
    ) {
      transaction.update(requestRef, {
        status: 'revoked',
        revokedAt: timestamp,
        updatedAt: timestamp,
      })
    }
  })
}