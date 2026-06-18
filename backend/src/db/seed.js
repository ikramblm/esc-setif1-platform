// Run: node src/db/seed.js
require('dotenv').config()
const pool = require('./connection')
const { hashPassword } = require('../utils/passwordHash')
const { encrypt } = require('../utils/crypto')
const { v4: uuidv4 } = require('uuid')

async function seed() {
  const client = await pool.connect()
  try {
    console.log('Seeding database...')

    // Admin account
    const adminEmail = 'admin@esc-setif1.dz'
    const adminPassword = 'admin123'
    const passwordHash = await hashPassword(adminPassword)
    const encryptedEmail = encrypt(adminEmail)
    const encryptedPhone = encrypt('+213 36 62 00 00')

    await client.query(`
      INSERT INTO companies (id, name, sector, contact_name, email, email_normalized, phone, password_hash, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'admin')
      ON CONFLICT (email_normalized) DO UPDATE
        SET password_hash = $8, role = 'admin'
    `, [
      uuidv4(),
      'ESC Sétif 1 Administration',
      'Administration Publique',
      'Administrateur Système',
      encryptedEmail,
      adminEmail,
      encryptedPhone,
      passwordHash,
    ])
    console.log('✓ Admin account created:', adminEmail, '/', adminPassword)

    // Default services
    const services = [
      { category: 'Consulting', title: 'Audit Stratégique et Organisationnel', description: "Diagnostic approfondi de votre organisation : analyse de la structure, des processus et de la gouvernance. Livrables : rapport d'audit + plan d'action priorisé." },
      { category: 'Formation',  title: 'Formation en Management de Projet (PMP Ready)', description: "Programme de 5 jours animé par des docteurs en management. Couvre le cycle PMBoK v7 : initiation, planification, exécution, contrôle et clôture." },
      { category: 'Études',     title: 'Étude de Faisabilité Technico-Économique', description: "Analyse complète de la viabilité technique et financière de votre projet. Inclut : étude de marché, rentabilité et matrice des risques." },
      { category: 'Recherche',  title: 'Partenariat R&D Industriel', description: "Collaboration avec nos laboratoires pour développer des solutions innovantes adaptées à vos problématiques industrielles. Valorisation et brevets inclus." },
    ]
    for (const svc of services) {
      await client.query(
        `INSERT INTO services (id, category, title, description) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [uuidv4(), svc.category, svc.title, svc.description]
      )
    }
    console.log('✓ Default services inserted')

    console.log('\nSeed complete. You can now log in with:')
    console.log('  Email   :', adminEmail)
    console.log('  Password:', adminPassword)
  } catch (err) {
    console.error('Seed error:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
