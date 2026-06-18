const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function getServices(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id, category, title, description, published_at FROM services ORDER BY published_at DESC'
    )
    res.json({ services: result.rows.map(formatService) })
  } catch (err) {
    console.error('Get services error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function publishService(req, res) {
  const { category, title, description } = req.body
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO services (id, category, title, description)
       VALUES ($1,$2,$3,$4)
       RETURNING id, category, title, description, published_at`,
      [id, category, title, description]
    )
    res.status(201).json({ service: formatService(result.rows[0]) })
  } catch (err) {
    console.error('Publish service error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function deleteService(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    const result = await client.query('DELETE FROM services WHERE id = $1 RETURNING id', [id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Service introuvable.' })
    res.json({ message: 'Service supprimé.' })
  } catch (err) {
    console.error('Delete service error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

function formatService(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
  }
}

module.exports = { getServices, publishService, deleteService }
