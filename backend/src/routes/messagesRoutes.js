const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const ctrl = require('../controllers/messagesController')

router.get('/unread', authenticate, ctrl.getUnreadCount)
router.get('/me', authenticate, ctrl.getMyMessages)
router.get('/project/:projectId', authenticate, ctrl.getProjectMessages)
router.post('/', authenticate, ctrl.sendMessage)

module.exports = router
