const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function createNeed(req, res) {
  const { title, serviceType, description, deadline, budget } = req.body
  const companyId = req.user.id
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO needs (id, company_id, service_type, title, description, deadline, budget, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
       RETURNING id, title, service_type, description, deadline, budget, status, created_at`,
      [id, companyId, serviceType, title, description, deadline, budget ?? null]
    )
    res.status(201).json({ need: formatNeed(result.rows[0]) })
  } catch (err) {
    console.error('Create need error:', err.message)
    res.status(500).json({ message: 'Erreur lors de la création de la demande.' })
  } finally { client.release() }
}

async function getCompanyNeeds(req, res) {
  const companyId = req.user.id
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, title, service_type, description, deadline, budget, status, created_at
       FROM needs WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    )
    res.json({ needs: result.rows.map(formatNeed) })
  } catch (err) {
    console.error('Get company needs error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllNeeds(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT n.id, n.title, n.service_type, n.description, n.deadline,
              n.budget, n.status, n.created_at,
              c.name as company_name, c.sector as company_sector
       FROM needs n
       LEFT JOIN companies c ON n.company_id = c.id
       ORDER BY n.created_at DESC`
    )
    res.json({
      needs: result.rows.map(r => ({
        ...formatNeed(r),
        company: { name: r.company_name, sector: r.company_sector }
      }))
    })
  } catch (err) {
    console.error('Get all needs error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateNeedStatus(req, res) {
  const { id } = req.params
  const { status } = req.body
  const client = await pool.connect()
  try {
    const result = await client.query(
      `UPDATE needs SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, status`,
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Demande introuvable.' })
    res.json({ need: result.rows[0] })
  } catch (err) {
    console.error('Update need status error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

function formatNeed(row) {
  return {
    id: row.id,
    title: row.title,
    serviceType: row.service_type,
    description: row.description,
    deadline: row.deadline,
    budget: row.budget,
    status: row.status,
    createdAt: row.created_at,
  }
}

module.exports = { createNeed, getCompanyNeeds, getAllNeeds, updateNeedStatus }
