interface LoadingSpinnerProps { size?: 'sm' | 'md' | 'lg'; label?: string; dark?: boolean }

export default function LoadingSpinner({ size = 'md', label, dark = false }: LoadingSpinnerProps) {
  const dim = size === 'sm' ? 16 : size === 'lg' ? 32 : 24
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: size === 'lg' ? 40 : 16 }}>
      <div style={{
        width: dim, height: dim,
        border: `${size === 'sm' ? 2 : 3}px solid ${dark ? 'rgba(13,42,74,0.15)' : 'rgba(255,255,255,0.25)'}`,
        borderTopColor: dark ? 'var(--color-navy)' : '#fff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      {label && <p style={{ fontSize: '0.875rem', color: dark ? 'var(--color-muted)' : 'rgba(255,255,255,0.7)' }}>{label}</p>}
    </div>
  )
}
