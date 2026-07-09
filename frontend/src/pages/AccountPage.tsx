import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, ShoppingBag, MessageSquare, Heart, Bell, LogOut, ChevronLeft, ChevronRight,
  Camera, Lock, CheckCheck, Save, FileText, Plus, Upload, X, Paperclip, Trash2,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { notificationsApi, messagesApi, needsApi, projectsApi, favoritesApi, profileApi, authApi, servicesApi } from '../lib/api'
import type { AuthUser } from '../lib/auth'
import type { Lang } from '../lib/i18n'

interface Props {
  tr: (s: string, k: string) => string
  lang: Lang
  user: AuthUser
  onLogout: () => void
}

type Tab = 'profile' | 'requests' | 'messages' | 'favorites' | 'notifications' | 'projects' | 'myServices' | 'publish'

interface Notification { id: string; title: string; body?: string; is_read: boolean; created_at: string }
interface Message { id: string; body: string; is_read: boolean; created_at: string; sender_name?: string }
interface Need { id: string; title: string; status: string; serviceType?: string; createdAt: string; serviceTitle?: string | null }
interface Project { id: string; title: string; status: string; progress_pct: number }
interface Favorite { id: string; category: string; title: string; description: string; department?: string | null; price: number | null; isFree: boolean }
interface MyService {
  id: string; category: string; title: string; description: string
  department?: string | null; city?: string | null; researchDomain?: string | null
  price: number | null; isFree: boolean
  images: Array<{ path: string; name: string }>; documents: Array<{ path: string; name: string }>
  publishedAt: string
}

const SERVICE_CATEGORIES = ['Consulting', 'Formation', 'Études', 'Recherche']
const PRESTATION_DOMAINS = [
  'Agriculture et agroalimentaire', 'Biotechnologie', 'Chimie', 'Environnement', 'Génie civil et bâtiment',
  'Informatique et technologies de l\'information', 'Intelligence artificielle', 'Matériaux', 'Mécanique',
  'Énergie', 'Électronique', 'Études de faisabilité de projets',
]

const statusColor: Record<string, string> = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
  active: '#10b981', paused: '#f59e0b', completed: '#6366f1', cancelled: '#ef4444',
}

