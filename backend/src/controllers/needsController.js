const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function createNeed(req, res) {
  const { title, serviceType, description, deadline, budget, serviceId } = req.body
  const companyId = req.user.id
  if (!title || !serviceType || !description) {
    return res.status(400).json({ message: 'Titre, type de service et description sont requis.' })
  }
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO needs (id, company_id, service_type, title, description, deadline, budget, service_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
       RETURNING id, title, service_type, description, deadline, budget, status, created_at, service_id`,
      [id, companyId, serviceType, title, description, deadline || null, budget ?? null, serviceId || null]
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
      `SELECT n.id, n.title, n.service_type, n.description, n.deadline, n.budget, n.status, n.created_at,
              n.service_id, s.title as service_title
       FROM needs n LEFT JOIN services s ON n.service_id = s.id
       WHERE n.company_id = $1 ORDER BY n.created_at DESC`,
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

const STATUS_LABELS = {
  pending: 'en attente', reviewing: 'en cours d’examen', approved: 'approuvée',
  rejected: 'rejetée', completed: 'terminée',
}

async function updateNeedStatus(req, res) {
  const { id } = req.params
  const { status } = req.body
  const client = await pool.connect()
  try {
    const result = await client.query(
      `UPDATE needs SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, status, title, company_id`,
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Demande introuvable.' })
    const need = result.rows[0]
    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, body)
       VALUES ($1,$2,'status','Mise à jour de votre demande',$3)`,
      [uuidv4(), need.company_id, `Votre demande "${need.title}" est maintenant ${STATUS_LABELS[status] ?? status}.`]
    )
    res.json({ need: { id: need.id, status: need.status } })
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
    serviceId: row.service_id ?? null,
    serviceTitle: row.service_title ?? null,
  }
}

module.exports = { createNeed, getCompanyNeeds, getAllNeeds, updateNeedStatus }
