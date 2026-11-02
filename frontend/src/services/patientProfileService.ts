
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../lib/firebase'

export interface PatientProfile {
  uid: string
  name: string
  email: string

  // Personal information
  dateOfBirth: string
  gender: string
  phone: string
  address: string

  // Medical information
  bloodGroup: string
  height: string
  weight: string
  allergies: string[]
  chronicConditions: string[]
  currentMedicines: string[]

  // Emergency information
  emergencyContactName: string
  emergencyContactPhone: string
  insuranceProvider: string
  insurancePolicyNumber: string
  organDonor: boolean

  createdAt?: unknown
  updatedAt?: unknown
}

// Retrieve the patient's profile
export async function getPatientProfile(
  uid: string,
): Promise<PatientProfile | null> {
  const profileRef = doc(db, 'patients', uid)
  const snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as PatientProfile
}

// Create a new patient profile
export async function createPatientProfile(
  profile: PatientProfile,
): Promise<void> {
  const profileRef = doc(db, 'patients', profile.uid)

  await setDoc(profileRef, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Update an existing patient profile
export async function updatePatientProfile(
  uid: string,
  updates: Partial<Omit<PatientProfile, 'uid' | 'email'>>,
): Promise<void> {
  const profileRef = doc(db, 'patients', uid)

  await updateDoc(profileRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}
