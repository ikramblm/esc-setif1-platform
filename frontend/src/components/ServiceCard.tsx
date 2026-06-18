import { Trash2, Calendar } from 'lucide-react'
import { formatDate } from '../lib/security'
import type { Lang } from '../lib/i18n'

interface Service {
  id: string
  category: string
  title: string
  description: string
  publishedAt: string
}

interface ServiceCardProps { service: Service; lang: Lang; isAdmin?: boolean; onDelete?: (id: string) => void }

const CATEGORY_COLORS: Record<string, string> = {
  Consulting: '#0ea47f',
  Formation:  '#3b82f6',
  Études:     '#8b5cf6',
  Recherche:  '#f59e0b',
}

export default function ServiceCard({ service, lang, isAdmin, onDelete }: ServiceCardProps) {
  const color = CATEGORY_COLORS[service.category] ?? '#64748b'

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="badge" style={{ background: `${color}18`, color, fontWeight: 700 }}>{service.category}</span>
        {isAdmin && onDelete && (
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(service.id)} style={{ color: 'var(--color-error)', padding: 4 }} title="Supprimer">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>{service.title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 16 }}>{service.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--color-muted)' }}>
        <Calendar size={11} /> Publié le {formatDate(service.publishedAt, lang)}
      </div>
    </div>
  )
}
