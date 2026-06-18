const router = require('express').Router()
const { getServices, publishService, deleteService } = require('../controllers/servicesController')
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { serviceRules, validate } = require('../middleware/validationMiddleware')

router.get('/', getServices)   // Public

router.use(authenticate)
router.post('/',     requireRole('admin'), serviceRules, validate, publishService)
router.delete('/:id',requireRole('admin'), deleteService)

module.exports = router