export default function AccountPage({ tr, lang, user, onLogout }: Props) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)

  const [notifs, setNotifs] = useState<Notification[]>([])
  const [msgs, setMsgs] = useState<Message[]>([])
  const [needs, setNeeds] = useState<Need[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [myServices, setMyServices] = useState<MyService[]>([])

  // Profile edit form
  const [profileForm, setProfileForm] = useState({ companyName: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Change password
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Publish service form
  const emptyPublishForm = { title: '', description: '', category: '', researchDomain: '', city: '', price: '', isFree: false, phone: '' }
  const [publishForm, setPublishForm] = useState(emptyPublishForm)
  const [images, setImages] = useState<File[]>([])
  const [documents, setDocuments] = useState<File[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'notifications') {
        const { data } = await notificationsApi.getMy()
        setNotifs(data.notifications ?? data ?? [])
      } else if (t === 'messages') {
        const { data } = await messagesApi.getMy()
        setMsgs(data.messages ?? data ?? [])
      } else if (t === 'requests' && user.role === 'company') {
        const { data } = await needsApi.getMyNeeds()
        setNeeds(data.needs ?? data ?? [])
      } else if (t === 'favorites') {
        const { data } = await favoritesApi.getMy()
        setFavorites(data.favorites ?? [])
      } else if (t === 'myServices' && user.role === 'researcher') {
        const { data } = await servicesApi.getMine()
        setMyServices(data.services ?? [])
      } else if (t === 'projects') {
        if (user.role === 'company') {
          const { data } = await projectsApi.getMy()
          setProjects(data.projects ?? data ?? [])
        } else if (user.role === 'researcher') {
          const { data } = await projectsApi.getResearcher()
          setProjects(data.projects ?? data ?? [])
        }
      } else if (t === 'profile') {
        const { data } = await profileApi.get()
        setProfileForm({ companyName: data.profile?.companyName ?? user.companyName ?? '', phone: data.profile?.phone ?? '' })
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { load(tab) }, [tab, load])

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    setNotifs(p => p.map(n => ({ ...n, is_read: true })))
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true); setProfileMsg(null)
    try {
      await profileApi.update({ companyName: profileForm.companyName, phone: profileForm.phone })
      setProfileMsg({ type: 'ok', text: 'Profil mis à jour avec succès.' })
    } catch {
      setProfileMsg({ type: 'err', text: 'Erreur lors de la mise à jour.' })
    } finally { setSavingProfile(false) }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) { setPwdMsg({ type: 'err', text: 'Tous les champs sont requis.' }); return }
    if (pwdForm.next !== pwdForm.confirm) { setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas.' }); return }
    if (pwdForm.next.length < 8) { setPwdMsg({ type: 'err', text: 'Le mot de passe doit contenir au moins 8 caractères.' }); return }
    setSavingPwd(true)
    try {
      await authApi.changePassword(pwdForm.current, pwdForm.next)
      setPwdMsg({ type: 'ok', text: 'Mot de passe modifié avec succès.' })
      setPwdForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPwdMsg({ type: 'err', text: msg || 'Erreur lors du changement de mot de passe.' })
    } finally { setSavingPwd(false) }
  }

  const removeFavorite = async (serviceId: string) => {
    await favoritesApi.toggle(serviceId)
    setFavorites(p => p.filter(f => f.id !== serviceId))
  }

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return
    setImages(prev => [...prev, ...Array.from(files)].slice(0, 6))
  }
  const handleDocFiles = (files: FileList | null) => {
    if (!files) return
    setDocuments(prev => [...prev, ...Array.from(files)].slice(0, 5))
  }

  const submitPublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishMsg(null)
    if (!publishForm.title || !publishForm.description || !publishForm.category) {
      setPublishMsg({ type: 'err', text: tr('admin', 'allRequired') }); return
    }
    setPublishing(true)
    try {
      await servicesApi.publishWithFiles({
        category: publishForm.category,
        title: publishForm.title,
        description: publishForm.description,
        department: user.companyName ?? undefined,
        researchDomain: publishForm.researchDomain || undefined,
        city: publishForm.city || undefined,
        phone: publishForm.phone || undefined,
        price: publishForm.isFree ? undefined : (publishForm.price ? Number(publishForm.price) : undefined),
        isFree: publishForm.isFree,
      }, images, documents)
      setPublishMsg({ type: 'ok', text: tr('account', 'publishSuccess') })
      setPublishForm(emptyPublishForm)
      setImages([]); setDocuments([])
      if (tab === 'myServices') load('myServices')
    } catch {
      setPublishMsg({ type: 'err', text: tr('account', 'publishError') })
    } finally { setPublishing(false) }
  }

  const removeMyService = async (id: string) => {
    await servicesApi.remove(id)
    setMyServices(p => p.filter(s => s.id !== id))
  }

  const unreadNotifs = notifs.filter(n => !n.is_read).length
  const unreadMsgs = msgs.filter(m => !m.is_read).length

  const NAV: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number; roles?: string[] }> = [
    { id: 'profile',       label: tr('account', 'tabProfile'), icon: <User size={17}/> },
    { id: 'myServices',    label: tr('account', 'tabMyServices'), icon: <FileText size={17}/>, roles: ['researcher'] },
    { id: 'publish',       label: tr('account', 'tabPublish'), icon: <Plus size={17}/>, roles: ['researcher'] },
    { id: 'requests',      label: tr('account', 'tabRequests'), icon: <ShoppingBag size={17}/>, roles: ['company'] },
    { id: 'messages',      label: tr('account', 'tabMessages'), icon: <MessageSquare size={17}/>, badge: unreadMsgs },
    { id: 'favorites',     label: tr('account', 'tabFavorites'), icon: <Heart size={17}/> },
    { id: 'notifications', label: tr('account', 'tabNotifs'), icon: <Bell size={17}/>, badge: unreadNotifs },
    { id: 'projects',      label: tr('account', 'tabProjects'), icon: <ShoppingBag size={17}/>, roles: ['company', 'researcher'] },
  ]
  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user.role))
  const roleLabel = user.role === 'researcher' ? tr('account', 'roleResearcher') : tr('account', 'roleCompany')

  return (
    <main style={{ minHeight: '80vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 260, flexShrink: 0,
        background: 'var(--white)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width .2s',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo-64.png" alt="UFAS1" width={30} height={30} style={{ borderRadius:'50%', flexShrink: 0 }}/>
            {!collapsed && <span style={{ fontWeight: 800, fontSize: '.92rem', color: 'var(--navy)' }}>ESC Sétif 1</span>}
          </Link>
        </div>

        {/* User chip */}
        <div style={{ padding: '4px 16px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 'var(--r-lg)', background: 'var(--bg)' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: user.role === 'researcher' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'linear-gradient(135deg,var(--emerald),#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.85rem',
            }}>
              {user.companyName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </p>
                <p style={{ fontSize: '.72rem', color: 'var(--emerald)', fontWeight: 600 }}>{roleLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
          {visibleNav.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} title={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '10px 12px', borderRadius: 'var(--r-lg)', border: 'none', cursor: 'pointer',
                background: tab === item.id ? 'var(--emerald-lt)' : 'transparent',
                color: tab === item.id ? 'var(--emerald-dk)' : 'var(--text-2)',
                fontWeight: tab === item.id ? 700 : 500, fontSize: '.85rem',
                transition: 'all .15s', position: 'relative',
              }}>
              {item.icon}
              {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
              {(item.badge ?? 0) > 0 && (
                <span style={{
                  marginLeft: collapsed ? 0 : 'auto', position: collapsed ? 'absolute' : 'static',
                  top: collapsed ? 2 : undefined, right: collapsed ? 2 : undefined,
                  background: '#ef4444', color: '#fff', borderRadius: 99,
                  fontSize: '.62rem', fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={onLogout} title={tr('account', 'signOut')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '10px 12px', borderRadius: 'var(--r-lg)', border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '.85rem',
            }}>
            <LogOut size={17}/> {!collapsed && tr('account', 'signOut')}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
              padding: '8px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg)', color: 'var(--muted)',
            }}>
            {collapsed ? <ChevronRight size={15}/> : <><ChevronLeft size={15}/> </>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 40px', maxWidth: 920 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="md"/></div>
        ) : (
          <>
            {tab === 'profile' && (
              <div>
                <PageHeader icon={<User size={20}/>} title={tr('account', 'tabProfile')} subtitle={tr('account', 'profileSub')}/>

                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', position: 'relative', flexShrink: 0,
                      background: user.role === 'researcher' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'linear-gradient(135deg,var(--emerald),#059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.4rem',
                    }}>
                      {user.companyName?.charAt(0)?.toUpperCase() ?? '?'}
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--white)',
                      }}>
                        <Camera size={11} style={{ color: '#fff' }}/>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '.95rem' }}>{user.email}</p>
                      <span style={{
                        display: 'inline-block', marginTop: 4, background: user.role === 'researcher' ? '#7c3aed' : 'var(--emerald)',
                        color: '#fff', fontSize: '.7rem', padding: '2px 9px', borderRadius: 99, fontWeight: 700,
                      }}>{roleLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--navy)', marginBottom: 18 }}>{tr('account', 'editProfile')}</h3>
                  {profileMsg && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--r-lg)', fontSize: '.82rem', fontWeight: 500,
                      background: profileMsg.type === 'ok' ? '#f0fdf4' : '#fff1f2', color: profileMsg.type === 'ok' ? '#15803d' : '#be123c',
                      border: `1px solid ${profileMsg.type === 'ok' ? '#bbf7d0' : '#fecdd3'}` }}>
                      {profileMsg.text}
                    </div>
                  )}
                  <form onSubmit={saveProfile} noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('account', 'fullName')}</label>
                        <input className="form-input" value={profileForm.companyName} onChange={e => setProfileForm(p => ({ ...p, companyName: e.target.value }))}/>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('auth', 'phone')}</label>
                        <input className="form-input" type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}/>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {savingProfile ? <LoadingSpinner size="sm"/> : <Save size={14}/>} {tr('account', 'save')}
                    </button>
                  </form>
                </div>

                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '.95rem', color: 'var(--navy)', marginBottom: 4 }}>
                    <Lock size={15}/> {tr('account', 'changePassword')}
                  </h3>
                  <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 18 }}>{tr('account', 'changePasswordSub')}</p>
                  {pwdMsg && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--r-lg)', fontSize: '.82rem', fontWeight: 500,
                      background: pwdMsg.type === 'ok' ? '#f0fdf4' : '#fff1f2', color: pwdMsg.type === 'ok' ? '#15803d' : '#be123c',
                      border: `1px solid ${pwdMsg.type === 'ok' ? '#bbf7d0' : '#fecdd3'}` }}>
                      {pwdMsg.text}
                    </div>
                  )}
                  <form onSubmit={changePassword} noValidate>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 18 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('account', 'currentPassword')}</label>
                        <input className="form-input" type="password" value={pwdForm.current} onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))}/>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('auth', 'newPassword')}</label>
                        <input className="form-input" type="password" value={pwdForm.next} onChange={e => setPwdForm(p => ({ ...p, next: e.target.value }))}/>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('auth', 'confirmPwd')}</label>
                        <input className="form-input" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}/>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-outline" disabled={savingPwd}>
                      {savingPwd ? <LoadingSpinner size="sm"/> : tr('account', 'updatePassword')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {tab === 'requests' && (
              <div>
                <PageHeader icon={<ShoppingBag size={20}/>} title={tr('account', 'tabRequests')} subtitle={tr('account', 'requestsSub')}/>
                {needs.length === 0 ? (
                  <EmptyState message={tr('account', 'noRequests')} cta={tr('account', 'browseServices')} onClick={() => navigate('/services')}/>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {needs.map(n => (
                      <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)' }}>{n.title}</p>
                          {n.serviceTitle && <p style={{ fontSize: '.76rem', color: 'var(--emerald-dk)', fontWeight: 600 }}>{n.serviceTitle}</p>}
                          {n.serviceType && <p style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{n.serviceType}</p>}
                          <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString(lang)}</p>
                        </div>
                        <StatusPill status={n.status}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'messages' && (
              <div>
                <PageHeader icon={<MessageSquare size={20}/>} title={tr('account', 'tabMessages')} subtitle={tr('account', 'messagesSub')}/>
                {msgs.length === 0 ? (
                  <EmptyState message={tr('account', 'noMessages')}/>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {msgs.map(m => (
                      <div key={m.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: m.is_read ? 'transparent' : '#f0f9ff' }}>
                        <p style={{ fontWeight: m.is_read ? 600 : 700, fontSize: '.88rem', color: 'var(--navy)', marginBottom: 4 }}>{m.sender_name ?? 'Utilisateur'}</p>
                        <p style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>{m.body}</p>
                        <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 6 }}>{new Date(m.created_at).toLocaleDateString(lang)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'favorites' && (
              <div>
                <PageHeader icon={<Heart size={20}/>} title={tr('account', 'tabFavorites')} subtitle={tr('account', 'favoritesSub')}/>
                {favorites.length === 0 ? (
                  <EmptyState message={tr('account', 'noFavorites')} cta={tr('account', 'browseServices')} onClick={() => navigate('/services')}/>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                    {favorites.map(f => (
                      <div key={f.id} className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                          <span className="badge" style={{ background: 'var(--emerald-lt)', color: 'var(--emerald-dk)', fontWeight: 700 }}>{f.category}</span>
                          <button onClick={() => removeFavorite(f.id)} title="Retirer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                            <Heart size={16} fill="#ef4444"/>
                          </button>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)', marginBottom: 6 }}>{f.title}</p>
                        <p style={{ fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{f.description}</p>
                        <p style={{ fontWeight: 700, fontSize: '.82rem', color: f.isFree ? 'var(--emerald)' : 'var(--navy)' }}>
                          {f.isFree ? tr('catalog', 'free') : f.price != null ? `${f.price.toLocaleString(lang)} DA` : tr('catalog', 'onQuote')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'myServices' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                  <PageHeader icon={<FileText size={20}/>} title={tr('account', 'tabMyServices')} subtitle={tr('account', 'myServicesSub')} noMargin/>
                  <button onClick={() => setTab('publish')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14}/> {tr('account', 'tabPublish')}
                  </button>
                </div>
                {myServices.length === 0 ? (
                  <EmptyState message={tr('account', 'noMyServices')} cta={tr('account', 'tabPublish')} onClick={() => setTab('publish')}/>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                    {myServices.map(s => (
                      <div key={s.id} className="card" style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                          <span className="badge" style={{ background: 'var(--emerald-lt)', color: 'var(--emerald-dk)', fontWeight: 700 }}>{s.category}</span>
                          <button onClick={() => removeMyService(s.id)} title={tr('common', 'cancel')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                            <Trash2 size={15}/>
                          </button>
                        </div>
                        {s.images?.[0] && (
                          <img src={`http://localhost:4000${s.images[0].path}`} alt={s.title}
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--r-lg)', marginBottom: 10 }}/>
                        )}
                        <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)', marginBottom: 6 }}>{s.title}</p>
                        <p style={{ fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.description}</p>
                        {s.city && <p style={{ fontSize: '.74rem', color: 'var(--muted)', marginBottom: 4 }}>📍 {s.city}</p>}
                        <p style={{ fontWeight: 700, fontSize: '.82rem', color: s.isFree ? 'var(--emerald)' : 'var(--navy)' }}>
                          {s.isFree ? tr('catalog', 'free') : s.price != null ? `${s.price.toLocaleString(lang)} DA` : tr('catalog', 'onQuote')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'publish' && (
              <div>
                <PageHeader icon={<Plus size={20}/>} title={tr('account', 'publishTitle')} subtitle={tr('account', 'publishSub')}/>

                {publishMsg && (
                  <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 'var(--r-lg)', fontSize: '.82rem', fontWeight: 500,
                    background: publishMsg.type === 'ok' ? '#f0fdf4' : '#fff1f2', color: publishMsg.type === 'ok' ? '#15803d' : '#be123c',
                    border: `1px solid ${publishMsg.type === 'ok' ? '#bbf7d0' : '#fecdd3'}` }}>
                    {publishMsg.text}
                  </div>
                )}

                <form onSubmit={submitPublish} noValidate>
                  <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--navy)', marginBottom: 18 }}>{tr('account', 'serviceInfo')}</h3>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">{tr('account', 'svcTitleLabel')}</label>
                      <input className="form-input" value={publishForm.title} onChange={e => setPublishForm(p => ({ ...p, title: e.target.value }))} placeholder={tr('admin', 'svcTitlePh')}/>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">{tr('account', 'descLabel')} *</label>
                      <textarea className="form-input" rows={4} value={publishForm.description} onChange={e => setPublishForm(p => ({ ...p, description: e.target.value }))} placeholder={tr('admin', 'svcDescPh')} style={{ resize: 'vertical' }}/>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('account', 'prestationDomain')} *</label>
                        <select className="form-input" value={publishForm.researchDomain} onChange={e => setPublishForm(p => ({ ...p, researchDomain: e.target.value }))}>
                          <option value="">-- {tr('common', 'select')} --</option>
                          {PRESTATION_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('account', 'category')} *</label>
                        <select className="form-input" value={publishForm.category} onChange={e => setPublishForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="">-- {tr('common', 'select')} --</option>
                          {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('account', 'city')}</label>
                        <input className="form-input" value={publishForm.city} onChange={e => setPublishForm(p => ({ ...p, city: e.target.value }))} placeholder="Sétif"/>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{tr('catalog', 'pricing')} (DA)</label>
                        <input className="form-input" type="number" min={0} disabled={publishForm.isFree} value={publishForm.price} onChange={e => setPublishForm(p => ({ ...p, price: e.target.value }))} placeholder={tr('catalog', 'onQuote')}/>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.84rem', color: 'var(--text-2)' }}>
                        <input type="checkbox" checked={publishForm.isFree} onChange={e => setPublishForm(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? '' : p.price }))}/>
                        {tr('catalog', 'free')}
                      </label>
                      <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label className="form-label">{tr('auth', 'phone')}</label>
                        <input className="form-input" type="tel" value={publishForm.phone} onChange={e => setPublishForm(p => ({ ...p, phone: e.target.value }))} placeholder="+213 XXX XXX XXX"/>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--navy)', marginBottom: 4 }}>{tr('account', 'addPhotos')}</h3>
                    <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 14 }}>{tr('account', 'addPhotosSub')}</p>
                    <div
                      onClick={() => imageInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); handleImageFiles(e.dataTransfer.files) }}
                      style={{
                        border: '2px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: '32px 20px',
                        textAlign: 'center', cursor: 'pointer', background: 'var(--bg)',
                      }}>
                      <Upload size={26} style={{ color: 'var(--muted)', marginBottom: 10 }}/>
                      <p style={{ fontWeight: 600, fontSize: '.86rem', color: 'var(--navy)' }}>{tr('account', 'dropImages')}</p>
                      <p style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 4 }}>PNG, JPG — 5MB max</p>
                      <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden
                        onChange={e => handleImageFiles(e.target.files)}/>
                    </div>
                    {images.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                        {images.map((f, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--bg)', borderRadius: 'var(--r-md)', fontSize: '.76rem', color: 'var(--text-2)' }}>
                            {f.name}
                            <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                              <X size={12}/>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--navy)', marginBottom: 4 }}>{tr('account', 'addDocs')}</h3>
                    <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 14 }}>{tr('account', 'addDocsSub')}</p>
                    <div
                      onClick={() => docInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); handleDocFiles(e.dataTransfer.files) }}
                      style={{
                        border: '2px dashed var(--border)', borderRadius: 'var(--r-xl)', padding: '32px 20px',
                        textAlign: 'center', cursor: 'pointer', background: 'var(--bg)',
                      }}>
                      <Paperclip size={26} style={{ color: 'var(--muted)', marginBottom: 10 }}/>
                      <p style={{ fontWeight: 600, fontSize: '.86rem', color: 'var(--navy)' }}>{tr('account', 'clickToAddDoc')}</p>
                      <p style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: 4 }}>PDF, DOC, DOCX, XLS, XLSX</p>
                      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple hidden
                        onChange={e => handleDocFiles(e.target.files)}/>
                    </div>
                    {documents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                        {documents.map((f, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--bg)', borderRadius: 'var(--r-md)', fontSize: '.76rem', color: 'var(--text-2)' }}>
                            {f.name}
                            <button type="button" onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                              <X size={12}/>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => { setPublishForm(emptyPublishForm); setImages([]); setDocuments([]) }}>{tr('common', 'cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={publishing} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {publishing ? <LoadingSpinner size="sm"/> : <Plus size={15}/>} {tr('account', 'publishBtn')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'notifications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                  <PageHeader icon={<Bell size={20}/>} title={tr('account', 'tabNotifs')} subtitle={tr('account', 'notifsSub')} noMargin/>
                  {notifs.length > 0 && (
                    <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--emerald)', fontSize: '.82rem', fontWeight: 600 }}>
                      <CheckCheck size={14}/> {tr('account', 'markAllRead')}
                    </button>
                  )}
                </div>
                {notifs.length === 0 ? (
                  <EmptyState message={tr('account', 'noNotifications')}/>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {notifs.map(n => (
                      <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: n.is_read ? 'transparent' : '#f0f9ff', display: 'flex', gap: 10 }}>
                        {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--emerald)', marginTop: 6, flexShrink: 0 }}/>}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: n.is_read ? 600 : 700, fontSize: '.88rem', color: 'var(--navy)' }}>{n.title}</p>
                          {n.body && <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 2 }}>{n.body}</p>}
                          <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 6 }}>{new Date(n.created_at).toLocaleDateString(lang)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'projects' && (
              <div>
                <PageHeader icon={<ShoppingBag size={20}/>} title={tr('account', 'tabProjects')} subtitle={tr('account', 'projectsSub')}/>
                {projects.length === 0 ? (
                  <EmptyState message={tr('account', 'noProjects')}/>
                ) : (
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {projects.map(p => (
                      <div key={p.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                          <p style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)' }}>{p.title}</p>
                          <StatusPill status={p.status}/>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.progress_pct}%`, background: p.progress_pct === 100 ? 'var(--emerald)' : 'var(--navy)', borderRadius: 99 }}/>
                          </div>
                          <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{p.progress_pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )

  function StatusPill({ status }: { status: string }) {
    return (
      <span style={{
        padding: '2px 10px', borderRadius: 99, fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap',
        background: `${statusColor[status] ?? '#6b7280'}22`, color: statusColor[status] ?? '#6b7280',
      }}>{status}</span>
    )
  }
}

function PageHeader({ icon, title, subtitle, noMargin }: { icon: React.ReactNode; title: string; subtitle: string; noMargin?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: noMargin ? 0 : 24 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--emerald-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-dk)' }}>
        {icon}
      </div>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>{title}</h1>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function EmptyState({ message, cta, onClick }: { message: string; cta?: string; onClick?: () => void }) {
  return (
    <div className="card" style={{ padding: 56, textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: 'var(--bg)', margin: '0 auto 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bell size={22} style={{ color: 'var(--muted)' }}/>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: cta ? 20 : 0 }}>{message}</p>
      {cta && <button onClick={onClick} className="btn btn-primary">{cta}</button>}
    </div>
  )
}
