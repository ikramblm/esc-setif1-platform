// ═══════════════════════════════════════════════════════
//  Auth helpers – JWT storage, decode, refresh
// ═══════════════════════════════════════════════════════

export interface AuthUser {
  id: string
  email: string
  role: 'company' | 'admin' | 'researcher'
  companyName?: string
  exp: number
}

const ACCESS_KEY  = 'esc_access_token'
const REFRESH_KEY = 'esc_refresh_token'
const USER_KEY    = 'esc_user'

export function saveTokens(accessToken: string, refreshToken: string, user: AuthUser) {
  sessionStorage.setItem(ACCESS_KEY, accessToken)
  // Store refresh in HttpOnly cookie via backend; fall back to localStorage for demo
  localStorage.setItem(REFRESH_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function clearAuth() {
  sessionStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  if (!token) return false
  return !isTokenExpired(token)
}

export function isAdmin(): boolean {
  const user = getStoredUser()
  return user?.role === 'admin'
}
