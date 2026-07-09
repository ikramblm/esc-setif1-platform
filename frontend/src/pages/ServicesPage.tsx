import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ServicesCatalog from '../components/ServicesCatalog'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import { needsApi } from '../lib/api'
import type { Lang } from '../lib/i18n'

interface Props {
  tr: (s: string, k: string) => string
  lang: Lang
  isAuthenticated: boolean
}
interface Service { id: string; category: string; title: string; description: string; titleEn?: string | null; titleAr?: string | null }

function localizedTitle(s: Service, lang: Lang) {
  if (lang === 'en' && s.titleEn) return s.titleEn
  if (lang === 'ar' && s.titleAr) return s.titleAr
  return s.title
}

export default function ServicesPage({ tr, lang, isAuthenticated }: Props) {
  const navigate = useNavigate()
  const [target, setTarget] = useState<Service | null>(null)
  const [requirement, setRequirement] = useState('')
  const [deadline, setDeadline] = useState('')
  const [budget, setBudget] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleRequestService = (service: Service) => {
    if (!isAuthenticated) { navigate('/login'); return }
    setTarget(service)
    setRequirement(''); setDeadline(''); setBudget(''); setMsg(null)
  }

  const closeModal = () => setTarget(null)

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!target) return
    if (!requirement.trim()) { setMsg({ type: 'err', text: tr('catalog', 'requirementRequired') }); return }
    setSubmitting(true); setMsg(null)
    try {
      await needsApi.create({
        title: localizedTitle(target, lang),
        serviceType: target.category,
        description: requirement.trim(),
        deadline: deadline || undefined,
        budget: budget || undefined,
        serviceId: target.id,
      })
      setMsg({ type: 'ok', text: tr('catalog', 'requestSent') })
      setTimeout(() => setTarget(null), 1400)
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setMsg({ type: 'err', text: text || tr('catalog', 'requestError') })
    } finally { setSubmitting(false) }
  }

  return (
    <main style={{ paddingTop: 32 }}>
      <ServicesCatalog
        tr={tr} lang={lang}
        isAuthenticated={isAuthenticated}
        onRequestService={handleRequestService}
        onRequireAuth={() => navigate('/login')}
      />

      <Modal open={!!target} onClose={closeModal} title={tr('catalog', 'requestModalTitle')}
        footer={<>
          <button className="btn btn-ghost" onClick={closeModal}>{tr('common', 'cancel')}</button>
          <button form="request-service-form" type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <LoadingSpinner size="sm"/> : tr('catalog', 'sendRequest')}
          </button>
        </>}>
        {target && (
          <form id="request-service-form" onSubmit={submitRequest} noValidate>
            <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 16 }}>
              {tr('catalog', 'requestingService')} <strong style={{ color: 'var(--navy)' }}>{localizedTitle(target, lang)}</strong>
            </p>

            {msg && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--r-lg)', fontSize: '.82rem', fontWeight: 500,
                background: msg.type === 'ok' ? '#f0fdf4' : '#fff1f2', color: msg.type === 'ok' ? '#15803d' : '#be123c',
                border: `1px solid ${msg.type === 'ok' ? '#bbf7d0' : '#fecdd3'}` }}>
                {msg.text}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">{tr('catalog', 'requirementLabel')} *</label>
              <textarea className="form-input" rows={5} required value={requirement}
                onChange={e => setRequirement(e.target.value)}
                placeholder={tr('catalog', 'requirementPh')} style={{ resize: 'vertical' }}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{tr('catalog', 'deadlineLabel')}</label>
                <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)}/>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{tr('catalog', 'budgetLabel')} (DA)</label>
                <input className="form-input" type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)} placeholder={tr('catalog', 'onQuote')}/>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </main>
  )
}
