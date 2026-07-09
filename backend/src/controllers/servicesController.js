const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function getServices(req, res) {
  const { search, category, department, pricing } = req.query
  const client = await pool.connect()
  try {
    const conditions = ['is_active = TRUE']
    const params = []

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }
    if (category) {
      params.push(category)
      conditions.push(`category = $${params.length}`)
    }
    if (department) {
      params.push(department)
      conditions.push(`department = $${params.length}`)
    }
    if (pricing === 'free') {
      conditions.push('is_free = TRUE')
    } else if (pricing === 'paid') {
      conditions.push('is_free = FALSE AND price IS NOT NULL')
    }

    const result = await client.query(
      `SELECT id, category, title, description, title_en, title_ar, description_en, description_ar,
              activity_code, department, city, research_domain, phone,
              price, is_free, images, documents, published_at
       FROM services WHERE ${conditions.join(' AND ')} ORDER BY published_at DESC`,
      params
    )
    res.json({ services: result.rows.map(formatService) })
  } catch (err) {
    console.error('Get services error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getDepartments(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT DISTINCT department FROM services WHERE department IS NOT NULL AND is_active = TRUE ORDER BY department`
    )
    res.json({ departments: result.rows.map(r => r.department) })
  } catch (err) {
    console.error('Get departments error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getMyServices(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, category, title, description, title_en, title_ar, description_en, description_ar,
              activity_code, department, city, research_domain, phone,
              price, is_free, images, documents, published_at
       FROM services WHERE researcher_id = $1 ORDER BY published_at DESC`,
      [req.user.id]
    )
    res.json({ services: result.rows.map(formatService) })
  } catch (err) {
    console.error('Get my services error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

function filePathsFrom(files) {
  if (!files) return []
  return files.map(f => ({ path: `/uploads/services/${f.filename}`, name: f.originalname }))
}

async function publishService(req, res) {
  const { category, title, description, department, city, researchDomain, phone, price, isFree } = req.body
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const images    = JSON.stringify(filePathsFrom(req.files?.images))
    const documents = JSON.stringify(filePathsFrom(req.files?.documents))
    const researcherId = req.user.role === 'researcher' ? req.user.id : null

    const result = await client.query(
      `INSERT INTO services (id, category, title, description, department, city, research_domain, phone,
                              price, is_free, images, documents, researcher_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, category, title, description, department, city, research_domain, phone,
                 price, is_free, images, documents, published_at`,
      [
        id, category, title, description, department || null, city || null, researchDomain || null, phone || null,
        isFree === 'true' || isFree === true ? null : (price || null),
        isFree === 'true' || isFree === true,
        images, documents, researcherId,
      ]
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
    const conditions = req.user.role === 'admin' ? 'id = $1' : 'id = $1 AND researcher_id = $2'
    const params = req.user.role === 'admin' ? [id] : [id, req.user.id]
    const result = await client.query(`DELETE FROM services WHERE ${conditions} RETURNING id`, params)
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
    titleEn: row.title_en ?? null,
    titleAr: row.title_ar ?? null,
    descriptionEn: row.description_en ?? null,
    descriptionAr: row.description_ar ?? null,
    activityCode: row.activity_code ?? null,
    department: row.department,
    city: row.city,
    researchDomain: row.research_domain,
    phone: row.phone,
    price: row.price !== null ? Number(row.price) : null,
    isFree: row.is_free,
    images: row.images ?? [],
    documents: row.documents ?? [],
    publishedAt: row.published_at,
  }
}

module.exports = { getServices, getDepartments, getMyServices, publishService, deleteService }
