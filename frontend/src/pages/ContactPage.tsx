import ContactSection from '../components/ContactSection'

interface Props { tr: (s: string, k: string) => string }

export default function ContactPage({ tr }: Props) {
  return (
    <main style={{ paddingTop: 32 }}>
      <ContactSection tr={tr}/>
    </main>
  )
}
