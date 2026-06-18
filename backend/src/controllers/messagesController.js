const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')

async function sendMessage(req, res) {
  const { projectId, receiverId, body } = req.body
  if (!body) return res.status(400).json({ message: 'Corps du message requis.' })
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO messages (id, project_id, sender_id, receiver_id, body)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, projectId||null, req.user.id, receiverId||null, body.trim()]
    )
    // Notify receiver if specified
    if (receiverId) {
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, body, link)
         VALUES ($1,$2,'message','Nouveau message','Vous avez reçu un nouveau message.',$3)`,
        [uuidv4(), receiverId, projectId ? `/projects/${projectId}` : null]
      )
    }
    res.status(201).json({ message: result.rows[0] })
  } catch (err) {
    console.error('sendMessage error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getProjectMessages(req, res) {
  const { projectId } = req.params
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT m.*, c.name AS sender_name, c.role AS sender_role
       FROM messages m
       JOIN companies c ON c.id = m.sender_id
       WHERE m.project_id = $1
       ORDER BY m.created_at ASC`,
      [projectId]
    )
    // Mark as read for current user
    await client.query(
      `UPDATE messages SET is_read = TRUE
       WHERE project_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [projectId, req.user.id]
    )
    res.json({ messages: result.rows })
  } catch (err) {
    console.error('getProjectMessages error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getMyMessages(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT m.*, c.name AS sender_name, p.title AS project_title
       FROM messages m
       JOIN companies c ON c.id = m.sender_id
       LEFT JOIN projects p ON p.id = m.project_id
       WHERE m.receiver_id = $1 OR m.sender_id = $1
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [req.user.id]
    )
    res.json({ messages: result.rows })
  } catch (err) {
    console.error('getMyMessages error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getUnreadCount(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE`,
      [req.user.id]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    console.error('getUnreadCount error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

module.exports = { sendMessage, getProjectMessages, getMyMessages, getUnreadCount }
