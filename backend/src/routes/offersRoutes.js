const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const ctrl = require('../controllers/offersController')

// ── Static paths first (must come before /:id) ───────────────

// Company: own applications
router.get('/my/applications',    authenticate, requireRole('company'), ctrl.getMyApplications)
// Admin: all applications across offers
router.get('/admin/applications', authenticate, requireRole('admin'),   ctrl.getAllApplications)
// Update one application status
router.put('/applications/:id/status', authenticate, requireRole('admin'), ctrl.updateApplicationStatus)

// Admin: all offers (including closed/archived)
router.get('/all', authenticate, requireRole('admin'), ctrl.getAllOffers)

// ── Offer CRUD ────────────────────────────────────────────────
router.get('/',      authenticate, ctrl.getOpenOffers)
router.post('/',     authenticate, requireRole('admin'), ctrl.createOffer)
router.put('/:id',   authenticate, requireRole('admin'), ctrl.updateOffer)
router.delete('/:id',authenticate, requireRole('admin'), ctrl.deleteOffer)

// ── Per-offer actions ─────────────────────────────────────────
router.post('/:id/apply',        authenticate, requireRole('company'), ctrl.applyToOffer)
router.get('/:id/applications',  authenticate, requireRole('admin'),   ctrl.getOfferApplications)

module.exports = router
