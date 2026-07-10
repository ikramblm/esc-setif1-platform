import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Sparkles } from 'lucide-react'

interface HeroProps { tr: (s: string, k: string) => string }

export default function HeroSection({ tr }: HeroProps) {
  return (
    <section id="home" style={{
      background: 'linear-gradient(160deg, var(--navy) 0%, #0d2040 55%, #0a1830 100%)',
      minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:-160, right:-120, width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-80, width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(30,58,110,.5) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Grid overlay */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
        backgroundSize:'56px 56px',
      }}/>

      <div className="container hero-container" style={{ position:'relative', zIndex:1, padding:'88px 24px' }}>
        {/* Badge */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:99,
          background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.25)',
          color:'#6ee7b7', fontSize:'.78rem', fontWeight:700, marginBottom:28,
          letterSpacing:'.04em', textTransform:'uppercase',
        }}>
          <Sparkles size={12}/>
          {tr('hero','badge')}
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:'var(--font-head)', fontWeight:800,
          fontSize:'clamp(2.4rem,5vw,3.8rem)', lineHeight:1.08,
          letterSpacing:'-.03em', color:'#fff',
          maxWidth:760, marginBottom:24,
        }}>
          {tr('hero','tagline')}
        </h1>

        <p style={{
          fontSize:'clamp(1rem,2vw,1.175rem)', color:'rgba(255,255,255,.68)',
          lineHeight:1.78, maxWidth:600, marginBottom:44,
        }}>
          {tr('hero','subtitle')}
        </p>

        {/* CTAs */}
        <div className="hero-ctas" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
          <Link to="/signup" className="btn btn-primary btn-xl" style={{ gap:10 }}>
            {tr('hero','cta1')} <ArrowRight size={18}/>
          </Link>
          <Link to="/services" className="btn btn-white-outline btn-xl">
            {tr('hero','cta2')}
          </Link>
        </div>

        {/* Floating card */}
        <div style={{
          position:'absolute', bottom:40, right:0,
          display:'flex', alignItems:'center', gap:12,
          background:'rgba(255,255,255,.97)', backdropFilter:'blur(12px)',
          borderRadius:'var(--r-xl)', padding:'12px 18px',
          boxShadow:'var(--sh-xl)', border:'1px solid var(--border)',
        }} className="trust-card">
          <div style={{ width:38, height:38, borderRadius:'var(--r-md)', background:'var(--emerald-lt)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Building2 size={18} style={{ color:'var(--emerald)' }}/>
          </div>
          <div>
            <div style={{ fontSize:'.8rem', fontWeight:700, color:'var(--navy)' }}>{tr('hero','trust')}</div>
            <div style={{ fontSize:'.7rem', color:'var(--muted)', marginTop:2 }}>{tr('hero','trustSub')}</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .trust-card { display: none !important; }
          .hero-container { padding: 64px 16px !important; }
        }
        @media (max-width: 480px) {
          .hero-container { padding: 48px 14px !important; }
          .hero-ctas { flex-direction: column !important; }
          .hero-ctas a { width: 100% !important; justify-content: center !important; }
        }
      `}</style>
    </section>
  )
}
