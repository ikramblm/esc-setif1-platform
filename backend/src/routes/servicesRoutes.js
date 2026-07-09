const router = require('express').Router()
const { getServices, getDepartments, getMyServices, publishService, deleteService } = require('../controllers/servicesController')
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { uploadServiceFiles } = require('../middleware/uploadMiddleware')

router.get('/', getServices)               // Public
router.get('/departments', getDepartments) // Public

router.use(authenticate)
router.get('/mine',  requireRole('researcher'), getMyServices)
router.post('/',     requireRole('admin', 'researcher'), uploadServiceFiles, publishService)
router.delete('/:id', requireRole('admin', 'researcher'), deleteService)

module.exports = router
