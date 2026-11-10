
import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActiveDoctor } from '../middleware/doctorAuthMiddleware.js'
import {
  createDoctorPrescription,
  DoctorPrescriptionError,
} from '../services/doctorPrescriptionService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActiveDoctor)

// POST /api/doctor/patients/:patientId/prescriptions
router.post('/patients/:patientId/prescriptions', async (req, res) => {
  try {
    const doctorId = res.locals.doctorId as string
    const { patientId } = req.params

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid patient ID is required.',
      })
      return
    }

    const prescriptionId = await createDoctorPrescription(
      doctorId,
      patientId,
      req.body
    )

    res.status(201).json({
      success: true,
      message: 'Prescription created and sent to the patient for review.',
      prescriptionId,
    })
  } catch (error) {
    console.error('Doctor prescription creation failed:', error)

    if (error instanceof DoctorPrescriptionError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
      return
    }

    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
        ? error.statusCode
        : 500

    res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? 'Unable to create prescription.'
          : error instanceof Error
            ? error.message
            : 'Prescription request failed.',
    })
  }
})

export default router
