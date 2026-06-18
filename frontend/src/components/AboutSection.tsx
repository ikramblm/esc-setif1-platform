import { Award, Users, BookOpen, TrendingUp } from 'lucide-react'

interface Props { tr: (s: string, k: string) => string }

export default function AboutSection({ tr }: Props) {
  const pillars = [
    { icon:Award,      tk:'p_excel',  dk:'p_excel_d'  },
    { icon:Users,      tk:'p_team',   dk:'p_team_d'   },
    { icon:BookOpen,   tk:'p_sci',    dk:'p_sci_d'    },
    { icon:TrendingUp, tk:'p_impact', dk:'p_impact_d' },
  ]

  return (
    <section id="about" style={{ background:'var(--white)' }} className="section">
      <div className="container">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:72, alignItems:'center' }} className="about-grid">
          {/* Text */}
          <div>
            <div className="section-label">{tr('about','sectionLabel')}</div>
            <h2 className="h1" style={{ marginBottom:20 }}>{tr('about','title')}</h2>
            <p style={{ color:'var(--text-2)', lineHeight:1.8, marginBottom:18, fontSize:'1rem' }}>{tr('about','p1')}</p>
            <p style={{ color:'var(--muted)',   lineHeight:1.8, marginBottom:36, fontSize:'.95rem' }}>{tr('about','p2')}</p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { v:'1987',  k:'founded' },
                { v:'50+',   k:'labs' },
                { v:'12 000+', k:'students' },
              ].map(({ v, k }) => (
                <div key={k} style={{
                  flex:1, minWidth:100, background:'var(--bg)', borderRadius:'var(--r-lg)',
                  padding:'16px 18px', textAlign:'center', border:'1px solid var(--border)',
                }}>
                  <div style={{ fontSize:'1.6rem', fontWeight:800, fontFamily:'var(--font-head)', color:'var(--emerald)', lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:6, fontWeight:500 }}>{tr('about',k)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {pillars.map(({ icon:Icon, tk, dk }) => (
              <div key={tk} style={{
                background:'var(--bg)', borderRadius:'var(--r-xl)', padding:22,
                border:'1px solid var(--border)', transition:'all var(--t)',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.boxShadow='var(--sh-md)'; (e.currentTarget as HTMLElement).style.background='var(--white)' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.boxShadow=''; (e.currentTarget as HTMLElement).style.background='var(--bg)' }}
              >
                <div style={{
                  width:42, height:42, borderRadius:12,
                  background:'var(--emerald-lt)', border:'1px solid rgba(16,185,129,.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14,
                }}>
                  <Icon size={18} style={{ color:'var(--emerald)' }}/>
                </div>
                <h4 style={{ fontSize:'.9rem', fontWeight:700, marginBottom:7, color:'var(--navy)' }}>{tr('about',tk)}</h4>
                <p style={{ fontSize:'.8rem', color:'var(--muted)', lineHeight:1.6 }}>{tr('about',dk)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .about-grid{ grid-template-columns:1fr !important; gap:40px !important; } }`}</style>
    </section>
  )
}
