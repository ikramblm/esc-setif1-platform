import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { sanitizeInput, isValidEmail } from '../lib/security'

interface Props { tr: (s: string, k: string) => string }

export default function ContactSection({ tr }: Props) {
  const [form, setForm] = useState({ name:'', email:'', message:'' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim())       e.name    = tr('contact','nameErr')
    if (!isValidEmail(form.email)) e.email  = tr('contact','emailErr')
    if (form.message.length < 20)  e.message = tr('contact','msgErr')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    console.log({ name:sanitizeInput(form.name), email:form.email, message:sanitizeInput(form.message) })
    setSent(true)
  }

  return (
    <section id="contact" style={{ background:'var(--navy)' }} className="section">
      <div className="container">
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div className="section-label" style={{ background:'rgba(16,185,129,.15)', color:'#6ee7b7', borderColor:'rgba(16,185,129,.25)' }}>
            {tr('contact','sectionLabel')}
          </div>
          <h2 className="h1" style={{ color:'#fff', marginBottom:12 }}>{tr('contact','title')}</h2>
          <p style={{ color:'rgba(255,255,255,.6)', maxWidth:420, margin:'0 auto', fontSize:'.975rem' }}>{tr('contact','subtitle')}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:56, alignItems:'start' }} className="contact-grid">
          {/* Info */}
          <div>
            {[
              { Icon:MapPin, text:tr('contact','address') },
              { Icon:Mail,   text:'contact@esc-setif1.dz' },
              { Icon:Phone,  text:'+213 36 62 00 00' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display:'flex', gap:14, marginBottom:28 }}>
                <div style={{ width:42, height:42, flexShrink:0, borderRadius:12, background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={17} style={{ color:'var(--emerald)' }}/>
                </div>
                <div style={{ color:'rgba(255,255,255,.72)', fontSize:'.9rem', paddingTop:11 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* Form / Success */}
          {sent ? (
            <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:'var(--r-2xl)', padding:48, textAlign:'center' }}>
              <CheckCircle size={48} style={{ color:'var(--emerald)', margin:'0 auto 16px' }}/>
              <h3 style={{ color:'#fff', fontSize:'1.2rem', marginBottom:8 }}>{tr('contact','sent')}</h3>
              <p style={{ color:'rgba(255,255,255,.6)', fontSize:'.9rem' }}>{tr('contact','sentSub')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{
              background:'rgba(255,255,255,.055)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(255,255,255,.1)', borderRadius:'var(--r-2xl)', padding:36,
            }}>
              <div className="contact-form-row" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                {[
                  { key:'name', type:'text',  label:tr('contact','name') },
                  { key:'email',type:'email', label:tr('contact','email') },
                ].map(({ key, type, label }) => (
                  <div className="form-group" key={key}>
                    <label style={{ color:'rgba(255,255,255,.75)', fontSize:'.8rem', fontWeight:600 }}>{label}</label>
                    <input type={type}
                      className={`form-input${errors[key] ? ' error' : ''}`}
                      style={{ background:'rgba(255,255,255,.08)', color:'#fff', borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,.15)' }}
                      value={(form as Record<string,string>)[key]}
                      onChange={e => setForm({ ...form, [key]:e.target.value })}
                    />
                    {errors[key] && <span style={{ fontSize:'.75rem', color:'#fca5a5' }}>{errors[key]}</span>}
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ marginBottom:24 }}>
                <label style={{ color:'rgba(255,255,255,.75)', fontSize:'.8rem', fontWeight:600 }}>{tr('contact','message')}</label>
                <textarea rows={5} className={`form-input${errors.message ? ' error' : ''}`}
                  style={{ background:'rgba(255,255,255,.08)', color:'#fff', borderColor: errors.message ? '#ef4444' : 'rgba(255,255,255,.15)', resize:'vertical' }}
                  value={form.message} onChange={e => setForm({ ...form, message:e.target.value })}
                />
                {errors.message && <span style={{ fontSize:'.75rem', color:'#fca5a5' }}>{errors.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ padding:'13px 0', fontSize:'1rem' }}>
                <Send size={16}/> {tr('contact','send')}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @media(max-width:768px){
          .contact-grid{ grid-template-columns:1fr !important; gap:32px !important; }
          .contact-form-row{ grid-template-columns:1fr !important; }
        }
      `}</style>
    </section>
  )
}
