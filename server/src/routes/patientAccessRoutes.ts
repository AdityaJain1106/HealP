
import { Router } from 'express'

import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActivePatient } from '../middleware/patientAuthMiddleware.js'
import {
  getPatientDoctorAccess,
  revokePatientDoctorAccess,
} from '../services/patientAccessManagementService.js'
import {
  approveDoctorAccessRequest,
  getPatientAccessRequests,
  rejectDoctorAccessRequest,
  DOCTOR_ACCESS_PERMISSIONS,
  type DoctorAccessPermission,
} from '../services/doctorAccessService.js'

const router = Router()

router.use(verifyFirebaseToken, requireActivePatient)

// Get pending doctor access requests
router.get('/access-requests', async (_req, res) => {
  try {
    const patientId = res.locals.patientId as string

    const requests = await getPatientAccessRequests(patientId)

    res.status(200).json({
      success: true,
      requests,
    })
  } catch (error) {
    console.error('Fetch patient access requests error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to fetch access requests.',
    })
  }
})

// Approve a doctor access request
router.post('/access-requests/:requestId/approve', async (req, res) => {
  try {
    const patientId = res.locals.patientId as string
    const { requestId } = req.params
    const { permissions } = req.body ?? {}

    if (!Array.isArray(permissions) || permissions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Select at least one permission to approve.',
      })
      return
    }

    const validPermissions = permissions.every(
      (permission: unknown) =>
        typeof permission === 'string' &&
        DOCTOR_ACCESS_PERMISSIONS.includes(
          permission as DoctorAccessPermission
        )
    )

    if (!validPermissions) {
      res.status(400).json({
        success: false,
        message: 'Invalid access permissions.',
      })
      return
    }

    await approveDoctorAccessRequest(
      patientId,
      requestId,
      permissions as DoctorAccessPermission[]
    )

    res.status(200).json({
      success: true,
      message: 'Doctor access approved successfully.',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to approve access request.'

    if (
      message.includes('not found') ||
      message.includes('not authorized') ||
      message.includes('already been processed') ||
      message.includes('only approve') ||
      message.includes('Please select')
    ) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    console.error('Approve doctor access error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to approve access request.',
    })
  }
})

// Reject a doctor access request
router.post('/access-requests/:requestId/reject', async (req, res) => {
  try {
    const patientId = res.locals.patientId as string
    const { requestId } = req.params

    await rejectDoctorAccessRequest(patientId, requestId)

    res.status(200).json({
      success: true,
      message: 'Doctor access request rejected.',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to reject access request.'

    if (
      message.includes('not found') ||
      message.includes('not authorized') ||
      message.includes('already been processed')
    ) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    console.error('Reject doctor access error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to reject access request.',
    })
  }
})
// Get all active doctor access grants belonging to the patient.
router.get('/access-management', async (_req, res) => {
  try {
    const patientId = res.locals.patientId as string

    const accesses = await getPatientDoctorAccess(patientId)

    res.status(200).json({
      success: true,
      accesses,
    })
  } catch (error) {
    console.error('Fetch patient access management error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve doctor access permissions.',
    })
  }
})

// Revoke a doctor's access.
router.delete('/access-management/:grantId', async (req, res) => {
  try {
    const patientId = res.locals.patientId as string
    const { grantId } = req.params

    await revokePatientDoctorAccess(patientId, grantId)

    res.status(200).json({
      success: true,
      message: 'Doctor access revoked successfully.',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to revoke doctor access.'

    if (
      message.includes('required') ||
      message.includes('not found') ||
      message.includes('not authorized') ||
      message.includes('no longer active')
    ) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    console.error('Revoke doctor access error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to revoke doctor access.',
    })
  }
})

export default router
