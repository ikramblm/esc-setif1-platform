const jwt = require('jsonwebtoken')

/**
 * Verifies JWT access token. Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou malformé.' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    req.user = payload
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expirée. Veuillez vous reconnecter.', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ message: 'Token invalide.' })
  }
}

module.exports = { authenticate }
