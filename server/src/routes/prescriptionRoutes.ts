
import { Router } from 'express'
import multer from 'multer'
import { FieldValue } from 'firebase-admin/firestore'

import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { analyzePrescriptionImage } from '../services/prescriptionService.js'
import { createPrescriptionReview } from '../services/prescriptionReviewService.js'
import { validatePrescriptionAnalysis } from '../services/prescriptionValidation.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png']

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error('Only JPEG and PNG images are supported.'))
      return
    }

    callback(null, true)
  },
})

// Analyze a prescription and save the original AI analysis.
router.post(
  '/analyze',
  verifyFirebaseToken,
  upload.single('file'),
  async (req, res) => {
    try {
      const firebaseUser = res.locals.firebaseUser
      const patientId = firebaseUser.uid

      const userSnapshot = await adminDb
        .collection('users')
        .doc(patientId)
        .get()

      const userData = userSnapshot.data()

      if (
        !userSnapshot.exists ||
        userData?.role !== 'patient' ||
        (userData?.accountStatus ?? 'active') !== 'active'
      ) {
        res.status(403).json({
          success: false,
          message: 'Only active patient accounts can analyze prescriptions.',
        })
        return
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Please upload a prescription image.',
        })
        return
      }

      const analysis = await analyzePrescriptionImage(
        req.file.buffer,
        req.file.mimetype
      )

      const reviewId = await createPrescriptionReview(patientId, analysis)

      res.status(200).json({
        success: true,
        message: 'Prescription analyzed and original analysis saved.',
        reviewId,
        analysis,
      })
    } catch (error) {
      console.error('Prescription analysis route error:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to analyze and save the prescription. Please try again.',
      })
    }
  }
)


// List this patient's saved prescription reviews.
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid
    const userSnapshot = await adminDb.collection('users').doc(patientId).get()
    const userData = userSnapshot.data()

    if (
      !userSnapshot.exists ||
      userData?.role !== 'patient' ||
      (userData?.accountStatus ?? 'active') !== 'active'
    ) {
      res.status(403).json({
        success: false,
        message: 'Only active patient accounts can view prescription reviews.',
      })
      return
    }

    const snapshot = await adminDb
      .collection('patients')
      .doc(patientId)
      .collection('prescriptionReviews')
      .orderBy('createdAt', 'desc')
      .get()

    const reviews = snapshot.docs.map((document) => {
      const data = document.data()
      const displayAnalysis = data.patientReview ?? data.originalAnalysis
      const createdAt = data.createdAt?.toDate?.()

      return {
        reviewId: document.id,
        reviewStatus: data.reviewStatus ?? 'awaiting_review',
        createdAt: createdAt ? createdAt.toISOString() : null,
        patientName: displayAnalysis?.prescription?.patientName ?? null,
        prescriberName: displayAnalysis?.prescription?.prescriberName ?? null,
        prescriptionDate: displayAnalysis?.prescription?.prescriptionDate ?? null,
        medicineNames: Array.isArray(displayAnalysis?.medicines)
          ? displayAnalysis.medicines.map((medicine: { name?: string | null }) => medicine.name).filter(Boolean)
          : [],
      }
    })

    res.status(200).json({ success: true, reviews })
  } catch (error) {
    console.error('Prescription review list error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load saved prescription reviews.',
    })
  }
})

