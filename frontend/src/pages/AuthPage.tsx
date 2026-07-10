import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FlaskConical, Building2, Lock, ArrowLeft, ArrowRight, CheckCircle, Mail, Check, ShieldCheck } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { checkPasswordStrength, sanitizeInput } from '../lib/security'
import { authApi } from '../lib/api'
import type { AuthUser } from '../lib/auth'
import type { RegisterPayload, ResearcherRegPayload } from '../lib/api'

interface Props {
  tr: (s: string, k: string) => string
  initialMode: 'login' | 'signup'
  onLogin: (p: { email: string; password: string }) => Promise<AuthUser>
  onRegister: (p: RegisterPayload) => Promise<AuthUser>
  onRegisterResearcher: (p: ResearcherRegPayload) => Promise<AuthUser>
  loading: boolean
  error: string | null
}

type Step = 'login' | 'reg1' | 'reg2' | 'reg2verify' | 'reg3' | 'forgot' | 'reset' | 'done'
type Role = 'company' | 'researcher' | null

const SECTORS = ['Banque & Assurance', 'Industrie', 'Administration Publique', 'Énergie & Environnement', 'Agroalimentaire', 'Numérique & Tech', 'Autre']
const GRADES  = ['Professeur', 'Maître de conférences A', 'Maître de conférences B', 'Maître assistant A', 'Maître assistant B', 'Doctorant']

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) }

