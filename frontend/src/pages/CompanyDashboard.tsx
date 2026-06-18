import { useState, useEffect, useCallback } from 'react'
import { Plus, FileText, Clock, CheckCircle, TrendingUp, LogOut, Briefcase, User, Send, ChevronRight } from 'lucide-react'
import Modal from '../components/Modal'
import NeedCard from '../components/NeedCard'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { needsApi, profileApi, offersApi, projectsApi } from '../lib/api'
import { sanitizeInput } from '../lib/security'
import type { Lang } from '../lib/i18n'
import type { AuthUser } from '../lib/auth'

interface Props { tr: (s: string, k: string) => string; lang: Lang; user: AuthUser; onLogout: () => void }

type Tab = 'requests' | 'offers' | 'applications' | 'projects' | 'profile'
type Status = 'pending'|'reviewing'|'approved'|'rejected'|'completed'
interface Need { id:string; title:string; serviceType:string; description:string; deadline:string; budget:string; status:Status; createdAt:string }
interface Project { id:string; title:string; description:string; status:string; progressPct:number; startDate:string; endDate:string; budgetApproved:number; adminNotes:string; createdAt:string }
interface Offer { id:string; title:string; description:string; category:string; deadline:string; budget:string; slots:number; tags:string[]; status:string; applicantsCount:number; createdAt:string }
interface Application { id:string; offerId:string; offerTitle:string; category:string; coverLetter:string; status:string; appliedAt:string }

const SERVICE_TYPES = ['Consulting','Formation','Études','Recherche']
const EMPTY_FORM = { title:'', serviceType:'', description:'', deadline:'', budget:'' }

const CAT_COLORS: Record<string,string> = {
  Consulting:'var(--navy)', Formation:'#7c3aed', Études:'#2563eb', Recherche:'#059669'
}

function OfferCard({ offer, appliedIds, onApply, tr }: { offer:Offer; appliedIds:Set<string>; onApply:(o:Offer)=>void; tr:(s:string,k:string)=>string }) {
  const applied = appliedIds.has(offer.id)
  const closed  = offer.status !== 'open'
  return (
    <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ height:4, background: CAT_COLORS[offer.category] ?? 'var(--emerald)' }}/>
      <div style={{ padding:'20px 22px', flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <span style={{ padding:'3px 10px', borderRadius:99, background:CAT_COLORS[offer.category]+'18', color:CAT_COLORS[offer.category], fontSize:'.72rem', fontWeight:700 }}>{offer.category}</span>
          <span style={{ fontSize:'.72rem', padding:'2px 9px', borderRadius:99, background: closed ? '#f1f5f9' : 'var(--emerald-lt)', color: closed ? 'var(--muted)' : 'var(--emerald)', fontWeight:600 }}>
            {closed ? tr('offers','closed') : tr('offers','open')}
          </span>
        </div>
        <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--navy)', marginBottom:8, lineHeight:1.4 }}>{offer.title}</h3>
        <p style={{ fontSize:'.84rem', color:'var(--text-2)', lineHeight:1.6, marginBottom:14 }}>{offer.description.slice(0,140)}{offer.description.length>140?'…':''}</p>
        {offer.tags.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
            {offer.tags.map(t => <span key={t} style={{ padding:'2px 8px', borderRadius:99, background:'var(--bg)', border:'1px solid var(--border)', fontSize:'.7rem', color:'var(--muted)' }}>{t}</span>)}
          </div>
        )}
        <div style={{ display:'flex', gap:16, fontSize:'.76rem', color:'var(--muted)' }}>
          {offer.deadline && <span>⏰ {new Date(offer.deadline).toLocaleDateString('fr-DZ')}</span>}
          {offer.budget   && <span>💰 {Number(offer.budget).toLocaleString()} DZD</span>}
          <span>👥 {offer.applicantsCount} {tr('offers','applicants')}</span>
        </div>
      </div>
      <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)' }}>
        <button onClick={() => onApply(offer)} disabled={applied || closed}
          style={{
            width:'100%', padding:'9px 0', borderRadius:'var(--r-lg)', border:'none', cursor: applied||closed ? 'default' : 'pointer',
            background: applied ? 'var(--emerald-lt)' : closed ? 'var(--bg)' : 'var(--emerald)',
            color: applied ? 'var(--emerald)' : closed ? 'var(--muted)' : '#fff',
            fontWeight:700, fontSize:'.85rem', transition:'all var(--t)',
          }}>
          {applied ? `✓ ${tr('offers','applied')}` : closed ? tr('offers','offerClosed') : tr('offers','apply')}
        </button>
      </div>
    </div>
  )
}

