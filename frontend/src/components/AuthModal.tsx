import { useState, useEffect, useRef } from 'react'
import { X, Eye, EyeOff, FlaskConical, Building2, Lock, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { checkPasswordStrength, sanitizeInput } from '../lib/security'
import { authApi } from '../lib/api'
import type { AuthUser } from '../lib/auth'
import type { RegisterPayload, ResearcherRegPayload } from '../lib/api'

interface Props {
  open: boolean
  onClose: () => void
  tr: (s: string, k: string) => string
  onLogin: (p: { email: string; password: string }) => Promise<AuthUser>
  onRegister: (p: RegisterPayload) => Promise<AuthUser>
  onRegisterResearcher: (p: ResearcherRegPayload) => Promise<AuthUser>
  loading: boolean
  error: string | null
  initialMode?: Mode
}

type Mode = 'login' | 'register' | 'researcher' | 'forgot' | 'reset' | 'done'

const SECTORS = ['Banque & Assurance', 'Industrie', 'Administration Publique', 'Énergie & Environnement', 'Agroalimentaire', 'Numérique & Tech', 'Autre']
const GRADES  = ['Professeur', 'Maître de conférences A', 'Maître de conférences B', 'Maître assistant A', 'Maître assistant B', 'Doctorant']

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) }

