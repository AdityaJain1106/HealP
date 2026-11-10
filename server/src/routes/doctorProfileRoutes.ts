
import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'

import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireActiveDoctor } from '../middleware/doctorAuthMiddleware.js'

const router = Router()

router.use(verifyFirebaseToken, requireActiveDoctor)

const editableFields = [
  'name',
  'phone',
  'specialization',
  'qualification',
  'experience',
  'registrationNumber',
  'issuingCouncil',
  'workplaceName',
  'workplaceAddress',
  'bio',
] as const

// Retrieve the authenticated doctor's profile.
router.get('/profile', async (_req, res) => {
  try {
    const doctorId = res.locals.doctorId as string

    const snapshot = await adminDb
      .collection('users')
      .doc(doctorId)
      .get()

    if (!snapshot.exists || snapshot.data()?.role !== 'doctor') {
      res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      })
      return
    }

    const data = snapshot.data() ?? {}

    res.status(200).json({
      success: true,
      profile: {
        uid: doctorId,
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        specialization: data.specialization ?? '',
        qualification: data.qualification ?? '',
        experience: data.experience ?? '',
        registrationNumber: data.registrationNumber ?? '',
        issuingCouncil: data.issuingCouncil ?? '',
        workplaceName: data.workplaceName ?? '',
        workplaceAddress: data.workplaceAddress ?? '',
        bio: data.bio ?? '',
        accountStatus: data.accountStatus ?? 'pending',
        createdAt: data.createdAt ?? null,
      },
    })
  } catch (error) {
    console.error('Get doctor profile error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve doctor profile.',
    })
  }
})

// Update only permitted doctor profile fields.
router.patch('/profile', async (req, res) => {
  try {
    const doctorId = res.locals.doctorId as string
    const body = req.body ?? {}

    const keys = Object.keys(body)

    if (
      keys.length === 0 ||
      keys.some(
        (key) =>
          !editableFields.includes(
            key as (typeof editableFields)[number]
          )
      )
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid or empty profile update.',
      })
      return
    }

    const updates: Record<string, string> = {}

    for (const key of editableFields) {
      if (key in body) {
        if (typeof body[key] !== 'string') {
          res.status(400).json({
            success: false,
            message: `Invalid value for ${key}.`,
          })
          return
        }

        const value = body[key].trim()

        if (value.length > 1000) {
          res.status(400).json({
            success: false,
            message: `${key} is too long.`,
          })
          return
        }

        updates[key] = value
      }
    }

    const doctorRef = adminDb.collection('users').doc(doctorId)
    const doctorSnapshot = await doctorRef.get()

    if (
      !doctorSnapshot.exists ||
      doctorSnapshot.data()?.role !== 'doctor'
    ) {
      res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      })
      return
    }

    await doctorRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    })

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
    })
  } catch (error) {
    console.error('Update doctor profile error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to update doctor profile.',
    })
  }
})

export default router