export default function CompanyDashboard({ tr, lang, user, onLogout }: Props) {
  const [tab, setTab]         = useState<Tab>('requests')
  const [needs, setNeeds]     = useState<Need[]>([])
  const [offers, setOffers]   = useState<Offer[]>([])
  const [apps, setApps]       = useState<Application[]>([])
  const [profile, setProfile] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)
  const [alert, setAlert]     = useState<{type:'success'|'error';msg:string}|null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [selectedNeed, setSelectedNeed] = useState<Need|null>(null)
  const [projects, setProjects]   = useState<Project[]>([])
  const [applyModal, setApplyModal] = useState<Offer|null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [applyLoading, setApplyLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileEdit, setProfileEdit] = useState<Record<string,string>>({})

  const appliedIds = new Set(apps.map(a => a.offerId))

  const loadNeeds = useCallback(() => {
    setLoading(true)
    needsApi.getMyNeeds().then(r => setNeeds(r.data.needs ?? [])).catch(() => setNeeds([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadNeeds() }, [loadNeeds])

  useEffect(() => {
    if (tab === 'offers' && offers.length === 0) {
      offersApi.getOpen().then(r => setOffers(r.data.offers ?? [])).catch(() => setOffers([]))
    }
    if (tab === 'applications' && apps.length === 0) {
      offersApi.getMyApplications().then(r => setApps(r.data.applications ?? [])).catch(() => setApps([]))
    }
    if (tab === 'profile' && !profile.companyName) {
      profileApi.get().then(r => { setProfile(r.data.profile); setProfileEdit(r.data.profile) }).catch(() => {})
    }
    if (tab === 'projects' && projects.length === 0) {
      projectsApi.getMy().then(r => setProjects(r.data.projects ?? [])).catch(() => setProjects([]))
    }
  }, [tab])

  const stats = {
    total: needs.length, pending: needs.filter(n=>n.status==='pending').length,
    approved: needs.filter(n=>n.status==='approved').length, completed: needs.filter(n=>n.status==='completed').length,
  }

  const handleSubmitNeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.serviceType || !form.description || !form.deadline) {
      setAlert({ type:'error', msg:tr('dashboard','requiredFields') }); return
    }
    setSubmitting(true)
    try {
      await needsApi.create({ ...form, title:sanitizeInput(form.title), description:sanitizeInput(form.description) })
      setAlert({ type:'success', msg:tr('dashboard','submitSuccess') })
      setModalOpen(false); setForm(EMPTY_FORM); loadNeeds()
    } catch { setAlert({ type:'error', msg:tr('dashboard','submitError') }) }
    finally { setSubmitting(false) }
  }

  const handleApply = async () => {
    if (!applyModal) return
    setApplyLoading(true)
    try {
      await offersApi.apply(applyModal.id, coverLetter)
      setAlert({ type:'success', msg:tr('offers','appSuccess') })
      setApps(prev => [...prev, { id:'', offerId:applyModal.id, offerTitle:applyModal.title, category:applyModal.category, coverLetter, status:'pending', appliedAt:new Date().toISOString() }])
      setApplyModal(null); setCoverLetter('')
    } catch { setAlert({ type:'error', msg:tr('offers','appError') }) }
    finally { setApplyLoading(false) }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await profileApi.update(profileEdit)
      setProfile({ ...profile, ...profileEdit })
      setAlert({ type:'success', msg:tr('profile','saved') })
    } catch { setAlert({ type:'error', msg:tr('profile','saveError') }) }
    finally { setSavingProfile(false) }
  }

  const TABS: {id:Tab; icon:React.ElementType; label:string}[] = [
    { id:'requests',     icon:FileText,  label:tr('dashboard','title') },
    { id:'projects',     icon:TrendingUp, label:tr('projects','myProjects') },
    { id:'offers',       icon:Briefcase, label:tr('offers','title') },
    { id:'applications', icon:Send,      label:tr('offers','myApps') },
    { id:'profile',      icon:User,      label:tr('profile','title') },
  ]

  const appStatusColor = (s:string) => s==='accepted' ? 'var(--emerald)' : s==='rejected' ? '#ef4444' : '#d97706'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <header style={{ background:'var(--navy)', borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,var(--emerald),var(--emerald-dk))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 14L9 4L15 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 10.5H12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'.93rem' }}>{user.companyName ?? 'Dashboard'}</div>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.45)' }}>{tr('dashboard','subtitle')}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.45)', display:'none' }} className="email-label">{user.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ color:'rgba(255,255,255,.7)' }} title={tr('common','logout')}><LogOut size={15}/></button>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <aside style={{ width:220, background:'var(--white)', borderRight:'1px solid var(--border)', padding:'20px 0', flexShrink:0 }}>
          {TABS.map(({ id, icon:Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 20px',
                textAlign:'start', fontWeight:600, fontSize:'.875rem', cursor:'pointer', border:'none',
                background: tab===id ? 'var(--emerald-lt)' : 'transparent',
                color: tab===id ? 'var(--emerald)' : 'var(--muted)',
                borderLeft: tab===id ? '3px solid var(--emerald)' : '3px solid transparent',
                transition:'all var(--t)',
              }}>
              <Icon size={15}/> {label}
              {id==='offers' && offers.length>0 && tab!=='offers' && (
                <span style={{ marginLeft:'auto', padding:'1px 7px', borderRadius:99, background:'var(--emerald)', color:'#fff', fontSize:'.68rem', fontWeight:700 }}>{offers.length}</span>
              )}
              {id==='applications' && appliedIds.size>0 && tab!=='applications' && (
                <span style={{ marginLeft:'auto', padding:'1px 7px', borderRadius:99, background:'var(--navy)', color:'#fff', fontSize:'.68rem', fontWeight:700 }}>{appliedIds.size}</span>
              )}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex:1, padding:'28px 32px', overflow:'auto', minWidth:0 }}>
          {alert && <div style={{ marginBottom:18 }}><Alert type={alert.type} message={alert.msg} onDismiss={() => setAlert(null)}/></div>}

          {/* ── MY REQUESTS ── */}
          {tab === 'requests' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('dashboard','title')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('dashboard','subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15}/> {tr('dashboard','newNeed')}</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:13, marginBottom:28 }}>
                {[
                  { k:'statsTotal', v:stats.total, icon:FileText, color:'var(--navy)' },
                  { k:'statsPending', v:stats.pending, icon:Clock, color:'#d97706' },
                  { k:'statsApproved', v:stats.approved, icon:CheckCircle, color:'var(--emerald)' },
                  { k:'statsDone', v:stats.completed, icon:TrendingUp, color:'#7c3aed' },
                ].map(({ k, v, icon:Icon, color }) => (
                  <div key={k} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'16px 18px', display:'flex', alignItems:'center', gap:12, border:'1px solid var(--border)', boxShadow:'var(--sh-xs)' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={17} style={{ color }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, fontFamily:'var(--font-head)', color:'var(--navy)', lineHeight:1 }}>{v}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--muted)', marginTop:3 }}>{tr('dashboard',k)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {loading ? (
                <div style={{ textAlign:'center', padding:60 }}><LoadingSpinner size="lg"/></div>
              ) : needs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <FileText size={48} style={{ color:'var(--border)', marginBottom:16 }}/>
                  <h3 style={{ marginBottom:8, color:'var(--navy)' }}>{tr('dashboard','noNeeds')}</h3>
                  <p style={{ color:'var(--muted)', marginBottom:20, fontSize:'.85rem' }}>{tr('dashboard','noNeedsSub')}</p>
                  <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={14}/> {tr('dashboard','firstNeed')}</button>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
                  {needs.map(n => <NeedCard key={n.id} need={n} lang={lang} onView={() => setSelectedNeed(n)}/>)}
                </div>
              )}
            </>
          )}

          {/* ── MY PROJECTS ── */}
          {tab === 'projects' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('projects','myProjects')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>Suivez l'avancement de vos projets en cours.</p>
              </div>
              {projects.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <TrendingUp size={48} style={{ color:'var(--border)', marginBottom:16 }}/>
                  <p style={{ color:'var(--muted)' }}>{tr('projects','noProjects')}</p>
                  <p style={{ color:'var(--muted)', fontSize:'.84rem', marginTop:8 }}>Les projets apparaissent lorsque l'admin approuve vos demandes.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {projects.map(proj => {
                    const statusColors: Record<string,string> = { active:'#10b981', paused:'#f59e0b', completed:'#6366f1', cancelled:'#ef4444' }
                    const sc = statusColors[proj.status] || 'var(--navy)'
                    return (
                      <div key={proj.id} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', overflow:'hidden' }}>
                        <div style={{ height:4, background:sc }}/>
                        <div style={{ padding:'20px 24px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                            <div>
                              <span style={{ padding:'3px 10px', borderRadius:99, background:sc+'18', color:sc, fontSize:'.72rem', fontWeight:700, marginBottom:8, display:'inline-block' }}>{tr('projects',proj.status)}</span>
                              <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--navy)', marginBottom:4 }}>{proj.title}</h3>
                              {proj.description && <p style={{ fontSize:'.84rem', color:'var(--text-2)', lineHeight:1.6 }}>{proj.description.slice(0,180)}{proj.description.length>180?'…':''}</p>}
                            </div>
                            <div style={{ textAlign:'right', fontSize:'.76rem', color:'var(--muted)', flexShrink:0, marginLeft:16 }}>
                              {proj.startDate && <div>Début : {new Date(proj.startDate).toLocaleDateString('fr-DZ')}</div>}
                              {proj.endDate && <div>Fin : {new Date(proj.endDate).toLocaleDateString('fr-DZ')}</div>}
                              {proj.budgetApproved && <div>💰 {Number(proj.budgetApproved).toLocaleString()} DZD</div>}
                            </div>
                          </div>
                          <div>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.76rem', color:'var(--muted)', marginBottom:5 }}>
                              <span>{tr('projects','progress')}</span>
                              <span style={{ fontWeight:700, color:sc }}>{proj.progressPct}%</span>
                            </div>
                            <div style={{ height:7, background:'var(--bg)', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${proj.progressPct}%`, background:sc, borderRadius:99, transition:'width .5s' }}/>
                            </div>
                          </div>
                          {proj.adminNotes && (
                            <div style={{ marginTop:12, padding:'9px 13px', background:'#fef3c7', borderRadius:'var(--r-md)', border:'1px solid #fde68a', fontSize:'.79rem', color:'#92400e' }}>
                              <strong>Note :</strong> {proj.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ── PROJECT OFFERS ── */}
          {tab === 'offers' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('offers','title')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('offers','subtitle')}</p>
              </div>
              {offers.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <Briefcase size={48} style={{ color:'var(--border)', marginBottom:16 }}/>
                  <p style={{ color:'var(--muted)' }}>{tr('offers','noOffers')}</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:18 }}>
                  {offers.map(o => <OfferCard key={o.id} offer={o} appliedIds={appliedIds} onApply={setApplyModal} tr={tr}/>)}
                </div>
              )}
            </>
          )}

          {/* ── MY APPLICATIONS ── */}
          {tab === 'applications' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('offers','myApps')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('offers','subtitle')}</p>
              </div>
              {apps.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <Send size={48} style={{ color:'var(--border)', marginBottom:16 }}/>
                  <p style={{ color:'var(--muted)', marginBottom:16 }}>{tr('offers','noApps')}</p>
                  <button className="btn btn-primary" onClick={() => setTab('offers')}>{tr('offers','title')} <ChevronRight size={14}/></button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {apps.map(a => (
                    <div key={a.id || a.offerId} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'18px 22px', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', display:'flex', alignItems:'center', gap:18 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'var(--navy)', marginBottom:5 }}>{a.offerTitle}</div>
                        <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>{a.category} · {new Date(a.appliedAt).toLocaleDateString('fr-DZ')}</div>
                      </div>
                      <span style={{
                        padding:'5px 14px', borderRadius:99, fontWeight:700, fontSize:'.78rem',
                        background: appStatusColor(a.status)+'18', color: appStatusColor(a.status),
                      }}>
                        {tr('offers', a.status==='accepted'?'appAccepted':a.status==='rejected'?'appRejected':'appPending')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('profile','title')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('profile','subtitle')}</p>
              </div>
              {!profile.companyName ? (
                <div style={{ textAlign:'center', padding:60 }}><LoadingSpinner size="lg"/></div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ maxWidth:640 }}>
                  <div style={{ background:'var(--white)', borderRadius:'var(--r-2xl)', border:'1px solid var(--border)', padding:'28px 32px', boxShadow:'var(--sh-sm)', marginBottom:20 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      {[
                        { key:'companyName', label:tr('profile','companyName') },
                        { key:'sector',      label:tr('profile','sector') },
                        { key:'contactName', label:tr('profile','contactName') },
                        { key:'phone',       label:tr('profile','phone') },
                        { key:'website',     label:tr('profile','website') },
                        { key:'employees',   label:tr('profile','employees'), type:'number' },
                      ].map(({ key, label, type }) => (
                        <div key={key} className="form-group">
                          <label className="form-label">{label}</label>
                          <input className="form-input" type={type ?? 'text'} value={profileEdit[key] ?? ''}
                            onChange={e => setProfileEdit(p => ({ ...p, [key]:e.target.value }))}/>
                        </div>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginTop:14 }}>
                      <label className="form-label">{tr('profile','address')}</label>
                      <input className="form-input" value={profileEdit.address ?? ''} onChange={e => setProfileEdit(p => ({ ...p, address:e.target.value }))}/>
                    </div>
                    <div className="form-group" style={{ marginTop:14 }}>
                      <label className="form-label">{tr('profile','about')}</label>
                      <textarea className="form-input" rows={4} value={profileEdit.about ?? ''} onChange={e => setProfileEdit(p => ({ ...p, about:e.target.value }))} style={{ resize:'vertical' }}/>
                    </div>
                    <div className="form-group" style={{ marginTop:14 }}>
                      <label className="form-label">{tr('profile','email')}</label>
                      <input className="form-input" value={profile.email ?? ''} disabled style={{ opacity:.6, cursor:'not-allowed' }}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                      {savingProfile ? <LoadingSpinner size="sm"/> : tr('profile','save')}
                    </button>
                    <div style={{ fontSize:'.78rem', color:'var(--muted)', padding:'10px 0' }}>
                      {tr('profile','memberSince')}: {new Date(profile.memberSince ?? '').toLocaleDateString('fr-DZ')}
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* New Request */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM) }}
        title={tr('dashboard','newNeed')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => { setModalOpen(false); setForm(EMPTY_FORM) }}>{tr('common','cancel')}</button>
          <button form="need-form" type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm"/> : tr('dashboard','submit')}
          </button>
        </>}>
        <form id="need-form" onSubmit={handleSubmitNeed} noValidate>
          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">{tr('dashboard','needTitle')} *</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title:e.target.value })} placeholder={tr('dashboard','needTitlePh')}/>
          </div>
          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">{tr('dashboard','serviceType')} *</label>
            <select className="form-input" required value={form.serviceType} onChange={e => setForm({ ...form, serviceType:e.target.value })}>
              <option value="">{tr('auth','chooseSector')}</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">{tr('dashboard','description')} *</label>
            <textarea className="form-input" rows={4} required value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder={tr('dashboard','descPh')} style={{ resize:'vertical' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{tr('dashboard','deadline')} *</label>
              <input className="form-input" type="date" required value={form.deadline} onChange={e => setForm({ ...form, deadline:e.target.value })} min={new Date().toISOString().slice(0,10)}/>
            </div>
            <div className="form-group">
              <label className="form-label">{tr('dashboard','budget')}</label>
              <input className="form-input" type="number" min="0" placeholder="500000" value={form.budget} onChange={e => setForm({ ...form, budget:e.target.value })}/>
            </div>
          </div>
        </form>
      </Modal>

      {/* Need Detail */}
      <Modal open={!!selectedNeed} onClose={() => setSelectedNeed(null)} title={selectedNeed?.title ?? ''} maxWidth={580}
        footer={<button className="btn btn-ghost" onClick={() => setSelectedNeed(null)}>{tr('common','close')}</button>}>
        {selectedNeed && (
          <div>
            <p style={{ color:'var(--text)', lineHeight:1.7, marginBottom:18 }}>{selectedNeed.description}</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:tr('dashboard','deadline'), value:new Date(selectedNeed.deadline).toLocaleDateString('fr-DZ') },
                { label:tr('dashboard','budget'), value:selectedNeed.budget ? `${Number(selectedNeed.budget).toLocaleString()} DZD` : 'N/A' },
                { label:tr('common','submittedOn'), value:new Date(selectedNeed.createdAt).toLocaleDateString('fr-DZ') },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:'var(--bg)', borderRadius:'var(--r-lg)', padding:'11px 14px' }}>
                  <div style={{ fontSize:'.7rem', color:'var(--muted)', marginBottom:3 }}>{label}</div>
                  <div style={{ fontWeight:600, color:'var(--navy)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Apply to Offer */}
      <Modal open={!!applyModal} onClose={() => { setApplyModal(null); setCoverLetter('') }}
        title={tr('offers','applyTitle')} maxWidth={520}
        footer={<>
          <button className="btn btn-ghost" onClick={() => { setApplyModal(null); setCoverLetter('') }}>{tr('common','cancel')}</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={applyLoading}>
            {applyLoading ? <LoadingSpinner size="sm"/> : tr('offers','submitApp')}
          </button>
        </>}>
        {applyModal && (
          <div>
            <div style={{ padding:'12px 16px', background:'var(--bg)', borderRadius:'var(--r-lg)', marginBottom:18, border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, color:'var(--navy)', fontSize:'.95rem' }}>{applyModal.title}</div>
              <div style={{ fontSize:'.78rem', color:'var(--muted)', marginTop:3 }}>{applyModal.category}</div>
            </div>
            <div className="form-group">
              <label className="form-label">{tr('offers','coverLetter')}</label>
              <textarea className="form-input" rows={6} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder={tr('offers','coverPh')} style={{ resize:'vertical' }}/>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
