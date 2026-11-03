
import { Router } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { getMedicineInformation } from '../services/medicineAssistantService.js'

const router = Router()

router.post('/explain', verifyFirebaseToken, async (req, res) => {
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
        message: 'Only active patient accounts can use the Medicine Assistant.',
      })
      return
    }

    const medicineName = req.body?.medicineName

    if (
      typeof medicineName !== 'string' ||
      !medicineName.trim() ||
      medicineName.trim().length > 150
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid medicine name (maximum 150 characters).',
      })
      return
    }

    const medicineInformation = await getMedicineInformation(
      medicineName.trim()
    )

    res.status(200).json({
      success: true,
      message: 'Medicine information generated successfully.',
      medicine: medicineInformation,
    })
  } catch (error) {
    console.error('Medicine Assistant route error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve medicine information. Please try again.',
    })
  }
})

export default router
