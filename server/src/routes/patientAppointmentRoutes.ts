
import { Router } from 'express'

import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActivePatient } from '../middleware/patientAuthMiddleware.js'

import {
  createAppointmentRequest,
  getPatientAppointments,
  AppointmentError,
} from '../services/appointmentService.js'

import type {
  CreateAppointmentInput,
} from '../services/appointmentService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActivePatient)

// POST /api/patient/appointments
// Submit a new appointment request
router.post('/appointments', async (req, res) => {
  try {
    const patientId = res.locals.patientId as string

    const {
      doctorId,
      accessGrantId,
      appointmentDate,
      appointmentTime,
      reason,
    } = req.body ?? {}

    const input: CreateAppointmentInput = {
      doctorId,
      accessGrantId,
      appointmentDate,
      appointmentTime,
      reason,
    }

    const appointmentId = await createAppointmentRequest(
      patientId,
      input
    )

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully.',
      appointmentId,
    })
  } catch (error) {
    if (error instanceof AppointmentError) {
      const message = error.message

      const statusCode =
        message.includes('not found') ? 404 :
        message.includes('permission') ||
        message.includes('access') ? 403 : 400

      res.status(statusCode).json({
        success: false,
        message,
      })
      return
    }

    console.error('Appointment creation failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to submit appointment request.',
    })
  }
})

// GET /api/patient/appointments
// Retrieve appointments belonging to the authenticated patient
router.get('/appointments', async (_req, res) => {
  try {
    const patientId = res.locals.patientId as string

    const appointments = await getPatientAppointments(patientId)

    res.status(200).json({
      success: true,
      totalAppointments: appointments.length,
      appointments,
    })
  } catch (error) {
    console.error('Patient appointment retrieval failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve appointments.',
    })
  }
})

export default router
