import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CtaBand, PageHeader } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon from '../components/Icon'
import { SERVICES } from '../lib/config'

export default function Services() {
  const { open } = useConsultation()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <>
      <PageHeader eyebrow="Services" title="Support for theses, long essays, dissertations and assignments">
        Choose the help you need, from a single chapter to the full project. Not sure which fits? Book a free consultation.
      </PageHeader>
      <section className="wrap space-y-6 py-16">
        {SERVICES.map((s, i) => (
          <article key={s.slug} id={s.slug} className="card scroll-mt-24 grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-scholar"><Icon name={s.icon} className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-xs font-semibold text-slate">0{i + 1}</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">{s.name}</h2>
              <p className="mt-2 text-slate">{s.short}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-scholar" />{p}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => open(s.name)} className="btn-primary md:self-center">Ask about this</button>
          </article>
        ))}
      </section>
      <CtaBand />
    </>
  )
}
