const router = require('express').Router()
const { register, registerResearcher, login, logout, refreshTokens, verifyToken, forgotPassword, resetPassword } = require('../controllers/authController')
const { authenticate } = require('../middleware/authMiddleware')
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware')
const { registerRules, loginRules, validate } = require('../middleware/validationMiddleware')

router.post('/register', registerLimiter, registerRules, validate, register)
router.post('/researcher-register', registerLimiter, registerResearcher)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/login',    loginLimiter,    loginRules,    validate, login)
router.post('/logout',   authenticate, logout)
router.post('/refresh',  refreshTokens)
router.get('/verify',    authenticate, verifyToken)

module.exports = router
