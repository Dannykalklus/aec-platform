import { PageHeader } from '../components/Blocks'
import { BUSINESS } from '../lib/config'

// Draft wording from the PRD. Have a lawyer review before launch.
const UPDATED = 'November 2026'

export function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of service" />
      <section className="wrap prose-legal max-w-3xl py-14">
        <p className="text-sm text-slate">Last updated {UPDATED}</p>
        <h2>1. Who we are</h2>
        <p>{BUSINESS.name} ("AEC") provides academic consulting, research support, data analysis, editing and related services from {BUSINESS.location}.</p>
        <h2>2. Your order</h2>
        <p>You agree to give an accurate brief and to share the guidelines, files and feedback the work needs in good time. Delays in sending these can move the delivery date.</p>
        <h2>3. Prices and payment</h2>
        <p>The price is agreed before work starts. A {BUSINESS.depositPercent}% deposit is paid before work begins and the balance is paid before the full work is released. Payment is by {BUSINESS.momo.network}. See our <a href="/refunds">payment and refund policy</a>.</p>
        <h2>4. How you use the work</h2>
        <p>Work delivered by AEC is model and reference material to support your own learning, research and writing. You are responsible for how you use it and for following your institution's rules.</p>
        <h2>5. Confidentiality</h2>
        <p>We do not share your identity, institution, supervisor or files with anyone, and we do not publish client work.</p>
        <h2>6. Revisions</h2>
        <p>Revision terms are agreed with each order. Changes outside the agreed scope, such as a new topic or new objectives, may be quoted separately.</p>
        <h2>7. Contact</h2>
        <p>Questions about these terms can be sent on WhatsApp to {BUSINESS.whatsappDisplay}.</p>
      </section>
    </>
  )
}

export function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy policy" />
      <section className="wrap prose-legal max-w-3xl py-14">
        <p className="text-sm text-slate">Last updated {UPDATED}</p>
        <h2>What we collect</h2>
        <ul>
          <li>Contact details: name, WhatsApp number and email.</li>
          <li>Order details: topic, level, institution, programme, deadline and the files you upload.</li>
          <li>Payment details: MoMo transaction ID, sender number and name, and any screenshot you send.</li>
        </ul>
        <h2>Why we collect it</h2>
        <p>To reply to you, deliver your order, confirm your payments and keep a record of each order.</p>
        <h2>Who can see it</h2>
        <p>Only AEC. Files are kept in private storage and shared with you through links that expire. We do not sell or share your data.</p>
        <h2>How long we keep it</h2>
        <p>Order files are deleted six months after an order closes, unless you ask us to keep them. Basic order and payment records are kept for accounting.</p>
        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete your information by messaging {BUSINESS.whatsappDisplay}. We handle personal data in line with Ghana's Data Protection Act, 2012 (Act 843).</p>
      </section>
    </>
  )
}

export function Refunds() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Payments and refunds" />
      <section className="wrap prose-legal max-w-3xl py-14">
        <p className="text-sm text-slate">Last updated {UPDATED}</p>
        <h2>How to pay</h2>
        <p>Send payments to {BUSINESS.momo.network} {BUSINESS.momo.number}, registered to {BUSINESS.momo.accountName}. Use your order number as the reference. Any sending charges are paid by the sender.</p>
        <h2>Deposit and balance</h2>
        <p>{BUSINESS.depositPercent}% is paid before work starts, for theses and assignments alike. The balance is paid after you preview the finished work and before you download it.</p>
        <h2>Payment checks</h2>
        <p>We confirm every payment against our MoMo records before releasing work. A screenshot alone is not proof of payment. A transaction ID can only be used once.</p>
        <h2>Refunds</h2>
        <ul>
          <li>The deposit is not refundable once work has started.</li>
          <li>If we miss the agreed delivery date by more than 72 hours without telling you, you can ask for a full refund of what you have paid.</li>
          <li>No refunds are given after the full work has been downloaded.</li>
          <li>Any concern should be raised with us on WhatsApp first so we can put it right.</li>
        </ul>
      </section>
    </>
  )
}
