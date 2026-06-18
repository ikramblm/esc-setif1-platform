const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { getProfile, updateProfile, getAllCompanies, toggleCompanyActive } = require('../controllers/profileController')

router.get('/me',       authenticate, getProfile)
router.put('/me',       authenticate, updateProfile)
router.get('/companies', authenticate, requireRole('admin'), getAllCompanies)
router.put('/companies/:id/toggle', authenticate, requireRole('admin'), toggleCompanyActive)

module.exports = router
