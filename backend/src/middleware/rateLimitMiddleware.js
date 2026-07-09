const rateLimit = require('express-rate-limit')

/** Strict limiter for login attempts: 5 per 10 minutes */
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_WINDOW_MINUTES ?? '10') * 60 * 1000,
  max: parseInt(process.env.LOGIN_MAX_ATTEMPTS ?? '5'),
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
})

/** General API limiter: 100 req/min per IP */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Trop de requêtes. Veuillez patienter.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Registration limiter: 3 per hour per IP */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Trop de créations de compte depuis cette adresse IP.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/** Email verification limiter: 10 per hour per IP (covers send + resend + verify attempts) */
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives de vérification. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { loginLimiter, apiLimiter, registerLimiter, verificationLimiter }
