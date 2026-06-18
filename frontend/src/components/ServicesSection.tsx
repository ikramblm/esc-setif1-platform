import { Lightbulb, GraduationCap, BarChart3, FlaskConical, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Props { tr: (s: string, k: string) => string }

const CARDS = [
  { prefix:'c', icon:Lightbulb,    accent:'#10b981', bg:'#ecfdf5' },
  { prefix:'t', icon:GraduationCap,accent:'#3b82f6', bg:'#eff6ff' },
  { prefix:'s', icon:BarChart3,    accent:'#8b5cf6', bg:'#f5f3ff' },
  { prefix:'r', icon:FlaskConical, accent:'#f59e0b', bg:'#fffbeb' },
]

export default function ServicesSection({ tr }: Props) {
  const navigate = useNavigate()

  return (
    <section id="services" style={{ background:'var(--white)' }} className="section">
      <div className="container">
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div className="section-label">{tr('services','sectionLabel')}</div>
          <h2 className="h1" style={{ marginBottom:14 }}>{tr('services','title')}</h2>
          <p className="lead" style={{ maxWidth:520, margin:'0 auto' }}>{tr('services','subtitle')}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(258px,1fr))', gap:20 }}>
          {CARDS.map(({ prefix, icon:Icon, accent, bg }) => (
            <div key={prefix} className="card" style={{ padding:28, display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{
                width:50, height:50, borderRadius:14, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20,
                border:`1px solid ${accent}22`,
              }}>
                <Icon size={22} style={{ color:accent }}/>
              </div>
              <h3 style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--navy)', marginBottom:10 }}>
                {tr('services', `${prefix}_title`)}
              </h3>
              <p style={{ fontSize:'.875rem', color:'var(--muted)', lineHeight:1.7, marginBottom:18, flex:1 }}>
                {tr('services', `${prefix}_desc`)}
              </p>
              <ul style={{ marginBottom:22 }}>
                {['f1','f2','f3'].map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'.82rem', color:'var(--text-2)', marginBottom:7 }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:accent, flexShrink:0 }}/>
                    {tr('services', `${prefix}_${f}`)}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/auth?mode=register')}
                style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'.82rem', fontWeight:700, color:accent, background:'none', border:'none', cursor:'pointer', padding:0, marginTop:'auto' }}>
                {tr('services','cta')} <ArrowRight size={13}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
