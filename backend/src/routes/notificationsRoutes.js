const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const ctrl = require('../controllers/notificationsController')

router.get('/unread', authenticate, ctrl.getUnreadCount)
router.get('/', authenticate, ctrl.getMyNotifications)
router.put('/read-all', authenticate, ctrl.markAllRead)
router.put('/:id/read', authenticate, ctrl.markRead)
router.post('/', authenticate, requireRole('admin'), ctrl.createNotification)

module.exports = router
