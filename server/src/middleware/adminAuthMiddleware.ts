import type { RequestHandler } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'

export const requireAdmin: RequestHandler = async (
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

    const userRef = adminDb.collection('users').doc(firebaseUser.uid)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      res.status(403).json({
        success: false,
        message: 'Admin account was not found in system records.',
      })
      return
    }

    const userData = userSnapshot.data() ?? {}
    const userEmail = (firebaseUser.email || userData.email || '').toLowerCase()

    // Support configured bootstrap admin emails if provided in environment
    const configuredAdmins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    const isDesignatedEmailAdmin =
      userEmail && configuredAdmins.includes(userEmail)

    const isExplicitAdminRole = userData.role === 'admin'

    if (!isExplicitAdminRole && !isDesignatedEmailAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges are required.',
      })
      return
    }

    // Auto-promote in Firestore if authenticated as a designated email admin
    if (isDesignatedEmailAdmin && userData.role !== 'admin') {
      await userRef.update({
        role: 'admin',
        accountStatus: 'active',
      })
    }

    res.locals.adminId = firebaseUser.uid
    res.locals.adminEmail = userEmail
    next()
  } catch (error) {
    console.error('Admin authorization failed:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to verify administrator authorization.',
    })
  }
}

