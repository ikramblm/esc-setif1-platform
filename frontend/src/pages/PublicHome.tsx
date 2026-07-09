import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import HeroSection from '../components/HeroSection'
import ServicesSection from '../components/ServicesSection'
import SectorsSection from '../components/SectorsSection'
import AboutSection from '../components/AboutSection'
import type { Lang } from '../lib/i18n'

interface PublicHomeProps {
  tr: (s: string, k: string) => string
  lang: Lang
}

export default function PublicHome({ tr }: PublicHomeProps) {
  return (
    <main>
      <HeroSection tr={tr}/>
      <ServicesSection tr={tr}/>
      <SectorsSection tr={tr}/>

      {/* CTA Band */}
      <section style={{ background:'linear-gradient(135deg,var(--navy) 0%,var(--navy-light) 100%)', padding:'80px 0', textAlign:'center', position:'relative', overflow:'hidden' }}>
        {/* decorative blobs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-30%', right:'-10%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.15) 0%,transparent 70%)' }}/>
          <div style={{ position:'absolute', bottom:'-20%', left:'-5%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)' }}/>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div className="section-label" style={{ background:'rgba(16,185,129,.15)', color:'#6ee7b7', borderColor:'rgba(16,185,129,.25)', margin:'0 auto 20px' }}>
            {tr('cta','label')}
          </div>
          <h2 style={{ color:'#fff', fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:800, fontFamily:'var(--font-head)', marginBottom:16, lineHeight:1.2 }}>
            {tr('cta','title')}
          </h2>
          <p style={{ color:'rgba(255,255,255,.65)', marginBottom:36, maxWidth:500, margin:'0 auto 36px', fontSize:'1rem', lineHeight:1.7 }}>
            {tr('cta','subtitle')}
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding:'13px 28px', fontSize:'1rem' }}>
              {tr('cta','register')} <ArrowRight size={16}/>
            </Link>
            <Link to="/login" className="btn btn-white-outline" style={{ padding:'13px 28px', fontSize:'1rem' }}>
              {tr('cta','login')}
            </Link>
          </div>
        </div>
      </section>

      <AboutSection tr={tr}/>
    </main>
  )
}
