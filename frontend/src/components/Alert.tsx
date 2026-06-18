import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
  onDismiss?: () => void
}

const ICONS = { error: AlertCircle, success: CheckCircle, info: Info }

export default function Alert({ type, message, onDismiss }: AlertProps) {
  const Icon = ICONS[type]
  return (
    <div className={`alert alert-${type}`} role="alert">
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.7 }} aria-label="Fermer">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
