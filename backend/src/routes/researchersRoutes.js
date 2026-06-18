const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const ctrl = require('../controllers/researchersController')

router.get('/',            authenticate, ctrl.getAll)         // any authenticated user
router.get('/admin',       authenticate, requireRole('admin'), ctrl.getAllAdmin)
router.post('/',           authenticate, requireRole('admin'), ctrl.create)
router.put('/:id',         authenticate, requireRole('admin'), ctrl.update)
router.delete('/:id',      authenticate, requireRole('admin'), ctrl.remove)

module.exports = router
