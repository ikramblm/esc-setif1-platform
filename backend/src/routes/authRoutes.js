const router = require('express').Router()
const { register, registerResearcher, login, logout, refreshTokens, verifyToken, forgotPassword, resetPassword, changePassword, sendVerificationCode, verifyEmailCode } = require('../controllers/authController')
const { authenticate } = require('../middleware/authMiddleware')
const { loginLimiter, registerLimiter, verificationLimiter } = require('../middleware/rateLimitMiddleware')
const { registerRules, loginRules, validate } = require('../middleware/validationMiddleware')

router.post('/send-verification', verificationLimiter, sendVerificationCode)
router.post('/verify-email',      verificationLimiter, verifyEmailCode)
router.post('/register', registerLimiter, registerRules, validate, register)
router.post('/researcher-register', registerLimiter, registerResearcher)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/login',    loginLimiter,    loginRules,    validate, login)
router.post('/logout',   authenticate, logout)
router.post('/refresh',  refreshTokens)
router.get('/verify',    authenticate, verifyToken)
router.post('/change-password', authenticate, changePassword)

module.exports = router
