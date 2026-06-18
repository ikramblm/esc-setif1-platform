import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'
import { saveTokens, clearAuth, getStoredUser, isAuthenticated } from '../lib/auth'
import type { AuthUser } from '../lib/auth'
import type { LoginPayload, RegisterPayload, ResearcherRegPayload } from '../lib/api'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() =>
    isAuthenticated() ? getStoredUser() : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) { clearAuth(); setUser(null) }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true); setError(null)
    try {
      const { data } = await authApi.login(payload)
      saveTokens(data.accessToken, data.refreshToken, data.user)
      setUser(data.user)
      return data.user
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur de connexion'
      setError(msg); throw err
    } finally { setLoading(false) }
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true); setError(null)
    try {
      const { data } = await authApi.register(payload)
      saveTokens(data.accessToken, data.refreshToken, data.user)
      setUser(data.user)
      return data.user
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur d'inscription"
      setError(msg); throw err
    } finally { setLoading(false) }
  }, [])

  const registerResearcher = useCallback(async (payload: ResearcherRegPayload) => {
    setLoading(true); setError(null)
    try {
      const { data } = await authApi.registerResearcher(payload)
      saveTokens(data.accessToken, data.refreshToken, data.user)
      setUser(data.user)
      return data.user
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur d'inscription"
      setError(msg); throw err
    } finally { setLoading(false) }
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth(); setUser(null)
  }, [])

  return { user, loading, error, login, register, registerResearcher, logout, isAdmin: user?.role === 'admin' }
}
