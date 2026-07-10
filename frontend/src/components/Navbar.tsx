import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Globe, Shield, ChevronDown, Bell, User } from 'lucide-react'
import type { Lang } from '../lib/i18n'
import type { AuthUser } from '../lib/auth'

interface NavbarProps {
  lang: Lang; setLang: (l: Lang) => void
  tr: (s: string, k: string) => string
  user: AuthUser | null; onLogout: () => void
  onOpenAccount: () => void
  unreadCount?: number
}

const LANGS: { code: Lang; label: string; full: string }[] = [
  { code: 'fr', label: 'FR', full: 'Français' },
  { code: 'ar', label: 'عر', full: 'العربية' },
  { code: 'en', label: 'EN', full: 'English' },
]

export default function Navbar({ lang, setLang, tr, user, onLogout, onOpenAccount, unreadCount = 0 }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
          {/* Logo */}
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img src="/logo-64.png" alt="UFAS1" width={40} height={40} style={{ borderRadius: '50%', flexShrink: 0 }}/>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy)', lineHeight: 1 }}>ESC Sétif 1</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', lineHeight: 1.3, marginTop: 1 }}>Services & Consultations</div>
            </div>
          </Link>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="desktop-nav">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{
              padding: '6px 13px', borderRadius: 'var(--r-md)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)',
              transition: 'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--navy)'; (e.target as HTMLElement).style.background = 'var(--bg)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
            >{tr('nav', 'home')}</Link>
            <a href="/#sectors" style={{
              padding: '6px 13px', borderRadius: 'var(--r-md)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)',
              transition: 'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--navy)'; (e.target as HTMLElement).style.background = 'var(--bg)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
            >{tr('nav', 'sectors')}</a>
            <a href="/#about" style={{
              padding: '6px 13px', borderRadius: 'var(--r-md)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)',
              transition: 'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--navy)'; (e.target as HTMLElement).style.background = 'var(--bg)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
            >{tr('nav', 'about')}</a>
            <Link to="/services" style={{
              padding: '6px 13px', borderRadius: 'var(--r-md)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)',
              transition: 'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--navy)'; (e.target as HTMLElement).style.background = 'var(--bg)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
            >{tr('nav', 'services')}</Link>
            <Link to="/contact" style={{
              padding: '6px 13px', borderRadius: 'var(--r-md)',
              fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted)',
              transition: 'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.target as HTMLElement).style.color = 'var(--navy)'; (e.target as HTMLElement).style.background = 'var(--bg)' }}
            onMouseOut={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
            >{tr('nav', 'contact')}</Link>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            {/* Lang switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangOpen(!langOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 700,
                color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all var(--t)',
              }}>
                <Globe size={13} />
                {LANGS.find(l => l.code === lang)?.label}
                <ChevronDown size={11} style={{ opacity: .6 }} />
              </button>
              {langOpen && (
                <div onClick={() => setLangOpen(false)} style={{
                  position: 'absolute', top: 36, right: 0, minWidth: 130,
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-lg)', overflow: 'hidden', zIndex: 200,
                }}>
                  {LANGS.map(({ code, label, full }) => (
                    <button key={code} onClick={() => { setLang(code); setLangOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '9px 14px', fontSize: '0.8rem', fontWeight: 600,
                        color: lang === code ? 'var(--emerald-dk)' : 'var(--text-2)',
                        background: lang === code ? 'var(--emerald-lt)' : 'transparent',
                        cursor: 'pointer', transition: 'all var(--t)',
                        borderBottom: code !== 'en' ? '1px solid var(--border)' : 'none',
                      }}>
                      <span style={{ width: 24, fontWeight: 700 }}>{label}</span>
                      <span style={{ opacity: .6, fontWeight: 400 }}>{full}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth area */}
            {user ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* Admin gets a direct link */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn btn-primary btn-sm" style={{ gap: 6 }}>
                    <Shield size={13}/> {tr('nav', 'adminPanel')}
                  </Link>
                )}

                {/* Notification bell (non-admin) */}
                {user.role !== 'admin' && (
                  <button onClick={onOpenAccount} title="Notifications"
                    style={{
                      position: 'relative', padding: '6px 8px',
                      borderRadius: 'var(--r-md)', background: 'var(--bg)',
                      border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--muted)',
                      display: 'flex', alignItems: 'center',
                    }}>
                    <Bell size={15}/>
                    {unreadCount > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#ef4444', color: '#fff', borderRadius: 99,
                        fontSize: '.6rem', fontWeight: 800, padding: '1px 4px', minWidth: 14, textAlign: 'center',
                        lineHeight: 1.4,
                      }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                )}

                {/* Avatar button → opens drawer */}
                <button onClick={user.role === 'admin' ? onLogout : onOpenAccount}
                  title={user.role === 'admin' ? tr('nav', 'logout') : 'Mon compte'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px 5px 5px',
                    borderRadius: 'var(--r-xl)', background: 'var(--bg)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--emerald)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: user.role === 'researcher'
                      ? 'linear-gradient(135deg,#7c3aed,#4c1d95)'
                      : 'linear-gradient(135deg,var(--emerald),#059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '.7rem', fontWeight: 800,
                  }}>
                    {user.companyName?.charAt(0)?.toUpperCase() ?? <User size={12}/>}
                  </div>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--navy)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.companyName}
                  </span>
                  <ChevronDown size={11} style={{ color: 'var(--muted)', flexShrink: 0 }}/>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <Link to="/login" className="btn btn-outline btn-sm">{tr('nav','login')}</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">{tr('nav','register')}</Link>
              </div>
            )}

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: 'none', padding: 6, borderRadius: 'var(--r-md)', color: 'var(--navy)', background: menuOpen ? 'var(--bg)' : 'transparent' }}
              className="hamburger-btn">
              {menuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--white)', padding: '8px 0 16px' }}>
            <Link to="/"
              style={{ display: 'block', padding: '11px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}
              onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{tr('nav', 'home')}</Link>
            <a href="/#sectors"
              style={{ display: 'block', padding: '11px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}
              onClick={() => setMenuOpen(false)}>{tr('nav', 'sectors')}</a>
            <a href="/#about"
              style={{ display: 'block', padding: '11px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}
              onClick={() => setMenuOpen(false)}>{tr('nav', 'about')}</a>
            <Link to="/services"
              style={{ display: 'block', padding: '11px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}
              onClick={() => setMenuOpen(false)}>{tr('nav', 'services')}</Link>
            <Link to="/contact"
              style={{ display: 'block', padding: '11px 24px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}
              onClick={() => setMenuOpen(false)}>{tr('nav', 'contact')}</Link>
            {user ? (
              <div style={{ padding: '14px 24px 0', display: 'flex', gap: 8 }}>
                {user.role !== 'admin' && (
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { onOpenAccount(); setMenuOpen(false) }}>Mon compte</button>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Admin</Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, padding: '14px 24px 0' }}>
                <Link to="/login" className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>{tr('nav','login')}</Link>
                <Link to="/signup" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>{tr('nav','register')}</Link>
              </div>
            )}
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        /* Prevent navbar from creating horizontal overflow */
        header { max-width: 100vw; overflow-x: hidden; }
        header .container { gap: 12px !important; }
        @media (max-width: 480px) {
          header .container { gap: 8px !important; padding: 0 12px !important; }
          .nav-account-btn span { display: none !important; }
        }
      `}</style>
    </>
  )
}
