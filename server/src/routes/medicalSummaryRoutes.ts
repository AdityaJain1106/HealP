
import { Router } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { generateMedicalSummary } from '../services/medicalSummaryService.js'

const router = Router()

router.post('/generate', verifyFirebaseToken, async (_req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid

    // Verify that the authenticated account is an active patient.
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
        message: 'Only active patient accounts can generate medical summaries.',
      })
      return
    }

    const summary = await generateMedicalSummary(patientId)

    res.status(200).json({
      success: true,
      message: 'Medical summary generated successfully.',
      summary: JSON.parse(summary),
    })
  } catch (error) {
    console.error('Medical summary route error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to generate your medical summary. Please try again.',
    })
  }
})

export default router
