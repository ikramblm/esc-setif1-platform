const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')
const { hashPassword, comparePassword } = require('../utils/passwordHash')
const { encrypt, decrypt } = require('../utils/crypto')

function generateTokens(userId, role, email) {
  const accessToken = jwt.sign(
    { id: userId, role, email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' }
  )
  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d' }
  )
  return { accessToken, refreshToken }
}

async function register(req, res) {
  const { companyName, sector, contactName, email, phone, password } = req.body
  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id FROM companies WHERE email_normalized = $1',
      [email.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée.' })
    }

    const passwordHash = await hashPassword(password)
    const encryptedEmail = encrypt(email)
    const encryptedPhone = encrypt(phone ?? '')
    const id = uuidv4()

    await client.query(
      `INSERT INTO companies (id, name, sector, contact_name, email, email_normalized, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'company')`,
      [id, companyName, sector, contactName, encryptedEmail, email.toLowerCase(), encryptedPhone, passwordHash]
    )

    const { accessToken, refreshToken } = generateTokens(id, 'company', email)

    const refreshHash = await hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await client.query(
      'INSERT INTO sessions (id, company_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)',
      [uuidv4(), id, refreshHash, expiresAt]
    )

    res.status(201).json({
      accessToken, refreshToken,
      user: { id, email, role: 'company', companyName, exp: Math.floor(Date.now()/1000) + 15*60 }
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ message: `Erreur serveur lors de l'inscription.` })
  } finally { client.release() }
}

async function registerResearcher(req, res) {
  const { fullName, department, specialty, grade, email, phone, password } = req.body
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Nom, email et mot de passe sont requis.' })
  }
  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id FROM companies WHERE email_normalized = $1',
      [email.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée.' })
    }

    const passwordHash = await hashPassword(password)
    const encryptedEmail = encrypt(email)
    const encryptedPhone = encrypt(phone ?? '')
    const id = uuidv4()

    await client.query(
      `INSERT INTO companies
         (id, name, sector, contact_name, email, email_normalized, phone, password_hash, role,
          department, specialty, grade)
       VALUES ($1,$2,'Recherche',$2,$3,$4,$5,$6,'researcher',$7,$8,$9)`,
      [id, fullName, encryptedEmail, email.toLowerCase(), encryptedPhone, passwordHash,
       department||null, specialty||null, grade||null]
    )

    const { accessToken, refreshToken } = generateTokens(id, 'researcher', email)

    const refreshHash = await hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await client.query(
      'INSERT INTO sessions (id, company_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)',
      [uuidv4(), id, refreshHash, expiresAt]
    )

    res.status(201).json({
      accessToken, refreshToken,
      user: { id, email, role: 'researcher', companyName: fullName, exp: Math.floor(Date.now()/1000) + 15*60 }
    })
  } catch (err) {
    console.error('RegisterResearcher error:', err.message)
    res.status(500).json({ message: `Erreur serveur lors de l'inscription.` })
  } finally { client.release() }
}

async function login(req, res) {
  const { email, password } = req.body
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id, email, phone, password_hash, role, name FROM companies WHERE email_normalized = $1',
      [email.toLowerCase()]
    )
    if (result.rows.length === 0) {
      // Constant-time response to prevent user enumeration
      await comparePassword('dummy', '$2b$12$dummyhashtopreventtiming')
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
    }

    const company = result.rows[0]
    const valid = await comparePassword(password, company.password_hash)
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' })

    const { accessToken, refreshToken } = generateTokens(company.id, company.role, email)

    // Persist refresh token
    const refreshHash = await hashPassword(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await client.query(
      'INSERT INTO sessions (id, company_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)',
      [uuidv4(), company.id, refreshHash, expiresAt]
    )

    res.json({
      accessToken, refreshToken,
      user: {
        id: company.id,
        email,
        role: company.role,
        companyName: company.name,
        exp: Math.floor(Date.now()/1000) + 15*60,
      }
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function logout(req, res) {
  const client = await pool.connect()
  try {
    // Invalidate all sessions for this user
    if (req.user?.id) {
      await client.query('DELETE FROM sessions WHERE company_id = $1', [req.user.id])
    }
    res.json({ message: 'Déconnecté avec succès.' })
  } catch (err) {
    console.error('Logout error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function refreshTokens(req, res) {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token manquant.' })
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const { accessToken, refreshToken: newRefresh } = generateTokens(payload.id, payload.role, payload.email ?? '')

    res.json({ accessToken, refreshToken: newRefresh, exp: Math.floor(Date.now()/1000) + 15*60 })
  } catch {
    res.status(401).json({ message: 'Refresh token invalide ou expiré.' })
  }
}

async function verifyToken(req, res) {
  res.json({ valid: true, user: req.user })
}

async function forgotPassword(req, res) {
  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Adresse e-mail invalide.' })
  }
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id FROM companies WHERE email_normalized = $1',
      [email.toLowerCase()]
    )
    if (result.rows.length === 0) {
      // Security: don't reveal whether email exists
      return res.json({ message: 'Si cet e-mail est enregistré, un code de réinitialisation a été envoyé.' })
    }
    const userId = result.rows[0].id
    // Generate 6-digit code valid for 15 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 15 * 60 * 1000)
    await client.query(
      'UPDATE companies SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [code, expires, userId]
    )
    // In production this would be emailed. For demo, returned in response.
    res.json({
      message: 'Si cet e-mail est enregistré, un code de réinitialisation a été envoyé.',
      // Only expose code in development mode
      ...(process.env.NODE_ENV !== 'production' && { devCode: code }),
    })
  } catch (err) {
    console.error('forgotPassword error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  }
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, reset_token, reset_token_expires FROM companies WHERE email_normalized = $1`,
      [email.toLowerCase()]
    )
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Code invalide ou expiré.' })
    }
    const { id, reset_token, reset_token_expires } = result.rows[0]
    if (!reset_token || reset_token !== code) {
      return res.status(400).json({ message: 'Code invalide.' })
    }
    if (new Date(reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Code expiré. Veuillez recommencer.' })
    }
    const passwordHash = await hashPassword(newPassword)
    await client.query(
      'UPDATE companies SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, id]
    )
    res.json({ message: 'Mot de passe réinitialisé avec succès.' })
  } catch (err) {
    console.error('resetPassword error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = { register, registerResearcher, login, logout, refreshTokens, verifyToken, forgotPassword, resetPassword }
