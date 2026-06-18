require('dotenv').config()

const express = require('express')
const helmet  = require('helmet')
const cors    = require('cors')
const morgan  = require('morgan')
const { apiLimiter } = require('./middleware/rateLimitMiddleware')

const authRoutes        = require('./routes/authRoutes')
const needsRoutes       = require('./routes/needsRoutes')
const servicesRoutes    = require('./routes/servicesRoutes')
const profileRoutes     = require('./routes/profileRoutes')
const researchersRoutes = require('./routes/researchersRoutes')
const offersRoutes         = require('./routes/offersRoutes')
const projectsRoutes       = require('./routes/projectsRoutes')
const messagesRoutes       = require('./routes/messagesRoutes')
const notificationsRoutes  = require('./routes/notificationsRoutes')

const app = express()

// ── Security headers (Helmet) ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}))

// ── CORS ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',')
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS policy: origin not allowed'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }))
app.use(express.urlencoded({ extended: false, limit: '50kb' }))

// ── Logging (mask sensitive data) ──────────────────────────────
morgan.token('safe-url', (req) => req.url.replace(/password=[^&]*/gi, 'password=***'))
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :safe-url :status :res[content-length] - :response-time ms'))
}

// ── Global rate limit ──────────────────────────────────────────
app.use('/api', apiLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/needs',       needsRoutes)
app.use('/api/services',    servicesRoutes)
app.use('/api/profile',     profileRoutes)
app.use('/api/researchers', researchersRoutes)
app.use('/api/offers',         offersRoutes)
app.use('/api/projects',       projectsRoutes)
app.use('/api/messages',       messagesRoutes)
app.use('/api/notifications',  notificationsRoutes)

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Endpoint introuvable.' }))

// ── Global error handler ───────────────────────────────────────
app.use((err, req, res, _next) => {
  // Never expose stack traces in production
  const isDev = process.env.NODE_ENV === 'development'
  console.error('Unhandled error:', err.message)
  res.status(err.status ?? 500).json({
    message: err.message ?? 'Erreur serveur interne.',
    ...(isDev && { stack: err.stack }),
  })
})

module.exports = app
