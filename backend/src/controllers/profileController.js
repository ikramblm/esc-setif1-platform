const pool = require('../db/connection')
const { decrypt, encrypt } = require('../utils/crypto')

async function getProfile(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT id, name, sector, contact_name, email, phone,
              website, address, employees, about, role, created_at
       FROM companies WHERE id = $1`,
      [req.user.id]
    )
    if (!r.rows.length) return res.status(404).json({ message: 'Profil introuvable.' })
    const c = r.rows[0]
    res.json({
      profile: {
        id: c.id,
        companyName: c.name,
        sector: c.sector,
        contactName: c.contact_name,
        email: safeDecrypt(c.email),
        phone: safeDecrypt(c.phone),
        website: c.website ?? '',
        address: c.address ?? '',
        employees: c.employees ?? '',
        about: c.about ?? '',
        role: c.role,
        memberSince: c.created_at,
      }
    })
  } catch (err) {
    console.error('getProfile error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateProfile(req, res) {
  const { companyName, sector, contactName, phone, website, address, employees, about } = req.body
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE companies SET
         name = COALESCE($1, name),
         sector = COALESCE($2, sector),
         contact_name = COALESCE($3, contact_name),
         phone = COALESCE($4, phone),
         website = $5,
         address = $6,
         employees = $7,
         about = $8,
         updated_at = NOW()
       WHERE id = $9`,
      [
        companyName || null,
        sector || null,
        contactName || null,
        phone ? encrypt(phone) : null,
        website ?? null,
        address ?? null,
        employees ? parseInt(employees) : null,
        about ?? null,
        req.user.id,
      ]
    )
    res.json({ message: 'Profil mis à jour.' })
  } catch (err) {
    console.error('updateProfile error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllCompanies(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT id, name, sector, contact_name, email, phone,
              website, address, employees, about, is_active, created_at
       FROM companies WHERE role = 'company' ORDER BY created_at DESC`
    )
    res.json({
      companies: r.rows.map(c => ({
        id: c.id,
        companyName: c.name,
        sector: c.sector,
        contactName: c.contact_name,
        email: safeDecrypt(c.email),
        phone: safeDecrypt(c.phone),
        website: c.website,
        address: c.address,
        employees: c.employees,
        about: c.about,
        isActive: c.is_active,
        createdAt: c.created_at,
      }))
    })
  } catch (err) {
    console.error('getAllCompanies error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function toggleCompanyActive(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    const r = await client.query(
      `UPDATE companies SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'company' RETURNING id, is_active`,
      [id]
    )
    if (!r.rows.length) return res.status(404).json({ message: 'Entreprise introuvable.' })
    res.json({ id: r.rows[0].id, isActive: r.rows[0].is_active })
  } catch (err) {
    console.error('toggleCompanyActive error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

function safeDecrypt(val) {
  if (!val) return ''
  try { return decrypt(val) } catch { return '' }
}

module.exports = { getProfile, updateProfile, getAllCompanies, toggleCompanyActive }
