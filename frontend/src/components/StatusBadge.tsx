import type { LucideProps } from 'lucide-react'
import { Clock, Eye, CheckCircle, XCircle, Star } from 'lucide-react'

type Status = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed'
type IconType = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>

const CONFIG: Record<Status, { label: { fr: string; ar: string; en: string }; icon: IconType; cls: string }> = {
  pending:   { label: { fr: 'En attente',  ar: 'قيد الانتظار', en: 'Pending'      }, icon: Clock,       cls: 'status-pending'   },
  reviewing: { label: { fr: 'En cours',    ar: 'قيد المراجعة', en: 'Under Review' }, icon: Eye,         cls: 'status-reviewing' },
  approved:  { label: { fr: 'Approuvé',    ar: 'مقبول',        en: 'Approved'     }, icon: CheckCircle, cls: 'status-approved'  },
  rejected:  { label: { fr: 'Rejeté',      ar: 'مرفوض',        en: 'Rejected'     }, icon: XCircle,     cls: 'status-rejected'  },
  completed: { label: { fr: 'Complété',    ar: 'مكتمل',        en: 'Completed'    }, icon: Star,        cls: 'status-completed' },
}

interface StatusBadgeProps { status: Status; lang?: 'fr' | 'ar' | 'en' }

export default function StatusBadge({ status, lang = 'fr' }: StatusBadgeProps) {
  const { label, icon: Icon, cls } = CONFIG[status] ?? CONFIG.pending
  return (
    <span className={`badge ${cls}`}>
      <Icon size={11} />
      {label[lang]}
    </span>
  )
}
