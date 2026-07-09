const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

function fmtOffer(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    deadline: r.deadline,
    budget: r.budget,
    slots: r.slots,
    tags: r.tags ? r.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    status: r.status,
    applicantsCount: parseInt(r.applicants_count ?? 0),
    createdAt: r.created_at,
  }
}

function fmtApp(r) {
  return {
    id: r.id,
    offerId: r.offer_id,
    offerTitle: r.offer_title ?? '',
    companyId: r.company_id,
    companyName: r.company_name ?? '',
    companySector: r.company_sector ?? '',
    coverLetter: r.cover_letter ?? '',
    status: r.status,
    appliedAt: r.applied_at,
  }
}

// ── Offers CRUD (admin) ──────────────────────────────────────

async function createOffer(req, res) {
  const { title, description, category, deadline, budget, slots, tags } = req.body
  const client = await pool.connect()
  try {
    const id = uuidv4()
    await client.query(
      `INSERT INTO project_offers (id, title, description, category, deadline, budget, slots, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, title, description, category,
       deadline || null, budget ? parseFloat(budget) : null,
       slots ? parseInt(slots) : 1,
       Array.isArray(tags) ? tags.join(',') : (tags ?? null)]
    )
    res.status(201).json({ message: "Offre créée." })
  } catch (err) {
    console.error('createOffer:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllOffers(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT o.*,
         (SELECT COUNT(*) FROM project_applications pa WHERE pa.offer_id = o.id) AS applicants_count
       FROM project_offers o ORDER BY o.created_at DESC`
    )
    res.json({ offers: r.rows.map(fmtOffer) })
  } catch (err) {
    console.error('getAllOffers:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getOpenOffers(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT o.*,
         (SELECT COUNT(*) FROM project_applications pa WHERE pa.offer_id = o.id) AS applicants_count
       FROM project_offers o WHERE o.status = 'open' ORDER BY o.created_at DESC`
    )
    res.json({ offers: r.rows.map(fmtOffer) })
  } catch (err) {
    console.error('getOpenOffers:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateOffer(req, res) {
  const { id } = req.params
  const { title, description, category, deadline, budget, slots, tags, status } = req.body
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE project_offers SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         deadline = $4,
         budget = $5,
         slots = COALESCE($6, slots),
         tags = $7,
         status = COALESCE($8, status),
         updated_at = NOW()
       WHERE id = $9`,
      [title || null, description || null, category || null,
       deadline || null, budget ? parseFloat(budget) : null,
       slots ? parseInt(slots) : null,
       Array.isArray(tags) ? tags.join(',') : (tags ?? null),
       status || null, id]
    )
    res.json({ message: 'Offre mise à jour.' })
  } catch (err) {
    console.error('updateOffer:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function deleteOffer(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query('DELETE FROM project_offers WHERE id = $1', [id])
    res.json({ message: 'Offre supprimée.' })
  } catch (err) {
    console.error('deleteOffer:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

// ── Applications ─────────────────────────────────────────────

async function applyToOffer(req, res) {
  const { id: offerId } = req.params
  const { coverLetter } = req.body
  const companyId = req.user.id
  const client = await pool.connect()
  try {
    const offerCheck = await client.query(
      `SELECT id, status FROM project_offers WHERE id = $1`, [offerId]
    )
    if (!offerCheck.rows.length) return res.status(404).json({ message: 'Offre introuvable.' })
    if (offerCheck.rows[0].status !== 'open') return res.status(400).json({ message: 'Cette offre est fermée.' })

    const id = uuidv4()
    await client.query(
      `INSERT INTO project_applications (id, offer_id, company_id, cover_letter)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (offer_id, company_id) DO NOTHING`,
      [id, offerId, companyId, coverLetter ?? null]
    )
    res.status(201).json({ message: 'Candidature soumise avec succès.' })
  } catch (err) {
    console.error('applyToOffer:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getMyApplications(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT pa.*, po.title AS offer_title, po.category, po.status AS offer_status
       FROM project_applications pa
       JOIN project_offers po ON pa.offer_id = po.id
       WHERE pa.company_id = $1
       ORDER BY pa.applied_at DESC`,
      [req.user.id]
    )
    res.json({
      applications: r.rows.map(row => ({
        id: row.id,
        offerId: row.offer_id,
        offerTitle: row.offer_title,
        category: row.category,
        offerStatus: row.offer_status,
        coverLetter: row.cover_letter ?? '',
        status: row.status,
        appliedAt: row.applied_at,
      }))
    })
  } catch (err) {
    console.error('getMyApplications:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getOfferApplications(req, res) {
  const { id: offerId } = req.params
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT pa.*, c.name AS company_name, c.sector AS company_sector
       FROM project_applications pa
       JOIN companies c ON pa.company_id = c.id
       WHERE pa.offer_id = $1
       ORDER BY pa.applied_at ASC`,
      [offerId]
    )
    res.json({ applications: r.rows.map(fmtApp) })
  } catch (err) {
    console.error('getOfferApplications:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateApplicationStatus(req, res) {
  const { id } = req.params
  const { status } = req.body
  const client = await pool.connect()
  try {
    const r = await client.query(
      `UPDATE project_applications SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, status, company_id, offer_id`,
      [status, id]
    )
    if (!r.rows.length) return res.status(404).json({ message: 'Candidature introuvable.' })
    const app = r.rows[0]
    const offer = await client.query('SELECT title FROM offers WHERE id = $1', [app.offer_id])
    const offerTitle = offer.rows[0]?.title ?? 'l’offre'
    const label = status === 'accepted' ? 'acceptée' : status === 'rejected' ? 'rejetée' : 'mise à jour'
    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, body)
       VALUES ($1,$2,'status','Mise à jour de votre candidature',$3)`,
      [uuidv4(), app.company_id, `Votre candidature à "${offerTitle}" a été ${label}.`]
    )
    res.json({ application: { id: app.id, status: app.status } })
  } catch (err) {
    console.error('updateApplicationStatus:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllApplications(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT pa.*, po.title AS offer_title, c.name AS company_name, c.sector AS company_sector
       FROM project_applications pa
       JOIN project_offers po ON pa.offer_id = po.id
       JOIN companies c ON pa.company_id = c.id
       ORDER BY pa.applied_at DESC`
    )
    res.json({ applications: r.rows.map(fmtApp) })
  } catch (err) {
    console.error('getAllApplications:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = {
  createOffer, getAllOffers, getOpenOffers, updateOffer, deleteOffer,
  applyToOffer, getMyApplications, getOfferApplications, updateApplicationStatus, getAllApplications
}
