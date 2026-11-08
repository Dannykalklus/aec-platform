import { PageHeader } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { BUSINESS } from '../lib/config'
import { waLink } from '../lib/whatsapp'

export default function Contact() {
  const { open } = useConsultation()
  return (
    <>
      <PageHeader eyebrow="Contact" title="Talk to AEC">
        WhatsApp is the fastest way to reach us.
      </PageHeader>
      <section className="wrap grid gap-6 py-16 md:grid-cols-3">
        <div className="card">
          <span className="text-action"><WhatsAppIcon className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-bold">WhatsApp</h2>
          <p className="mt-1 text-slate">{BUSINESS.whatsappDisplay}</p>
          <a href={waLink('Hello AEC.')} target="_blank" rel="noreferrer" className="btn-primary mt-5 w-full">Open chat</a>
        </div>
        <div className="card">
          <span className="text-library"><Icon name="chat" className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-bold">Free consultation</h2>
          <p className="mt-1 text-slate">Tell us about your work in a short form, then continue on WhatsApp.</p>
          <button onClick={() => open()} className="btn-navy mt-5 w-full">Start</button>
        </div>
        <div className="card">
          <span className="text-tassel"><Icon name="clock" className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-bold">Where we are</h2>
          <p className="mt-1 text-slate">{BUSINESS.location}. We work with students across Ghana and abroad online.</p>
          {BUSINESS.email && <a href={`mailto:${BUSINESS.email}`} className="mt-5 inline-block text-sm font-semibold">{BUSINESS.email}</a>}
        </div>
      </section>
    </>
  )
}
