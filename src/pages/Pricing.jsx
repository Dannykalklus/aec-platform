import { CtaBand, PageHeader } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { BUSINESS } from '../lib/config'
import { waLink } from '../lib/whatsapp'

const cedi = (n) => `GH₵ ${n.toLocaleString('en-GH')}`

export default function Pricing() {
  const { open } = useConsultation()
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Straightforward prices, agreed before work starts">
        Every order begins with a {BUSINESS.depositPercent}% deposit. The balance is due after you preview the finished work.
      </PageHeader>
      <section className="wrap grid gap-6 py-16 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white">
          <span className="inline-block rounded-full bg-tassel px-3 py-1 font-display text-xs font-bold text-navy">Full project</span>
          <h2 className="mt-5 text-2xl font-extrabold text-white">Thesis, Long Essay or Dissertation</h2>
          <p className="mt-6 font-display text-5xl font-extrabold text-white">{cedi(BUSINESS.thesisStandardPrice)}</p>
          <p className="mt-2 text-white/70">Standard price. Your final price can be discussed on WhatsApp.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/85">
            {['Chapters 1 to 5 to your school\'s format', 'Data analysis and write-up', 'References in APA 7 or your required style', `${cedi(BUSINESS.thesisStandardPrice * BUSINESS.depositPercent / 100)} deposit to start`].map((p) => (
              <li key={p} className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-scholar" />{p}</li>
            ))}
          </ul>
          <button onClick={() => open('Thesis, Long Essay and Dissertation')} className="btn-primary mt-8 w-full py-3.5"><WhatsAppIcon /> Discuss my project</button>
        </div>
        <div className="card flex flex-col p-8">
          <span className="inline-block w-fit rounded-full bg-library/10 px-3 py-1 font-display text-xs font-bold text-library">Case by case</span>
          <h2 className="mt-5 text-2xl font-extrabold">Assignments and other work</h2>
          <p className="mt-6 font-display text-4xl font-extrabold text-navy">Quoted</p>
          <p className="mt-2 text-slate">Priced on the scope, level and deadline. Send the details and we'll quote on WhatsApp.</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            {['Assignments at any level', 'Proposals and single chapters', 'Data analysis only', 'Presentations, formatting and editing'].map((p) => (
              <li key={p} className="flex gap-2"><Icon name="check" className="h-5 w-5 shrink-0 text-scholar" />{p}</li>
            ))}
          </ul>
          <a href={waLink('Hello AEC, I would like a quote for an assignment.')} target="_blank" rel="noreferrer" className="btn-navy mt-auto w-full py-3.5">
            <WhatsAppIcon /> Get a quote on WhatsApp
          </a>
        </div>
      </section>
      <section className="wrap pb-4">
        <div className="grid gap-4 rounded-2xl bg-mist p-6 text-sm sm:grid-cols-3">
          <p><span className="font-semibold text-navy">Payment method.</span> {BUSINESS.momo.network} {BUSINESS.momo.number}, {BUSINESS.momo.accountName}.</p>
          <p><span className="font-semibold text-navy">Deposit.</span> {BUSINESS.depositPercent}% before work starts, for theses and assignments.</p>
          <p><span className="font-semibold text-navy">Balance.</span> Paid after the preview, before you download.</p>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
