
import type { RequestHandler } from 'express'
import { adminAuth } from '../config/firebaseAdmin.js'

export const verifyFirebaseToken: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
      })
      return
    }

    const token = authorization.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
      return
    }

    const decodedToken = await adminAuth.verifyIdToken(token)

    res.locals.firebaseUser = decodedToken

    next()
  } catch (error) {
    console.error('Firebase authentication failed:', error)

    res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.',
    })
  }
}
