import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useI18n } from './hooks/useI18n'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PublicHome from './pages/PublicHome'
import AuthPage from './pages/AuthPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import AccountPage from './pages/AccountPage'
import AdminPanel from './pages/AdminPanel'
import ResearcherDashboard from './pages/ResearcherDashboard'
import { notificationsApi } from './lib/api'
import type { AuthUser } from './lib/auth'

function RequireAuth({ user, children, roles }: { user: AuthUser | null; children: React.ReactNode; roles?: string[] }) {
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'researcher') return <Navigate to="/researcher" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppLayout() {
  const { lang, setLang, tr } = useI18n()
  const { user, login, register, registerResearcher, logout, loading, error } = useAuth()

  const [unreadCount, setUnreadCount] = useState(0)

  // Poll unread notification count for logged-in non-admin users
  useEffect(() => {
    if (!user || user.role === 'admin') { setUnreadCount(0); return }
    let mounted = true
    const fetch = async () => {
      try {
        const { data } = await notificationsApi.getUnread()
        if (mounted) setUnreadCount(data.count ?? 0)
      } catch { /* silent */ }
    }
    fetch()
    const id = setInterval(fetch, 60_000)
    return () => { mounted = false; clearInterval(id) }
  }, [user])

  const PublicWrapper = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate()
    const openAccount = () => {
      if (!user) { navigate('/login'); return }
      if (user.role === 'admin') { window.location.href = '/admin'; return }
      navigate('/account')
    }
    return (
      <>
        <Navbar
          lang={lang} setLang={setLang} tr={tr}
          user={user} onLogout={logout}
          onOpenAccount={openAccount}
          unreadCount={unreadCount}
        />
        {children}
        <Footer tr={tr} lang={lang} />
      </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicWrapper>
            <PublicHome tr={tr} lang={lang} />
          </PublicWrapper>
        } />

        <Route path="/services" element={
          <PublicWrapper>
            <ServicesPage tr={tr} lang={lang} isAuthenticated={!!user} />
          </PublicWrapper>
        } />

        <Route path="/contact" element={
          <PublicWrapper>
            <ContactPage tr={tr} />
          </PublicWrapper>
        } />

        {/* Standalone login / signup pages */}
        <Route path="/login" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : (
            <PublicWrapper>
              <AuthPage tr={tr} initialMode="login" onLogin={login} onRegister={register} onRegisterResearcher={registerResearcher} loading={loading} error={error} />
            </PublicWrapper>
          )
        } />
        <Route path="/signup" element={
          user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : (
            <PublicWrapper>
              <AuthPage tr={tr} initialMode="signup" onLogin={login} onRegister={register} onRegisterResearcher={registerResearcher} loading={loading} error={error} />
            </PublicWrapper>
          )
        } />

        <Route path="/privacy" element={
          <PublicWrapper>
            <div className="container section" style={{ maxWidth: 720 }}>
              <h1>Politique de Confidentialité</h1>
              <p style={{ color: 'var(--color-muted)', marginTop: 20, lineHeight: 1.8 }}>
                ESC Sétif 1 collecte uniquement les données nécessaires à la fourniture de ses services.
                Vos données personnelles sont chiffrées et ne sont jamais revendues à des tiers.
                Contact : dpo@esc-setif1.dz
              </p>
            </div>
          </PublicWrapper>
        } />

        {/* Account page — sidebar dashboard for company / researcher */}
        <Route path="/account" element={
          <RequireAuth user={user} roles={['company', 'researcher']}>
            <AccountPage tr={tr} lang={lang} user={user!} onLogout={logout} />
          </RequireAuth>
        } />

        {/* Researcher portal (stays as full page — complex workflow) */}
        <Route path="/researcher" element={
          <RequireAuth user={user} roles={['researcher']}>
            <ResearcherDashboard tr={tr} lang={lang} user={user!} onLogout={logout} />
          </RequireAuth>
        } />

        {/* Admin panel */}
        <Route path="/admin" element={
          <RequireAuth user={user} roles={['admin']}>
            <AdminPanel tr={tr} lang={lang} user={user!} onLogout={logout} />
          </RequireAuth>
        } />

        {/* Legacy aliases */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<Navigate to="/account" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppLayout
