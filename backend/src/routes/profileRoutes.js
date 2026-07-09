const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { getProfile, updateProfile, getAllCompanies, toggleCompanyActive, getContacts, getAllResearcherAccounts, toggleResearcherAccountActive } = require('../controllers/profileController')

router.get('/me',       authenticate, getProfile)
router.put('/me',       authenticate, updateProfile)
router.get('/companies', authenticate, requireRole('admin'), getAllCompanies)
router.put('/companies/:id/toggle', authenticate, requireRole('admin'), toggleCompanyActive)
router.get('/researcher-accounts', authenticate, requireRole('admin'), getAllResearcherAccounts)
router.put('/researcher-accounts/:id/toggle', authenticate, requireRole('admin'), toggleResearcherAccountActive)
router.get('/contacts', authenticate, requireRole('admin'), getContacts)

module.exports = router
