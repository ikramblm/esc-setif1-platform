import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, FileText, Package, Plus, LogOut, Users, CheckCircle, Clock, AlertCircle, Briefcase, FlaskConical, Building2, Pencil, Trash2, ToggleLeft, ToggleRight, MessageSquare, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import ServiceCard from '../components/ServiceCard'
import Alert from '../components/Alert'
import LoadingSpinner from '../components/LoadingSpinner'
import { needsApi, servicesApi, offersApi, researchersApi, profileApi, projectsApi, messagesApi } from '../lib/api'
import { sanitizeInput, formatDate, truncate } from '../lib/security'
import type { Lang } from '../lib/i18n'
import type { AuthUser } from '../lib/auth'

interface Props { tr: (s:string,k:string)=>string; lang:Lang; user:AuthUser; onLogout:()=>void }

type Tab = 'requests'|'services'|'offers'|'researchers'|'companies'|'projects'|'messages'
interface Contact { id:string; name:string; role:string; email:string; detail?:string }
interface Msg { id:string; sender_id:string; receiver_id:string; body:string; created_at:string; is_read:boolean; sender_name?:string }
type Status = 'pending'|'reviewing'|'approved'|'rejected'|'completed'
interface Need { id:string; title:string; serviceType:string; description:string; deadline:string; budget:string; status:Status; createdAt:string; company?:{name:string;sector:string} }
interface Service { id:string; category:string; title:string; description:string; department?:string; price?:number|null; isFree?:boolean; publishedAt:string }
interface Offer { id:string; title:string; description:string; category:string; deadline:string; budget:string; slots:number; tags:string[]; status:string; applicantsCount:number; createdAt:string }
interface Application { id:string; offerId:string; offerTitle:string; companyId:string; companyName:string; companySector:string; coverLetter:string; status:string; appliedAt:string }
interface Researcher { id:string; fullName:string; specialty:string; department:string; grade:string; email:string; phone:string; bio:string; expertise:string[]; isActive:boolean }
interface Company { id:string; companyName:string; sector:string; contactName:string; email:string; isActive:boolean; createdAt:string; employees:number; about:string }
interface ResearcherAccount { id:string; fullName:string; specialty:string; department:string; grade:string; email:string; phone:string; isActive:boolean; createdAt:string }
interface Project { id:string; title:string; description:string; status:string; progressPct:number; companyName:string; sector:string; startDate:string; endDate:string; budgetApproved:number; adminNotes:string; createdAt:string; needId:string }

const STATUSES: Status[] = ['pending','reviewing','approved','rejected','completed']
const CATS = ['Consulting','Formation','Études','Recherche']
const APP_STATUSES = ['pending','accepted','rejected']