// Retrieve one saved review, including the immutable AI extraction and patient corrections.
router.get('/:reviewId', verifyFirebaseToken, async (req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid
    const { reviewId } = req.params
    const userSnapshot = await adminDb.collection('users').doc(patientId).get()
    const userData = userSnapshot.data()

    if (
      !userSnapshot.exists ||
      userData?.role !== 'patient' ||
      (userData?.accountStatus ?? 'active') !== 'active'
    ) {
      res.status(403).json({
        success: false,
        message: 'Only active patient accounts can view prescription reviews.',
      })
      return
    }

    if (typeof reviewId !== 'string' || !reviewId.trim()) {
      res.status(400).json({ success: false, message: 'A valid review ID is required.' })
      return
    }

    const reviewSnapshot = await adminDb
      .collection('patients')
      .doc(patientId)
      .collection('prescriptionReviews')
      .doc(reviewId)
      .get()

    if (!reviewSnapshot.exists) {
      res.status(404).json({ success: false, message: 'Prescription review not found.' })
      return
    }

    const data = reviewSnapshot.data()!

    res.status(200).json({
      success: true,
      review: {
        reviewId: reviewSnapshot.id,
        originalAnalysis: data.originalAnalysis,
        patientReview: data.patientReview ?? null,
        reviewStatus: data.reviewStatus ?? 'awaiting_review',
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Prescription review retrieval error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load this prescription review.',
    })
  }
})

// Delete one prescription review belonging to the authenticated patient.
router.delete('/:reviewId', verifyFirebaseToken, async (req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid
    const { reviewId } = req.params
    const userSnapshot = await adminDb.collection('users').doc(patientId).get()
    const userData = userSnapshot.data()

    if (
      !userSnapshot.exists ||
      userData?.role !== 'patient' ||
      (userData?.accountStatus ?? 'active') !== 'active'
    ) {
      res.status(403).json({
        success: false,
        message: 'Only active patient accounts can delete prescription reviews.',
      })
      return
    }

    if (typeof reviewId !== 'string' || !reviewId.trim()) {
      res.status(400).json({ success: false, message: 'A valid review ID is required.' })
      return
    }

    const reviewRef = adminDb
      .collection('patients')
      .doc(patientId)
      .collection('prescriptionReviews')
      .doc(reviewId)
    const reviewSnapshot = await reviewRef.get()

    if (!reviewSnapshot.exists) {
      res.status(404).json({ success: false, message: 'Prescription review not found.' })
      return
    }

    await reviewRef.delete()

    res.status(200).json({
      success: true,
      message: 'Prescription review deleted successfully.',
      reviewId,
    })
  } catch (error) {
    console.error('Prescription review deletion error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to delete this prescription review. Please try again.',
    })
  }
})

// Save the patient's reviewed version without changing the original AI analysis.
router.patch(
  '/:reviewId/review',
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const firebaseUser = res.locals.firebaseUser
      const patientId = firebaseUser.uid
      const { reviewId } = req.params
      const patientReview = req.body?.patientReview

      const userSnapshot = await adminDb
        .collection('users')
        .doc(patientId)
        .get()

      const userData = userSnapshot.data()

      if (
        !userSnapshot.exists ||
        userData?.role !== 'patient' ||
        (userData?.accountStatus ?? 'active') !== 'active'
      ) {
        res.status(403).json({
          success: false,
          message: 'Only active patient accounts can save prescription reviews.',
        })
        return
      }

      if (
        typeof reviewId !== 'string' ||
        !reviewId.trim() ||
        !validatePrescriptionAnalysis(patientReview)
      ) {
        res.status(400).json({
          success: false,
          message: 'The prescription review data is invalid.',
        })
        return
      }

      const reviewRef = adminDb
        .collection('patients')
        .doc(patientId)
        .collection('prescriptionReviews')
        .doc(reviewId)

      const reviewSnapshot = await reviewRef.get()

      if (!reviewSnapshot.exists) {
        res.status(404).json({
          success: false,
          message: 'Prescription review not found.',
        })
        return
      }

      await reviewRef.update({
        patientReview,
        reviewStatus: 'patient_reviewed',
        updatedAt: FieldValue.serverTimestamp(),
      })

      res.status(200).json({
        success: true,
        message: 'Your prescription review has been saved.',
        reviewId,
      })
    } catch (error) {
      console.error('Prescription review save error:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to save your prescription review. Please try again.',
      })
    }
  }
)

export default router
