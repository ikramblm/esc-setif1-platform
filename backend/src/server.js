require('dotenv').config()
const app  = require('./app')
const pool = require('./db/connection')

const PORT = parseInt(process.env.PORT ?? '4000', 10)

async function start() {
  try {
    await pool.query('SELECT 1')
    console.log('✓ PostgreSQL connected')
    app.listen(PORT, () => {
      console.log(`✓ ESC Sétif 1 API running on http://localhost:${PORT}`)
      console.log(`  Environment: ${process.env.NODE_ENV ?? 'development'}`)
    })
  } catch (err) {
    console.error('✗ Failed to connect to database:', err.message)
    process.exit(1)
  }
}

start()

process.on('SIGTERM', async () => {
  console.log('Graceful shutdown…')
  await pool.end()
  process.exit(0)
})
