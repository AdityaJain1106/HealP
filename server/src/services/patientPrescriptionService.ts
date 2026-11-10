
import { adminDb } from '../config/firebaseAdmin.js'
import { FieldValue } from 'firebase-admin/firestore'
import type { DoctorPrescription } from '../types/doctorPrescription.js'

export async function getPatientDoctorPrescriptions(
  patientId: string
): Promise<DoctorPrescription[]> {
  const snapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .orderBy('createdAt', 'desc')
    .get()

  return snapshot.docs.map((document) => ({
    ...document.data(),
    prescriptionId: document.id,
  })) as DoctorPrescription[]
}

export async function getPatientDoctorPrescription(
  patientId: string,
  prescriptionId: string
): Promise<DoctorPrescription | null> {
  if (!prescriptionId || typeof prescriptionId !== 'string') {
    return null
  }

  const snapshot = await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)
    .get()

  if (!snapshot.exists) {
    return null
  }

  return {
    ...snapshot.data(),
    prescriptionId: snapshot.id,
  } as DoctorPrescription
}



export async function acceptPatientDoctorPrescription(
  patientId: string,
  prescriptionId: string
): Promise<void> {
  if (!prescriptionId || typeof prescriptionId !== 'string') {
    throw new Error('Invalid prescription ID.')
  }

  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)

  const historyRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('medicalHistory')
    .doc(prescriptionId)

  await adminDb.runTransaction(async (transaction) => {
    const prescriptionSnapshot = await transaction.get(prescriptionRef)

    if (!prescriptionSnapshot.exists) {
      throw new Error('Prescription not found.')
    }

    const prescription = prescriptionSnapshot.data()!

    if (prescription.patientId !== patientId) {
      throw new Error('You cannot access this prescription.')
    }

    if (prescription.status !== 'pending_patient_review') {
      throw new Error('This prescription has already been reviewed.')
    }

    const historySnapshot = await transaction.get(historyRef)

    if (historySnapshot.exists) {
      throw new Error('Prescription already exists in medical history.')
    }

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(prescriptionRef, {
      status: 'accepted',
      acceptedAt: timestamp,
      updatedAt: timestamp,
    })

    transaction.set(historyRef, {
      type: 'prescription',
      title: 'Doctor Prescription',
      description: prescription.diagnosis,
      date: prescription.prescriptionDate,
      hospital: prescription.hospitalName,
      doctor: prescription.doctorName,
      medicines: prescription.medicines.map(
        (medicine: { name: string }) => medicine.name
      ),
      notes: prescription.additionalInstructions.join('\n'),
      source: 'doctor_prescription',
      prescriptionId,
      createdBy: prescription.doctorId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  })
}




export async function requestPrescriptionClarification(
  patientId: string,
  prescriptionId: string,
  clarificationRequest: string
): Promise<void> {
  if (
    typeof clarificationRequest !== 'string' ||
    clarificationRequest.trim().length < 5 ||
    clarificationRequest.trim().length > 1000
  ) {
    throw new Error(
      'Clarification request must contain 5–1000 characters.'
    )
  }

  if (!prescriptionId || typeof prescriptionId !== 'string') {
    throw new Error('Invalid prescription ID.')
  }

  const patientRef = adminDb.collection('patients').doc(patientId)

  const prescriptionRef = patientRef
    .collection('doctorPrescriptions')
    .doc(prescriptionId)


  await adminDb.runTransaction(async (transaction) => {
    const prescriptionSnapshot = await transaction.get(prescriptionRef)

    if (!prescriptionSnapshot.exists) {
      throw new Error('Prescription not found.')
    }

    const prescription = prescriptionSnapshot.data()!

    if (prescription.patientId !== patientId) {
      throw new Error('You cannot access this prescription.')
    }

    if (prescription.status !== 'pending_patient_review') {
      throw new Error('This prescription has already been reviewed.')
    }

    const doctorNotificationRef = adminDb
      .collection('users')
      .doc(prescription.doctorId)
      .collection('notifications')
      .doc()

    const timestamp = FieldValue.serverTimestamp()

    transaction.update(prescriptionRef, {
      status: 'clarification_requested',
      clarificationRequest: clarificationRequest.trim(),
      updatedAt: timestamp,
    })

    transaction.set(doctorNotificationRef, {
      title: 'Prescription Clarification Requested',
      message: 'A patient has requested clarification on your prescription.',
      type: 'prescription',
      route: '/doctor/prescriptions',
      isRead: false,
      createdAt: timestamp,
    })
  })
}



export async function getPatientPrescriptionVersions(
  patientId: string,
  prescriptionId: string
) {
  if (!prescriptionId || typeof prescriptionId !== 'string') {
    throw new Error('Invalid prescription ID.')
  }

  const prescriptionRef = adminDb
    .collection('patients')
    .doc(patientId)
    .collection('doctorPrescriptions')
    .doc(prescriptionId)

  const prescriptionSnapshot = await prescriptionRef.get()

  if (!prescriptionSnapshot.exists) {
    throw new Error('Prescription not found.')
  }

  const prescription = prescriptionSnapshot.data()!

  if (prescription.patientId !== patientId) {
    throw new Error('You cannot access this prescription.')
  }

  const versionsSnapshot = await prescriptionRef
    .collection('versions')
    .orderBy('versionNumber', 'desc')
    .get()

  return versionsSnapshot.docs.map((document) => ({
    ...document.data(),
    versionId: document.id,
  }))
}
