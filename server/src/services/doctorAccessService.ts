
import {
  FieldValue,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'

import { adminDb } from '../config/firebaseAdmin.js'

export const DOCTOR_ACCESS_PERMISSIONS = [
  'profile',
  'medicalHistory',
  'documents',
  'prescriptions',
  'prescriptionCreation',
] as const

export type DoctorAccessPermission =
  (typeof DOCTOR_ACCESS_PERMISSIONS)[number]

export type DoctorAccessStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revoked'

export interface DoctorAccessRequest {
  requestId: string
  doctorId: string
  patientId: string
  reason: string
  permissions: DoctorAccessPermission[]
  status: DoctorAccessStatus
  createdAt: FirebaseFirestore.Timestamp
  updatedAt: FirebaseFirestore.Timestamp
  respondedAt?: FirebaseFirestore.Timestamp
  approvedPermissions?: DoctorAccessPermission[]
}

export interface DoctorPatientSearchResult {
  patientId: string
  name: string
}

interface CreateAccessRequestInput {
  doctorId: string
  patientId: string
  reason: string
  permissions: DoctorAccessPermission[]
}

// Search for an active patient using exact ID, email or phone.
export async function searchPatientForDoctor(
  searchTerm: string
): Promise<DoctorPatientSearchResult | null> {
  const normalizedSearch = searchTerm.trim()

  if (
    normalizedSearch.length < 3 ||
    normalizedSearch.length > 254
  ) {
    throw new Error('Enter a valid patient ID, email or phone number.')
  }

  let patientId: string | null = null

  // 1. Search by exact patient ID.
  const patientProfileRef = adminDb
    .collection('patients')
    .doc(normalizedSearch)

  const patientProfile = await patientProfileRef.get()

  if (patientProfile.exists) {
    patientId = patientProfile.id
  }

  // 2. Search by exact registered email.
  if (!patientId && normalizedSearch.includes('@')) {
    const emailSnapshot = await adminDb
      .collection('users')
      .where('email', '==', normalizedSearch.toLowerCase())
      .limit(1)
      .get()

    const matchingUser = emailSnapshot.docs.find(
      (document) =>
        document.data().role === 'patient'
    )

    if (matchingUser) {
      patientId = matchingUser.id
    }
  }

  // 3. Search by exact registered phone number.
  if (!patientId && !normalizedSearch.includes('@')) {
    const phoneSnapshot = await adminDb
      .collection('patients')
      .where('phone', '==', normalizedSearch)
      .limit(1)
      .get()

    if (!phoneSnapshot.empty) {
      patientId = phoneSnapshot.docs[0].id
    }
  }

  if (!patientId) {
    return null
  }

  // Verify the associated account is an active patient.
  const userSnapshot = await adminDb
    .collection('users')
    .doc(patientId)
    .get()

  if (
    !userSnapshot.exists ||
    userSnapshot.data()?.role !== 'patient' ||
    userSnapshot.data()?.accountStatus !== 'active'
  ) {
    return null
  }

  const profileSnapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .get()

  if (!profileSnapshot.exists) {
    return null
  }

  const profile = profileSnapshot.data()

  return {
    patientId,
    name:
      typeof profile?.name === 'string' && profile.name.trim()
        ? profile.name.trim()
        : 'Patient',
  }
}

export async function createDoctorAccessRequest(
  input: CreateAccessRequestInput
): Promise<string> {
  const { doctorId, patientId, reason, permissions } = input

  if (!doctorId || !patientId || doctorId === patientId) {
    throw new Error('Invalid doctor or patient account.')
  }

  const normalizedReason = reason.trim()

  if (
    normalizedReason.length < 10 ||
    normalizedReason.length > 500
  ) {
    throw new Error(
      'The access request reason must contain 10–500 characters.'
    )
  }

  if (
    !Array.isArray(permissions) ||
    permissions.length === 0 ||
    permissions.some(
      (permission) =>
        !DOCTOR_ACCESS_PERMISSIONS.includes(permission)
    )
  ) {
    throw new Error('Please select valid access permissions.')
  }

  const uniquePermissions = [...new Set(permissions)]

  const patientUserRef = adminDb.collection('users').doc(patientId)
  const patientProfileRef = adminDb.collection('patients').doc(patientId)
  const doctorRef = adminDb.collection('users').doc(doctorId)

  const [patientUser, patientProfile, doctorSnapshot] =
    await Promise.all([
      patientUserRef.get(),
      patientProfileRef.get(),
      doctorRef.get(),
    ])

  if (
    !patientUser.exists ||
    patientUser.data()?.role !== 'patient' ||
    patientUser.data()?.accountStatus !== 'active' ||
    !patientProfile.exists
  ) {
    throw new Error('Active patient account was not found.')
  }

  if (
    !doctorSnapshot.exists ||
    doctorSnapshot.data()?.role !== 'doctor' ||
    doctorSnapshot.data()?.accountStatus !== 'active'
  ) {
    throw new Error('Approved doctor account was not found.')
  }

  const doctorName = doctorSnapshot.data()?.name || 'A doctor'

  const requestsRef = adminDb.collection('doctorAccessRequests')
  const requestRef = requestsRef.doc()

  const notificationRef = patientProfileRef
    .collection('notifications')
    .doc()

  await adminDb.runTransaction(async (transaction) => {
    const existingRequestsQuery = requestsRef
      .where('doctorId', '==', doctorId)
      .where('patientId', '==', patientId)

    const existingRequests = await transaction.get(
      existingRequestsQuery
    )

    const alreadyExists = existingRequests.docs.some(
      (document: QueryDocumentSnapshot) =>
        ['pending', 'approved'].includes(
          document.data().status
        )
    )

    if (alreadyExists) {
      throw new Error(
        'An active or pending access request already exists for this patient.'
      )
    }

    transaction.set(requestRef, {
      requestId: requestRef.id,
      doctorId,
      patientId,
      reason: normalizedReason,
      permissions: uniquePermissions,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    transaction.set(notificationRef, {
      title: 'Doctor Access Request',
      message: `${doctorName} has requested access to your health records. Review the request before granting access.`,
      type: 'general',
      route: '/patient/access-requests',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  return requestRef.id
}


// Retrieve every access request created by the authenticated doctor.

export async function getDoctorAccessRequests(
  doctorId: string
) {
  const snapshot = await adminDb
    .collection('doctorAccessRequests')
    .where('doctorId', '==', doctorId)
    .get()

  const requests = snapshot.docs.map((document) => {
    const data = document.data()

    return {
      ...data,
      requestId: document.id,
      createdAt: data.createdAt as
        | FirebaseFirestore.Timestamp
        | undefined,
    }
  })

  requests.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() ?? 0
    const bTime = b.createdAt?.toMillis() ?? 0

    return bTime - aTime
  })

  return requests
}


export interface DoctorApprovedPatient {
  patientId: string
  name: string
  permissions: DoctorAccessPermission[]
  grantId: string
  grantedAt?: FirebaseFirestore.Timestamp
}

export async function getDoctorApprovedPatients(
  doctorId: string
): Promise<DoctorApprovedPatient[]> {
  const grantsSnapshot = await adminDb
    .collection('doctorPatientAccess')
    .where('doctorId', '==', doctorId)
    .where('status', '==', 'active')
    .get()

  const patients = await Promise.all(
    grantsSnapshot.docs.map(async (grantDocument) => {
      const grant = grantDocument.data()

      if (
        typeof grant.patientId !== 'string' ||
        !Array.isArray(grant.permissions)
      ) {
        return null
      }

      const validPermissions = grant.permissions.filter(
        (permission: unknown): permission is DoctorAccessPermission =>
          DOCTOR_ACCESS_PERMISSIONS.includes(
            permission as DoctorAccessPermission
          )
      )

      if (validPermissions.length === 0) {
        return null
      }

      const [patientUser, patientProfile] = await Promise.all([
        adminDb.collection('users').doc(grant.patientId).get(),
        adminDb.collection('patients').doc(grant.patientId).get(),
      ])

      if (
        !patientUser.exists ||
        patientUser.data()?.role !== 'patient' ||
        patientUser.data()?.accountStatus !== 'active' ||
        !patientProfile.exists
      ) {
        return null
      }

      const profile = patientProfile.data()

      return {
        patientId: grant.patientId,
        name:
          typeof profile?.name === 'string' && profile.name.trim()
            ? profile.name.trim()
            : 'Patient',
        permissions: validPermissions,
        grantId: grantDocument.id,
        grantedAt: grant.grantedAt,
      }
    })
  )

  return patients.filter(
  (patient) => patient !== null
) as DoctorApprovedPatient[]
}


export async function getPatientAccessRequests(
  patientId: string
): Promise<DoctorAccessRequest[]> {
  const snapshot = await adminDb
    .collection('doctorAccessRequests')
    .where('patientId', '==', patientId)
    .where('status', '==', 'pending')
    .get()

  return snapshot.docs.map((document) => ({
    ...document.data(),
    requestId: document.id,
  })) as DoctorAccessRequest[]
}

export async function approveDoctorAccessRequest(
  patientId: string,
  requestId: string,
  approvedPermissions: DoctorAccessPermission[]
): Promise<void> {
  if (
    !Array.isArray(approvedPermissions) ||
    approvedPermissions.length === 0 ||
    approvedPermissions.some(
      (permission) =>
        !DOCTOR_ACCESS_PERMISSIONS.includes(permission)
    )
  ) {
    throw new Error('Please select valid access permissions.')
  }

  const requestRef = adminDb
    .collection('doctorAccessRequests')
    .doc(requestId)

  const grantRef = adminDb
    .collection('doctorPatientAccess')
    .doc(requestId)

  await adminDb.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef)

    if (!requestSnapshot.exists) {
      throw new Error('Access request was not found.')
    }

    const request = requestSnapshot.data()!

    if (request.patientId !== patientId) {
      throw new Error('You are not authorized to respond to this request.')
    }

    if (request.status !== 'pending') {
      throw new Error('This access request has already been processed.')
    }

    const requestedPermissions =
      request.permissions as DoctorAccessPermission[]

    const uniqueApprovedPermissions = [
      ...new Set(approvedPermissions),
    ]

    if (
      uniqueApprovedPermissions.some(
        (permission) =>
          !requestedPermissions.includes(permission)
      )
    ) {
      throw new Error(
        'You can only approve permissions requested by the doctor.'
      )
    }

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(requestRef, {
      status: 'approved',
      approvedPermissions: uniqueApprovedPermissions,
      respondedAt: timestamp,
      updatedAt: timestamp,
    })

    transaction.set(grantRef, {
      doctorId: request.doctorId,
      patientId,
      permissions: uniqueApprovedPermissions,
      status: 'active',
      sourceRequestId: requestId,
      grantedAt: timestamp,
      revokedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}

export async function rejectDoctorAccessRequest(
  patientId: string,
  requestId: string
): Promise<void> {
  const requestRef = adminDb
    .collection('doctorAccessRequests')
    .doc(requestId)

  await adminDb.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestRef)

    if (!requestSnapshot.exists) {
      throw new Error('Access request was not found.')
    }

    const request = requestSnapshot.data()!

    if (request.patientId !== patientId) {
      throw new Error('You are not authorized to respond to this request.')
    }

    if (request.status !== 'pending') {
      throw new Error('This access request has already been processed.')
    }

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(requestRef, {
      status: 'rejected',
      respondedAt: timestamp,
      updatedAt: timestamp,
    })
  })
}
