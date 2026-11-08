import { Link } from 'react-router-dom'
import { BUSINESS } from '../lib/config'
import { useConsultation } from './Consultation'
import Icon, { WhatsAppIcon } from './Icon'

export function PageHeader({ eyebrow, title, children }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-scholar/15" />
      <div className="wrap relative py-14 sm:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-white sm:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{children}</div>}
      </div>
    </section>
  )
}

export const STEPS = [
  { icon: 'chat', title: 'Talk to us', text: 'Book a free consultation. We agree the scope, timeline and price with you on WhatsApp.' },
  { icon: 'upload', title: 'Send your brief', text: `Share your topic, guidelines and supervisor comments. Pay a ${BUSINESS.depositPercent}% deposit and work begins.` },
  { icon: 'eye', title: 'Preview the work', text: `When it is ready, you preview ${BUSINESS.previewPercent}% of it on the site, watermarked, before paying the balance.` },
  { icon: 'lock', title: 'Pay and download', text: `Pay the balance by ${BUSINESS.momo.network}. Once we confirm it, your download unlocks.` },
]

export function Steps({ dark = false }) {
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <li key={s.title} className={`relative rounded-2xl p-6 ${dark ? 'bg-white/[0.06] ring-1 ring-white/10' : 'card'}`}>
          <div className="flex items-center justify-between">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${dark ? 'bg-scholar/20 text-scholar' : 'bg-scholar/10 text-action'}`}>
              <Icon name={s.icon} />
            </span>
            <span className={`font-display text-3xl font-extrabold ${dark ? 'text-white/15' : 'text-navy/10'}`}>0{i + 1}</span>
          </div>
          <h3 className={`mt-5 text-lg font-bold ${dark ? 'text-white' : ''}`}>{s.title}</h3>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-white/70' : 'text-slate'}`}>{s.text}</p>
        </li>
      ))}
    </ol>
  )
}

export function CtaBand({ title = 'Not sure where to start?', text = 'Tell us where you are with your work. The first conversation is free.' }) {
  const { open } = useConsultation()
  return (
    <section className="wrap py-16">
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-12 text-center sm:px-12">
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full border-[24px] border-scholar/20" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tassel/10" />
        <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">{title}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-white/75">{text}</p>
        <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => open()} className="btn-primary px-6 py-3.5"><WhatsAppIcon /> Book a free consultation</button>
          <Link to="/services" className="btn-ghost px-6 py-3.5">Browse services</Link>
        </div>
      </div>
    </section>
  )
}
