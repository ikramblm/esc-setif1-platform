const { body, validationResult } = require('express-validator')

/** Extract validation errors and return 422 if any */
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Données invalides.', errors: errors.array() })
  }
  next()
}

const registerRules = [
  body('companyName').trim().notEmpty().isLength({ max: 200 }).escape(),
  body('sector').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('contactName').trim().notEmpty().isLength({ max: 150 }).escape(),
  body('email').trim().normalizeEmail().isEmail().isLength({ max: 254 }),
  body('phone').optional().trim().isMobilePhone('any').isLength({ max: 20 }),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/[A-Z]/).withMessage('Au moins 1 majuscule requise.')
    .matches(/[a-z]/).withMessage('Au moins 1 minuscule requise.')
    .matches(/[0-9]/).withMessage('Au moins 1 chiffre requis.'),
]

const loginRules = [
  body('email').trim().normalizeEmail().isEmail(),
  body('password').notEmpty().isLength({ max: 128 }),
]

const needRules = [
  body('title').trim().notEmpty().isLength({ max: 300 }).escape(),
  body('serviceType').trim().isIn(['Consulting','Formation','Études','Recherche']),
  body('description').trim().notEmpty().isLength({ max: 5000 }).escape(),
  body('deadline').isISO8601().toDate(),
  body('budget').optional().isNumeric().isFloat({ min: 0 }),
]

const serviceRules = [
  body('category').trim().isIn(['Consulting','Formation','Études','Recherche']),
  body('title').trim().notEmpty().isLength({ max: 300 }).escape(),
  body('description').trim().notEmpty().isLength({ max: 5000 }).escape(),
]

const statusRules = [
  body('status').isIn(['pending','reviewing','approved','rejected','completed']),
]

module.exports = { validate, registerRules, loginRules, needRules, serviceRules, statusRules }
