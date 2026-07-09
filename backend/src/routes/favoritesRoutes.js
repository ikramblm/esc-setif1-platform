const router = require('express').Router()
const { authenticate } = require('../middleware/authMiddleware')
const { getMyFavorites, getFavoriteIds, toggleFavorite } = require('../controllers/favoritesController')

router.use(authenticate)
router.get('/',              getMyFavorites)
router.get('/ids',           getFavoriteIds)
router.post('/:serviceId/toggle', toggleFavorite)

module.exports = router
