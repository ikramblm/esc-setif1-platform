const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const ctrl = require('../controllers/projectsController')

// ── Researcher ────────────────────────────────────────────────
router.get('/my', authenticate, requireRole('researcher'), ctrl.getResearcherProjects)
router.put('/assignments/:id/respond', authenticate, requireRole('researcher'), ctrl.respondToAssignment)

// ── Company ───────────────────────────────────────────────────
router.get('/company', authenticate, requireRole('company'), ctrl.getMyProjects)

// ── Admin ─────────────────────────────────────────────────────
router.get('/all', authenticate, requireRole('admin'), ctrl.getAllProjects)
router.post('/', authenticate, requireRole('admin'), ctrl.createProject)
router.delete('/:id', authenticate, requireRole('admin'), ctrl.deleteProject)
router.post('/:id/assign', authenticate, requireRole('admin'), ctrl.assignResearcher)
router.get('/:id/assignments', authenticate, ctrl.getProjectAssignments)
router.post('/:id/contracts', authenticate, requireRole('admin'), ctrl.createContract)
router.put('/:id/contracts/:contractId', authenticate, requireRole('admin'), ctrl.updateContractStatus)
router.post('/:id/documents', authenticate, ctrl.addDocument)
router.get('/:id/documents', authenticate, ctrl.getProjectDocuments)
router.put('/:id', authenticate, requireRole('admin'), ctrl.updateProject)
router.get('/:id', authenticate, ctrl.getProject)

module.exports = router
