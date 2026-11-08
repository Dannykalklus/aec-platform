import { CtaBand, PageHeader, Steps } from '../components/Blocks'
import Icon from '../components/Icon'
import { BUSINESS } from '../lib/config'

const STATUSES = [
  ['Awaiting quote', 'We are reviewing your brief.'],
  ['Quote sent', 'Your price and delivery date are ready to accept.'],
  ['Awaiting deposit', `Pay ${BUSINESS.depositPercent}% to start.`],
  ['In progress', 'We are working on your order.'],
  ['Ready for preview', 'Preview the work and pay the balance.'],
  ['Payment submitted', 'We are checking your payment.'],
  ['Delivered', 'Your download is unlocked.'],
]

export default function HowItWorks() {
  return (
    <>
      <PageHeader eyebrow="How it works" title="From first message to final download">
        A simple process with the price agreed up front and a preview before you pay in full.
      </PageHeader>
      <section className="wrap py-16"><Steps /></section>

      <section className="bg-mist py-16">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Paying by MoMo</p>
            <h2 className="mt-2 text-3xl font-extrabold">How payment works</h2>
            <ol className="mt-6 space-y-4">
              {[
                `Send the amount due to ${BUSINESS.momo.network} ${BUSINESS.momo.number} (${BUSINESS.momo.accountName}).`,
                'Use your order number as the payment reference.',
                'On your order page, tap "I have paid" and enter the transaction ID from your MoMo message.',
                'Send the screenshot on WhatsApp using the button provided.',
                'We confirm the payment against our MoMo records, and your order moves forward.',
              ].map((t, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{i + 1}</span>
                  <p className="pt-1 text-ink/90">{t}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold">Follow your order</h3>
            <p className="mt-1 text-sm text-slate">Your order page always shows where things stand.</p>
            <ul className="mt-5 space-y-3">
              {STATUSES.map(([s, d], i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === STATUSES.length - 1 ? 'bg-scholar' : i === 5 ? 'bg-tassel' : 'bg-library'}`} />
                  <p className="text-sm"><span className="font-semibold text-navy">{s}.</span> <span className="text-slate">{d}</span></p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-navy p-4 text-sm text-white/85">
              <Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0 text-tassel" />
              The full file stays locked until the balance is confirmed. The preview shows {BUSINESS.previewPercent}% of the pages with an AEC watermark.
            </div>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  )
}
