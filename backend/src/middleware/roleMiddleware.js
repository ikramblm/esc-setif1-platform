/**
 * Role-Based Access Control middleware.
 * Usage: requireRole('admin') or requireRole('company', 'admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié.' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Privilèges insuffisants.' })
    }
    next()
  }
}

module.exports = { requireRole }
