const { v4: uuidv4 } = require('uuid')
const pool = require('../db/connection')
const { decrypt } = require('../utils/crypto')

async function createProject(req, res) {
  const { needId, title, description, budgetApproved, startDate, endDate, companyId } = req.body
  if (!title || !companyId) return res.status(400).json({ message: 'Champs requis manquants.' })
  const client = await pool.connect()
  try {
    const id = uuidv4()
    const result = await client.query(
      `INSERT INTO projects (id, need_id, company_id, title, description, budget_approved, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [id, needId||null, companyId, title, description||null, budgetApproved||null, startDate||null, endDate||null]
    )
    if (needId) {
      await client.query(`UPDATE needs SET status='approved' WHERE id=$1`, [needId])
    }
    res.status(201).json({ project: formatProject(result.rows[0]) })
  } catch (err) {
    console.error('createProject error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getAllProjects(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT p.*, c.name AS company_name, c.sector
       FROM projects p
       JOIN companies c ON c.id = p.company_id
       ORDER BY p.created_at DESC`
    )
    res.json({ projects: result.rows.map(formatProject) })
  } catch (err) {
    console.error('getAllProjects error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getMyProjects(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT p.* FROM projects p WHERE p.company_id = $1 ORDER BY p.created_at DESC`,
      [req.user.id]
    )
    res.json({ projects: result.rows.map(formatProject) })
  } catch (err) {
    console.error('getMyProjects error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getResearcherProjects(req, res) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT p.*, pa.role AS assignment_role, pa.status AS assignment_status, pa.accepted_at
       FROM projects p
       JOIN project_assignments pa ON pa.project_id = p.id
       WHERE pa.researcher_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    )
    res.json({ projects: result.rows.map(formatProject) })
  } catch (err) {
    console.error('getResearcherProjects error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getProject(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    const pResult = await client.query(
      `SELECT p.*, c.name AS company_name, c.sector
       FROM projects p JOIN companies c ON c.id = p.company_id
       WHERE p.id = $1`,
      [id]
    )
    if (pResult.rows.length === 0) return res.status(404).json({ message: 'Projet introuvable.' })

    const assignResult = await client.query(
      `SELECT pa.*, c.name, c.specialty, c.grade, c.department
       FROM project_assignments pa
       JOIN companies c ON c.id = pa.researcher_id
       WHERE pa.project_id = $1`,
      [id]
    )
    const docsResult = await client.query(
      `SELECT d.*, c.name AS uploader_name
       FROM documents d JOIN companies c ON c.id = d.uploaded_by
       WHERE d.project_id = $1 ORDER BY d.created_at DESC`,
      [id]
    )
    const contractResult = await client.query(
      `SELECT * FROM contracts WHERE project_id = $1 ORDER BY created_at DESC`, [id]
    )

    res.json({
      project: formatProject(pResult.rows[0]),
      assignments: assignResult.rows,
      documents: docsResult.rows,
      contracts: contractResult.rows,
    })
  } catch (err) {
    console.error('getProject error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateProject(req, res) {
  const { id } = req.params
  const { title, description, status, progress, adminNotes, endDate, budgetApproved } = req.body
  const client = await pool.connect()
  try {
    const result = await client.query(
      `UPDATE projects SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         progress_pct = COALESCE($4, progress_pct),
         admin_notes = COALESCE($5, admin_notes),
         end_date = COALESCE($6, end_date),
         budget_approved = COALESCE($7, budget_approved),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title||null, description||null, status||null, progress??null, adminNotes||null, endDate||null, budgetApproved||null, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Projet introuvable.' })
    res.json({ project: formatProject(result.rows[0]) })
  } catch (err) {
    console.error('updateProject error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function deleteProject(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    await client.query('DELETE FROM projects WHERE id = $1', [id])
    res.json({ message: 'Projet supprimé.' })
  } catch (err) {
    console.error('deleteProject error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

// Researcher assignment
async function assignResearcher(req, res) {
  const { id } = req.params
  const { researcherId, role } = req.body
  if (!researcherId) return res.status(400).json({ message: 'researcherId requis.' })
  const client = await pool.connect()
  try {
    const assignId = uuidv4()
    const result = await client.query(
      `INSERT INTO project_assignments (id, project_id, researcher_id, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (project_id, researcher_id) DO UPDATE SET role = $4
       RETURNING *`,
      [assignId, id, researcherId, role || 'member']
    )
    // Notify researcher
    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, body, link)
       VALUES ($1,$2,'assignment','Nouvelle assignation de projet',
               'Vous avez été assigné à un nouveau projet. Veuillez accepter ou décliner.',
               $3)`,
      [uuidv4(), researcherId, `/researcher/projects`]
    )
    res.status(201).json({ assignment: result.rows[0] })
  } catch (err) {
    console.error('assignResearcher error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function respondToAssignment(req, res) {
  const { id } = req.params
  const { response, declineNote } = req.body
  if (!['accepted','declined'].includes(response)) {
    return res.status(400).json({ message: 'Réponse invalide.' })
  }
  const client = await pool.connect()
  try {
    const result = await client.query(
      `UPDATE project_assignments
       SET status = $1, accepted_at = CASE WHEN $1='accepted' THEN NOW() ELSE NULL END, decline_note = $2
       WHERE id = $3 AND researcher_id = $4
       RETURNING *`,
      [response, declineNote||null, id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Assignation introuvable.' })
    res.json({ assignment: result.rows[0] })
  } catch (err) {
    console.error('respondToAssignment error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getProjectAssignments(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT pa.*, c.name, c.specialty, c.grade, c.department, c.email AS enc_email
       FROM project_assignments pa
       JOIN companies c ON c.id = pa.researcher_id
       WHERE pa.project_id = $1`,
      [id]
    )
    res.json({ assignments: result.rows })
  } catch (err) {
    console.error('getProjectAssignments error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

// Contracts
async function createContract(req, res) {
  const { id } = req.params
  const { title, notes, expiresAt } = req.body
  if (!title) return res.status(400).json({ message: 'Titre requis.' })
  const client = await pool.connect()
  try {
    const cid = uuidv4()
    const result = await client.query(
      `INSERT INTO contracts (id, project_id, title, notes, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [cid, id, title, notes||null, expiresAt||null]
    )
    res.status(201).json({ contract: result.rows[0] })
  } catch (err) {
    console.error('createContract error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function updateContractStatus(req, res) {
  const { contractId } = req.params
  const { status } = req.body
  const client = await pool.connect()
  try {
    const extra = status === 'signed' ? ', signed_admin = NOW()' : ''
    const result = await client.query(
      `UPDATE contracts SET status = $1${extra}, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, contractId]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Contrat introuvable.' })
    res.json({ contract: result.rows[0] })
  } catch (err) {
    console.error('updateContractStatus error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

// Documents
async function addDocument(req, res) {
  const { id } = req.params
  const { title, fileName, fileUrl, docType, visibility } = req.body
  if (!title) return res.status(400).json({ message: 'Titre requis.' })
  const client = await pool.connect()
  try {
    const did = uuidv4()
    const result = await client.query(
      `INSERT INTO documents (id, project_id, uploaded_by, title, file_name, file_url, doc_type, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [did, id||null, req.user.id, title, fileName||null, fileUrl||null, docType||'other', visibility||'all']
    )
    res.status(201).json({ document: result.rows[0] })
  } catch (err) {
    console.error('addDocument error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

async function getProjectDocuments(req, res) {
  const { id } = req.params
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT d.*, c.name AS uploader_name FROM documents d
       JOIN companies c ON c.id = d.uploaded_by
       WHERE d.project_id = $1 ORDER BY d.created_at DESC`,
      [id]
    )
    res.json({ documents: result.rows })
  } catch (err) {
    console.error('getProjectDocuments error:', err.message)
    res.status(500).json({ message: 'Erreur serveur.' })
  } finally { client.release() }
}

function formatProject(row) {
  return {
    id: row.id,
    needId: row.need_id,
    companyId: row.company_id,
    companyName: row.company_name,
    sector: row.sector,
    title: row.title,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    budgetApproved: row.budget_approved,
    progressPct: row.progress_pct,
    adminNotes: row.admin_notes,
    assignmentRole: row.assignment_role,
    assignmentStatus: row.assignment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

module.exports = {
  createProject, getAllProjects, getMyProjects, getResearcherProjects,
  getProject, updateProject, deleteProject,
  assignResearcher, respondToAssignment, getProjectAssignments,
  createContract, updateContractStatus,
  addDocument, getProjectDocuments,
}
