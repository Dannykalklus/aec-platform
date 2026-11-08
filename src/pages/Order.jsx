import { PageHeader } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { waLink } from '../lib/whatsapp'

// Placeholder until the order form ships in Week 3 of the build.
export default function Order() {
  const { open } = useConsultation()
  return (
    <>
      <PageHeader eyebrow="Place an order" title="Online ordering opens soon">
        You'll soon be able to submit your brief, upload files and follow your order here. For now, send your details on WhatsApp.
      </PageHeader>
      <section className="wrap max-w-2xl py-16">
        <div className="card text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-scholar/10 text-action"><Icon name="upload" className="h-7 w-7" /></span>
          <h2 className="mt-5 text-xl font-bold">Start your order on WhatsApp</h2>
          <p className="mt-2 text-slate">Share your topic, level, institution, deadline and any guidelines. We'll send your quote and order number.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => open()} className="btn-primary"><WhatsAppIcon /> Fill a short form</button>
            <a href={waLink('Hello AEC, I would like to place an order.')} target="_blank" rel="noreferrer" className="btn-outline">Message directly</a>
          </div>
        </div>
      </section>
    </>
  )
}
