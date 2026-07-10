import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

interface Props { tr: (s: string, k: string) => string; lang?: string }

export default function Footer({ tr }: Props) {
  return (
    <footer style={{ background:'var(--footer)', color:'#64748b', paddingTop:64, paddingBottom:32 }}>
      <div className="container">
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1.2fr', gap:48, marginBottom:48 }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <img src="/logo-64.png" alt="UFAS1" width={34} height={34} style={{ borderRadius:'50%' }}/>
              <div>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'.95rem', color:'#e2e8f0' }}>ESC Sétif 1</div>
                <div style={{ fontSize:'.65rem', color:'#475569' }}>Services & Consultations</div>
              </div>
            </div>
            <p style={{ fontSize:'.825rem', lineHeight:1.75, maxWidth:240 }}>{tr('footer','tagline')}</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'.72rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:16 }}>{tr('footer','links')}</h4>
            {['services','sectors','about','contact'].map(k => (
              ['services','contact'].includes(k) ? (
                <Link key={k} to={`/${k}`} style={{ display:'block', marginBottom:10, fontSize:'.85rem', color:'#64748b', transition:'color var(--t)' }}
                  onMouseOver={e => (e.currentTarget.style.color='var(--emerald)') }
                  onMouseOut={e => (e.currentTarget.style.color='#64748b')}
                >{tr('nav',k)}</Link>
              ) : (
                <a key={k} href={`/#${k}`} style={{ display:'block', marginBottom:10, fontSize:'.85rem', color:'#64748b', transition:'color var(--t)' }}
                  onMouseOver={e => (e.currentTarget.style.color='var(--emerald)') }
                  onMouseOut={e => (e.currentTarget.style.color='#64748b')}
                >{tr('nav',k)}</a>
              )
            ))}
          </div>

          {/* Services */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'.72rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:16 }}>{tr('nav','services')}</h4>
            {['c','t','s','r'].map(p => (
              <Link key={p} to="/services" style={{ display:'block', marginBottom:10, fontSize:'.85rem', color:'#64748b', transition:'color var(--t)' }}
                onMouseOver={e => (e.currentTarget.style.color='var(--emerald)')}
                onMouseOut={e => (e.currentTarget.style.color='#64748b')}
              >{tr('services',`${p}_title`)}</Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color:'#94a3b8', fontSize:'.72rem', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:16 }}>{tr('nav','contact')}</h4>
            {[
              { Icon:MapPin, t:tr('contact','address') },
              { Icon:Mail,   t:'contact@esc-setif1.dz' },
              { Icon:Phone,  t:'+213 36 62 00 00' },
            ].map(({ Icon, t }) => (
              <div key={t} style={{ display:'flex', gap:10, marginBottom:12, fontSize:'.825rem' }}>
                <Icon size={14} style={{ color:'var(--emerald)', flexShrink:0, marginTop:3 }}/>
                <span>{t}</span>
              </div>
            ))}
            <a href="https://www.univ-setif.dz" target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:10, fontSize:'.78rem', color:'var(--emerald)' }}>
              {tr('footer','univ')} <ExternalLink size={11}/>
            </a>
          </div>
        </div>

        <div className="footer-bottom" style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <p style={{ fontSize:'.78rem' }}>{tr('footer','rights')}</p>
          <div style={{ display:'flex', gap:20 }}>
            <Link to="/privacy" style={{ fontSize:'.78rem', color:'#64748b', transition:'color var(--t)' }}>{tr('footer','privacy')}</Link>
            <Link to="/terms"   style={{ fontSize:'.78rem', color:'#64748b', transition:'color var(--t)' }}>{tr('footer','terms')}</Link>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:900px){
          .footer-grid{ grid-template-columns:1fr 1fr !important; gap:32px !important; }
        }
        @media(max-width:560px){
          .footer-grid{ grid-template-columns:1fr !important; gap:28px !important; }
        }
        @media(max-width:480px){
          .footer-bottom{ flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
        }
      `}</style>
    </footer>
  )
}
