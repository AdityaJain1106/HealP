
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import { createNotification } from './notificationService'

import { ROUTES } from '../routes/routePaths'

export type MedicalRecordType =
  | 'hospital_visit'
  | 'consultation'
  | 'diagnosis'
  | 'surgery'
  | 'allergy'
  | 'vaccination'
  | 'medicine'
  | 'follow_up'

export interface MedicalHistoryRecord {
  id?: string
  type: MedicalRecordType
  title: string
  description: string
  date: string
  hospital?: string
  doctor?: string
  diagnosis?: string
  medicines?: string[]
  notes?: string
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

type MedicalHistoryInput = Omit<
  MedicalHistoryRecord,
  'id' | 'createdAt' | 'updatedAt'
>

function getMedicalHistoryCollection(patientId: string) {
  return collection(db, 'patients', patientId, 'medicalHistory')
}

export async function addMedicalHistoryRecord(
  patientId: string,
  record: MedicalHistoryInput
): Promise<string> {
  const historyCollection = getMedicalHistoryCollection(patientId)

  const docRef = await addDoc(historyCollection, {
    ...record,
    createdAt: serverTimestamp(),
  })

  // Notification failure must not undo a successfully saved medical record.
  try {
    await createNotification({
      title: 'Medical record added',
      message: `"${record.title}" has been added to your medical history.`,
      type: 'medical_record',
      route: ROUTES.PATIENT_HEALTH,
    })
  } catch (error) {
    console.error('Medical record notification could not be created:', error)
  }

  return docRef.id
}

export async function getMedicalHistory(
  patientId: string
): Promise<MedicalHistoryRecord[]> {
  const historyCollection = getMedicalHistoryCollection(patientId)

  const historyQuery = query(
    historyCollection,
    orderBy('date', 'desc')
  )

  const snapshot = await getDocs(historyQuery)

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as MedicalHistoryRecord[]
}

export async function updateMedicalHistoryRecord(
  patientId: string,
  recordId: string,
  record: MedicalHistoryInput
): Promise<void> {
  const recordRef = doc(
    db,
    'patients',
    patientId,
    'medicalHistory',
    recordId
  )

  await updateDoc(recordRef, {
    ...record,
    updatedAt: serverTimestamp(),
  })
}
