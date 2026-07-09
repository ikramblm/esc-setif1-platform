const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function getMyFavorites(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT s.id, s.category, s.title, s.description, s.department, s.price, s.is_free, s.published_at
       FROM favorites f
       JOIN services s ON s.id = f.service_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    )
    res.json({
      favorites: result.rows.map(row => ({
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        department: row.department,
        price: row.price !== null ? Number(row.price) : null,
        isFree: row.is_free,
        publishedAt: row.published_at,
      }))
    })
  } catch (err) {
    console.error('getMyFavorites error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getFavoriteIds(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT service_id FROM favorites WHERE user_id = $1', [req.user.id])
    res.json({ serviceIds: result.rows.map(r => r.service_id) })
  } catch (err) {
    console.error('getFavoriteIds error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function toggleFavorite(req, res) {
  const { serviceId } = req.params
  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND service_id = $2',
      [req.user.id, serviceId]
    )
    if (existing.rows.length > 0) {
      await client.query('DELETE FROM favorites WHERE id = $1', [existing.rows[0].id])
      return res.json({ favorited: false })
    }
    await client.query(
      'INSERT INTO favorites (id, user_id, service_id) VALUES ($1,$2,$3)',
      [uuidv4(), req.user.id, serviceId]
    )
    res.json({ favorited: true })
  } catch (err) {
    console.error('toggleFavorite error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = { getMyFavorites, getFavoriteIds, toggleFavorite }
