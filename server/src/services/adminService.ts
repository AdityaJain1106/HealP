import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '../config/firebaseAdmin.js'

export interface AdminStats {
  totalUsers: number
  totalPatients: number
  totalDoctors: number
  totalAdmins: number
  pendingDoctors: number
  activeAccounts: number
  suspendedAccounts: number
  rejectedDoctors: number
}

export interface ManagedUser {
  uid: string
  name: string
  email: string
  phone?: string
  role: 'patient' | 'doctor' | 'admin'
  accountStatus: 'active' | 'pending' | 'rejected' | 'suspended'
  authProvider?: string
  specialization?: string
  qualification?: string
  experience?: string
  registrationNumber?: string
  issuingCouncil?: string
  workplaceName?: string
  workplaceAddress?: string
  bio?: string
  verificationNotes?: string
  createdAt?: string | null
  updatedAt?: string | null
}

function timestampToIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  return null
}

export async function getAdminStats(): Promise<AdminStats> {
  const usersSnapshot = await adminDb.collection('users').get()

  let totalUsers = 0
  let totalPatients = 0
  let totalDoctors = 0
  let totalAdmins = 0
  let pendingDoctors = 0
  let activeAccounts = 0
  let suspendedAccounts = 0
  let rejectedDoctors = 0

  usersSnapshot.forEach((doc) => {
    totalUsers++
    const data = doc.data()
    const role = data.role
    const status = data.accountStatus ?? (role === 'doctor' ? 'pending' : 'active')

    if (role === 'patient') totalPatients++
    else if (role === 'doctor') totalDoctors++
    else if (role === 'admin') totalAdmins++

    if (role === 'doctor' && status === 'pending') pendingDoctors++
    if (role === 'doctor' && status === 'rejected') rejectedDoctors++
    if (status === 'active') activeAccounts++
    if (status === 'suspended') suspendedAccounts++
  })

  return {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    pendingDoctors,
    activeAccounts,
    suspendedAccounts,
    rejectedDoctors,
  }
}

export async function getPendingDoctors(): Promise<ManagedUser[]> {
  const snapshot = await adminDb
    .collection('users')
    .where('role', '==', 'doctor')
    .where('accountStatus', '==', 'pending')
    .get()

  const doctors: ManagedUser[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    doctors.push({
      uid: doc.id,
      name: data.name ?? 'Unnamed Doctor',
      email: data.email ?? '',
      phone: data.phone ?? '',
      role: 'doctor',
      accountStatus: 'pending',
      authProvider: data.authProvider ?? 'password',
      specialization: data.specialization ?? '',
      qualification: data.qualification ?? '',
      experience: data.experience ?? '',
      registrationNumber: data.registrationNumber ?? '',
      issuingCouncil: data.issuingCouncil ?? '',
      workplaceName: data.workplaceName ?? '',
      workplaceAddress: data.workplaceAddress ?? '',
      bio: data.bio ?? '',
      verificationNotes: data.verificationNotes ?? '',
      createdAt: timestampToIso(data.createdAt),
      updatedAt: timestampToIso(data.updatedAt),
    })
  })

  return doctors
}

