import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export default function Modal({ open, onClose, title, children, footer, maxWidth = 560 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal animate-in" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-title" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
