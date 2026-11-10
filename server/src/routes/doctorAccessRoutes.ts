
import { Router } from 'express'

import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActiveDoctor } from '../middleware/doctorAuthMiddleware.js'
import { adminDb } from '../config/firebaseAdmin.js'
import {
  createDoctorAccessRequest,
  searchPatientForDoctor,
  getDoctorAccessRequests,
  getDoctorApprovedPatients,
  DOCTOR_ACCESS_PERMISSIONS,
  type DoctorAccessPermission,
} from '../services/doctorAccessService.js'

import {
  verifyDoctorPatientPermission,
  getDoctorPatientMedicalHistory,
  DoctorPatientAccessError,
} from '../services/doctorRecordAccessService.js'

import {
  getDoctorPatientDocuments,
} from '../services/doctorDocumentService.js'

import {
  getDoctorPatientPrescriptions,
} from '../services/doctorPrescriptionService.js'

import { getDocumentDownloadUrl } from '../services/documentService.js'

const router = Router()

// All doctor routes require authentication and an active doctor account.
router.use(verifyFirebaseToken, requireActiveDoctor)

// Get all approved patients belonging to the authenticated doctor.
router.get('/my-patients', async (_req, res) => {
  try {
    const doctorId = res.locals.doctorId as string

    const patients = await getDoctorApprovedPatients(doctorId)

    res.status(200).json({
      success: true,
      patients,
    })
  } catch (error) {
    console.error('Get approved patients error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve approved patients.',
    })
  }
})

// Get all access requests belonging to the authenticated doctor.
router.get('/access-requests', async (_req, res) => {
  try {
    const doctorId = res.locals.doctorId as string

    const requests = await getDoctorAccessRequests(doctorId)

    res.status(200).json({
      success: true,
      requests,
    })
  } catch (error) {
    console.error('Get doctor access requests error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve access requests.',
    })
  }
})

// Retrieve a patient's profile after verifying explicit consent.
router.get('/patients/:patientId/profile', async (req, res) => {
  try {
    const doctorId = res.locals.doctorId as string
    const patientId = req.params.patientId

    if (!patientId || typeof patientId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid patient ID is required.',
      })
      return
    }

    // Verify that this doctor has an active profile permission.
    await verifyDoctorPatientPermission(
      doctorId,
      patientId,
      'profile'
    )

    // Fetch the profile only after authorization succeeds.
    const profileSnapshot = await adminDb
      .collection('patients')
      .doc(patientId)
      .get()

    if (!profileSnapshot.exists) {
      res.status(404).json({
        success: false,
        message: 'Patient profile was not found.',
      })
      return
    }

    const profile = profileSnapshot.data() ?? {}

    // Explicit allowlist: never return the entire Firestore document.
    const patientProfile = {
      name:
        typeof profile.name === 'string' ? profile.name : '',
      email:
        typeof profile.email === 'string' ? profile.email : '',
      dateOfBirth:
        typeof profile.dateOfBirth === 'string'
          ? profile.dateOfBirth
          : '',
      gender:
        typeof profile.gender === 'string' ? profile.gender : '',
      phone:
        typeof profile.phone === 'string' ? profile.phone : '',
      address:
        typeof profile.address === 'string' ? profile.address : '',
      bloodGroup:
        typeof profile.bloodGroup === 'string'
          ? profile.bloodGroup
          : '',
      height:
        typeof profile.height === 'string' ? profile.height : '',
      weight:
        typeof profile.weight === 'string' ? profile.weight : '',
      allergies: Array.isArray(profile.allergies)
        ? profile.allergies.filter(
            (item: unknown): item is string =>
              typeof item === 'string'
          )
        : [],
      chronicConditions: Array.isArray(profile.chronicConditions)
        ? profile.chronicConditions.filter(
            (item: unknown): item is string =>
              typeof item === 'string'
          )
        : [],
      currentMedicines: Array.isArray(profile.currentMedicines)
        ? profile.currentMedicines.filter(
            (item: unknown): item is string =>
              typeof item === 'string'
          )
        : [],
      emergencyContactName:
        typeof profile.emergencyContactName === 'string'
          ? profile.emergencyContactName
          : '',
      emergencyContactPhone:
        typeof profile.emergencyContactPhone === 'string'
          ? profile.emergencyContactPhone
          : '',
      insuranceProvider:
        typeof profile.insuranceProvider === 'string'
          ? profile.insuranceProvider
          : '',
      insurancePolicyNumber:
        typeof profile.insurancePolicyNumber === 'string'
          ? profile.insurancePolicyNumber
          : '',
      organDonor:
        typeof profile.organDonor === 'boolean'
          ? profile.organDonor
          : false,
    }

    res.status(200).json({
      success: true,
      patientId,
      profile: patientProfile,
    })
  } catch (error) {
    if (error instanceof DoctorPatientAccessError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
      return
    }

    console.error('Get doctor patient profile error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve the patient profile.',
    })
  }
})

