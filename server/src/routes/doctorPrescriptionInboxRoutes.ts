
import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActiveDoctor } from '../middleware/doctorAuthMiddleware.js'
import {
  getDoctorPrescriptionInbox,
  getDoctorPrescriptionVersions,
  amendDoctorPrescription,
  explainDoctorPrescription,
  DoctorPrescriptionError,
} from '../services/doctorPrescriptionService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActiveDoctor)

// GET /api/doctor/prescriptions/inbox
router.get('/prescriptions/inbox', async (_req, res) => {
  try {
    const doctorId = res.locals.doctorId as string

    const prescriptions = await getDoctorPrescriptionInbox(doctorId)

    res.status(200).json({
      success: true,
      totalPrescriptions: prescriptions.length,
      prescriptions,
    })
  } catch (error) {
    console.error('Doctor prescription inbox failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve prescription inbox.',
    })
  }
})

// GET /api/doctor/patients/:patientId/prescriptions/:prescriptionId/versions
router.get(
  '/patients/:patientId/prescriptions/:prescriptionId/versions',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const { patientId, prescriptionId } = req.params

      const versions = await getDoctorPrescriptionVersions(
        doctorId,
        patientId,
        prescriptionId
      )

      res.status(200).json({
        success: true,
        totalVersions: versions.length,
        versions,
      })
    } catch (error) {
      console.error('Doctor prescription version history failed:', error)

      const statusCode =
        error instanceof DoctorPrescriptionError
          ? error.statusCode
          : 500

      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to retrieve prescription version history.',
      })
    }
  }
)

// POST /api/doctor/patients/:patientId/prescriptions/:prescriptionId/amend
router.post(
  '/patients/:patientId/prescriptions/:prescriptionId/amend',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const { patientId, prescriptionId } = req.params

      const versionId = await amendDoctorPrescription(
        doctorId,
        patientId,
        prescriptionId,
        req.body
      )

      res.status(200).json({
        success: true,
        message: 'Prescription amended and sent for patient review.',
        versionId,
      })
    } catch (error) {
      console.error('Prescription amendment failed:', error)

      const statusCode =
        error instanceof DoctorPrescriptionError
          ? error.statusCode
          : 500

      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to amend prescription.',
      })
    }
  }
)

// POST /api/doctor/patients/:patientId/prescriptions/:prescriptionId/explain
router.post(
  '/patients/:patientId/prescriptions/:prescriptionId/explain',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const { patientId, prescriptionId } = req.params
      const { explanation } = req.body

      await explainDoctorPrescription(
        doctorId,
        patientId,
        prescriptionId,
        explanation
      )

      res.status(200).json({
        success: true,
        message: 'Clarification response sent to the patient.',
      })
    } catch (error) {
      console.error('Prescription explanation failed:', error)

      const statusCode =
        error instanceof DoctorPrescriptionError
          ? error.statusCode
          : 500

      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to send clarification response.',
      })
    }
  }
)

export default router
