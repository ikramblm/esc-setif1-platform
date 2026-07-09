import { useState, useEffect, useCallback } from 'react'
import { LogOut, Briefcase, User, Bell, CheckCircle, XCircle, Send, ChevronRight } from 'lucide-react'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { projectsApi, messagesApi, notificationsApi } from '../lib/api'
import type { Lang } from '../lib/i18n'
import type { AuthUser } from '../lib/auth'

interface Props { tr: (s: string, k: string) => string; lang: Lang; user: AuthUser; onLogout: () => void }

type Tab = 'projects' | 'messages' | 'profile' | 'notifications'

interface Project {
  id: string; title: string; description: string; status: string
  progressPct: number; companyName: string; startDate: string; endDate: string
  budgetApproved: number; adminNotes: string
  assignmentRole: string; assignmentStatus: string; createdAt: string
  assignmentId?: string
}
interface Message { id: string; body: string; senderName: string; senderRole: string; createdAt: string; isRead: boolean }
interface Notification { id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string }

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981', paused: '#f59e0b', completed: '#6366f1', cancelled: '#ef4444'
}
const ASSIGN_COLORS: Record<string, string> = {
  accepted: '#10b981', declined: '#ef4444', pending: '#f59e0b'
}

export default function ResearcherDashboard({ tr, lang, user, onLogout }: Props) {
  const [tab, setTab]         = useState<Tab>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [messages, setMessages]     = useState<Message[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [msgBody, setMsgBody] = useState('')
  const [declineModal, setDeclineModal] = useState<{ assignId: string; projTitle: string } | null>(null)
  const [declineNote, setDeclineNote] = useState('')
  const [profileForm, setProfileForm] = useState({ bio: '', expertise: '', isAvailable: true })
  const [sendingMsg, setSendingMsg] = useState(false)
  const [, setProjectDocs] = useState<unknown[]>([])

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 4000)
  }

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await projectsApi.getResearcher()
      setProjects(data.projects || [])
    } catch {
      showAlert('error', 'Impossible de charger les projets.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const [nRes, uRes] = await Promise.all([notificationsApi.getMy(), notificationsApi.getUnread()])
      setNotifications(nRes.data.notifications || [])
      setUnreadNotifs(uRes.data.count || 0)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadProjects()
    loadNotifications()
  }, [loadProjects, loadNotifications])

  const loadProjectDetail = async (proj: Project) => {
    setSelectedProject(proj)
    try {
      const [docsRes, msgsRes] = await Promise.all([
        projectsApi.getDocuments(proj.id),
        messagesApi.getProject(proj.id),
      ])
      setProjectDocs(docsRes.data.documents || [])
      setMessages(msgsRes.data.messages || [])
    } catch { /* ignore */ }
  }

  const handleRespond = async (assignId: string, response: 'accepted' | 'declined', note?: string) => {
    try {
      await projectsApi.respond(assignId, response, note)
      showAlert('success', response === 'accepted' ? 'Projet accepté !' : 'Projet décliné.')
      setDeclineModal(null)
      setDeclineNote('')
      loadProjects()
    } catch {
      showAlert('error', 'Erreur lors de la réponse.')
    }
  }

  const handleSendMsg = async () => {
    if (!msgBody.trim() || !selectedProject) return
    setSendingMsg(true)
    try {
      await messagesApi.send({ projectId: selectedProject.id, body: msgBody })
      setMsgBody('')
      const { data } = await messagesApi.getProject(selectedProject.id)
      setMessages(data.messages || [])
    } catch {
      showAlert('error', 'Erreur lors de l\'envoi.')
    } finally {
      setSendingMsg(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setUnreadNotifs(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { /* ignore */ }
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const sidebarItems: Array<{ key: Tab; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'projects', label: tr('researcher', 'myProjects'), icon: <Briefcase size={17}/> },
    { key: 'messages', label: tr('projects', 'messages'), icon: <Send size={17}/> },
    { key: 'notifications', label: tr('notifications', 'title'), icon: <Bell size={17}/>, badge: unreadNotifs },
    { key: 'profile', label: tr('researcher', 'myProfile'), icon: <User size={17}/> },
  ]

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-64.png" alt="UFAS1" width={30} height={30} style={{ borderRadius:'50%' }}/>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--navy)', fontSize: '.95rem' }}>ESC Sétif 1</span>
            <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Chercheur</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '.84rem', color: 'var(--muted)' }}>{user.companyName || user.email}</span>
            <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600 }}>
              <LogOut size={13}/> {tr('common', 'logout')}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '24px 20px', display: 'flex', gap: 20 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--sh-xs)', position: 'sticky', top: 80 }}>
            {sidebarItems.map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: tab === item.key ? '#f5f3ff' : 'transparent', border: 'none', cursor: 'pointer', color: tab === item.key ? '#7c3aed' : 'var(--text-2)', fontWeight: tab === item.key ? 700 : 500, fontSize: '.88rem', borderLeft: tab === item.key ? '3px solid #7c3aed' : '3px solid transparent', transition: 'all .15s' }}>
                {item.icon}
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.badge ? <span style={{ background: '#7c3aed', color: '#fff', fontSize: '.65rem', padding: '1px 6px', borderRadius: 99, fontWeight: 800 }}>{item.badge}</span> : null}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {alert && <div style={{ marginBottom: 16 }}><Alert type={alert.type} message={alert.msg} onDismiss={() => setAlert(null)}/></div>}

          {/* PROJECTS TAB */}
          {tab === 'projects' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{tr('researcher', 'myProjects')}</h1>
                <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{tr('researcher', 'welcome')}</p>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><LoadingSpinner/></div>
              ) : projects.length === 0 ? (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 60, textAlign: 'center' }}>
                  <Briefcase size={32} style={{ color: 'var(--muted)', marginBottom: 12 }}/>
                  <p style={{ color: 'var(--muted)', fontWeight: 500 }}>{tr('researcher', 'noProjects')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {projects.map(proj => {
                    const assignStatus = proj.assignmentStatus || 'pending'
                    return (
                      <div key={proj.id} style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--sh-xs)', overflow: 'hidden' }}>
                        <div style={{ height: 4, background: STATUS_COLORS[proj.status] || '#6366f1' }}/>
                        <div style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 99, background: STATUS_COLORS[proj.status] + '18', color: STATUS_COLORS[proj.status], fontSize: '.72rem', fontWeight: 700 }}>{tr('projects', proj.status)}</span>
                                <span style={{ padding: '3px 10px', borderRadius: 99, background: ASSIGN_COLORS[assignStatus] + '18', color: ASSIGN_COLORS[assignStatus], fontSize: '.72rem', fontWeight: 700 }}>
                                  {tr('researcher', assignStatus)}
                                </span>
                                {proj.assignmentRole === 'lead' && <span style={{ padding: '3px 10px', borderRadius: 99, background: '#dbeafe', color: '#1e40af', fontSize: '.72rem', fontWeight: 700 }}>Chef de projet</span>}
                              </div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{proj.title}</h3>
                              <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginBottom: 10 }}>Entreprise : <strong style={{ color: 'var(--text-2)' }}>{proj.companyName}</strong></p>
                              {proj.description && <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6 }}>{proj.description.slice(0, 200)}{proj.description.length > 200 ? '…' : ''}</p>}
                              {/* Progress bar */}
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.76rem', color: 'var(--muted)', marginBottom: 4 }}>
                                  <span>{tr('projects', 'progress')}</span>
                                  <span>{proj.progressPct}%</span>
                                </div>
                                <div style={{ height: 5, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${proj.progressPct}%`, background: '#7c3aed', borderRadius: 99, transition: 'width .5s' }}/>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 16, fontSize: '.76rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                                {proj.startDate && <span>📅 {new Date(proj.startDate).toLocaleDateString('fr-DZ')}</span>}
                                {proj.endDate && <span>🏁 {new Date(proj.endDate).toLocaleDateString('fr-DZ')}</span>}
                                {proj.budgetApproved && <span>💰 {Number(proj.budgetApproved).toLocaleString()} DZD</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                              {assignStatus === 'pending' && (
                                <>
                                  <button onClick={() => handleRespond(proj.id, 'accepted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--r-lg)', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem' }}>
                                    <CheckCircle size={14}/> {tr('researcher', 'accept')}
                                  </button>
                                  <button onClick={() => setDeclineModal({ assignId: proj.id, projTitle: proj.title })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--r-lg)', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem' }}>
                                    <XCircle size={14}/> {tr('researcher', 'decline')}
                                  </button>
                                </>
                              )}
                              <button onClick={() => loadProjectDetail(proj)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--navy)', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>
                                <ChevronRight size={14}/> Détails
                              </button>
                            </div>
                          </div>
                          {proj.adminNotes && (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef3c7', borderRadius: 'var(--r-md)', border: '1px solid #fde68a', fontSize: '.8rem', color: '#92400e' }}>
                              <strong>Note admin :</strong> {proj.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {tab === 'messages' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{tr('projects', 'messages')}</h1>
                <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>Sélectionnez un projet pour voir les messages.</p>
              </div>
              {projects.length === 0 ? (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                  {tr('projects', 'noMsg')}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
                  {/* Project list */}
                  <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {projects.map(proj => (
                      <button key={proj.id} onClick={() => loadProjectDetail(proj)} style={{ width: '100%', padding: '14px 16px', background: selectedProject?.id === proj.id ? '#f5f3ff' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', color: selectedProject?.id === proj.id ? '#7c3aed' : 'var(--navy)' }}>
                        <p style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 3 }}>{proj.title.slice(0, 30)}{proj.title.length > 30 ? '…' : ''}</p>
                        <p style={{ fontSize: '.74rem', color: 'var(--muted)' }}>{proj.companyName}</p>
                      </button>
                    ))}
                  </div>
                  {/* Chat panel */}
                  <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                    {!selectedProject ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>
                        Sélectionnez un projet
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>{selectedProject.title}</div>
                        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {messages.length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '.85rem', textAlign: 'center', marginTop: 40 }}>{tr('projects', 'noMsg')}</p>
                          ) : messages.map(msg => {
                            const isMe = msg.senderRole !== 'admin' && msg.senderRole === user.role
                            return (
                              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 12, background: isMe ? '#7c3aed' : 'var(--bg)', color: isMe ? '#fff' : 'var(--navy)', border: isMe ? 'none' : '1px solid var(--border)' }}>
                                  <p style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: 4, opacity: .7 }}>{msg.senderName}</p>
                                  <p style={{ fontSize: '.88rem', lineHeight: 1.5 }}>{msg.body}</p>
                                  <p style={{ fontSize: '.7rem', marginTop: 5, opacity: .6 }}>{new Date(msg.createdAt).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                          <input value={msgBody} onChange={e => setMsgBody(e.target.value)}
                            placeholder={tr('projects', 'msgPh')}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMsg() } }}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', fontSize: '.88rem', background: 'var(--bg)', color: 'var(--navy)' }}/>
                          <button onClick={handleSendMsg} disabled={sendingMsg || !msgBody.trim()} style={{ padding: '10px 18px', borderRadius: 'var(--r-lg)', border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Send size={14}/> {tr('projects', 'sendMsg')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)' }}>{tr('notifications', 'title')}</h1>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={handleMarkAllRead} style={{ padding: '7px 16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, color: 'var(--muted)' }}>
                    {tr('notifications', 'markAll')}
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 60, textAlign: 'center' }}>
                  <Bell size={32} style={{ color: 'var(--muted)', marginBottom: 12 }}/>
                  <p style={{ color: 'var(--muted)' }}>{tr('notifications', 'empty')}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map(notif => (
                    <div key={notif.id} style={{ background: notif.isRead ? 'var(--white)' : '#f5f3ff', borderRadius: 'var(--r-xl)', border: `1px solid ${notif.isRead ? 'var(--border)' : '#ddd6fe'}`, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: notif.isRead ? 'transparent' : '#7c3aed', marginTop: 6, flexShrink: 0 }}/>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--navy)', marginBottom: 3 }}>{notif.title}</p>
                        {notif.body && <p style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{notif.body}</p>}
                        <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 6 }}>{new Date(notif.createdAt).toLocaleDateString('fr-DZ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>{tr('researcher', 'myProfile')}</h1>
              </div>
              <div style={{ background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 28, boxShadow: 'var(--sh-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                    {(user.companyName || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy)' }}>{user.companyName || user.email}</p>
                    <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 3 }}>{user.email}</p>
                    <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>Chercheur</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--navy)', minWidth: 140 }}>{tr('researcher', 'availability')}</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {[true, false].map(avail => (
                        <button key={String(avail)} onClick={() => setProfileForm(p => ({ ...p, isAvailable: avail }))}
                          style={{ padding: '7px 16px', borderRadius: 'var(--r-lg)', border: `1.5px solid ${profileForm.isAvailable === avail ? '#10b981' : 'var(--border)'}`, background: profileForm.isAvailable === avail ? '#f0fdf4' : 'var(--white)', color: profileForm.isAvailable === avail ? '#10b981' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>
                          {avail ? tr('researcher', 'available') : tr('researcher', 'unavailable')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'bio')}</label>
                    <textarea className="form-input" rows={4} value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} style={{ resize: 'vertical' }}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{tr('researcher', 'expertise')} <span style={{ fontSize: '.76rem', fontWeight: 400, color: 'var(--muted)' }}>(séparées par des virgules)</span></label>
                    <input className="form-input" value={profileForm.expertise} onChange={e => setProfileForm(p => ({ ...p, expertise: e.target.value }))} placeholder="ex: IA, Réseaux, Optimisation"/>
                  </div>
                  <button onClick={() => showAlert('success', tr('researcher', 'profileSaved'))}
                    style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 'var(--r-lg)', border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem' }}>
                    {tr('researcher', 'saveProfile')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Decline modal */}
      {declineModal && (
        <Modal open={true} title={tr('researcher', 'decline')} onClose={() => setDeclineModal(null)}>
          <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: 16 }}>
            Vous allez décliner le projet : <strong>{declineModal.projTitle}</strong>
          </p>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{tr('researcher', 'declineNote')}</label>
            <textarea className="form-input" rows={3} value={declineNote} onChange={e => setDeclineNote(e.target.value)} style={{ resize: 'vertical' }}/>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeclineModal(null)} style={{ padding: '9px 18px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}>{tr('common', 'cancel')}</button>
            <button onClick={() => handleRespond(declineModal.assignId, 'declined', declineNote)} style={{ padding: '9px 18px', borderRadius: 'var(--r-lg)', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '.88rem' }}>
              {tr('researcher', 'decline')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