// Search patients by ID, email or phone.
router.get('/patients/search', async (req, res) => {
  try {
    const searchTerm = req.query.q

    if (typeof searchTerm !== 'string' || !searchTerm.trim()) {
      res.status(400).json({
        success: false,
        message: 'Enter a patient ID, email or phone number.',
      })
      return
    }

    const patient = await searchPatientForDoctor(searchTerm)

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'No active patient found with these details.',
      })
      return
    }

    res.status(200).json({
      success: true,
      patient,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to search for patients.'

    if (message.includes('valid patient ID')) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    console.error('Doctor patient search error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to search for patients.',
    })
  }
})

// Submit a patient access request.
router.post('/access-requests', async (req, res) => {
  try {
    const { patientId, reason, permissions } = req.body ?? {}

    if (
      typeof patientId !== 'string' ||
      typeof reason !== 'string' ||
      !Array.isArray(permissions)
    ) {
      res.status(400).json({
        success: false,
        message: 'Patient ID, reason and permissions are required.',
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
        message: 'One or more permissions are invalid.',
      })
      return
    }

    const requestId = await createDoctorAccessRequest({
      doctorId: res.locals.doctorId,
      patientId: patientId.trim(),
      reason,
      permissions: permissions as DoctorAccessPermission[],
    })

    res.status(201).json({
      success: true,
      message: 'Patient access request submitted successfully.',
      requestId,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to submit access request.'

    if (
      message.includes('already exists') ||
      message.includes('not found') ||
      message.includes('Invalid') ||
      message.includes('Please select') ||
      message.includes('reason must')
    ) {
      res.status(400).json({
        success: false,
        message,
      })
      return
    }

    console.error('Doctor access request failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to submit the access request.',
    })
  }
})


// Retrieve medical history after verifying explicit patient consent.
router.get(
  '/patients/:patientId/medical-history',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const patientId = req.params.patientId

      if (!patientId || typeof patientId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'A valid patient ID is required.',
        })
        return
      }

      const records = await getDoctorPatientMedicalHistory(
        doctorId,
        patientId
      )

      res.status(200).json({
        success: true,
        patientId,
        totalRecords: records.length,
        records,
      })
    } catch (error) {
      if (error instanceof DoctorPatientAccessError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
        return
      }

      console.error('Get doctor patient medical history error:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve patient medical history.',
      })
    }
  }
)


// Retrieve patient documents after verifying explicit consent.
router.get(
  '/patients/:patientId/documents',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const patientId = req.params.patientId

      if (!patientId || typeof patientId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'A valid patient ID is required.',
        })
        return
      }

      const documents = await getDoctorPatientDocuments(
        doctorId,
        patientId
      )

      res.status(200).json({
        success: true,
        patientId,
        totalDocuments: documents.length,
        documents,
      })
    } catch (error) {
      if (error instanceof DoctorPatientAccessError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
        return
      }

      console.error('Get doctor patient documents error:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve patient documents.',
      })
    }
  }
)


/**
 * Generate a temporary download URL for a patient document.
 * Requires the patient's active documents permission.
 */
router.get(
  '/patients/:patientId/documents/:documentId/download',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const patientId = req.params.patientId
      const documentId = req.params.documentId

      if (
        typeof patientId !== 'string' ||
        !patientId ||
        typeof documentId !== 'string' ||
        !documentId
      ) {
        res.status(400).json({
          success: false,
          message: 'Valid patient and document IDs are required.',
        })
        return
      }

      // Verify current patient consent on every download request.
      await verifyDoctorPatientPermission(
        doctorId,
        patientId,
        'documents'
      )

      // Existing service verifies document ownership.
      const downloadUrl = await getDocumentDownloadUrl(
        patientId,
        documentId
      )

      res.status(200).json({
        success: true,
        downloadUrl,
        expiresIn: 60,
      })
    } catch (error) {
      if (error instanceof DoctorPatientAccessError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
        return
      }

      console.error('Doctor document download error:', error)

      res.status(404).json({
        success: false,
        message: 'Document not found or unavailable.',
      })
    }
  }
)

// Retrieve a patient's previous doctor-issued prescriptions.
router.get(
  '/patients/:patientId/prescriptions',
  async (req, res) => {
    try {
      const doctorId = res.locals.doctorId as string
      const patientId = req.params.patientId

      if (!patientId || typeof patientId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'A valid patient ID is required.',
        })
        return
      }

      const prescriptions = await getDoctorPatientPrescriptions(
        doctorId,
        patientId
      )

      res.status(200).json({
        success: true,
        patientId,
        totalPrescriptions: prescriptions.length,
        prescriptions,
      })
    } catch (error) {
      if (error instanceof DoctorPatientAccessError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
        return
      }

      console.error('Get doctor patient prescriptions error:', error)

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve patient prescriptions.',
      })
    }
  }
)

export default router