export async function verifyDoctor(
  doctorId: string,
  status: 'active' | 'rejected',
  notes?: string,
  adminId?: string
): Promise<void> {
  const doctorRef = adminDb.collection('users').doc(doctorId)
  const snapshot = await doctorRef.get()

  if (!snapshot.exists || snapshot.data()?.role !== 'doctor') {
    throw new Error('Doctor profile not found.')
  }

  await doctorRef.update({
    accountStatus: status,
    verificationNotes: notes || '',
    verifiedAt: FieldValue.serverTimestamp(),
    verifiedBy: adminId || 'admin',
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Create an in-app notification for the doctor
  try {
    await adminDb.collection('notifications').add({
      userId: doctorId,
      title:
        status === 'active'
          ? 'Doctor Profile Verified & Approved'
          : 'Doctor Verification Update',
      message:
        status === 'active'
          ? 'Your medical credentials have been verified. You now have full access to the HealP Doctor Portal.'
          : notes ||
            'Your doctor credentials could not be verified. Please review your details and submit updated information.',
      type: status === 'active' ? 'approval' : 'rejection',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (notifErr) {
    console.warn('Failed to dispatch verification notification:', notifErr)
  }
}

export async function getAllUsers(options?: {
  role?: string
  status?: string
  search?: string
}): Promise<ManagedUser[]> {
  const snapshot = await adminDb.collection('users').get()

  const searchLower = options?.search?.trim().toLowerCase() || ''
  const roleFilter = options?.role?.trim().toLowerCase()
  const statusFilter = options?.status?.trim().toLowerCase()

  const users: ManagedUser[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    const role = (data.role || 'patient') as ManagedUser['role']
    const status = (data.accountStatus ?? (role === 'doctor' ? 'pending' : 'active')) as ManagedUser['accountStatus']

    if (roleFilter && roleFilter !== 'all' && role !== roleFilter) {
      return
    }

    if (statusFilter && statusFilter !== 'all' && status !== statusFilter) {
      return
    }

    const name = (data.name || '').toLowerCase()
    const email = (data.email || '').toLowerCase()
    const phone = (data.phone || '').toLowerCase()
    const regNum = (data.registrationNumber || '').toLowerCase()
    const spec = (data.specialization || '').toLowerCase()

    if (
      searchLower &&
      !name.includes(searchLower) &&
      !email.includes(searchLower) &&
      !phone.includes(searchLower) &&
      !regNum.includes(searchLower) &&
      !spec.includes(searchLower)
    ) {
      return
    }

    users.push({
      uid: doc.id,
      name: data.name ?? 'Unnamed User',
      email: data.email ?? '',
      phone: data.phone ?? '',
      role,
      accountStatus: status,
      authProvider: data.authProvider ?? 'password',
      specialization: data.specialization ?? '',
      qualification: data.qualification ?? '',
      experience: data.experience ?? '',
      registrationNumber: data.registrationNumber ?? '',
      issuingCouncil: data.issuingCouncil ?? '',
      workplaceName: data.workplaceName ?? '',
      workplaceAddress: data.workplaceAddress ?? '',
      bio: data.bio ?? '',
      verificationNotes: data.verificationNotes ?? '',
      createdAt: timestampToIso(data.createdAt),
      updatedAt: timestampToIso(data.updatedAt),
    })
  })

  // Sort: pending first, then newest
  return users.sort((a, b) => {
    if (a.accountStatus === 'pending' && b.accountStatus !== 'pending') return -1
    if (a.accountStatus !== 'pending' && b.accountStatus === 'pending') return 1
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
}

export async function getUserDetails(userId: string): Promise<Record<string, unknown>> {
  const userSnapshot = await adminDb.collection('users').doc(userId).get()

  if (!userSnapshot.exists) {
    throw new Error('User not found.')
  }

  const userData = userSnapshot.data() ?? {}
  const role = userData.role

  const result: Record<string, unknown> = {
    user: {
      uid: userId,
      ...userData,
      createdAt: timestampToIso(userData.createdAt),
      updatedAt: timestampToIso(userData.updatedAt),
    },
  }

  if (role === 'patient') {
    const patientSnapshot = await adminDb.collection('patients').doc(userId).get()
    if (patientSnapshot.exists) {
      result.patientProfile = patientSnapshot.data()
    }

    const historySnapshot = await adminDb
      .collection('patients')
      .doc(userId)
      .collection('medicalHistory')
      .get()
    result.medicalHistoryCount = historySnapshot.size

    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('patientId', '==', userId)
      .get()
    result.documentsCount = documentsSnapshot.size
  } else if (role === 'doctor') {
    const accessGrantsSnapshot = await adminDb
      .collection('doctorPatientAccess')
      .where('doctorId', '==', userId)
      .where('status', '==', 'active')
      .get()
    result.approvedPatientsCount = accessGrantsSnapshot.size
  }

  return result
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'pending' | 'rejected' | 'suspended',
  reason?: string,
  adminId?: string
): Promise<void> {
  const userRef = adminDb.collection('users').doc(userId)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    throw new Error('User account not found.')
  }

  await userRef.update({
    accountStatus: status,
    statusReason: reason || '',
    statusUpdatedAt: FieldValue.serverTimestamp(),
    statusUpdatedBy: adminId || 'admin',
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function updateUserRole(
  userId: string,
  newRole: 'patient' | 'doctor' | 'admin',
  adminId?: string
): Promise<void> {
  const userRef = adminDb.collection('users').doc(userId)
  const snapshot = await userRef.get()

  if (!snapshot.exists) {
    throw new Error('User account not found.')
  }

  await userRef.update({
    role: newRole,
    roleUpdatedAt: FieldValue.serverTimestamp(),
    roleUpdatedBy: adminId || 'admin',
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // Delete from Firestore
  await adminDb.collection('users').doc(userId).delete()

  // Attempt to delete from Firebase Authentication
  try {
    await adminAuth.deleteUser(userId)
  } catch (authError) {
    console.warn(`Could not delete Firebase Auth user ${userId}:`, authError)
  }
}