const OFFER_STATUS_COLOR: Record<string,string> = { open:'var(--emerald)', closed:'#d97706', archived:'var(--muted)' }
export default function AdminPanel({ tr, lang, user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('requests')
  const [needs, setNeeds] = useState<Need[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [researcherAccounts, setResearcherAccounts] = useState<ResearcherAccount[]>([])
  const [loadingN, setLoadingN] = useState(true)
  const [loadingS, setLoadingS] = useState(true)
  const [loadingO, setLoadingO] = useState(false)
  const [loadingR, setLoadingR] = useState(false)
  const [loadingRA, setLoadingRA] = useState(false)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingP, setLoadingP] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectModal, setProjectModal] = useState<Need|null>(null)
  const [projectForm, setProjectForm] = useState({ title:'', description:'', budgetApproved:'', startDate:'', endDate:'' })
  const [assignModal, setAssignModal] = useState<Project|null>(null)
  const [submittingProject, setSubmittingProject] = useState(false)
  const [alert, setAlert] = useState<{type:'success'|'error';msg:string}|null>(null)
  const [filterStatus, setFilterStatus] = useState<Status|'all'>('all')
  const [selectedNeed, setSelectedNeed] = useState<Need|null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer|null>(null)
  const [collapsed, setCollapsed] = useState(false)

  // Messages
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [allMsgs, setAllMsgs] = useState<Msg[]>([])
  const [activeContact, setActiveContact] = useState<Contact|null>(null)
  const [msgBody, setMsgBody] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [contactFilter, setContactFilter] = useState<'all'|'company'|'researcher'>('all')

  // Service modal
  const [svcModal, setSvcModal] = useState(false)
  const [svcForm, setSvcForm] = useState({ category:'', title:'', description:'', department:'', price:'', isFree:false })
  const [submittingSvc, setSubmittingSvc] = useState(false)

  // Offer modal
  const [offerModal, setOfferModal] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer|null>(null)
  const [offerForm, setOfferForm] = useState({ title:'', description:'', category:'', deadline:'', budget:'', slots:'1', tags:'' })
  const [submittingOffer, setSubmittingOffer] = useState(false)

  // Researcher modal
  const [resModal, setResModal] = useState(false)
  const [editRes, setEditRes] = useState<Researcher|null>(null)
  const [resForm, setResForm] = useState({ fullName:'', specialty:'', department:'', grade:'', email:'', phone:'', bio:'', expertise:'' })
  const [submittingRes, setSubmittingRes] = useState(false)

  // Applications panel (per offer)
  const [appsModal, setAppsModal] = useState(false)
  const [offerApps, setOfferApps] = useState<Application[]>([])

  const loadNeeds = useCallback(() => {
    setLoadingN(true)
    needsApi.getAllNeeds().then(r => setNeeds(r.data.needs??[])).catch(()=>setNeeds([])).finally(()=>setLoadingN(false))
  }, [])
  const loadServices = useCallback(() => {
    setLoadingS(true)
    servicesApi.getAll().then(r => setServices(r.data.services??[])).catch(()=>setServices([])).finally(()=>setLoadingS(false))
  }, [])

  useEffect(() => { loadNeeds(); loadServices() }, [loadNeeds, loadServices])

  useEffect(() => {
    if (tab==='offers' && offers.length===0) {
      setLoadingO(true); offersApi.getAll().then(r=>setOffers(r.data.offers??[])).catch(()=>setOffers([])).finally(()=>setLoadingO(false))
      offersApi.getAllApplications().then(r=>setApplications(r.data.applications??[])).catch(()=>{})
    }
    if (tab==='researchers' && researchers.length===0) {
      setLoadingR(true); researchersApi.getAllAdmin().then(r=>setResearchers(r.data.researchers??[])).catch(()=>setResearchers([])).finally(()=>setLoadingR(false))
    }
    if (tab==='researchers' && researcherAccounts.length===0) {
      setLoadingRA(true); profileApi.getResearcherAccounts().then(r=>setResearcherAccounts(r.data.researcherAccounts??[])).catch(()=>setResearcherAccounts([])).finally(()=>setLoadingRA(false))
    }
    if (tab==='companies' && companies.length===0) {
      setLoadingC(true); profileApi.getCompanies().then(r=>setCompanies(r.data.companies??[])).catch(()=>setCompanies([])).finally(()=>setLoadingC(false))
    }
    if (tab==='projects' && projects.length===0) {
      setLoadingP(true); projectsApi.getAll().then(r=>setProjects(r.data.projects??[])).catch(()=>setProjects([])).finally(()=>setLoadingP(false))
    }
    if (tab==='messages') {
      if (contacts.length===0) {
        setLoadingContacts(true)
        profileApi.getContacts().then(r=>setContacts(r.data.contacts??[])).catch(()=>setContacts([])).finally(()=>setLoadingContacts(false))
      }
      messagesApi.getMy().then(r=>setAllMsgs(r.data.messages??[])).catch(()=>{})
    }
  }, [tab])

  const conversation = activeContact
    ? allMsgs.filter(m => m.sender_id===activeContact.id || m.receiver_id===activeContact.id)
        .sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime())
    : []

  const sendAdminMessage = async () => {
    if (!activeContact || !msgBody.trim()) return
    setSendingMsg(true)
    try {
      const { data } = await messagesApi.send({ receiverId: activeContact.id, body: msgBody.trim() })
      setAllMsgs(prev => [...prev, data.message])
      setMsgBody('')
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
    finally { setSendingMsg(false) }
  }

  const filteredContacts = contacts.filter(c => contactFilter==='all' || c.role===contactFilter)

  // ── Needs ─────────────────────────────────────────────
  const updateStatus = async (id: string, status: Status) => {
    try {
      await needsApi.updateStatus(id, status)
      setNeeds(prev => prev.map(n => n.id===id ? {...n,status} : n))
      setSelectedNeed(prev => prev ? {...prev,status} : null)
      setAlert({ type:'success', msg:tr('admin','statusUpdated') })
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }

  // ── Services ──────────────────────────────────────────
  const deleteService = async (id: string) => {
    if (!confirm(tr('admin','confirmDelete'))) return
    try { await servicesApi.remove(id); setServices(prev=>prev.filter(s=>s.id!==id)); setAlert({ type:'success', msg:tr('admin','serviceDeleted') }) }
    catch { setAlert({ type:'error', msg:tr('admin','deleteError') }) }
  }
  const publishService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!svcForm.category||!svcForm.title||!svcForm.description) { setAlert({ type:'error', msg:tr('admin','allRequired') }); return }
    setSubmittingSvc(true)
    try {
      await servicesApi.publish({
        ...svcForm,
        title:sanitizeInput(svcForm.title),
        description:sanitizeInput(svcForm.description),
        price: svcForm.price ? Number(svcForm.price) : undefined,
      })
      setAlert({ type:'success', msg:tr('admin','publishSuccess') }); setSvcModal(false); setSvcForm({ category:'', title:'', description:'', department:'', price:'', isFree:false }); loadServices()
    } catch { setAlert({ type:'error', msg:tr('admin','publishError') }) }
    finally { setSubmittingSvc(false) }
  }

  // ── Offers ────────────────────────────────────────────
  const openOfferModal = (o?: Offer) => {
    if (o) { setEditOffer(o); setOfferForm({ title:o.title, description:o.description, category:o.category, deadline:o.deadline?.slice(0,10)??'', budget:String(o.budget??''), slots:String(o.slots), tags:o.tags.join(', ') }) }
    else { setEditOffer(null); setOfferForm({ title:'', description:'', category:'', deadline:'', budget:'', slots:'1', tags:'' }) }
    setOfferModal(true)
  }
  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerForm.title||!offerForm.description||!offerForm.category) { setAlert({ type:'error', msg:tr('admin','allRequired') }); return }
    setSubmittingOffer(true)
    const payload = { ...offerForm, tags: offerForm.tags.split(',').map(s=>s.trim()).filter(Boolean), budget:parseFloat(offerForm.budget)||undefined, slots:parseInt(offerForm.slots)||1 }
    try {
      if (editOffer) { await offersApi.update(editOffer.id, payload); setAlert({ type:'success', msg:tr('admin','statusUpdated') }) }
      else { await offersApi.create(payload as any); setAlert({ type:'success', msg:tr('admin','publishSuccess') }) }
      setOfferModal(false)
      offersApi.getAll().then(r=>setOffers(r.data.offers??[])).catch(()=>{})
    } catch { setAlert({ type:'error', msg:tr('admin','publishError') }) }
    finally { setSubmittingOffer(false) }
  }
  const deleteOffer = async (id: string) => {
    if (!confirm(tr('admin','confirmDelete'))) return
    try { await offersApi.remove(id); setOffers(prev=>prev.filter(o=>o.id!==id)); setAlert({ type:'success', msg:tr('admin','serviceDeleted') }) }
    catch { setAlert({ type:'error', msg:tr('admin','deleteError') }) }
  }
  const changeOfferStatus = async (id: string, status: string) => {
    try { await offersApi.update(id, { status } as any); setOffers(prev=>prev.map(o=>o.id===id?{...o,status}:o)) }
    catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }
  const openApps = async (o: Offer) => {
    setSelectedOffer(o); setAppsModal(true)
    const r = await offersApi.getOfferApplications(o.id).catch(()=>null)
    setOfferApps(r?.data.applications ?? [])
  }
  const updateAppStatus = async (id: string, status: string) => {
    try {
      await offersApi.updateAppStatus(id, status)
      setOfferApps(prev => prev.map(a=>a.id===id?{...a,status}:a))
      setApplications(prev => prev.map(a=>a.id===id?{...a,status}:a))
      setAlert({ type:'success', msg:tr('admin','statusUpdated') })
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }

  // ── Researchers ───────────────────────────────────────
  const openResModal = (r?: Researcher) => {
    if (r) { setEditRes(r); setResForm({ fullName:r.fullName, specialty:r.specialty, department:r.department, grade:r.grade, email:r.email, phone:r.phone, bio:r.bio, expertise:r.expertise.join(', ') }) }
    else { setEditRes(null); setResForm({ fullName:'', specialty:'', department:'', grade:'', email:'', phone:'', bio:'', expertise:'' }) }
    setResModal(true)
  }
  const submitRes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resForm.fullName||!resForm.specialty||!resForm.email) { setAlert({ type:'error', msg:tr('admin','allRequired') }); return }
    setSubmittingRes(true)
    const payload = { ...resForm, expertise: resForm.expertise.split(',').map(s=>s.trim()).filter(Boolean) }
    try {
      if (editRes) { await researchersApi.update(editRes.id, payload); setAlert({ type:'success', msg:tr('researchers','updateSuccess') }) }
      else { await researchersApi.create(payload as any); setAlert({ type:'success', msg:tr('researchers','addSuccess') }) }
      setResModal(false)
      researchersApi.getAllAdmin().then(r=>setResearchers(r.data.researchers??[])).catch(()=>{})
    } catch { setAlert({ type:'error', msg:tr('admin','publishError') }) }
    finally { setSubmittingRes(false) }
  }
  const deleteRes = async (id: string) => {
    if (!confirm(tr('researchers','confirmDelete'))) return
    try { await researchersApi.remove(id); setResearchers(prev=>prev.filter(r=>r.id!==id)); setAlert({ type:'success', msg:tr('researchers','deleteSuccess') }) }
    catch { setAlert({ type:'error', msg:tr('admin','deleteError') }) }
  }
  const toggleResearcher = async (id: string, isActive: boolean) => {
    try {
      await researchersApi.update(id, { isActive: !isActive } as any)
      setResearchers(prev => prev.map(r => r.id===id ? {...r, isActive: !isActive} : r))
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }

  // ── Companies ─────────────────────────────────────────
  const toggleCompany = async (id: string) => {
    try {
      const r = await profileApi.toggleCompany(id)
      setCompanies(prev => prev.map(c=>c.id===id?{...c,isActive:r.data.isActive}:c))
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }

  const toggleResearcherAccount = async (id: string) => {
    try {
      const r = await profileApi.toggleResearcherAccount(id)
      setResearcherAccounts(prev => prev.map(c=>c.id===id?{...c,isActive:r.data.isActive}:c))
    } catch { setAlert({ type:'error', msg:tr('admin','statusError') }) }
  }

  const filtered = filterStatus==='all' ? needs : needs.filter(n=>n.status===filterStatus)
  const stats = { total:needs.length, pending:needs.filter(n=>n.status==='pending').length, reviewing:needs.filter(n=>n.status==='reviewing').length, approved:needs.filter(n=>n.status==='approved').length }

  const createProject = async () => {
    if (!projectModal || !projectForm.title) return
    setSubmittingProject(true)
    try {
      await projectsApi.create({
        needId: projectModal.id,
        companyId: (projectModal.company as unknown as {id:string})?.id || '',
        title: projectForm.title || projectModal.title,
        description: projectForm.description,
        budgetApproved: projectForm.budgetApproved ? parseFloat(projectForm.budgetApproved) : undefined,
        startDate: projectForm.startDate || undefined,
        endDate: projectForm.endDate || undefined,
      })
      setAlert({ type:'success', msg:'Projet créé avec succès !' })
      setProjectModal(null)
      setProjectForm({ title:'', description:'', budgetApproved:'', startDate:'', endDate:'' })
      setLoadingP(true)
      projectsApi.getAll().then(r=>setProjects(r.data.projects??[])).catch(()=>{}).finally(()=>setLoadingP(false))
    } catch { setAlert({ type:'error', msg:'Erreur lors de la création du projet.' }) }
    finally { setSubmittingProject(false) }
  }

  const updateProjectStatus = async (id: string, status: string) => {
    try {
      await projectsApi.update(id, { status })
      setProjects(prev => prev.map(p => p.id===id ? {...p, status} : p))
      setAlert({ type:'success', msg:'Statut mis à jour.' })
    } catch { setAlert({ type:'error', msg:'Erreur.' }) }
  }

  const unreadMsgs = allMsgs.filter(m => !m.is_read && m.receiver_id===user.id).length

  const SIDEBAR = [
    { id:'requests',    icon:FileText,    labelKey:'tabRequests',  badge:stats.pending },
    { id:'projects',    icon:LayoutDashboard, labelKey:'tabProjects', badge:projects.filter(p=>p.status==='active').length },
    { id:'services',    icon:Package,     labelKey:'tabServices',  badge:0 },
    { id:'offers',      icon:Briefcase,   labelKey:'tabOffers',    badge:offers.filter(o=>o.status==='open').length },
    { id:'researchers', icon:FlaskConical,labelKey:'tabResearchers',badge:0 },
    { id:'companies',   icon:Building2,   labelKey:'tabCompanies', badge:0 },
    { id:'messages',    icon:MessageSquare, labelKey:'tabMessages', badge:unreadMsgs },
  ]

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <header style={{ background:'var(--navy)', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <img src="/logo-64.png" alt="UFAS1" width={32} height={32} style={{ borderRadius:'50%' }}/>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:'.93rem' }}>ESC Sétif 1</div>
              <div style={{ fontSize:'.68rem', color:'rgba(255,255,255,.4)' }}>{tr('admin','panelLabel')}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:'.75rem', color:'rgba(255,255,255,.4)' }}>{user.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ color:'rgba(255,255,255,.7)' }} title={tr('common','logout')}><LogOut size={15}/></button>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{
          width: collapsed ? 72 : 240, flexShrink: 0,
          background: 'var(--white)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', transition: 'width .2s',
          position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflow: 'hidden',
        }}>
          {/* User chip */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 'var(--r-lg)', background: 'var(--bg)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,var(--navy),#1e3a6e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.85rem',
              }}>
                {user.companyName?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </p>
                  <p style={{ fontSize: '.72rem', color: 'var(--emerald)', fontWeight: 600 }}>{tr('admin','panelLabel')}</p>
                </div>
              )}
            </div>
          </div>

          <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
            {SIDEBAR.map(({ id, icon:Icon, labelKey, badge }) => (
              <button key={id} onClick={() => setTab(id as Tab)} title={tr('admin',labelKey)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 12px', borderRadius: 'var(--r-lg)', border: 'none', cursor: 'pointer',
                  background: tab===id ? 'var(--emerald-lt)' : 'transparent',
                  color: tab===id ? 'var(--emerald-dk)' : 'var(--text-2)',
                  fontWeight: tab===id ? 700 : 500, fontSize: '.85rem',
                  transition: 'all .15s', position: 'relative',
                }}>
                <Icon size={17}/>
                {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{tr('admin',labelKey)}</span>}
                {badge > 0 && (
                  <span style={{
                    marginLeft: collapsed ? 0 : 'auto', position: collapsed ? 'absolute' : 'static',
                    top: collapsed ? 2 : undefined, right: collapsed ? 2 : undefined,
                    background: '#ef4444', color: '#fff', borderRadius: 99,
                    fontSize: '.62rem', fontWeight: 800, padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  }}>{badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={onLogout} title={tr('common','logout')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '10px 12px', borderRadius: 'var(--r-lg)', border: 'none', cursor: 'pointer',
                background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: '.85rem',
              }}>
              <LogOut size={17}/> {!collapsed && tr('common','logout')}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
                padding: '8px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', cursor: 'pointer',
                background: 'var(--bg)', color: 'var(--muted)',
              }}>
              {collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
            </button>
          </div>
        </aside>

        <main style={{ flex:1, padding:32, overflow:'auto', minWidth:0 }}>
          {alert && <div style={{ marginBottom:20 }}><Alert type={alert.type} message={alert.msg} onDismiss={()=>setAlert(null)}/></div>}

          {/* ══ REQUESTS ══ */}
          {tab==='requests' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('admin','allRequests')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('admin','requestsSub')}</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:13, marginBottom:22 }}>
                {[
                  { k:'statsTotal', v:stats.total, icon:LayoutDashboard, color:'var(--navy)' },
                  { k:'statsPending', v:stats.pending, icon:Clock, color:'#d97706' },
                  { k:'statsReview', v:stats.reviewing, icon:Users, color:'#3b82f6' },
                  { k:'statsApproved', v:stats.approved, icon:CheckCircle, color:'var(--emerald)' },
                ].map(({ k, v, icon:Icon, color }) => (
                  <div key={k} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', padding:'15px 17px', display:'flex', alignItems:'center', gap:12, border:'1px solid var(--border)', boxShadow:'var(--sh-xs)' }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={16} style={{ color }}/></div>
                    <div>
                      <div style={{ fontSize:'1.35rem', fontWeight:800, fontFamily:'var(--font-head)', color:'var(--navy)', lineHeight:1 }}>{v}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--muted)', marginTop:3 }}>{tr('admin',k)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:7, marginBottom:18, flexWrap:'wrap' }}>
                {(['all',...STATUSES] as const).map(s => (
                  <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:'4px 13px', borderRadius:99, fontSize:'.78rem', fontWeight:600, cursor:'pointer', border:'none', background:filterStatus===s?'var(--emerald)':'var(--bg)', color:filterStatus===s?'#fff':'var(--muted)', transition:'all var(--t)' }}>
                    {s==='all' ? tr('common','all') : tr('status',s)}
                  </button>
                ))}
              </div>
              {loadingN ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : (
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden' }}>
                  <table className="table" style={{ width:'100%' }}>
                    <thead><tr><th>{tr('admin','colTitle')}</th><th>{tr('admin','colCompany')}</th><th>{tr('admin','colType')}</th><th>{tr('admin','colDate')}</th><th>{tr('admin','colStatus')}</th><th>{tr('admin','colAction')}</th></tr></thead>
                    <tbody>
                      {filtered.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>{tr('admin','noRequests')}</td></tr>}
                      {filtered.map(n => (
                        <tr key={n.id}>
                          <td style={{ fontWeight:600, maxWidth:200 }}>
                            <button onClick={()=>setSelectedNeed(n)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--navy)', fontWeight:600, textAlign:'start', fontSize:'.875rem' }}>{truncate(n.title,45)}</button>
                          </td>
                          <td><span style={{ fontSize:'.8rem' }}>{n.company?.name??'—'}</span></td>
                          <td><span style={{ padding:'2px 9px', borderRadius:99, background:'var(--navy)', color:'#fff', fontSize:'.72rem', fontWeight:600 }}>{n.serviceType}</span></td>
                          <td style={{ fontSize:'.78rem', color:'var(--muted)' }}>{formatDate(n.createdAt,lang)}</td>
                          <td><StatusBadge status={n.status} lang={lang}/></td>
                          <td>
                            <select className="form-input" style={{ padding:'4px 8px', fontSize:'.78rem', width:'auto' }} value={n.status} onChange={e=>updateStatus(n.id,e.target.value as Status)}>
                              {STATUSES.map(s=><option key={s} value={s}>{tr('status',s)}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ══ SERVICES ══ */}
          {tab==='services' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('admin','manageServices')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('admin','servicesSub')}</p>
                </div>
                <button className="btn btn-primary" onClick={()=>setSvcModal(true)}><Plus size={15}/> {tr('admin','publishService')}</button>
              </div>
              {loadingS ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : services.length===0 ? (
                <div style={{ textAlign:'center', padding:60, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <AlertCircle size={40} style={{ color:'var(--border)', marginBottom:12 }}/><p style={{ color:'var(--muted)' }}>{tr('admin','noServices')}</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                  {services.map(s=><ServiceCard key={s.id} service={s} lang={lang} isAdmin onDelete={deleteService}/>)}
                </div>
              )}
            </>
          )}

          {/* ══ OFFERS ══ */}
          {tab==='offers' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('offers','title')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('offers','subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={()=>openOfferModal()}><Plus size={15}/> {tr('offers','createOffer')}</button>
              </div>
              {/* Applications summary */}
              {applications.length>0 && (
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
                  <Users size={18} style={{ color:'var(--navy)', flexShrink:0 }}/>
                  <div style={{ fontSize:'.875rem', color:'var(--text)' }}>
                    <strong>{applications.length}</strong> {tr('offers','allApps')} — {applications.filter(a=>a.status==='pending').length} {tr('offers','appPending').toLowerCase()}
                  </div>
                </div>
              )}
              {loadingO ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : offers.length===0 ? (
                <div style={{ textAlign:'center', padding:60, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <Briefcase size={40} style={{ color:'var(--border)', marginBottom:12 }}/><p style={{ color:'var(--muted)' }}>{tr('offers','noOffers')}</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {offers.map(o => (
                    <div key={o.id} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', padding:'18px 22px', display:'flex', alignItems:'center', gap:18 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                          <span style={{ fontWeight:700, color:'var(--navy)', fontSize:'1rem' }}>{o.title}</span>
                          <span style={{ padding:'2px 9px', borderRadius:99, background:OFFER_STATUS_COLOR[o.status]+'18', color:OFFER_STATUS_COLOR[o.status], fontSize:'.7rem', fontWeight:700 }}>{tr('offers',o.status as any)}</span>
                        </div>
                        <div style={{ fontSize:'.8rem', color:'var(--muted)', display:'flex', gap:14 }}>
                          <span>{o.category}</span>
                          {o.deadline && <span>⏰ {new Date(o.deadline).toLocaleDateString('fr-DZ')}</span>}
                          <span>👥 {o.applicantsCount} candidatures</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                        <select style={{ padding:'5px 8px', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', fontSize:'.78rem', background:'var(--bg)', cursor:'pointer' }}
                          value={o.status} onChange={e=>changeOfferStatus(o.id,e.target.value)}>
                          <option value="open">{tr('offers','open')}</option>
                          <option value="closed">{tr('offers','closed')}</option>
                          <option value="archived">{tr('offers','archived')}</option>
                        </select>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openApps(o)} title="Voir candidatures"><Users size={15}/></button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openOfferModal(o)} title="Modifier"><Pencil size={14}/></button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>deleteOffer(o.id)} style={{ color:'#ef4444' }} title="Supprimer"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ RESEARCHERS ══ */}
          {tab==='researchers' && (
            <>
              <div style={{ marginBottom:22 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('researchers','accountsTitle')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{researcherAccounts.length} {tr('researchers','accountsSubtitle')}</p>
              </div>
              {loadingRA ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : researcherAccounts.length===0 ? (
                <div style={{ textAlign:'center', padding:40, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)', marginBottom:32 }}>
                  <FlaskConical size={32} style={{ color:'var(--border)', marginBottom:10 }}/><p style={{ color:'var(--muted)' }}>{tr('researchers','noAccounts')}</p>
                </div>
              ) : (
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden', marginBottom:32 }}>
                  <table className="table" style={{ width:'100%' }}>
                    <thead><tr><th>{tr('researchers','fullName')}</th><th>{tr('researchers','specialty')}</th><th>Email</th><th>{tr('companies','joined')}</th><th>Statut</th><th>Action</th></tr></thead>
                    <tbody>
                      {researcherAccounts.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight:600, color:'var(--navy)' }}>{c.fullName}</td>
                          <td style={{ fontSize:'.8rem', color:'var(--muted)' }}>{c.specialty}{c.grade ? ` · ${c.grade}` : ''}</td>
                          <td style={{ fontSize:'.78rem', color:'var(--muted)' }}>{c.email}</td>
                          <td style={{ fontSize:'.78rem', color:'var(--muted)' }}>{formatDate(c.createdAt,lang)}</td>
                          <td>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.75rem', fontWeight:600, background:c.isActive?'var(--emerald-lt)':'#fee2e2', color:c.isActive?'var(--emerald)':'#ef4444' }}>
                              {c.isActive ? tr('researchers','active') : tr('researchers','inactive')}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={()=>toggleResearcherAccount(c.id)} title={tr('companies','toggleActive')}>
                              {c.isActive ? <ToggleRight size={18} style={{ color:'var(--emerald)' }}/> : <ToggleLeft size={18} style={{ color:'var(--muted)' }}/>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('researchers','title')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('researchers','subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={()=>openResModal()}><Plus size={15}/> {tr('researchers','addRes')}</button>
              </div>
              {loadingR ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : researchers.length===0 ? (
                <div style={{ textAlign:'center', padding:60, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <FlaskConical size={40} style={{ color:'var(--border)', marginBottom:12 }}/><p style={{ color:'var(--muted)' }}>{tr('researchers','noRes')}</p>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
                  {researchers.map(r => (
                    <div key={r.id} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', overflow:'hidden' }}>
                      <div style={{ height:4, background:'linear-gradient(90deg,var(--emerald),var(--navy))' }}/>
                      <div style={{ padding:'18px 20px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:700, color:'var(--navy)', fontSize:'.95rem' }}>{r.fullName}</div>
                            <div style={{ fontSize:'.78rem', color:'var(--emerald)', fontWeight:600 }}>{r.grade} · {r.specialty}</div>
                          </div>
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:'.68rem', fontWeight:600, background:r.isActive?'var(--emerald-lt)':'#fee2e2', color:r.isActive?'var(--emerald)':'#ef4444' }}>
                            {r.isActive ? tr('researchers','active') : tr('researchers','inactive')}
                          </span>
                        </div>
                        {r.department && <div style={{ fontSize:'.78rem', color:'var(--muted)', marginBottom:8 }}>📍 {r.department}</div>}
                        {r.bio && <p style={{ fontSize:'.8rem', color:'var(--text-2)', lineHeight:1.55, marginBottom:12 }}>{r.bio.slice(0,120)}{r.bio.length>120?'…':''}</p>}
                        {r.expertise.length>0 && (
                          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                            {r.expertise.slice(0,4).map(e=><span key={e} style={{ padding:'2px 8px', borderRadius:99, background:'var(--bg)', border:'1px solid var(--border)', fontSize:'.68rem', color:'var(--muted)' }}>{e}</span>)}
                          </div>
                        )}
                        <div style={{ display:'flex', gap:8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>openResModal(r)} style={{ flex:1 }}><Pencil size={13}/> {tr('researchers','editRes')}</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>toggleResearcher(r.id, r.isActive)} title={r.isActive ? tr('researchers','active') : tr('researchers','inactive')}>
                            {r.isActive ? <ToggleRight size={16} style={{ color:'var(--emerald)' }}/> : <ToggleLeft size={16} style={{ color:'var(--muted)' }}/>}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>deleteRes(r.id)} style={{ color:'#ef4444' }}><Trash2 size={13}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ PROJECTS ══ */}
          {tab==='projects' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <div>
                  <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('projects','allProjects')}</h1>
                  <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{projects.length} {tr('projects','title').toLowerCase()}</p>
                </div>
              </div>
              {loadingP ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : projects.length===0 ? (
                <div style={{ textAlign:'center', padding:60, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <LayoutDashboard size={40} style={{ color:'var(--border)', marginBottom:12 }}/><p style={{ color:'var(--muted)' }}>{tr('projects','noProjects')}</p>
                  <p style={{ fontSize:'.84rem', color:'var(--muted)', marginTop:8 }}>Créez des projets depuis l'onglet Demandes en approuvant une demande.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {projects.map(proj => {
                    const sc: Record<string,string> = { active:'#10b981', paused:'#f59e0b', completed:'#6366f1', cancelled:'#ef4444' }
                    const c = sc[proj.status] || 'var(--navy)'
                    return (
                      <div key={proj.id} style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', boxShadow:'var(--sh-xs)', overflow:'hidden' }}>
                        <div style={{ height:4, background:c }}/>
                        <div style={{ padding:'18px 22px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                                <span style={{ padding:'3px 9px', borderRadius:99, background:c+'18', color:c, fontSize:'.72rem', fontWeight:700 }}>{tr('projects',proj.status)}</span>
                                <span style={{ padding:'3px 9px', borderRadius:99, background:'#dbeafe', color:'#1e40af', fontSize:'.72rem', fontWeight:600 }}>{proj.companyName}</span>
                              </div>
                              <h3 style={{ fontWeight:700, color:'var(--navy)', marginBottom:4 }}>{proj.title}</h3>
                              {proj.description && <p style={{ fontSize:'.82rem', color:'var(--muted)', lineHeight:1.5 }}>{proj.description.slice(0,160)}{proj.description.length>160?'…':''}</p>}
                              <div style={{ display:'flex', gap:14, marginTop:10, fontSize:'.76rem', color:'var(--muted)' }}>
                                {proj.startDate && <span>📅 {new Date(proj.startDate).toLocaleDateString('fr-DZ')}</span>}
                                {proj.endDate && <span>🏁 {new Date(proj.endDate).toLocaleDateString('fr-DZ')}</span>}
                                {proj.budgetApproved && <span>💰 {Number(proj.budgetApproved).toLocaleString()} DZD</span>}
                              </div>
                              <div style={{ marginTop:10 }}>
                                <div style={{ height:5, background:'var(--bg)', borderRadius:99, overflow:'hidden', width:'100%' }}>
                                  <div style={{ height:'100%', width:`${proj.progressPct}%`, background:c, borderRadius:99 }}/>
                                </div>
                                <span style={{ fontSize:'.72rem', color:'var(--muted)' }}>{proj.progressPct}%</span>
                              </div>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              <select value={proj.status} onChange={e=>updateProjectStatus(proj.id, e.target.value)}
                                style={{ padding:'6px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:'.8rem', cursor:'pointer' }}>
                                {['active','paused','completed','cancelled'].map(s => <option key={s} value={s}>{tr('projects',s)}</option>)}
                              </select>
                              <button onClick={()=>setAssignModal(proj)} style={{ padding:'7px 14px', borderRadius:'var(--r-md)', border:'1px solid #7c3aed', background:'transparent', color:'#7c3aed', cursor:'pointer', fontWeight:600, fontSize:'.8rem' }}>
                                + {tr('projects','assignRes')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ COMPANIES ══ */}
          {tab==='companies' && (
            <>
              <div style={{ marginBottom:22 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('companies','title')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{companies.length} {tr('companies','total')}</p>
              </div>
              {loadingC ? <div style={{ textAlign:'center', padding:40 }}><LoadingSpinner size="lg"/></div> : companies.length===0 ? (
                <div style={{ textAlign:'center', padding:60, background:'var(--white)', borderRadius:'var(--r-2xl)', border:'2px dashed var(--border)' }}>
                  <Building2 size={40} style={{ color:'var(--border)', marginBottom:12 }}/><p style={{ color:'var(--muted)' }}>{tr('companies','noCompanies')}</p>
                </div>
              ) : (
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden' }}>
                  <table className="table" style={{ width:'100%' }}>
                    <thead><tr><th>{tr('auth','companyName')}</th><th>{tr('companies','sector')}</th><th>{tr('companies','contact')}</th><th>{tr('companies','joined')}</th><th>Statut</th><th>Action</th></tr></thead>
                    <tbody>
                      {companies.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight:600, color:'var(--navy)' }}>{c.companyName}</td>
                          <td style={{ fontSize:'.8rem', color:'var(--muted)' }}>{c.sector}</td>
                          <td style={{ fontSize:'.8rem' }}>{c.contactName}<br/><span style={{ color:'var(--muted)', fontSize:'.72rem' }}>{c.email}</span></td>
                          <td style={{ fontSize:'.78rem', color:'var(--muted)' }}>{formatDate(c.createdAt,lang)}</td>
                          <td>
                            <span style={{ padding:'3px 10px', borderRadius:99, fontSize:'.75rem', fontWeight:600, background:c.isActive?'var(--emerald-lt)':'#fee2e2', color:c.isActive?'var(--emerald)':'#ef4444' }}>
                              {c.isActive ? tr('companies','active') : tr('companies','inactive')}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={()=>toggleCompany(c.id)} title={tr('companies','toggleActive')}>
                              {c.isActive ? <ToggleRight size={18} style={{ color:'var(--emerald)' }}/> : <ToggleLeft size={18} style={{ color:'var(--muted)' }}/>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ══ MESSAGES ══ */}
          {tab==='messages' && (
            <>
              <div style={{ marginBottom: 22 }}>
                <h1 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:4 }}>{tr('admin','tabMessages')}</h1>
                <p style={{ color:'var(--muted)', fontSize:'.85rem' }}>{tr('admin','messagesSub')}</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16, height:'calc(100vh - 230px)' }}>
                {/* Contact list */}
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ display:'flex', gap:6, padding:12, borderBottom:'1px solid var(--border)' }}>
                    {(['all','company','researcher'] as const).map(f => (
                      <button key={f} onClick={()=>setContactFilter(f)}
                        style={{ flex:1, padding:'5px 0', borderRadius:99, fontSize:'.72rem', fontWeight:600, cursor:'pointer', border:'none',
                          background:contactFilter===f?'var(--emerald)':'var(--bg)', color:contactFilter===f?'#fff':'var(--muted)' }}>
                        {f==='all' ? tr('common','all') : f==='company' ? tr('companies','title') : tr('researchers','title')}
                      </button>
                    ))}
                  </div>
                  <div style={{ flex:1, overflowY:'auto' }}>
                    {loadingContacts ? <div style={{ padding:30, textAlign:'center' }}><LoadingSpinner size="md"/></div> : filteredContacts.length===0 ? (
                      <p style={{ padding:20, color:'var(--muted)', fontSize:'.82rem', textAlign:'center' }}>{tr('admin','noContacts')}</p>
                    ) : filteredContacts.map(c => {
                      const unread = allMsgs.filter(m=>m.sender_id===c.id && !m.is_read).length
                      return (
                        <button key={c.id} onClick={()=>setActiveContact(c)}
                          style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 14px', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer',
                            background:activeContact?.id===c.id?'var(--emerald-lt)':'transparent', textAlign:'start' }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'.78rem',
                            background:c.role==='researcher'?'linear-gradient(135deg,#7c3aed,#4c1d95)':'linear-gradient(135deg,var(--emerald),#059669)' }}>
                            {c.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:'.82rem', fontWeight:700, color:'var(--navy)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</p>
                            <p style={{ fontSize:'.72rem', color:'var(--muted)' }}>{c.detail || (c.role==='researcher'?tr('researchers','title'):tr('companies','title'))}</p>
                          </div>
                          {unread>0 && <span style={{ background:'#ef4444', color:'#fff', borderRadius:99, fontSize:'.62rem', fontWeight:800, padding:'1px 6px' }}>{unread}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Conversation */}
                <div style={{ background:'var(--white)', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  {!activeContact ? (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:'.88rem' }}>
                      {tr('admin','selectContact')}
                    </div>
                  ) : (
                    <>
                      <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'.8rem',
                          background:activeContact.role==='researcher'?'linear-gradient(135deg,#7c3aed,#4c1d95)':'linear-gradient(135deg,var(--emerald),#059669)' }}>
                          {activeContact.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight:700, color:'var(--navy)', fontSize:'.9rem' }}>{activeContact.name}</p>
                          <p style={{ fontSize:'.74rem', color:'var(--muted)' }}>{activeContact.email}</p>
                        </div>
                      </div>
                      <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                        {conversation.length===0 ? (
                          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:'.82rem', marginTop:30 }}>{tr('admin','noMessagesYet')}</p>
                        ) : conversation.map(m => {
                          const fromAdmin = m.sender_id === user.id
                          return (
                            <div key={m.id} style={{ display:'flex', justifyContent:fromAdmin?'flex-end':'flex-start' }}>
                              <div style={{
                                maxWidth:'70%', padding:'9px 13px', borderRadius:'var(--r-lg)', fontSize:'.84rem', lineHeight:1.5,
                                background:fromAdmin?'var(--emerald)':'var(--bg)', color:fromAdmin?'#fff':'var(--text)',
                              }}>
                                {m.body}
                                <div style={{ fontSize:'.66rem', marginTop:4, opacity:.7 }}>{new Date(m.created_at).toLocaleString(lang)}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ padding:14, borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                        <input className="form-input" placeholder={tr('admin','writeMessage')} value={msgBody}
                          onChange={e=>setMsgBody(e.target.value)}
                          onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMessage() } }}/>
                        <button className="btn btn-primary" onClick={sendAdminMessage} disabled={sendingMsg || !msgBody.trim()} style={{ display:'flex', alignItems:'center', gap:6 }}>
                          {sendingMsg ? <LoadingSpinner size="sm"/> : <Send size={15}/>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Need detail */}
      <Modal open={!!selectedNeed} onClose={()=>setSelectedNeed(null)} title={selectedNeed?.title??''} maxWidth={600}
        footer={<button className="btn btn-ghost" onClick={()=>setSelectedNeed(null)}>{tr('common','close')}</button>}>
        {selectedNeed && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <span style={{ padding:'3px 10px', borderRadius:99, background:'var(--navy)', color:'#fff', fontSize:'.75rem', fontWeight:600 }}>{selectedNeed.serviceType}</span>
              <StatusBadge status={selectedNeed.status} lang={lang}/>
            </div>
            {selectedNeed.company && <div style={{ padding:'10px 14px', background:'var(--bg)', borderRadius:'var(--r-lg)', marginBottom:14, fontSize:'.875rem' }}><strong>{selectedNeed.company.name}</strong> — {selectedNeed.company.sector}</div>}
            <p style={{ lineHeight:1.7, color:'var(--text)', marginBottom:18 }}>{selectedNeed.description}</p>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label className="form-label">{tr('admin','updateStatus')}</label>
              <select className="form-input" value={selectedNeed.status} onChange={e=>updateStatus(selectedNeed.id,e.target.value as Status)}>
                {STATUSES.map(s=><option key={s} value={s}>{tr('status',s)}</option>)}
              </select>
            </div>
            {selectedNeed.status==='approved' && (
              <button onClick={()=>{ setProjectModal(selectedNeed); setProjectForm(f=>({...f,title:selectedNeed.title,description:selectedNeed.description})); setSelectedNeed(null) }}
                style={{ width:'100%', padding:'10px 0', borderRadius:'var(--r-lg)', border:'none', background:'#7c3aed', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'.88rem' }}>
                🚀 {tr('projects','createFromNeed')}
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Create Project modal */}
      <Modal open={!!projectModal} onClose={()=>setProjectModal(null)} title={tr('projects','newProject')} maxWidth={560}
        footer={<><button className="btn btn-ghost" onClick={()=>setProjectModal(null)}>{tr('common','cancel')}</button>
          <button onClick={createProject} className="btn btn-primary" disabled={submittingProject}>{submittingProject?<LoadingSpinner size="sm"/>:'Créer le projet'}</button></>}>
        {projectModal && (
          <div>
            <div style={{ padding:'10px 14px', background:'#f5f3ff', borderRadius:'var(--r-lg)', marginBottom:16, fontSize:'.84rem', color:'#7c3aed', fontWeight:600 }}>
              Demande source : {projectModal.title}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Titre du projet *</label>
                <input className="form-input" required value={projectForm.title} onChange={e=>setProjectForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={projectForm.description} onChange={e=>setProjectForm(f=>({...f,description:e.target.value}))} style={{ resize:'vertical' }}/>
              </div>
              <div className="form-group">
                <label className="form-label">Budget approuvé (DZD)</label>
                <input className="form-input" type="number" value={projectForm.budgetApproved} onChange={e=>setProjectForm(f=>({...f,budgetApproved:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de début</label>
                <input className="form-input" type="date" value={projectForm.startDate} onChange={e=>setProjectForm(f=>({...f,startDate:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Date de fin prévue</label>
                <input className="form-input" type="date" value={projectForm.endDate} onChange={e=>setProjectForm(f=>({...f,endDate:e.target.value}))}/>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign researcher modal */}
      <Modal open={!!assignModal} onClose={()=>setAssignModal(null)} title={`Assigner un chercheur — ${assignModal?.title??''}`} maxWidth={560}
        footer={<button className="btn btn-ghost" onClick={()=>setAssignModal(null)}>{tr('common','close')}</button>}>
        {assignModal && (
          <div>
            {researchers.length===0 ? (
              <p style={{ color:'var(--muted)', textAlign:'center', padding:24 }}>Chargez d'abord les chercheurs depuis l'onglet Chercheurs.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {researchers.filter(r=>r.isActive).map(r => (
                  <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'var(--bg)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight:700, color:'var(--navy)', fontSize:'.88rem' }}>{r.fullName}</div>
                      <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{r.grade} · {r.specialty}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={async()=>{ await projectsApi.assign(assignModal.id, r.id, 'member'); setAlert({ type:'success', msg:'Chercheur assigné !' }) }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'var(--white)', cursor:'pointer', fontSize:'.78rem', fontWeight:600 }}>
                        + Membre
                      </button>
                      <button onClick={async()=>{ await projectsApi.assign(assignModal.id, r.id, 'lead'); setAlert({ type:'success', msg:'Chef de projet assigné !' }) }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'none', background:'#7c3aed', color:'#fff', cursor:'pointer', fontSize:'.78rem', fontWeight:700 }}>
                        Chef
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Publish service */}
      <Modal open={svcModal} onClose={()=>{setSvcModal(false);setSvcForm({category:'',title:'',description:'',department:'',price:'',isFree:false})}}
        title={tr('admin','publishService')}
        footer={<><button className="btn btn-ghost" onClick={()=>setSvcModal(false)}>{tr('common','cancel')}</button>
          <button form="svc-form" type="submit" className="btn btn-primary" disabled={submittingSvc}>{submittingSvc?<LoadingSpinner size="sm"/>:tr('admin','publish')}</button></>}>
        <form id="svc-form" onSubmit={publishService} noValidate>
          <div className="form-group" style={{ marginBottom:14 }}><label className="form-label">{tr('admin','category')} *</label>
            <select className="form-input" required value={svcForm.category} onChange={e=>setSvcForm({...svcForm,category:e.target.value})}>
              <option value="">{tr('auth','chooseSector')}</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select></div>
          <div className="form-group" style={{ marginBottom:14 }}><label className="form-label">{tr('admin','svcTitle')} *</label>
            <input className="form-input" required value={svcForm.title} onChange={e=>setSvcForm({...svcForm,title:e.target.value})} placeholder={tr('admin','svcTitlePh')}/></div>
          <div className="form-group" style={{ marginBottom:14 }}><label className="form-label">{tr('catalog','department')}</label>
            <input className="form-input" value={svcForm.department} onChange={e=>setSvcForm({...svcForm,department:e.target.value})} placeholder="ex: Informatique"/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14, alignItems:'end' }}>
            <div className="form-group" style={{ marginBottom:0 }}><label className="form-label">{tr('catalog','pricing')} (DA)</label>
              <input className="form-input" type="number" min={0} disabled={svcForm.isFree} value={svcForm.price} onChange={e=>setSvcForm({...svcForm,price:e.target.value})} placeholder={tr('catalog','onQuote')}/></div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.84rem', color:'var(--text-2)', paddingBottom:11 }}>
              <input type="checkbox" checked={svcForm.isFree} onChange={e=>setSvcForm({...svcForm,isFree:e.target.checked, price: e.target.checked ? '' : svcForm.price})}/>
              {tr('catalog','free')}
            </label>
          </div>
          <div className="form-group"><label className="form-label">{tr('admin','svcDesc')} *</label>
            <textarea className="form-input" rows={4} required value={svcForm.description} onChange={e=>setSvcForm({...svcForm,description:e.target.value})} placeholder={tr('admin','svcDescPh')} style={{ resize:'vertical' }}/></div>
        </form>
      </Modal>

      {/* Create/Edit Offer */}
      <Modal open={offerModal} onClose={()=>setOfferModal(false)} title={editOffer?tr('offers','editOffer'):tr('offers','createOffer')} maxWidth={580}
        footer={<><button className="btn btn-ghost" onClick={()=>setOfferModal(false)}>{tr('common','cancel')}</button>
          <button form="offer-form" type="submit" className="btn btn-primary" disabled={submittingOffer}>{submittingOffer?<LoadingSpinner size="sm"/>:tr('admin','publish')}</button></>}>
        <form id="offer-form" onSubmit={submitOffer} noValidate>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{tr('offers','offerTitle')} *</label>
              <input className="form-input" required value={offerForm.title} onChange={e=>setOfferForm({...offerForm,title:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('admin','category')} *</label>
              <select className="form-input" required value={offerForm.category} onChange={e=>setOfferForm({...offerForm,category:e.target.value})}>
                <option value="">{tr('auth','chooseSector')}</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">{tr('offers','deadline')}</label>
              <input className="form-input" type="date" value={offerForm.deadline} onChange={e=>setOfferForm({...offerForm,deadline:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('offers','budget')} (DZD)</label>
              <input className="form-input" type="number" value={offerForm.budget} onChange={e=>setOfferForm({...offerForm,budget:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('offers','slots')}</label>
              <input className="form-input" type="number" min="1" value={offerForm.slots} onChange={e=>setOfferForm({...offerForm,slots:e.target.value})}/></div>
          </div>
          <div className="form-group" style={{ marginBottom:14 }}><label className="form-label">{tr('offers','tags')} (virgule)</label>
            <input className="form-input" value={offerForm.tags} onChange={e=>setOfferForm({...offerForm,tags:e.target.value})} placeholder="Machine Learning, Data Science…"/></div>
          <div className="form-group"><label className="form-label">{tr('admin','svcDesc')} *</label>
            <textarea className="form-input" rows={4} required value={offerForm.description} onChange={e=>setOfferForm({...offerForm,description:e.target.value})} style={{ resize:'vertical' }}/></div>
        </form>
      </Modal>

      {/* Offer Applications */}
      <Modal open={appsModal} onClose={()=>setAppsModal(false)} title={`${tr('offers','allApps')} — ${selectedOffer?.title??''}`} maxWidth={680}
        footer={<button className="btn btn-ghost" onClick={()=>setAppsModal(false)}>{tr('common','close')}</button>}>
        {offerApps.length===0 ? <p style={{ textAlign:'center', color:'var(--muted)', padding:30 }}>{tr('offers','noApps')}</p> : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {offerApps.map(a => (
              <div key={a.id} style={{ padding:'14px 18px', background:'var(--bg)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div><div style={{ fontWeight:700, color:'var(--navy)' }}>{a.companyName}</div><div style={{ fontSize:'.75rem', color:'var(--muted)' }}>{a.companySector} · {new Date(a.appliedAt).toLocaleDateString('fr-DZ')}</div></div>
                  <select style={{ padding:'4px 8px', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', fontSize:'.78rem', background:'var(--white)', cursor:'pointer' }}
                    value={a.status} onChange={e=>updateAppStatus(a.id,e.target.value)}>
                    {APP_STATUSES.map(s=><option key={s} value={s}>{tr('offers',s==='accepted'?'appAccepted':s==='rejected'?'appRejected':'appPending')}</option>)}
                  </select>
                </div>
                {a.coverLetter && <p style={{ fontSize:'.82rem', color:'var(--text-2)', lineHeight:1.6 }}>{a.coverLetter}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Researcher form */}
      <Modal open={resModal} onClose={()=>setResModal(false)} title={editRes?tr('researchers','editRes'):tr('researchers','addRes')} maxWidth={580}
        footer={<><button className="btn btn-ghost" onClick={()=>setResModal(false)}>{tr('common','cancel')}</button>
          <button form="res-form" type="submit" className="btn btn-primary" disabled={submittingRes}>{submittingRes?<LoadingSpinner size="sm"/>:tr('admin','publish')}</button></>}>
        <form id="res-form" onSubmit={submitRes} noValidate>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{tr('researchers','fullName')} *</label>
              <input className="form-input" required value={resForm.fullName} onChange={e=>setResForm({...resForm,fullName:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('researchers','specialty')} *</label>
              <input className="form-input" required value={resForm.specialty} onChange={e=>setResForm({...resForm,specialty:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('researchers','grade')}</label>
              <input className="form-input" value={resForm.grade} onChange={e=>setResForm({...resForm,grade:e.target.value})} placeholder="Professeur, MCA…"/></div>
            <div className="form-group"><label className="form-label">{tr('researchers','department')}</label>
              <input className="form-input" value={resForm.department} onChange={e=>setResForm({...resForm,department:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('researchers','email')} *</label>
              <input className="form-input" type="email" required value={resForm.email} onChange={e=>setResForm({...resForm,email:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{tr('researchers','phone')}</label>
              <input className="form-input" type="tel" value={resForm.phone} onChange={e=>setResForm({...resForm,phone:e.target.value})}/></div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{tr('researchers','expertise')} (virgule)</label>
              <input className="form-input" value={resForm.expertise} onChange={e=>setResForm({...resForm,expertise:e.target.value})} placeholder="ML, Energie, Finance…"/></div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">{tr('researchers','bio')}</label>
              <textarea className="form-input" rows={3} value={resForm.bio} onChange={e=>setResForm({...resForm,bio:e.target.value})} style={{ resize:'vertical' }}/></div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
