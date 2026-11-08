import { CtaBand, PageHeader } from '../components/Blocks'
import { BUSINESS } from '../lib/config'

export const FAQS = [
  ['Is my information kept private?', 'Yes. Your name, school, supervisor and files are never shared or published. Only AEC sees your order.'],
  ['How much does a thesis cost?', `The standard price is GH₵ ${BUSINESS.thesisStandardPrice.toLocaleString('en-GH')}. The final price can be discussed on WhatsApp, depending on your level, method and deadline.`],
  ['How are assignments priced?', 'Case by case, based on the scope, level and deadline. Send the details on WhatsApp for a quote.'],
  ['How do I pay?', `By ${BUSINESS.momo.network} to ${BUSINESS.momo.number} (${BUSINESS.momo.accountName}). Pay ${BUSINESS.depositPercent}% before work starts and the balance before you download.`],
  ['Can I see the work before paying the balance?', `Yes. When your work is ready, you can preview ${BUSINESS.previewPercent}% of it on the site with an AEC watermark. The full file unlocks once your balance is confirmed.`],
  ['Do I need an account to order?', 'No. You can order as a guest with your name and WhatsApp number. We send you a private link to follow your order. You can create an account if you prefer to keep all your orders in one place.'],
  ['How long does it take?', 'It depends on the work. We agree a delivery date with you before you pay the deposit, and you can follow it on your order page.'],
  ['Which formats and styles do you follow?', 'Your institution\'s guidelines, including UGBS and UCC formats, with APA 7, Harvard or the referencing style you need.'],
  ['What if my supervisor asks for changes?', 'Send us the comments through WhatsApp or your order page. Revision terms are agreed with each order.'],
]

export default function Faq() {
  return (
    <>
      <PageHeader eyebrow="FAQs" title="Questions students often ask" />
      <section className="wrap max-w-3xl py-16">
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-navy">
                {q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-lg text-navy transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand title="Still have a question?" text="Ask us directly on WhatsApp. We usually reply within working hours." />
    </>
  )
}
