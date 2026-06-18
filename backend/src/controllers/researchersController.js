const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')
const { encrypt, decrypt } = require('../utils/crypto')

function fmt(r) {
  return {
    id: r.id,
    fullName: r.full_name,
    specialty: r.specialty,
    department: r.department ?? '',
    grade: r.grade ?? '',
    email: safeDecrypt(r.email),
    phone: safeDecrypt(r.phone),
    bio: r.bio ?? '',
    expertise: r.expertise ? r.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
    isActive: r.is_active,
    createdAt: r.created_at,
  }
}
function safeDecrypt(v) { if (!v) return ''; try { return decrypt(v) } catch { return '' } }

async function getAll(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(
      `SELECT * FROM researchers WHERE is_active = TRUE ORDER BY full_name ASC`
    )
    res.json({ researchers: r.rows.map(fmt) })
  } catch (err) {
    console.error('getAll researchers error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllAdmin(req, res) {
  const client = await pool.connect()
  try {
    const r = await client.query(`SELECT * FROM researchers ORDER BY full_name ASC`)
    res.json({ researchers: r.rows.map(fmt) })
  } catch (err) {
    console.error('getAllAdmin researchers error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function create(req, res) {
  const { fullName, specialty, department, grade, email, phone, bio, expertise } = req.body
  const client = await pool.connect()
  try {
    const id = uuidv4()
    await client.query(
      `INSERT INTO researchers (id, full_name, specialty, department, grade, email, phone, bio, expertise)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, fullName, specialty, department ?? null, grade ?? null,
       encrypt(email), phone ? encrypt(phone) : null,
       bio ?? null,
       Array.isArray(expertise) ? expertise.join(',') : (expertise ?? null)]
    )
    res.status(201).json({ message: 'Chercheur ajouté.' })
  } catch (err) {
    console.error('create researcher error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function update(req, res) {
  const { id } = req.params
  const { fullName, specialty, department, grade, email, phone, bio, expertise, isActive } = req.body
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE researchers SET
         full_name  = COALESCE($1, full_name),
         specialty  = COALESCE($2, specialty),
         department = $3,
         grade      = $4,
         email      = COALESCE($5, email),
         phone      = $6,
         bio        = $7,
         expertise  = $8,
         is_active  = COALESCE($9, is_active),
         updated_at = NOW()
       WHERE id = $10`,
      [
        fullName || null, specialty || null,
        department ?? null, grade ?? null,
        email ? encrypt(email) : null,
        phone ? encrypt(phone) : null,
        bio ?? null,
        Array.isArray(expertise) ? expertise.join(',') : (expertise ?? null),
        typeof isActive === 'boolean' ? isActive : null,
        id,
      ]
    )
    res.json({ message: 'Chercheur mis à jour.' })
  } catch (err) {
    console.error('update researcher error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function remove(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query('DELETE FROM researchers WHERE id = $1', [id])
    res.json({ message: 'Chercheur supprimé.' })
  } catch (err) {
    console.error('remove researcher error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = { getAll, getAllAdmin, create, update, remove }
