import { Landmark, Factory, Building, Zap, Wheat, Cpu } from 'lucide-react'

interface Props { tr: (s: string, k: string) => string }

const SECTORS = [
  { key:'banking',  Icon:Landmark, grad:'linear-gradient(135deg,#10b981,#059669)' },
  { key:'industry', Icon:Factory,  grad:'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  { key:'public',   Icon:Building, grad:'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  { key:'energy',   Icon:Zap,      grad:'linear-gradient(135deg,#f59e0b,#d97706)' },
  { key:'agrifood', Icon:Wheat,    grad:'linear-gradient(135deg,#22c55e,#15803d)' },
  { key:'digital',  Icon:Cpu,      grad:'linear-gradient(135deg,#6366f1,#4338ca)' },
]

export default function SectorsSection({ tr }: Props) {
  return (
    <section id="sectors" style={{ background:'var(--bg)' }} className="section">
      <div className="container">
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div className="section-label">{tr('sectors','sectionLabel')}</div>
          <h2 className="h1" style={{ marginBottom:14 }}>{tr('sectors','title')}</h2>
          <p className="lead" style={{ maxWidth:480, margin:'0 auto' }}>{tr('sectors','subtitle')}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(175px,1fr))', gap:16 }}>
          {SECTORS.map(({ key, Icon, grad }) => (
            <div key={key} style={{
              background:'var(--white)', borderRadius:'var(--r-xl)', padding:'28px 16px',
              textAlign:'center', border:'1px solid var(--border)',
              boxShadow:'var(--sh-xs)', cursor:'default',
              transition:'all var(--t) var(--ease)',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow='var(--sh-md)' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform=''; (e.currentTarget as HTMLElement).style.boxShadow='var(--sh-xs)' }}
            >
              <div style={{
                width:58, height:58, borderRadius:16, background:grad,
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px', boxShadow:'0 6px 16px rgba(0,0,0,.18)',
              }}>
                <Icon size={26} color="#fff"/>
              </div>
              <h3 style={{ fontSize:'.875rem', fontWeight:700, color:'var(--navy)' }}>{tr('sectors',key)}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
