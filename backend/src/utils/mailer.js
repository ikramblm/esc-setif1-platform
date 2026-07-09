const nodemailer = require('nodemailer')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return transporter
}

/**
 * Sends an email. Silently no-ops (logs only) if SMTP isn't configured —
 * lets registration/forgot-password keep working via devCode in dev mode.
 */
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter()
  if (!t) {
    console.warn(`[mailer] SMTP not configured — skipped email to ${to}: "${subject}"`)
    return
  }
  const info = await t.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to, subject, html,
    text: text ?? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  })
  console.log(`[mailer] sent to ${to} — messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`)
}

function codeEmailHtml(title, code, intro) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f1f3d">${title}</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6">${intro}</p>
      <div style="background:#f1f5f9;border-radius:10px;padding:18px;text-align:center;margin:20px 0">
        <span style="font-size:28px;font-weight:800;letter-spacing:6px;color:#0f1f3d">${code}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px">Ce code expire dans 15 minutes. Si vous n'avez pas demandé ce code, ignorez cet e-mail.</p>
    </div>
  `
}

module.exports = { sendMail, codeEmailHtml }
