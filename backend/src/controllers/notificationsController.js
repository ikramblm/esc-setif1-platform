const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function getMyNotifications(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    )
    res.json({ notifications: result.rows })
  } catch (err) {
    console.error('getMyNotifications error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function markRead(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('markRead error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function markAllRead(req, res) {
  const client = await pool.connect()
  try {
    await client.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('markAllRead error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getUnreadCount(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    console.error('getUnreadCount error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function createNotification(req, res) {
  const { userId, type, title, body, link } = req.body
  if (!userId || !title) return res.status(400).json({ message: 'userId et title requis.' })
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO notifications (id, user_id, type, title, body, link)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, userId, type||'info', title, body||null, link||null]
    )
    res.status(201).json({ notification: result.rows[0] })
  } catch (err) {
    console.error('createNotification error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = { getMyNotifications, markRead, markAllRead, getUnreadCount, createNotification }