export default function AuthModal({ open, onClose, tr, onLogin, onRegister, onRegisterResearcher, loading, error, initialMode = 'login' }: Props) {
  const [mode, setMode]         = useState<Mode>(initialMode)
  const [showPwd, setShowPwd]   = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [localOk, setLocalOk]  = useState<string | null>(null)

  // Login
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  // Company register
  const [reg, setReg]     = useState<RegisterPayload>({ companyName: '', sector: '', contactName: '', email: '', phone: '', password: '' })
  const [confirmPwd, setConfirmPwd] = useState('')
  const [strength, setStrength] = useState({ strong: false, messages: [] as string[] })

  // Researcher register
  const [resReg, setResReg] = useState<ResearcherRegPayload>({ fullName: '', department: '', specialty: '', grade: '', email: '', phone: '', password: '' })
  const [resConfirmPwd, setResConfirmPwd] = useState('')

  // Forgot password
  const [fpEmail, setFpEmail] = useState('')
  const [fpCode, setFpCode]   = useState('')
  const [fpPwd, setFpPwd]     = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [fpLoading, setFpLoading] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setMode(initialMode); setLocalErr(null); setLocalOk(null) }
  }, [open, initialMode])

  useEffect(() => {
    const pwd = mode === 'researcher' ? resReg.password : reg.password
    if (pwd) setStrength(checkPasswordStrength(pwd))
  }, [reg.password, resReg.password, mode])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  const displayErr = localErr ?? error

  const clearErrs = () => { setLocalErr(null); setLocalOk(null) }

  /* ── LOGIN ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!loginForm.email || !loginForm.password) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(loginForm.email)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    try {
      const u = await onLogin(loginForm)
      if (u.role === 'admin') { onClose(); window.location.href = '/admin' }
      else { onClose() }
    } catch { /* error shown via prop */ }
  }

  /* ── COMPANY REGISTER ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!reg.companyName || !reg.sector || !reg.contactName || !reg.email || !reg.password) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(reg.email)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    if (reg.password !== confirmPwd) { setLocalErr(tr('auth', 'pwdMismatch')); return }
    if (!strength.strong) { setLocalErr(tr('auth', 'pwdWeak') + (strength.messages[0] || '')); return }
    try {
      const u = await onRegister({ ...reg, companyName: sanitizeInput(reg.companyName), contactName: sanitizeInput(reg.contactName) })
      if (u.role === 'admin') { onClose(); window.location.href = '/admin' }
      else { onClose() }
    } catch { /* error shown via prop */ }
  }

  /* ── RESEARCHER REGISTER ── */
  const handleResRegister = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!resReg.fullName || !resReg.email || !resReg.password) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(resReg.email)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    if (resReg.password !== resConfirmPwd) { setLocalErr(tr('auth', 'pwdMismatch')); return }
    try {
      await onRegisterResearcher({ ...resReg, fullName: sanitizeInput(resReg.fullName) })
      onClose()
    } catch { /* error shown via prop */ }
  }

  /* ── FORGOT PASSWORD ── */
  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!fpEmail) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(fpEmail)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    setFpLoading(true)
    try {
      const { data } = await authApi.forgotPassword(fpEmail)
      setLocalOk(tr('auth', 'codeSent'))
      if (data.devCode) setDevCode(data.devCode)
      setMode('reset')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLocalErr(msg || 'Erreur serveur.')
    } finally { setFpLoading(false) }
  }

  const handleResetPwd = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!fpCode || !fpPwd) { setLocalErr(tr('auth', 'required')); return }
    if (fpPwd.length < 8) { setLocalErr('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setFpLoading(true)
    try {
      await authApi.resetPassword(fpEmail, fpCode, fpPwd)
      setMode('done')
      setLocalOk(tr('auth', 'resetSuccess'))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLocalErr(msg || 'Code invalide ou expiré.')
    } finally { setFpLoading(false) }
  }

  const strengthPct   = Math.max(10, (4 - strength.messages.length) / 4 * 100)
  const strengthColor = strength.strong ? 'var(--emerald)' : strength.messages.length <= 2 ? 'var(--warning)' : 'var(--error)'

  const TABS: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'login',      label: tr('auth', 'loginTitle'), icon: <Lock size={13}/> },
    { id: 'register',   label: tr('auth', 'registerTitle'), icon: <Building2 size={13}/> },
    { id: 'researcher', label: '🔬 Chercheur', icon: <FlaskConical size={13}/> },
  ]

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,31,61,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        animation: 'fadeIn .2s ease',
      }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--white)',
        borderRadius: 'var(--r-2xl)',
        boxShadow: '0 32px 80px rgba(15,31,61,.28), 0 4px 16px rgba(15,31,61,.12)',
        overflow: 'hidden',
        animation: 'slideUp .25s cubic-bezier(.4,0,.2,1)',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', right: 16, top: 16,
          width: 32, height: 32, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,.15)',
          color: '#fff', cursor: 'pointer', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={16}/>
        </button>

        {/* Header */}
        <div style={{
          background: mode === 'researcher'
            ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
            : 'linear-gradient(135deg,var(--navy),#1e3a6e)',
          padding: '28px 32px 22px', flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            {mode === 'researcher' ? <FlaskConical size={20} style={{ color: '#c4b5fd' }}/> :
             mode === 'forgot' || mode === 'reset' ? <Mail size={20} style={{ color: 'rgba(255,255,255,.9)' }}/> :
             mode === 'done' ? <CheckCircle size={20} style={{ color: '#10b981' }}/> :
             mode === 'login' ? <Lock size={20} style={{ color: 'var(--emerald)' }}/> :
             <Building2 size={20} style={{ color: 'var(--emerald)' }}/>}
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
            {mode === 'forgot' ? tr('auth', 'forgotTitle') :
             mode === 'reset'  ? tr('auth', 'enterCode') :
             mode === 'done'   ? '✓ Réinitialisation réussie' :
             mode === 'researcher' ? tr('researcher', 'registerTitle') :
             mode === 'register' ? tr('auth', 'registerTitle') :
             tr('auth', 'loginTitle')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.82rem' }}>
            {mode === 'forgot' ? tr('auth', 'forgotDesc') :
             mode === 'reset'  ? 'Entrez le code reçu et votre nouveau mot de passe.' :
             mode === 'done'   ? tr('auth', 'resetSuccess') :
             mode === 'researcher' ? tr('researcher', 'loginSub') :
             mode === 'register' ? tr('auth', 'registerSub') :
             tr('auth', 'loginSub')}
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ padding: '24px 32px 28px' }}>
            {/* Mode tabs (only for main modes) */}
            {['login','register','researcher'].includes(mode) && (
              <div className="tabs" style={{ marginBottom: 22 }}>
                {TABS.map(t => (
                  <button key={t.id} className={`tab${mode === t.id ? ' active' : ''}`}
                    onClick={() => { setMode(t.id as Mode); clearErrs() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Alerts */}
            {displayErr && (
              <div style={{ marginBottom: 16, padding: '11px 14px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--r-lg)', color: '#be123c', fontSize: '.82rem', fontWeight: 500 }}>
                {displayErr}
              </div>
            )}
            {localOk && (
              <div style={{ marginBottom: 16, padding: '11px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r-lg)', color: '#15803d', fontSize: '.82rem', fontWeight: 500 }}>
                {localOk}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} noValidate>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'email')}</label>
                  <input className="form-input" type="email" autoComplete="email" autoFocus
                    value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 6 }}>
                  <label className="form-label">{tr('auth', 'password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                      style={{ paddingRight: 42 }} value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <button type="button" onClick={() => { setMode('forgot'); clearErrs(); setFpEmail(loginForm.email) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--emerald)', fontWeight: 600 }}>
                    {tr('auth', 'forgotPwd')}
                  </button>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '12px 0', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submit')}
                </button>
                <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', fontSize: '.76rem', color: 'var(--muted)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--navy)' }}>{tr('auth', 'demoHint')}</strong> admin@esc-setif1.dz / admin123
                </div>
              </form>
            )}

            {/* ── COMPANY REGISTER ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'companyName')} *</label>
                    <input className="form-input" required value={reg.companyName} onChange={e => setReg(p => ({ ...p, companyName: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'sector')} *</label>
                    <select className="form-input" required value={reg.sector} onChange={e => setReg(p => ({ ...p, sector: e.target.value }))}>
                      <option value="">{tr('auth', 'chooseSector')}</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'contactName')} *</label>
                    <input className="form-input" required value={reg.contactName} onChange={e => setReg(p => ({ ...p, contactName: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('auth', 'phone')}</label>
                    <input className="form-input" type="tel" value={reg.phone} onChange={e => setReg(p => ({ ...p, phone: e.target.value }))}/>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" required value={reg.email} onChange={e => setReg(p => ({ ...p, email: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} required style={{ paddingRight: 42 }}
                      value={reg.password} onChange={e => setReg(p => ({ ...p, password: e.target.value }))}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {reg.password && (
                    <div style={{ marginTop: 5 }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'width .3s,background .3s', borderRadius: 99 }}/>
                      </div>
                      {!strength.strong && <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3 }}>{strength.messages[0]}</p>}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
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
              <form onSubmit={handleResRegister} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">{tr('researcher', 'fullName')} *</label>
                    <input className="form-input" required autoFocus value={resReg.fullName} onChange={e => setResReg(p => ({ ...p, fullName: e.target.value }))}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'department')}</label>
                    <input className="form-input" value={resReg.department} onChange={e => setResReg(p => ({ ...p, department: e.target.value }))} placeholder="ex: Informatique"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'specialty')}</label>
                    <input className="form-input" value={resReg.specialty} onChange={e => setResReg(p => ({ ...p, specialty: e.target.value }))} placeholder="ex: IA"/>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">{tr('researcher', 'grade')}</label>
                    <select className="form-input" value={resReg.grade} onChange={e => setResReg(p => ({ ...p, grade: e.target.value }))}>
                      <option value="">-- Choisir --</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" required value={resReg.email} onChange={e => setResReg(p => ({ ...p, email: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} required style={{ paddingRight: 42 }}
                      value={resReg.password} onChange={e => setResReg(p => ({ ...p, password: e.target.value }))}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {resReg.password && (
                    <div style={{ marginTop: 5 }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'width .3s,background .3s', borderRadius: 99 }}/>
                      </div>
                      {!strength.strong && <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3 }}>{strength.messages[0]}</p>}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">{tr('auth', 'confirmPwd')}</label>
                  <input className="form-input" type="password" required value={resConfirmPwd} onChange={e => setResConfirmPwd(e.target.value)}/>
                </div>
                <button type="submit" className="btn btn-full" disabled={loading}
                  style={{ padding: '12px 0', fontSize: '1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontWeight: 700 }}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('researcher', 'registerTitle')}
                </button>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSend} noValidate>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" autoFocus required value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)} placeholder="votre@email.com"/>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '11px 0' }} disabled={fpLoading}>
                  {fpLoading ? <LoadingSpinner size="sm"/> : tr('auth', 'sendCode')}
                </button>
                <button type="button" onClick={() => { setMode('login'); clearErrs() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.82rem', fontWeight: 500 }}>
                  <ArrowLeft size={13}/> {tr('auth', 'backToLogin')}
                </button>
              </form>
            )}

            {/* ── RESET PASSWORD ── */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPwd} noValidate>
                {devCode && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--r-lg)', fontSize: '.82rem', color: '#92400e', fontWeight: 600 }}>
                    {tr('auth', 'devCodeHint')} <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: 3 }}>{devCode}</span>
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'enterCode')}</label>
                  <input className="form-input" autoFocus inputMode="numeric" maxLength={6} value={fpCode}
                    onChange={e => setFpCode(e.target.value.replace(/\D/g, ''))}
                    style={{ letterSpacing: 6, fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'newPassword')}</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} style={{ paddingRight: 42 }}
                      value={fpPwd} onChange={e => setFpPwd(e.target.value)}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '11px 0', marginTop: 18 }} disabled={fpLoading}>
                  {fpLoading ? <LoadingSpinner size="sm"/> : tr('auth', 'resetPwd')}
                </button>
                <button type="button" onClick={() => { setMode('forgot'); clearErrs() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.82rem' }}>
                  <ArrowLeft size={13}/> Renvoyer un code
                </button>
              </form>
            )}

            {/* ── DONE ── */}
            {mode === 'done' && (
              <div style={{ textAlign: 'center', padding: '10px 0 8px' }}>
                <CheckCircle size={48} style={{ color: 'var(--emerald)', marginBottom: 16 }}/>
                <p style={{ marginBottom: 24, color: 'var(--text-2)', lineHeight: 1.6 }}>{tr('auth', 'resetSuccess')}</p>
                <button onClick={() => { setMode('login'); clearErrs() }} className="btn btn-primary btn-full" style={{ padding: '11px 0' }}>
                  {tr('auth', 'backToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
