import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, SlidersHorizontal, Calendar, X, Tag, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { servicesApi, favoritesApi } from '../lib/api'
import { formatDate } from '../lib/security'
import type { Lang } from '../lib/i18n'
import type { ServiceFilters } from '../lib/api'

interface Service {
  id: string; category: string; title: string; description: string
  titleEn?: string | null; titleAr?: string | null
  descriptionEn?: string | null; descriptionAr?: string | null
  activityCode?: string | null
  department?: string | null; price: number | null; isFree: boolean; publishedAt: string
}

function localizedTitle(s: Service, lang: Lang) {
  if (lang === 'en' && s.titleEn) return s.titleEn
  if (lang === 'ar' && s.titleAr) return s.titleAr
  return s.title
}
function localizedDescription(s: Service, lang: Lang) {
  if (lang === 'en' && s.descriptionEn) return s.descriptionEn
  if (lang === 'ar' && s.descriptionAr) return s.descriptionAr
  return s.description
}

interface Props {
  tr: (s: string, k: string) => string
  lang: Lang
  isAuthenticated?: boolean
  onRequestService: (service: Service) => void
  onRequireAuth?: () => void
}

const CATEGORIES = ['Consulting', 'Formation', 'Études', 'Recherche']
const CATEGORY_COLORS: Record<string, string> = {
  Consulting: '#0ea47f', Formation: '#3b82f6', Études: '#8b5cf6', Recherche: '#f59e0b',
}

