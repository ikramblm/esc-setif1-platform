import { useState, useEffect, useCallback, useRef } from 'react'
import { X, User, Bell, MessageSquare, FileText, FolderOpen, LogOut, ExternalLink, CheckCheck, ChevronRight } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { notificationsApi, messagesApi, needsApi, projectsApi } from '../lib/api'
import type { AuthUser } from '../lib/auth'
import type { Lang } from '../lib/i18n'

interface Props {
  open: boolean
  onClose: () => void
  user: AuthUser | null
  onLogout: () => void
  tr: (s: string, k: string) => string
  lang: Lang
}

type Tab = 'profile' | 'notifications' | 'messages' | 'requests' | 'projects'

interface Notification { id: string; title: string; body?: string; is_read: boolean; created_at: string; type: string; link?: string }
interface Message { id: string; body: string; sender_id: string; is_read: boolean; created_at: string; sender_name?: string }
interface Need { id: string; title: string; status: string; service_type?: string; created_at: string }
interface Project { id: string; title: string; status: string; progress_pct: number; start_date?: string }

export default function AccountDrawer({ open, onClose, user, onLogout, tr, lang }: Props) {
  const [tab, setTab]       = useState<Tab>('profile')
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [msgs, setMsgs]     = useState<Message[]>([])
  const [needs, setNeeds]   = useState<Need[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const load = useCallback(async (t: Tab) => {
    if (!user) return
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
      } else if (t === 'projects') {
        if (user.role === 'company') {
          const { data } = await projectsApi.getMy()
          setProjects(data.projects ?? data ?? [])
        } else if (user.role === 'researcher') {
          const { data } = await projectsApi.getResearcher()
          setProjects(data.projects ?? data ?? [])
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    if (open) load(tab)
  }, [open, tab, load])

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    setNotifs(p => p.map(n => ({ ...n, is_read: true })))
  }

  const unreadNotifs = notifs.filter(n => !n.is_read).length
  const unreadMsgs   = msgs.filter(m => !m.is_read).length

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number; roles?: string[] }> = [
    { id: 'profile',       label: tr('account', 'tabProfile'),   icon: <User size={15}/> },
    { id: 'notifications', label: tr('account', 'tabNotifs'),    icon: <Bell size={15}/>, badge: unreadNotifs },
    { id: 'messages',      label: tr('account', 'tabMessages'),  icon: <MessageSquare size={15}/>, badge: unreadMsgs },
    { id: 'requests',      label: tr('account', 'tabRequests'),  icon: <FileText size={15}/>, roles: ['company'] },
    { id: 'projects',      label: tr('account', 'tabProjects'),  icon: <FolderOpen size={15}/>, roles: ['company', 'researcher'] },
  ]

  const visibleTabs = TABS.filter(t => !t.roles || (user && t.roles.includes(user.role)))

  const statusColor: Record<string, string> = {
    pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
    active: '#10b981', paused: '#f59e0b', completed: '#6366f1', cancelled: '#ef4444',
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(15,31,61,.4)', backdropFilter: 'blur(3px)',
          animation: 'fadeIn .2s ease',
        }}/>
      )}

      {/* Drawer */}
      <div ref={drawerRef} dir={dir} style={{
        position: 'fixed', top: 0, right: lang === 'ar' ? 'auto' : 0, left: lang === 'ar' ? 0 : 'auto',
        bottom: 0, width: 400, zIndex: 999,
        background: 'var(--white)',
        boxShadow: '-8px 0 40px rgba(15,31,61,.18)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : (lang === 'ar' ? 'translateX(-100%)' : 'translateX(100%)'),
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,var(--navy),#1e3a6e)',
          padding: '20px 20px 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: user?.role === 'researcher' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'linear-gradient(135deg,var(--emerald),#059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>
                {user?.companyName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '.95rem', lineHeight: 1.2, marginBottom: 2 }}>
                  {user?.companyName}
                </p>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem' }}>{user?.email}</p>
                <span style={{
                  display: 'inline-block', marginTop: 4,
                  background: user?.role === 'admin' ? '#ef4444' : user?.role === 'researcher' ? '#7c3aed' : 'var(--emerald)',
                  color: '#fff', fontSize: '.68rem', padding: '1px 8px', borderRadius: 99, fontWeight: 700,
                }}>
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'researcher' ? 'Chercheur' : 'Entreprise'}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={14}/>
            </button>
          </div>

          {/* Admin shortcut */}
          {user?.role === 'admin' ? (
            <a href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
              borderRadius: 'var(--r-lg)', padding: '10px 14px', marginBottom: 16,
              color: '#fff', textDecoration: 'none', fontSize: '.84rem', fontWeight: 600,
              transition: 'background .2s',
            }}>
              <ExternalLink size={14}/> Ouvrir le panneau d'administration <ChevronRight size={13} style={{ marginLeft: 'auto' }}/>
            </a>
          ) : (
            /* Tabs */
            <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
              {visibleTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: '.75rem', fontWeight: tab === t.id ? 700 : 500, borderRadius: 0,
                    color: tab === t.id ? '#fff' : 'rgba(255,255,255,.5)',
                    background: 'transparent',
                    borderBottom: tab === t.id ? '2px solid var(--emerald)' : '2px solid transparent',
                    transition: 'all .15s',
                    position: 'relative',
                  }}>
                  {t.icon} {t.label}
                  {(t.badge ?? 0) > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff', borderRadius: 99,
                      fontSize: '.6rem', fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                    }}>{t.badge}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><LoadingSpinner/></div>
          ) : user?.role === 'admin' ? (
            <div style={{ padding: 24 }}>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.7 }}>
                En tant qu'administrateur, gérez la plateforme depuis le panneau d'administration dédié.
              </p>
              <a href="/admin" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'none', padding: '11px 0' }}>
                Accéder au panneau admin →
              </a>
            </div>
          ) : (
            <>
              {/* PROFILE TAB */}
              {tab === 'profile' && (
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-xl)', padding: 20, marginBottom: 16 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 16, color: 'var(--navy)' }}>Informations du compte</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <InfoRow label="Nom" value={user?.companyName}/>
                      <InfoRow label="Email" value={user?.email}/>
                      <InfoRow label="Rôle" value={user?.role === 'researcher' ? 'Chercheur' : 'Entreprise'}/>
                    </div>
                  </div>
                  <p style={{ fontSize: '.76rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6 }}>
                    Pour modifier votre profil, contactez l'administration.
                  </p>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {tab === 'notifications' && (
                <div>
                  {notifs.length > 0 && (
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={markAllRead} style={{
                        display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--emerald)', fontSize: '.78rem', fontWeight: 600,
                      }}>
                        <CheckCheck size={13}/> Tout marquer lu
                      </button>
                    </div>
                  )}
                  {notifs.length === 0 ? (
                    <Empty message="Aucune notification"/>
                  ) : notifs.map(n => (
                    <div key={n.id} style={{
                      padding: '14px 20px', borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : '#f0f9ff',
                      transition: 'background .2s',
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald)', marginTop: 6, flexShrink: 0 }}/>}
                        <div style={{ flex: 1, marginLeft: n.is_read ? 16 : 0 }}>
                          <p style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '.84rem', color: 'var(--navy)', marginBottom: 2 }}>{n.title}</p>
                          {n.body && <p style={{ fontSize: '.76rem', color: 'var(--muted)', lineHeight: 1.5 }}>{n.body}</p>}
                          <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString(lang)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MESSAGES TAB */}
              {tab === 'messages' && (
                <div>
                  {msgs.length === 0 ? (
                    <Empty message="Aucun message"/>
                  ) : msgs.map(m => (
                    <div key={m.id} style={{
                      padding: '14px 20px', borderBottom: '1px solid var(--border)',
                      background: m.is_read ? 'transparent' : '#f0f9ff',
                    }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {!m.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginTop: 6, flexShrink: 0 }}/>}
                        <div style={{ flex: 1, marginLeft: m.is_read ? 16 : 0 }}>
                          <p style={{ fontWeight: m.is_read ? 500 : 700, fontSize: '.84rem', color: 'var(--navy)', marginBottom: 2 }}>
                            {m.sender_name ?? 'Utilisateur'}
                          </p>
                          <p style={{ fontSize: '.76rem', color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {m.body}
                          </p>
                          <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>{new Date(m.created_at).toLocaleDateString(lang)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* REQUESTS TAB (company only) */}
              {tab === 'requests' && user?.role === 'company' && (
                <div>
                  {needs.length === 0 ? (
                    <Empty message="Aucune demande soumise"/>
                  ) : needs.map(n => (
                    <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--navy)', marginBottom: 2 }}>{n.title}</p>
                          {n.service_type && <p style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{n.service_type}</p>}
                          <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString(lang)}</p>
                        </div>
                        <span style={{
                          padding: '2px 10px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
                          background: `${statusColor[n.status] ?? '#6b7280'}22`,
                          color: statusColor[n.status] ?? '#6b7280',
                          whiteSpace: 'nowrap',
                        }}>
                          {n.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PROJECTS TAB */}
              {tab === 'projects' && (
                <div>
                  {projects.length === 0 ? (
                    <Empty message="Aucun projet assigné"/>
                  ) : projects.map(p => (
                    <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--navy)', flex: 1 }}>{p.title}</p>
                        <span style={{
                          padding: '2px 10px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
                          background: `${statusColor[p.status] ?? '#6b7280'}22`,
                          color: statusColor[p.status] ?? '#6b7280', whiteSpace: 'nowrap',
                        }}>
                          {p.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${p.progress_pct}%`,
                            background: p.progress_pct === 100 ? 'var(--emerald)' : 'var(--navy)',
                            borderRadius: 99, transition: 'width .5s',
                          }}/>
                        </div>
                        <span style={{ fontSize: '.7rem', color: 'var(--muted)', minWidth: 30, textAlign: 'right' }}>{p.progress_pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', background: 'none', cursor: 'pointer',
            color: '#ef4444', fontSize: '.84rem', fontWeight: 600,
            transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fff1f2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <LogOut size={14}/> {tr('account', 'signOut')}
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0}to{opacity:1} }`}</style>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '.78rem', color: 'var(--navy)', fontWeight: 600, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12, opacity: .4 }}>📭</div>
      <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>{message}</p>
    </div>
  )
}
