
import { Router } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { assessSymptoms } from '../services/symptomCheckerService.js'

const router = Router()

router.post('/assess', verifyFirebaseToken, async (req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid

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
        message: 'Only active patient accounts can use the Symptom Checker.',
      })
      return
    }

    const { symptoms, duration, severity } = req.body ?? {}

    if (
      typeof symptoms !== 'string' ||
      !symptoms.trim() ||
      symptoms.trim().length > 2000
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide symptoms (maximum 2000 characters).',
      })
      return
    }

    if (
      typeof duration !== 'string' ||
      !duration.trim() ||
      duration.trim().length > 100
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid symptom duration.',
      })
      return
    }

    if (
      typeof severity !== 'string' ||
      !['mild', 'moderate', 'severe'].includes(severity)
    ) {
      res.status(400).json({
        success: false,
        message: 'Please select a valid symptom severity.',
      })
      return
    }

    const assessment = await assessSymptoms(
      symptoms.trim(),
      duration.trim(),
      severity
    )

    res.status(200).json({
      success: true,
      message: 'Symptom assessment generated successfully.',
      assessment,
    })
  } catch (error) {
    console.error('Symptom Checker route error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to assess symptoms. Please try again.',
    })
  }
})

export default router