export default function AuthPage({ tr, initialMode, onLogin, onRegister, onRegisterResearcher, loading, error }: Props) {
  const navigate = useNavigate()
  const [step, setStep]         = useState<Step>(initialMode === 'signup' ? 'reg1' : 'login')
  const [role, setRole]         = useState<Role>(null)
  const [showPwd, setShowPwd]   = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [localOk, setLocalOk]   = useState<string | null>(null)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [reg, setReg]     = useState<RegisterPayload>({ companyName: '', sector: '', contactName: '', email: '', phone: '', password: '' })
  const [confirmPwd, setConfirmPwd] = useState('')
  const [strength, setStrength] = useState({ strong: false, messages: [] as string[] })
  const [resReg, setResReg] = useState<ResearcherRegPayload>({ fullName: '', department: '', specialty: '', grade: '', email: '', phone: '', password: '' })

  // Email verification (registration)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  // Forgot password
  const [fpEmail, setFpEmail] = useState('')
  const [fpCode, setFpCode]   = useState('')
  const [fpPwd, setFpPwd]     = useState('')
  const [fpLoading, setFpLoading] = useState(false)

  useEffect(() => {
    setStep(initialMode === 'signup' ? 'reg1' : 'login')
    setRole(null)
  }, [initialMode])

  useEffect(() => {
    const pwd = role === 'researcher' ? resReg.password : reg.password
    if (pwd) setStrength(checkPasswordStrength(pwd))
  }, [reg.password, resReg.password, role])

  const displayErr = localErr ?? error
  const clearErrs = () => { setLocalErr(null); setLocalOk(null) }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!loginForm.email || !loginForm.password) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(loginForm.email)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    try {
      const u = await onLogin(loginForm)
      navigate(u.role === 'admin' ? '/admin' : '/')
    } catch { /* error shown via prop */ }
  }

  const submitStep1 = () => { if (!role) return; setStep('reg2'); clearErrs() }

  /** Step 2: validate basic info, then send an email verification code before moving on. */
  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    const email = role === 'researcher' ? resReg.email : reg.email
    const phone = role === 'researcher' ? resReg.phone : reg.phone
    const password = role === 'researcher' ? resReg.password : reg.password
    if (!email || !phone || !password || !confirmPwd) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(email)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    if (password !== confirmPwd) { setLocalErr(tr('auth', 'pwdMismatch')); return }
    if (!strength.strong) { setLocalErr(tr('auth', 'pwdWeak') + (strength.messages[0] || '')); return }
    setVerifyLoading(true)
    try {
      await authApi.sendVerification(email)
      setVerifyCode('')
      setStep('reg2verify')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLocalErr(msg || 'Erreur serveur.')
    } finally { setVerifyLoading(false) }
  }

  const resendVerification = async () => {
    clearErrs()
    const email = role === 'researcher' ? resReg.email : reg.email
    setVerifyLoading(true)
    try {
      await authApi.sendVerification(email)
      setLocalOk(tr('auth', 'codeSent'))
    } catch { /* ignore */ } finally { setVerifyLoading(false) }
  }

  const submitVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    const email = role === 'researcher' ? resReg.email : reg.email
    if (!verifyCode) { setLocalErr(tr('auth', 'required')); return }
    setVerifyLoading(true)
    try {
      await authApi.verifyEmail(email, verifyCode)
      setStep('reg3')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLocalErr(msg || 'Code invalide.')
    } finally { setVerifyLoading(false) }
  }

  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    try {
      if (role === 'researcher') {
        if (!resReg.fullName) { setLocalErr(tr('auth', 'required')); return }
        await onRegisterResearcher({ ...resReg, fullName: sanitizeInput(resReg.fullName) })
        navigate('/')
      } else {
        if (!reg.companyName || !reg.sector || !reg.contactName) { setLocalErr(tr('auth', 'required')); return }
        const u = await onRegister({ ...reg, companyName: sanitizeInput(reg.companyName), contactName: sanitizeInput(reg.contactName) })
        navigate(u.role === 'admin' ? '/admin' : '/')
      }
    } catch { /* error shown via prop */ }
  }

  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault(); clearErrs()
    if (!fpEmail) { setLocalErr(tr('auth', 'required')); return }
    if (!validateEmail(fpEmail)) { setLocalErr(tr('auth', 'invalidEmail')); return }
    setFpLoading(true)
    try {
      await authApi.forgotPassword(fpEmail)
      setLocalOk(tr('auth', 'codeSent'))
      setStep('reset')
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
      setStep('done')
      setLocalOk(tr('auth', 'resetSuccess'))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLocalErr(msg || 'Code invalide ou expiré.')
    } finally { setFpLoading(false) }
  }

  const strengthPct   = Math.max(10, (4 - strength.messages.length) / 4 * 100)
  const strengthColor = strength.strong ? 'var(--emerald)' : strength.messages.length <= 2 ? 'var(--warning)' : 'var(--error)'
  const isWizard = step === 'reg1' || step === 'reg2' || step === 'reg2verify' || step === 'reg3'
  const stepNum  = step === 'reg1' ? 1 : (step === 'reg2' || step === 'reg2verify') ? 2 : step === 'reg3' ? 3 : 0
  const accent   = role === 'researcher' ? '#7c3aed' : 'var(--emerald)'
  const isLoginSide = step === 'login' // login form sits on the right, signup wizard on the left

  return (
    <main style={{ minHeight: '88vh', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', minHeight: '88vh', position: 'relative' }}>
        {/* Brand panel — slides between left/right */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '50%',
          left: isLoginSide ? 0 : '50%',
          transition: 'left .5s cubic-bezier(.4,0,.2,1)',
          background: 'linear-gradient(160deg, var(--navy) 0%, #0d2040 55%, #0a1830 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 48, overflow: 'hidden',
        }} className="auth-brand-panel">
          <div style={{ position: 'absolute', top: -140, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)' }}/>
          <div style={{ position: 'absolute', bottom: -100, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,58,110,.5) 0%, transparent 70%)' }}/>
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
            <img src="/logo-180.png" alt="UFAS1" width={72} height={72} style={{ margin: '0 auto 24px', borderRadius: '50%', display: 'block' }}/>
            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 14 }}>
              {isLoginSide ? tr('auth', 'brandWelcomeBack') : tr('auth', 'brandJoin')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,.62)', fontSize: '.92rem', lineHeight: 1.7, marginBottom: 28 }}>
              {isLoginSide ? tr('auth', 'brandWelcomeBackSub') : tr('auth', 'brandJoinSub')}
            </p>
            <Link to={isLoginSide ? '/signup' : '/login'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px',
                borderRadius: 'var(--r-lg)', border: '1px solid rgba(255,255,255,.3)',
                color: '#fff', fontSize: '.88rem', fontWeight: 700, textDecoration: 'none',
              }}>
              {isLoginSide ? tr('auth', 'registerTitle') : tr('auth', 'loginTitle')}
              <ArrowRight size={15}/>
            </Link>
          </div>
        </div>

        {/* Form panel — slides between left/right (mirrors brand panel) */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '50%',
          left: isLoginSide ? '50%' : 0,
          transition: 'left .5s cubic-bezier(.4,0,.2,1)',
          background: 'var(--white)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px', overflowY: 'auto',
        }} className="auth-form-panel">
          <div style={{ width: '100%', maxWidth: 400 }}>
            {/* Header */}
            {isWizard ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : undefined, gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.75rem', fontWeight: 800,
                        background: n <= stepNum ? accent : 'var(--bg)',
                        color: n <= stepNum ? '#fff' : 'var(--muted)',
                        border: n <= stepNum ? 'none' : '1px solid var(--border)',
                        transition: 'all .2s',
                      }}>
                        {n < stepNum ? <Check size={13}/> : n}
                      </div>
                      {n < 3 && <div style={{ flex: 1, height: 2, background: n < stepNum ? accent : 'var(--border)', borderRadius: 99, transition: 'background .2s' }}/>}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  {tr('auth', 'stepOf').replace('{n}', String(stepNum))}
                </p>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 22 }}>
                  {step === 'reg1' ? tr('auth', 'chooseAccountType') :
                   step === 'reg2' ? tr('auth', 'basicInfo') :
                   step === 'reg2verify' ? tr('auth', 'verifyEmailTitle') :
                   tr('auth', 'detailsStep')}
                </h1>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: step === 'done' ? '#ecfdf5' : step === 'forgot' || step === 'reset' ? '#eff6ff' : 'var(--emerald-lt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step === 'forgot' || step === 'reset' ? <Mail size={19} style={{ color: '#3b82f6' }}/> :
                   step === 'done' ? <CheckCircle size={19} style={{ color: 'var(--emerald)' }}/> :
                   <Lock size={19} style={{ color: 'var(--emerald)' }}/>}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)' }}>
                    {step === 'forgot' ? tr('auth', 'forgotTitle') :
                     step === 'reset'  ? tr('auth', 'enterCode') :
                     step === 'done'   ? tr('auth', 'resetSuccess') :
                     tr('auth', 'loginTitle')}
                  </h1>
                  <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                    {step === 'forgot' ? tr('auth', 'forgotDesc') :
                     step === 'reset'  ? 'Entrez le code reçu et votre nouveau mot de passe.' :
                     step === 'done'   ? '' :
                     tr('auth', 'loginSub')}
                  </p>
                </div>
              </div>
            )}

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

            {/* ── LOGIN ── */}
            {step === 'login' && (
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
                  <button type="button" onClick={() => { setStep('forgot'); clearErrs(); setFpEmail(loginForm.email) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', color: 'var(--emerald)', fontWeight: 600 }}>
                    {tr('auth', 'forgotPwd')}
                  </button>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '12px 0', fontSize: '1rem' }} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submit')}
                </button>
                <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.82rem', color: 'var(--muted)' }} className="mobile-only-switch">
                  {tr('auth', 'noAccount')}{' '}
                  <Link to="/signup" style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tr('auth', 'registerTitle')}</Link>
                </p>
              </form>
            )}

            {/* ── STEP 1 — ROLE SELECTION ── */}
            {step === 'reg1' && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  <RoleCard icon={<Building2 size={20}/>} title={tr('auth', 'roleCompany')} desc={tr('auth', 'roleCompanyDesc')}
                    active={role === 'company'} color="var(--emerald)" onClick={() => setRole('company')}/>
                  <RoleCard icon={<FlaskConical size={20}/>} title={tr('auth', 'roleResearcher')} desc={tr('auth', 'roleResearcherDesc')}
                    active={role === 'researcher'} color="#7c3aed" onClick={() => setRole('researcher')}/>
                </div>
                <button onClick={submitStep1} disabled={!role} className="btn btn-primary btn-full"
                  style={{ padding: '12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: role ? 1 : .5 }}>
                  {tr('auth', 'next')} <ArrowRight size={16}/>
                </button>
                <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.82rem', color: 'var(--muted)' }} className="mobile-only-switch">
                  {tr('auth', 'haveAccount')}{' '}
                  <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tr('auth', 'loginTitle')}</Link>
                </p>
              </div>
            )}

            {/* ── STEP 2 — BASIC INFO ── */}
            {step === 'reg2' && (
              <form onSubmit={submitStep2} noValidate>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" autoFocus required
                    value={role === 'researcher' ? resReg.email : reg.email}
                    onChange={e => role === 'researcher' ? setResReg(p => ({ ...p, email: e.target.value })) : setReg(p => ({ ...p, email: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'phone')} *</label>
                  <input className="form-input" type="tel" required placeholder="+213 XXX XXX XXX"
                    value={role === 'researcher' ? (resReg.phone ?? '') : reg.phone}
                    onChange={e => role === 'researcher' ? setResReg(p => ({ ...p, phone: e.target.value })) : setReg(p => ({ ...p, phone: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 4 }}>
                  <label className="form-label">{tr('auth', 'password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} required style={{ paddingRight: 42 }}
                      value={role === 'researcher' ? resReg.password : reg.password}
                      onChange={e => role === 'researcher' ? setResReg(p => ({ ...p, password: e.target.value })) : setReg(p => ({ ...p, password: e.target.value }))}/>
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}>
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {(role === 'researcher' ? resReg.password : reg.password) && (
                    <div style={{ marginTop: 5 }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${strengthPct}%`, background: strengthColor, transition: 'width .3s,background .3s', borderRadius: 99 }}/>
                      </div>
                      {!strength.strong && <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 3 }}>{strength.messages[0]}</p>}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 22 }}>
                  <label className="form-label">{tr('auth', 'confirmPwd')} *</label>
                  <input className="form-input" type="password" required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}/>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('reg1')} className="btn btn-outline" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={15}/> {tr('common', 'back')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={verifyLoading}>
                    {verifyLoading ? <LoadingSpinner size="sm"/> : <>{tr('auth', 'next')} <ArrowRight size={15}/></>}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2b — EMAIL VERIFICATION ── */}
            {step === 'reg2verify' && (
              <form onSubmit={submitVerifyCode} noValidate>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                  padding: '10px 14px', background: 'var(--emerald-lt)', borderRadius: 'var(--r-lg)',
                }}>
                  <ShieldCheck size={16} style={{ color: 'var(--emerald-dk)', flexShrink: 0 }}/>
                  <p style={{ fontSize: '.8rem', color: 'var(--emerald-dk)', fontWeight: 600 }}>
                    {tr('auth', 'verifyEmailDesc')} <strong>{role === 'researcher' ? resReg.email : reg.email}</strong>
                  </p>
                </div>
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label">{tr('auth', 'enterCode')}</label>
                  <input className="form-input" autoFocus inputMode="numeric" maxLength={6} value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    style={{ letterSpacing: 6, fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }}/>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('reg2')} className="btn btn-outline" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={15}/> {tr('common', 'back')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }} disabled={verifyLoading}>
                    {verifyLoading ? <LoadingSpinner size="sm"/> : tr('auth', 'verifyAndContinue')}
                  </button>
                </div>
                <button type="button" onClick={resendVerification} disabled={verifyLoading}
                  style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.8rem', fontWeight: 500 }}>
                  {tr('auth', 'resendCode')}
                </button>
              </form>
            )}

            {/* ── STEP 3 — DETAILS ── */}
            {step === 'reg3' && role === 'company' && (
              <form onSubmit={submitStep3} noValidate>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'companyName')} *</label>
                  <input className="form-input" required autoFocus value={reg.companyName} onChange={e => setReg(p => ({ ...p, companyName: e.target.value }))}/>
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('auth', 'sector')} *</label>
                  <select className="form-input" required value={reg.sector} onChange={e => setReg(p => ({ ...p, sector: e.target.value }))}>
                    <option value="">{tr('auth', 'chooseSector')}</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 22 }}>
                  <label className="form-label">{tr('auth', 'contactName')} *</label>
                  <input className="form-input" required value={reg.contactName} onChange={e => setReg(p => ({ ...p, contactName: e.target.value }))}/>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('reg2verify')} className="btn btn-outline" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={15}/> {tr('common', 'back')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }} disabled={loading}>
                    {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submitReg')}
                  </button>
                </div>
              </form>
            )}

            {step === 'reg3' && role === 'researcher' && (
              <form onSubmit={submitStep3} noValidate>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">{tr('researcher', 'fullName')} *</label>
                  <input className="form-input" required autoFocus value={resReg.fullName} onChange={e => setResReg(p => ({ ...p, fullName: e.target.value }))}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{tr('researcher', 'department')}</label>
                    <input className="form-input" value={resReg.department} onChange={e => setResReg(p => ({ ...p, department: e.target.value }))} placeholder="ex: Informatique"/>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{tr('researcher', 'specialty')}</label>
                    <input className="form-input" value={resReg.specialty} onChange={e => setResReg(p => ({ ...p, specialty: e.target.value }))} placeholder="ex: IA"/>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label className="form-label">{tr('researcher', 'grade')}</label>
                    <select className="form-input" value={resReg.grade} onChange={e => setResReg(p => ({ ...p, grade: e.target.value }))}>
                      <option value="">-- Choisir --</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep('reg2verify')} className="btn btn-outline" style={{ flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowLeft size={15}/> {tr('common', 'back')}
                  </button>
                  <button type="submit" className="btn" style={{ flex: 1, padding: '12px 0', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 'var(--r-lg)', cursor: 'pointer', fontWeight: 700 }} disabled={loading}>
                    {loading ? <LoadingSpinner size="sm"/> : tr('auth', 'submitReg')}
                  </button>
                </div>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {step === 'forgot' && (
              <form onSubmit={handleForgotSend} noValidate>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">{tr('auth', 'email')} *</label>
                  <input className="form-input" type="email" autoFocus required value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)} placeholder="votre@email.com"/>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ padding: '11px 0' }} disabled={fpLoading}>
                  {fpLoading ? <LoadingSpinner size="sm"/> : tr('auth', 'sendCode')}
                </button>
                <button type="button" onClick={() => { setStep('login'); clearErrs() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.82rem', fontWeight: 500 }}>
                  <ArrowLeft size={13}/> {tr('auth', 'backToLogin')}
                </button>
              </form>
            )}

            {/* ── RESET PASSWORD ── */}
            {step === 'reset' && (
              <form onSubmit={handleResetPwd} noValidate>
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
                <button type="button" onClick={() => { setStep('forgot'); clearErrs() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '14px auto 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.82rem' }}>
                  <ArrowLeft size={13}/> Renvoyer un code
                </button>
              </form>
            )}

            {/* ── DONE ── */}
            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '10px 0 8px' }}>
                <CheckCircle size={48} style={{ color: 'var(--emerald)', marginBottom: 16 }}/>
                <p style={{ marginBottom: 24, color: 'var(--text-2)', lineHeight: 1.6 }}>{tr('auth', 'resetSuccess')}</p>
                <button onClick={() => setStep('login')} className="btn btn-primary btn-full" style={{ padding: '11px 0' }}>
                  {tr('auth', 'backToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-brand-panel { display: none !important; }
          .auth-form-panel { position: relative !important; left: 0 !important; width: 100% !important; }
        }
      `}</style>
    </main>
  )
}

function RoleCard({ icon, title, desc, active, color, onClick }: {
  icon: React.ReactNode; title: string; desc: string; active: boolean; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} type="button" style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left',
      padding: '16px 18px', borderRadius: 'var(--r-xl)', cursor: 'pointer',
      border: active ? `2px solid ${color}` : '1px solid var(--border)',
      background: active ? `${color}0d` : 'var(--white)',
      transition: 'all .15s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? color : 'var(--bg)',
        color: active ? '#fff' : 'var(--muted)',
        transition: 'all .15s',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--navy)', marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</p>
      </div>
      {active && (
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Check size={12} style={{ color: '#fff' }}/>
        </div>
      )}
    </button>
  )
}
