// ═══════════════════════════════════════════════════════
//  Client-side security helpers
//  Server-side validation is authoritative — this is
//  defence-in-depth only.
// ═══════════════════════════════════════════════════════

import DOMPurify from 'dompurify'

/** Strip HTML tags and dangerous attributes from user input */
export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/** Escape HTML entities for safe text rendering */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Validate email format client-side */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Password strength checker – returns { strong, messages } */
export function checkPasswordStrength(password: string): { strong: boolean; messages: string[] } {
  const messages: string[] = []
  if (password.length < 8)         messages.push('Minimum 8 caractères')
  if (!/[A-Z]/.test(password))     messages.push('Au moins 1 majuscule')
  if (!/[a-z]/.test(password))     messages.push('Au moins 1 minuscule')
  if (!/[0-9]/.test(password))     messages.push('Au moins 1 chiffre')
  return { strong: messages.length === 0, messages }
}

/** Truncate potentially long user-supplied strings before display */
export function truncate(str: string, max = 120): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

/** Format DZD currency */
export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(n)
}

/** Format ISO date string to locale */
export function formatDate(iso: string, lang = 'fr'): string {
  const locales: Record<string, string> = { fr: 'fr-DZ', ar: 'ar-DZ', en: 'en-GB' }
  return new Date(iso).toLocaleDateString(locales[lang] ?? 'fr-DZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
