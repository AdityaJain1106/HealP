
import { randomUUID } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '../config/firebaseAdmin.js'
import type { PrescriptionAnalysis } from '../types/prescription.js'

export interface PrescriptionReviewRecord {
  reviewId: string
  patientId: string
  originalAnalysis: PrescriptionAnalysis
  patientReview: null
  reviewStatus: 'awaiting_review'
  createdAt: FirebaseFirestore.FieldValue
  updatedAt: FirebaseFirestore.FieldValue
}

export async function createPrescriptionReview(
  patientId: string,
  analysis: PrescriptionAnalysis
): Promise<string> {
  const reviewId = randomUUID()

  const record: PrescriptionReviewRecord = {
    reviewId,
    patientId,
    originalAnalysis: analysis,
    patientReview: null,
    reviewStatus: 'awaiting_review',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  await adminDb
    .collection('patients')
    .doc(patientId)
    .collection('prescriptionReviews')
    .doc(reviewId)
    .set(record)

  return reviewId
}
