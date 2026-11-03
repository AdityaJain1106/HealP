
import { Router } from 'express'
import multer from 'multer'
import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import {
  uploadDocument,
  getPatientDocuments,
  getDocumentDownloadUrl,
  deletePatientDocument,
} from '../services/documentService.js'
import type { DocumentCategory } from '../types/document.js'

const router = Router()

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

const allowedCategories: DocumentCategory[] = [
  'prescription',
  'blood_report',
  'mri',
  'ct_scan',
  'x_ray',
  'ecg',
  'medical_certificate',
  'other',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error('Only PDF, JPEG and PNG files are allowed.'))
      return
    }

    callback(null, true)
  },
})

// Verify that the authenticated account is an active patient.
async function getActivePatient(uid: string): Promise<boolean> {
  const userSnapshot = await adminDb
    .collection('users')
    .doc(uid)
    .get()

  if (!userSnapshot.exists) return false

  const user = userSnapshot.data()

  return (
    user?.role === 'patient' &&
    (user?.accountStatus ?? 'active') === 'active'
  )
}

// Upload a medical document
router.post(
  '/upload',
  verifyFirebaseToken,
  upload.single('file'),
  async (req, res) => {
    try {
      const patientId = res.locals.firebaseUser.uid

      if (!(await getActivePatient(patientId))) {
        res.status(403).json({
          success: false,
          message: 'Only active patients can upload documents.',
        })
        return
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Please select a document.',
        })
        return
      }

      const { category, hospital, doctor, documentDate } = req.body

      if (!allowedCategories.includes(category)) {
        res.status(400).json({
          success: false,
          message: 'Invalid document category.',
        })
        return
      }

      const document = await uploadDocument(patientId, req.file, {
        category,
        ...(hospital && { hospital }),
        ...(doctor && { doctor }),
        ...(documentDate && { documentDate }),
      })

      res.status(201).json({
        success: true,
        message: 'Medical document uploaded successfully.',
        document,
      })
    } catch (error) {
      console.error('Document upload failed:', error)

      res.status(500).json({
        success: false,
        message: 'Document upload failed.',
      })
    }
  }
)

// Get all documents belonging to the authenticated patient
router.get('/', verifyFirebaseToken, async (_req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid

    if (!(await getActivePatient(patientId))) {
      res.status(403).json({
        success: false,
        message: 'Patient access required.',
      })
      return
    }

    const documents = await getPatientDocuments(patientId)

    res.status(200).json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error('Document listing failed:', error)

    res.status(500).json({
      success: false,
      message: 'Could not retrieve documents.',
    })
  }
})

// Generate a temporary download URL
router.get(
  '/:documentId/download',
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const patientId = res.locals.firebaseUser.uid
const documentId = req.params.documentId

if (typeof documentId !== 'string') {
  res.status(400).json({
    success: false,
    message: 'Invalid document ID.',
  })
  return
}

      if (!(await getActivePatient(patientId))) {
        res.status(403).json({
          success: false,
          message: 'Patient access required.',
        })
        return
      }

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
      console.error('Document download failed:', error)

      res.status(404).json({
        success: false,
        message: 'Document not found or unavailable.',
      })
    }
  }
)

// Delete a document belonging to the authenticated patient
router.delete(
  '/:documentId',
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const patientId = res.locals.firebaseUser.uid
const documentId = req.params.documentId

if (typeof documentId !== 'string') {
  res.status(400).json({
    success: false,
    message: 'Invalid document ID.',
  })
  return
}

      if (!(await getActivePatient(patientId))) {
        res.status(403).json({
          success: false,
          message: 'Patient access required.',
        })
        return
      }

      await deletePatientDocument(patientId, documentId)

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully.',
      })
    } catch (error) {
      console.error('Document deletion failed:', error)

      res.status(500).json({
        success: false,
        message: 'Could not delete document.',
      })
    }
  }
)

export default router
