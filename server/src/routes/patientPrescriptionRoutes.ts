
import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActivePatient } from '../middleware/patientAuthMiddleware.js'
import {
  getPatientDoctorPrescriptions,
  getPatientDoctorPrescription,
  acceptPatientDoctorPrescription,
  requestPrescriptionClarification,
  getPatientPrescriptionVersions,
} from '../services/patientPrescriptionService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActivePatient)

// GET /api/patient/doctor-prescriptions
router.get('/doctor-prescriptions', async (_req, res) => {
  try {
    const patientId = res.locals.patientId as string

    const prescriptions =
      await getPatientDoctorPrescriptions(patientId)

    res.status(200).json({
      success: true,
      totalPrescriptions: prescriptions.length,
      prescriptions,
    })
  } catch (error) {
    console.error('Patient prescription listing failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve prescriptions.',
    })
  }
})

// GET /api/patient/doctor-prescriptions/:prescriptionId
router.get(
  '/doctor-prescriptions/:prescriptionId',
  async (req, res) => {
    try {
      const patientId = res.locals.patientId as string
      const { prescriptionId } = req.params

      const prescription = await getPatientDoctorPrescription(
        patientId,
        prescriptionId
      )

      if (!prescription) {
        res.status(404).json({
          success: false,
          message: 'Prescription not found.',
        })
        return
      }

      res.status(200).json({
        success: true,
        prescription,
      })
    } catch (error) {
      console.error('Patient prescription retrieval failed:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve prescription.',
      })
    }
  }
)

// POST /api/patient/doctor-prescriptions/:prescriptionId/accept
router.post(
  '/doctor-prescriptions/:prescriptionId/accept',
  async (req, res) => {
    try {
      const patientId = res.locals.patientId as string
      const { prescriptionId } = req.params

      await acceptPatientDoctorPrescription(
        patientId,
        prescriptionId
      )

      res.status(200).json({
        success: true,
        message: 'Prescription accepted successfully.',
      })
    } catch (error) {
      console.error('Prescription acceptance failed:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to accept prescription.'

      const statusCode =
        message === 'Prescription not found.' ? 404 :
        message.includes('already') ? 409 :
        message.includes('cannot access') ? 403 : 400

      res.status(statusCode).json({
        success: false,
        message,
      })
    }
  }
)

// POST /api/patient/doctor-prescriptions/:prescriptionId/clarification
router.post(
  '/doctor-prescriptions/:prescriptionId/clarification',
  async (req, res) => {
    try {
      const patientId = res.locals.patientId as string
      const { prescriptionId } = req.params
      const { clarificationRequest } = req.body

      await requestPrescriptionClarification(
        patientId,
        prescriptionId,
        clarificationRequest
      )

      res.status(200).json({
        success: true,
        message: 'Clarification request submitted successfully.',
      })
    } catch (error) {
      console.error('Prescription clarification failed:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit clarification request.'

      const statusCode =
        message === 'Prescription not found.' ? 404 :
        message.includes('already') ? 409 :
        message.includes('cannot access') ? 403 : 400

      res.status(statusCode).json({
        success: false,
        message,
      })
    }
  }
)

// GET /api/patient/doctor-prescriptions/:prescriptionId/versions
router.get(
  '/doctor-prescriptions/:prescriptionId/versions',
  async (req, res) => {
    try {
      const patientId = res.locals.patientId as string
      const { prescriptionId } = req.params

      const versions = await getPatientPrescriptionVersions(
        patientId,
        prescriptionId
      )

      res.status(200).json({
        success: true,
        totalVersions: versions.length,
        versions,
      })
    } catch (error) {
      console.error('Prescription version retrieval failed:', error)

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to retrieve prescription versions.'

      const statusCode =
        message === 'Prescription not found.' ? 404 :
        message.includes('cannot access') ? 403 : 400

      res.status(statusCode).json({
        success: false,
        message,
      })
    }
  }
)

export default router
