import { Link } from 'react-router-dom'
import { CtaBand, Steps } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { BUSINESS, SERVICES } from '../lib/config'

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-6 rounded-full bg-scholar/25 blur-3xl" />
      <div className="relative mx-auto flex aspect-square w-[72%] max-w-[300px] items-center justify-center rounded-full bg-white shadow-2xl ring-8 ring-white/10 sm:max-w-none">
        <img src="/brand/aec-emblem.webp" alt="AEC owl emblem" width="609" height="594" className="w-[80%]" />
      </div>
      <div className="absolute -left-8 top-[18%] hidden w-52 rounded-xl bg-white p-3.5 text-left shadow-card sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-library/10 text-library"><Icon name="eye" className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] font-medium text-slate">AEC-2611-0087</p>
            <p className="text-sm font-semibold text-navy">Chapter 4 ready to preview</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-6 bottom-[10%] hidden w-56 rounded-xl bg-white p-3.5 text-left shadow-card sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-scholar/15 text-action"><Icon name="check" className="h-4 w-4" /></span>
          <div>
            <p className="text-[11px] font-medium text-slate">Payment confirmed</p>
            <p className="text-sm font-semibold text-navy">Download unlocked</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { open } = useConsultation()
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full border-[40px] border-white/[0.03]" />
        <div className="wrap relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="eyebrow">Theses · Dissertations · Assignments</p>
            <h1 className="mt-4 text-[2.15rem] font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-[3.4rem]">
              Academic work done to the standard your <span className="text-scholar">supervisor</span> expects.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              From topic to defence, AEC helps undergraduate and graduate students in Ghana with theses, long essays,
              proposals, data analysis and assignments, formatted to your school's guidelines.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => open()} className="btn-primary px-6 py-3.5 text-base"><WhatsAppIcon /> Book a free consultation</button>
              <Link to="/order" className="btn-ghost px-6 py-3.5 text-base">Place an order <Icon name="arrow" className="h-4 w-4" /></Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {['UGBS and UCC formats', 'APA 7 and Harvard', 'R, SPSS, Stata, SmartPLS'].map((t) => (
                <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-scholar" />{t}</li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Services */}
      <section className="wrap py-16 sm:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">What we do</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Every stage of your academic work</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold no-underline">All services →</Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link key={s.slug} to={`/services#${s.slug}`} className="card group no-underline transition-shadow hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-scholar"><Icon name={s.icon} /></span>
              <h3 className="mt-5 text-lg font-bold">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{s.short}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-library">
                Learn more <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900 py-16 sm:py-24">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">Four steps, and you see the work before you pay in full</h2>
          <div className="mt-10"><Steps dark /></div>
        </div>
      </section>

      {/* Trust */}
      <section className="wrap grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Pay with confidence</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Clear terms from the first message</h2>
          <p className="mt-4 text-slate leading-relaxed">
            You know the price before work starts, you see a preview before you pay the balance, and
            every payment is checked against our MoMo records before your file is released.
          </p>
          <Link to="/how-it-works" className="mt-6 inline-flex text-sm font-semibold no-underline">See the full process →</Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: 'shield', t: 'Confidential', d: 'Your name, school and supervisor are never shared or published.' },
            { icon: 'eye', t: `${BUSINESS.previewPercent}% preview first`, d: 'Check the quality on the site before you pay the balance.' },
            { icon: 'phone', t: `${BUSINESS.depositPercent}% to start`, d: `Deposit and balance paid by ${BUSINESS.momo.network}. No card needed.` },
            { icon: 'clock', t: 'Deadlines tracked', d: 'Every order has a delivery date you can follow on your order page.' },
          ].map((x) => (
            <li key={x.t} className="rounded-2xl bg-mist p-5">
              <span className="text-action"><Icon name={x.icon} className="h-6 w-6" /></span>
              <h3 className="mt-3 text-base font-bold">{x.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate">{x.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </>
  )
}
