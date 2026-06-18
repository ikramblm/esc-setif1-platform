const router = require('express').Router()
const { createNeed, getCompanyNeeds, getAllNeeds, updateNeedStatus } = require('../controllers/needsController')
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { needRules, statusRules, validate } = require('../middleware/validationMiddleware')

router.use(authenticate)

router.post('/',              requireRole('company'),       needRules,    validate, createNeed)
router.get('/company',        requireRole('company'),       getCompanyNeeds)
router.get('/all',            requireRole('admin'),         getAllNeeds)
router.put('/:id/status',     requireRole('admin'),         statusRules,  validate, updateNeedStatus)

module.exports = router
