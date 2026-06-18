import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, Lock, Building2, FlaskConical } from 'lucide-react'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { checkPasswordStrength, sanitizeInput } from '../lib/security'
import type { Lang } from '../lib/i18n'
import type { AuthUser } from '../lib/auth'
import type { ResearcherRegPayload } from '../lib/api'

interface AuthPageProps {
  tr: (s: string, k: string) => string
  lang: Lang
  onLogin: (p: { email: string; password: string }) => Promise<AuthUser>
  onRegister: (p: RegData) => Promise<AuthUser>
  onRegisterResearcher?: (p: ResearcherRegPayload) => Promise<AuthUser>
  loading: boolean
  error: string | null
}
interface RegData { companyName: string; sector: string; contactName: string; email: string; phone: string; password: string }

const SECTORS = [
  'Banque & Assurance', 'Industrie', 'Administration Publique',
  'Énergie & Environnement', 'Agroalimentaire', 'Numérique & Tech', 'Autre',
]

const GRADES = ['Professeur', 'Maître de conférences A', 'Maître de conférences B', 'Maître assistant A', 'Maître assistant B', 'Doctorant']

type Mode = 'login' | 'register' | 'researcher'

export default function AuthPage({ tr, onLogin, onRegister, onRegisterResearcher, loading, error }: AuthPageProps) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(
    params.get('mode') === 'register' ? 'register'
    : params.get('mode') === 'researcher' ? 'researcher'
    : 'login'
  )
  const [showPwd, setShowPwd] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [reg, setReg] = useState<RegData>({ companyName: '', sector: '', contactName: '', email: '', phone: '', password: '' })
  const [resReg, setResReg] = useState<ResearcherRegPayload>({ fullName: '', department: '', specialty: '', grade: '', email: '', phone: '', password: '' })
  const [confirmPwd, setConfirmPwd] = useState('')
  const [strength, setStrength] = useState({ strong: false, messages: [] as string[] })

  useEffect(() => {
    const m = params.get('mode')
    setMode(m === 'register' ? 'register' : m === 'researcher' ? 'researcher' : 'login')
  }, [params])

  useEffect(() => {
    const pwd = mode === 'researcher' ? resReg.password : reg.password
    if (pwd) setStrength(checkPasswordStrength(pwd))
  }, [reg.password, resReg.password, mode])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalErr(null)
    if (!login.email || !login.password) { setLocalErr(tr('auth', 'required')); return }
    try {
      const u = await onLogin(login)
      navigate(u.role === 'admin' ? '/admin' : u.role === 'researcher' ? '/researcher' : '/dashboard')
    } catch { /* error shown via prop */ }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalErr(null)
    if (reg.password !== confirmPwd) { setLocalErr(tr('auth', 'pwdMismatch')); return }
    if (!strength.strong) { setLocalErr(tr('auth', 'pwdWeak') + strength.messages[0]); return }
    try {
      await onRegister({ ...reg, companyName: sanitizeInput(reg.companyName), contactName: sanitizeInput(reg.contactName) })
      navigate('/dashboard')
    } catch { /* error shown via prop */ }
  }

  const handleResearcherRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLocalErr(null)
    if (!resReg.fullName || !resReg.email || !resReg.password) { setLocalErr(tr('auth', 'required')); return }
    if (resReg.password !== confirmPwd) { setLocalErr(tr('auth', 'pwdMismatch')); return }
    if (!strength.strong) { setLocalErr(tr('auth', 'pwdWeak') + strength.messages[0]); return }
    try {
      if (!onRegisterResearcher) return
      await onRegisterResearcher({ ...resReg, fullName: sanitizeInput(resReg.fullName) })
      navigate('/researcher')
    } catch { /* error shown via prop */ }
  }

  const displayErr = localErr ?? error
  const strengthPct = Math.max(10, (4 - strength.messages.length) / 4 * 100)
  const strengthColor = strength.strong ? 'var(--emerald)' : strength.messages.length <= 2 ? 'var(--warning)' : 'var(--error)'

  const headerColors: Record<Mode, string> = {
    login: 'linear-gradient(135deg,var(--navy),var(--navy-light))',
    register: 'linear-gradient(135deg,var(--navy),var(--navy-light))',
    researcher: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
  }
  const headerIcon = mode === 'researcher' ? <FlaskConical size={20} style={{ color: '#c4b5fd' }}/> : mode === 'login' ? <Lock size={20} style={{ color: 'var(--emerald)' }}/> : <Building2 size={20} style={{ color: 'var(--emerald)' }}/>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
        <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.8rem', color: 'var(--muted)', fontWeight: 500 }}>
            <ArrowLeft size={14}/> {tr('common', 'backHome')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--emerald),var(--emerald-dk))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 14L9 4L15 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 10.5H12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--navy)', fontSize: '.9rem' }}>ESC Sétif 1</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 520, background: 'var(--white)', borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header strip */}
          <div style={{ background: headerColors[mode], padding: '28px 32px 24px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              {headerIcon}
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: 5 }}>
              {mode === 'login' ? tr('auth', 'loginTitle') : mode === 'researcher' ? tr('researcher', 'registerTitle') : tr('auth', 'registerTitle')}
            </h1>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.82rem' }}>
              {mode === 'login' ? tr('auth', 'loginSub') : mode === 'researcher' ? tr('researcher', 'loginSub') : tr('auth', 'registerSub')}
            </p>
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Mode tabs */}
            <div className="tabs" style={{ marginBottom: 24 }}>
              <button className={`tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>{tr('auth', 'loginTitle')}</button>
              <button className={`tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>{tr('auth', 'registerTitle')}</button>
              <button className={`tab${mode === 'researcher' ? ' active' : ''}`} onClick={() => setMode('researcher')}>🔬 Chercheur</button>
            </div>

            {displayErr && <div style={{ marginBottom: 16 }}><Alert type="error" message={displayErr} onDismiss={() => setLocalErr(null)}/></div>}

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} noValidate>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">{tr('auth', 'email')}</label>
                  <input className="form-input" type="email" autoComplete="email" value={login.email}
                    onChange={e => setLogin({ ...login, email: e.target.value })}/>
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">{tr('auth', 'password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                      style={{ paddingRight: 42 }} value={login.password}
                      onChange={e => setLogin({ ...login, password: e.target.value })}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginBottom: 22 }}>
                  <a href="#" style={{ fontSize: '.78rem', color: 'var(--emerald)', fontWeight: 500 }}>{tr('auth', 'forgotPwd')}</a>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '12px 0', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submit')}
                </button>
                <div style={{ marginTop: 20, padding: '11px 14px', background: 'var(--bg)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', fontSize: '.78rem', color: 'var(--muted)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--navy)' }}>{tr('auth', 'demoHint')}</strong> admin@esc-setif1.dz / admin123
                </div>
              </form>
            )}

            {/* ── COMPANY REGISTER ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 13 }}>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'companyName')}</label>
                    <input className="form-input" required value={reg.companyName} onChange={e => setReg({ ...reg, companyName: e.target.value })}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'sector')}</label>
                    <select className="form-input" required value={reg.sector} onChange={e => setReg({ ...reg, sector: e.target.value })}>
                      <option value="">{tr('auth', 'chooseSector')}</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'contactName')}</label>
                    <input className="form-input" required value={reg.contactName} onChange={e => setReg({ ...reg, contactName: e.target.value })}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'phone')}</label>
                    <input className="form-input" type="tel" value={reg.phone} onChange={e => setReg({ ...reg, phone: e.target.value })}/>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 13 }}>
                  <label className="form-label">{tr('auth', 'email')}</label>
                  <input className="form-input" type="email" required value={reg.email} onChange={e => setReg({ ...reg, email: e.target.value })}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} required style={{ paddingRight: 42 }}
                      value={reg.password} onChange={e => setReg({ ...reg, password: e.target.value })}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {reg.password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'width .3s, background .3s', borderRadius: 99 }}/>
                      </div>
                      {!strength.strong && <p className="form-hint" style={{ marginTop: 4 }}>{strength.messages[0]}</p>}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 22 }}>
                  <label className="form-label">{tr('auth', 'confirmPwd')}</label>
                  <input className="form-input" type="password" required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}/>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '12px 0', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submitReg')}
                </button>
              </form>
            )}

            {/* ── RESEARCHER REGISTER ── */}
            {mode === 'researcher' && (
              <form onSubmit={handleResearcherRegister} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 13 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">{tr('researcher', 'fullName')} *</label>
                    <input className="form-input" required value={resReg.fullName} onChange={e => setResReg({ ...resReg, fullName: e.target.value })}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'department')}</label>
                    <input className="form-input" value={resReg.department} onChange={e => setResReg({ ...resReg, department: e.target.value })} placeholder="ex: Informatique"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'specialty')}</label>
                    <input className="form-input" value={resReg.specialty} onChange={e => setResReg({ ...resReg, specialty: e.target.value })} placeholder="ex: Intelligence Artificielle"/>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">{tr('researcher', 'grade')}</label>
                    <select className="form-input" value={resReg.grade} onChange={e => setResReg({ ...resReg, grade: e.target.value })}>
                      <option value="">-- Choisir un grade --</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 13 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" required value={resReg.email} onChange={e => setResReg({ ...resReg, email: e.target.value })}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} required style={{ paddingRight: 42 }}
                      value={resReg.password} onChange={e => setResReg({ ...resReg, password: e.target.value })}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {resReg.password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'width .3s, background .3s', borderRadius: 99 }}/>
                      </div>
                      {!strength.strong && <p className="form-hint" style={{ marginTop: 4 }}>{strength.messages[0]}</p>}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 22 }}>
                  <label className="form-label">{tr('auth', 'confirmPwd')}</label>
                  <input className="form-input" type="password" required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}/>
                </div>
                <button type="submit" className="btn btn-full" disabled={loading}
                  style={{ padding: '12px 0', fontSize: '1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontWeight: 700 }}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('researcher', 'registerTitle')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
