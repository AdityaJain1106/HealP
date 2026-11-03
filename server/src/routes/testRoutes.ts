
import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/protected', verifyFirebaseToken, (_req, res) => {
  const firebaseUser = res.locals.firebaseUser

  res.status(200).json({
    success: true,
    message: 'Firebase authentication successful!',
    user: {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    },
  })
})

export default router
