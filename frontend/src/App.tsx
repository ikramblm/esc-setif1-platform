import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useI18n } from './hooks/useI18n'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import AccountDrawer from './components/AccountDrawer'
import PublicHome from './pages/PublicHome'
import AdminPanel from './pages/AdminPanel'
import ResearcherDashboard from './pages/ResearcherDashboard'
import { notificationsApi } from './lib/api'

type AuthMode = 'login' | 'register'

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
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

  const [authOpen, setAuthOpen]         = useState(false)
  const [authMode, setAuthMode]         = useState<AuthMode>('login')
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)

  const openAuth = (mode: AuthMode = 'login') => { setAuthMode(mode); setAuthOpen(true) }
  const openAccount = () => {
    if (!user) return openAuth()
    if (user.role === 'admin') { window.location.href = '/admin'; return }
    setDrawerOpen(true)
  }

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

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
  }

  const PublicWrapper = ({ children }: { children: React.ReactNode }) => (
    <>
      <Navbar
        lang={lang} setLang={setLang} tr={tr}
        user={user} onLogout={handleLogout}
        onOpenAuth={openAuth} onOpenAccount={openAccount}
        unreadCount={unreadCount}
      />
      {children}
      <Footer tr={tr} lang={lang} />
      <AuthModal
        open={authOpen && !user}
        onClose={() => setAuthOpen(false)}
        tr={tr}
        onLogin={async (p) => { const u = await login(p); setAuthOpen(false); return u }}
        onRegister={async (p) => { const u = await register(p); setAuthOpen(false); return u }}
        onRegisterResearcher={async (p) => { const u = await registerResearcher(p); setAuthOpen(false); return u }}
        loading={loading} error={error}
        initialMode={authMode}
      />
      <AccountDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user} onLogout={handleLogout}
        tr={tr} lang={lang}
      />
    </>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicWrapper>
            <PublicHome tr={tr} lang={lang} />
          </PublicWrapper>
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

        {/* Researcher portal (stays as full page — complex workflow) */}
        <Route path="/researcher" element={
          <RequireAuth roles={['researcher']}>
            <ResearcherDashboard tr={tr} lang={lang} user={user!} onLogout={logout} />
          </RequireAuth>
        } />

        {/* Admin panel */}
        <Route path="/admin" element={
          <RequireAuth roles={['admin']}>
            <AdminPanel tr={tr} lang={lang} user={user!} onLogout={logout} />
          </RequireAuth>
        } />

        {/* Legacy /auth → home (auth is now a modal) */}
        <Route path="/auth" element={<Navigate to="/" replace />} />
        {/* Legacy /dashboard → home (company uses drawer overlay) */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppLayout
