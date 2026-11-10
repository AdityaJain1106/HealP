
import type { RequestHandler } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'

export const requireActiveDoctor: RequestHandler = async (
  _req,
  res,
  next
) => {
  try {
    const firebaseUser = res.locals.firebaseUser

    if (!firebaseUser?.uid) {
      res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      })
      return
    }

    const userSnapshot = await adminDb
      .collection('users')
      .doc(firebaseUser.uid)
      .get()

    if (!userSnapshot.exists) {
      res.status(403).json({
        success: false,
        message: 'User account was not found.',
      })
      return
    }

    const userData = userSnapshot.data()

    if (
      userData?.role !== 'doctor' ||
      userData?.accountStatus !== 'active'
    ) {
      res.status(403).json({
        success: false,
        message: 'Only approved, active doctors can access this resource.',
      })
      return
    }

    res.locals.doctorId = firebaseUser.uid
    next()
  } catch (error) {
    console.error('Doctor authorization failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to verify doctor authorization.',
    })
  }
}
