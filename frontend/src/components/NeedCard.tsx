import { Calendar, DollarSign, Tag } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatDate, formatCurrency, truncate } from '../lib/security'
import type { Lang } from '../lib/i18n'

interface Need {
  id: string
  title: string
  serviceType: string
  description: string
  deadline: string
  budget: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
  createdAt: string
}

interface NeedCardProps { need: Need; lang: Lang; onView?: (need: Need) => void }

export default function NeedCard({ need, lang, onView }: NeedCardProps) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{need.title}</h3>
        <StatusBadge status={need.status} lang={lang} />
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 16, lineHeight: 1.6 }}>
        {truncate(need.description, 140)}
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
          <Tag size={12} /> {need.serviceType}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
          <Calendar size={12} /> {formatDate(need.deadline, lang)}
        </span>
        {need.budget && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            <DollarSign size={12} /> {formatCurrency(need.budget)}
          </span>
        )}
      </div>

      {onView && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, padding: '5px 0', color: 'var(--color-emerald)' }} onClick={() => onView(need)}>
          Voir les détails →
        </button>
      )}
    </div>
  )
}
