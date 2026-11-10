
import { Router } from 'express'

import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActiveDoctor } from '../middleware/doctorAuthMiddleware.js'

import {
  getDoctorAppointments,
  respondToAppointment,
  DoctorAppointmentError,
} from '../services/doctorAppointmentService.js'

import type {
  RespondToAppointmentInput,
} from '../services/doctorAppointmentService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActiveDoctor)

// GET /api/doctor/appointments
// Retrieve appointment requests for the authenticated doctor
router.get('/appointments', async (_req, res) => {
  try {
    const doctorId = res.locals.doctorId as string

    const appointments = await getDoctorAppointments(doctorId)

    res.status(200).json({
      success: true,
      totalAppointments: appointments.length,
      appointments,
    })
  } catch (error) {
    console.error('Doctor appointment retrieval failed:', error)

    const statusCode =
      error instanceof DoctorAppointmentError
        ? error.statusCode
        : 500

    res.status(statusCode).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Unable to retrieve appointments.',
    })
  }
})

// POST /api/doctor/appointments/:appointmentId/respond
// Accept or reject an appointment request
router.post(
  '/appointments/:appointmentId/respond',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const { appointmentId } = req.params

      const input: RespondToAppointmentInput = {
        status: req.body?.status,
        doctorResponse: req.body?.doctorResponse,
      }

      await respondToAppointment(
        doctorId,
        appointmentId,
        input
      )

      res.status(200).json({
        success: true,
        message:
          input.status === 'accepted'
            ? 'Appointment accepted successfully.'
            : 'Appointment rejected successfully.',
      })
    } catch (error) {
      console.error('Doctor appointment response failed:', error)

      const statusCode =
        error instanceof DoctorAppointmentError
          ? error.statusCode
          : 500

      res.status(statusCode).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Unable to respond to appointment.',
      })
    }
  }
)

export default router
