import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/adminAuthMiddleware.js'
import {
  getAdminStats,
  getPendingDoctors,
  verifyDoctor,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUserAccount,
} from '../services/adminService.js'

const router = Router()

// All routes require valid Firebase token and administrator role
router.use(verifyFirebaseToken, requireAdmin)

// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
  try {
    const stats = await getAdminStats()
    res.status(200).json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve administrative statistics.',
    })
  }
})

// GET /api/admin/doctors/pending
router.get('/doctors/pending', async (_req, res) => {
  try {
    const pendingDoctors = await getPendingDoctors()
    res.status(200).json({
      success: true,
      doctors: pendingDoctors,
    })
  } catch (error) {
    console.error('Get pending doctors error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve pending doctor verifications.',
    })
  }
})

// POST /api/admin/doctors/:doctorId/verify
router.post('/doctors/:doctorId/verify', async (req, res) => {
  try {
    const { doctorId } = req.params
    const { status, notes } = req.body ?? {}
    const adminId = res.locals.adminId as string

    if (!doctorId || typeof doctorId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid doctor ID is required.',
      })
      return
    }

    if (status !== 'active' && status !== 'rejected') {
      res.status(400).json({
        success: false,
        message: "Status must be either 'active' (approved) or 'rejected'.",
      })
      return
    }

    await verifyDoctor(doctorId, status, notes, adminId)

    res.status(200).json({
      success: true,
      message:
        status === 'active'
          ? 'Doctor profile successfully approved and verified.'
          : 'Doctor application declined.',
    })
  } catch (error) {
    console.error('Verify doctor error:', error)
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Unable to verify doctor application.',
    })
  }
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query

    const users = await getAllUsers({
      role: typeof role === 'string' ? role : undefined,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
    })

    res.status(200).json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve user directory.',
    })
  }
})

// GET /api/admin/users/:userId
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid user ID is required.',
      })
      return
    }

    const details = await getUserDetails(userId)

    res.status(200).json({
      success: true,
      details,
    })
  } catch (error) {
    console.error('Get user details error:', error)
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Unable to retrieve user details.',
    })
  }
})

// PATCH /api/admin/users/:userId/status
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params
    const { status, reason } = req.body ?? {}
    const adminId = res.locals.adminId as string

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid user ID is required.',
      })
      return
    }

    const allowedStatuses = ['active', 'pending', 'rejected', 'suspended']
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      })
      return
    }

    await updateUserStatus(userId, status, reason, adminId)

    res.status(200).json({
      success: true,
      message: `Account status updated to '${status}'.`,
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Unable to update account status.',
    })
  }
})

// PATCH /api/admin/users/:userId/role
router.patch('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body ?? {}
    const adminId = res.locals.adminId as string

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid user ID is required.',
      })
      return
    }

    const allowedRoles = ['patient', 'doctor', 'admin']
    if (!allowedRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(', ')}`,
      })
      return
    }

    await updateUserRole(userId, role, adminId)

    res.status(200).json({
      success: true,
      message: `User role changed to '${role}'.`,
    })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Unable to update user role.',
    })
  }
})

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const adminId = res.locals.adminId as string

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        success: false,
        message: 'A valid user ID is required.',
      })
      return
    }

    if (userId === adminId) {
      res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own active account.',
      })
      return
    }

    await deleteUserAccount(userId)

    res.status(200).json({
      success: true,
      message: 'Account successfully removed from system records.',
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Unable to delete user account.',
    })
  }
})

export default router