export default function ServicesCatalog({ tr, lang, isAuthenticated, onRequestService, onRequireAuth }: Props) {
  const [services, setServices]     = useState<Service[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    servicesApi.getDepartments().then(r => setDepartments(r.data.departments ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isAuthenticated) { setFavoriteIds(new Set()); return }
    favoritesApi.getIds().then(r => setFavoriteIds(new Set(r.data.serviceIds ?? []))).catch(() => {})
  }, [isAuthenticated])

  const toggleFavorite = async (serviceId: string) => {
    if (!isAuthenticated) { onRequireAuth?.(); return }
    const { data } = await favoritesApi.toggle(serviceId)
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (data.favorited) next.add(serviceId); else next.delete(serviceId)
      return next
    })
  }

  const load = useCallback(() => {
    setLoading(true)
    const filters: ServiceFilters = {}
    if (search) filters.search = search
    if (category) filters.category = category
    if (department) filters.department = department
    servicesApi.getAll(filters)
      .then(r => setServices(r.data.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [search, category, department])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const activeFilterCount = useMemo(
    () => [category, department].filter(Boolean).length,
    [category, department]
  )

  const clearFilters = () => { setCategory(''); setDepartment('') }

  return (
    <section id="catalogue" className="section" style={{ background: 'var(--bg)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="section-label">{tr('catalog', 'sectionLabel')}</div>
          <h2 className="h1" style={{ marginBottom: 14 }}>{tr('catalog', 'title')}</h2>
          <p className="lead" style={{ maxWidth: 520, margin: '0 auto' }}>{tr('catalog', 'subtitle')}</p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 10, maxWidth: 640, margin: '0 auto 28px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}/>
            <input
              className="form-input"
              style={{ paddingLeft: 40 }}
              placeholder={tr('catalog', 'searchPh')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', flexShrink: 0 }}
          >
            <SlidersHorizontal size={15}/> {tr('catalog', 'filters')}
            {activeFilterCount > 0 && (
              <span style={{
                background: 'var(--emerald)', color: '#fff', borderRadius: 99,
                fontSize: '.68rem', fontWeight: 800, padding: '1px 6px', minWidth: 16, textAlign: 'center',
              }}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: filtersOpen ? '240px 1fr' : '1fr', gap: 28, alignItems: 'flex-start' }}>
          {/* Filter sidebar */}
          {filtersOpen && (
            <aside style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: 20, position: 'sticky', top: 84,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--navy)' }}>{tr('catalog', 'filters')}</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--emerald)', fontSize: '.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <X size={11}/> {tr('catalog', 'clearFilters')}
                  </button>
                )}
              </div>

              <FilterGroup label={tr('catalog', 'category')}>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">{tr('catalog', 'allCategories')}</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterGroup>

              <FilterGroup label={tr('catalog', 'department')} last>
                <select className="form-input" value={department} onChange={e => setDepartment(e.target.value)}>
                  <option value="">{tr('catalog', 'allDepartments')}</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FilterGroup>
            </aside>
          )}

          {/* Results */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}><LoadingSpinner size="md"/></div>
            ) : services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12, opacity: .4 }}>🔍</div>
                <p>{tr('catalog', 'noResults')}</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>
                  {services.length} {tr('catalog', 'resultsCount')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 18 }}>
                  {services.map(s => (
                    <CatalogCard key={s.id} service={s} lang={lang} tr={tr}
                      isFavorite={favoriteIds.has(s.id)}
                      isExpanded={expandedId === s.id}
                      onToggleExpand={() => setExpandedId(prev => prev === s.id ? null : s.id)}
                      onToggleFavorite={() => toggleFavorite(s.id)}
                      onRequest={() => onRequestService(s)}/>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 18 }}>
      <label className="form-label" style={{ display: 'block', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  )
}

function CatalogCard({ service, lang, tr, isFavorite, isExpanded, onToggleExpand, onToggleFavorite, onRequest }: {
  service: Service; lang: Lang; tr: (s: string, k: string) => string
  isFavorite: boolean; isExpanded: boolean; onToggleExpand: () => void
  onToggleFavorite: () => void; onRequest: () => void
}) {
  const color = CATEGORY_COLORS[service.category] ?? '#64748b'
  const bullets = localizedDescription(service, lang).split('\n').map(l => l.trim()).filter(Boolean)

  if (isExpanded) {
    return (
      <div key="expanded" className="card card-expand" style={{
        gridColumn: '1 / -1', padding: 26, display: 'flex', gap: 28,
        flexWrap: 'wrap', position: 'relative', transformOrigin: 'top center',
      }}>
        <button onClick={onToggleFavorite} title={tr('catalog', 'favorite')}
          style={{ position: 'absolute', top: 22, right: 22, background: 'none', border: 'none', cursor: 'pointer', color: isFavorite ? '#ef4444' : 'var(--muted)', padding: 0 }}>
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'}/>
        </button>

        {/* Left: title/meta/actions */}
        <div style={{ flex: '0 0 240px', minWidth: 200 }}>
          <span className="badge" style={{ background: `${color}18`, color, fontWeight: 700, marginBottom: 12, display: 'inline-block' }}>{service.category}</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 10, paddingRight: 20 }}>{localizedTitle(service, lang)}</h3>
          <p style={{ fontSize: '.95rem', fontWeight: 800, color: service.isFree ? 'var(--emerald)' : 'var(--navy)', marginBottom: 10 }}>
            {service.isFree ? tr('catalog', 'free') : service.price != null ? `${service.price.toLocaleString(lang)} DA` : tr('catalog', 'onQuote')}
          </p>
          {service.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: 'var(--muted)', marginBottom: 6 }}>
              <Tag size={11}/> {service.department}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.74rem', color: 'var(--muted)', marginBottom: 16 }}>
            <Calendar size={11}/> {formatDate(service.publishedAt, lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={onRequest} className="btn btn-primary btn-sm">{tr('catalog', 'requestService')}</button>
            <button onClick={onToggleExpand} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'transform .2s var(--ease)' }}>
              <ChevronUp size={14}/> {tr('catalog', 'hideDescription')}
            </button>
          </div>
        </div>

        {/* Right: bullet description */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: '.88rem', color: 'var(--text-2)', lineHeight: 1.6, animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
                <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 7 }}/>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div key="collapsed" className="card card-expand" style={{ padding: 22, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <button onClick={onToggleFavorite} title={tr('catalog', 'favorite')}
        style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: isFavorite ? '#ef4444' : 'var(--muted)', padding: 0 }}>
        <Heart size={17} fill={isFavorite ? '#ef4444' : 'none'}/>
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8, paddingRight: 26 }}>
        <span className="badge" style={{ background: `${color}18`, color, fontWeight: 700 }}>{service.category}</span>
        <span style={{
          fontSize: '.82rem', fontWeight: 800, color: service.isFree ? 'var(--emerald)' : 'var(--navy)',
          whiteSpace: 'nowrap',
        }}>
          {service.isFree ? tr('catalog', 'free') : service.price != null ? `${service.price.toLocaleString(lang)} DA` : tr('catalog', 'onQuote')}
        </span>
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 14, flex: 1 }}>{localizedTitle(service, lang)}</h3>
      {service.department && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>
          <Tag size={11}/> {service.department}
        </div>
      )}
      <button onClick={onToggleExpand} className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
        <ChevronDown size={14}/> {tr('catalog', 'seeDescription')}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', color: 'var(--muted)' }}>
          <Calendar size={11}/> {formatDate(service.publishedAt, lang)}
        </div>
        <button onClick={onRequest} className="btn btn-primary btn-sm">
          {tr('catalog', 'requestService')}
        </button>
      </div>
    </div>
  )
}
