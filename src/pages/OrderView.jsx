import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { useAuth } from '../lib/auth'
import { BUSINESS } from '../lib/config'
import { amountDue, callFn, cedi, guestLink, STATUS } from '../lib/orders'
import { supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'
import { StatusPill } from './Account'

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')

function GuestLinkBox({ orderNumber, token }) {
  const link = guestLink(orderNumber, token)
  const [copied, setCopied] = useState(false)
  return (
    <div className="rounded-2xl border border-tassel/40 bg-tassel/10 p-5">
      <p className="font-semibold text-navy">Save your private order link</p>
      <p className="mt-1 text-sm text-ink/80">Anyone with this link can see this order, so keep it to yourself. It is also saved on this device.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={link} className="field bg-white text-sm" onFocus={(e) => e.target.select()} />
        <button type="button" className="btn-navy shrink-0" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true) }}>{copied ? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  )
}

function PaymentBox({ order, token, onDone }) {
  const due = amountDue(order)
  const [f, setF] = useState({ txn: '', number: '', name: '', amount: due.amount ? String(due.amount) : '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(null)
  if (!due.kind) return null
  const stage = due.kind === 'deposit' ? `${order.deposit_percent}% deposit` : 'balance'

  async function submit(e) {
    e.preventDefault(); setErr('')
    const amount = Number(f.amount)
    if (!f.txn.trim() || !f.number.trim() || !f.name.trim() || !amount) return setErr('Fill in all four fields.')
    setBusy(true)
    const { error } = await supabase.rpc('submit_payment', {
      p_order: order.id, p_kind: due.kind, p_amount: amount, p_txn_id: f.txn.trim(),
      p_sender_number: f.number.trim(), p_sender_name: f.name.trim(), p_screenshot_path: null, p_token: token || null,
    })
    setBusy(false)
    if (error) return setErr(error.message)
    setSent({ amount, txn: f.txn.trim() })
  }

  if (sent) {
    const msg = `Payment for ${order.order_number}: ${cedi(sent.amount)} (${stage}), Txn ID ${sent.txn}. Screenshot attached.`
    return (
      <div className="card border-scholar/40">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-scholar/15 text-action"><Icon name="check" /></span>
          <h2 className="text-lg font-bold">Payment details sent</h2></div>
        <p className="mt-3 text-sm text-ink/85">Last step: send your MoMo screenshot on WhatsApp. We'll confirm it against our MoMo records.</p>
        <a href={waLink(msg)} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full py-3.5" onClick={() => setTimeout(onDone, 800)}>
          <WhatsAppIcon /> Send screenshot on WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold">Pay the {stage}: {cedi(due.amount)}</h2>
      <div className="mt-4 grid gap-3 rounded-xl bg-navy p-5 text-white sm:grid-cols-3">
        <div><p className="text-xs text-white/60">{BUSINESS.momo.network}</p><p className="font-display text-lg font-bold">{BUSINESS.momo.number}</p></div>
        <div><p className="text-xs text-white/60">Account name</p><p className="font-semibold">{BUSINESS.momo.accountName}</p></div>
        <div><p className="text-xs text-white/60">Reference</p><p className="font-display font-bold text-tassel">{order.order_number}</p></div>
      </div>
      <p className="mt-3 text-xs text-slate">Any sending charges are paid by the sender. After paying, fill in the details from your MoMo message.</p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="p-txn">Transaction ID</label><input id="p-txn" className="field" value={f.txn} onChange={(e) => setF({ ...f, txn: e.target.value })} placeholder="From your MoMo SMS" /></div>
        <div><label className="label" htmlFor="p-amt">Amount sent (GH₵)</label><input id="p-amt" className="field" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-num">Number you paid from</label><input id="p-num" className="field" inputMode="tel" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-name">Name on that MoMo account</label><input id="p-name" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        {err && <p className="text-sm text-alert sm:col-span-2">{err}</p>}
        <button disabled={busy} className="btn-primary py-3.5 sm:col-span-2">{busy ? 'Sending…' : 'I have paid'}</button>
      </form>
    </div>
  )
}

function Preview({ d, onDownload, downloading }) {
  return (
    <div className="card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold">{d.label} <span className="text-sm font-normal text-slate">· version {d.version}</span></h2>
          <p className="text-sm text-slate">{d.preview_page_count} pages{d.locked ? ` · preview shows the first ${BUSINESS.previewPercent}% clearly` : ''}</p>
        </div>
        {d.locked
          ? <span className="inline-flex items-center gap-2 rounded-lg bg-mist px-3 py-2 text-sm font-semibold text-slate"><Icon name="lock" className="h-4 w-4" /> Locked until balance is confirmed</span>
          : <button onClick={() => onDownload(d.id)} disabled={downloading || d.downloads_left === 0} className="btn-primary">{downloading ? 'Preparing…' : `Download (${d.downloads_left} left)`}</button>}
      </div>
      {d.previews.length > 0 && (
        <div className="mt-5 max-h-[75vh] select-none space-y-4 overflow-y-auto rounded-xl bg-[#525a66] p-3 sm:p-5"
             onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
          {d.previews.map((src, i) => (
            <img key={i} src={src} alt={`Preview page ${i + 1}`} loading="lazy" draggable="false" className="pointer-events-none mx-auto w-full max-w-3xl bg-white shadow-lg" />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrderView() {
  const { orderNumber } = useParams()
  const [params] = useSearchParams()
  const token = params.get('t')
  const isNew = params.get('new') === '1'
  const failed = Number(params.get('failed') || 0)
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    try { setData(await callFn('order-get', { orderNumber, token })); setErr('') } catch (e) { setErr(e.message) }
  }, [orderNumber, token])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  async function accept() {
    setBusy('accept')
    const { error } = await supabase.rpc('accept_quote', { p_order: data.order.id, p_token: token || null })
    setBusy('')
    if (error) setErr(error.message); else load()
  }

  async function download(deliverableId) {
    setBusy(deliverableId)
    try { const { url } = await callFn('download', { orderNumber, token, deliverableId }); window.location.href = url; setTimeout(load, 1500) }
    catch (e) { setErr(e.message) }
    setBusy('')
  }

  if (err && !data) {
    return (
      <section className="wrap max-w-xl py-20 text-center">
        <h1 className="text-2xl font-extrabold">We couldn't open this order</h1>
        <p className="mt-2 text-slate">{err} Check the link, or {user ? 'look in your account' : 'log in if you ordered with an account'}.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={user ? '/account' : '/login'} className="btn-navy">{user ? 'My orders' : 'Log in'}</Link>
          <a href={waLink(`Hello AEC, I can't open my order ${orderNumber}.`)} target="_blank" rel="noreferrer" className="btn-outline">Ask on WhatsApp</a>
        </div>
      </section>
    )
  }
  if (!data) return <div className="wrap py-20 text-slate">Loading your order…</div>

  const { order, deliverables, payments, files } = data
  const st = STATUS[order.status]
  const due = amountDue(order)

  return (
    <section className="bg-mist py-10 sm:py-14">
      <div className="wrap grid max-w-5xl gap-6">
        {isNew && (
          <div className="rounded-2xl bg-navy p-6 text-white">
            <p className="eyebrow">Order received</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white">Thank you. Your order number is {order.order_number}.</h1>
            <p className="mt-2 text-white/80">We'll review your brief and send a quote here. You can also message us to speed things up.</p>
            {failed > 0 && <p className="mt-3 rounded-lg bg-alert/20 p-3 text-sm">{failed} file(s) did not upload. Please send them on WhatsApp.</p>}
            <a href={waLink(`Hello AEC, I just placed order ${order.order_number}.`)} target="_blank" rel="noreferrer" className="btn-primary mt-5"><WhatsAppIcon /> Tell AEC on WhatsApp</a>
          </div>
        )}
        {token && <GuestLinkBox orderNumber={order.order_number} token={token} />}

        <div className="card">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold text-slate">{order.order_number} · {order.services?.name}</p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{order.topic}</h2>
            </div>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-3 text-ink/85">{st?.text}</p>
          <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-4">
            <div><dt className="text-slate">Price</dt><dd className="font-semibold text-navy">{order.quoted_price ? cedi(order.quoted_price) : 'Quote pending'}</dd></div>
            <div><dt className="text-slate">Paid</dt><dd className="font-semibold text-navy">{cedi(order.amount_paid)}</dd></div>
            <div><dt className="text-slate">Delivery date</dt><dd className="font-semibold text-navy">{fmtDate(order.delivery_date)}</dd></div>
            <div><dt className="text-slate">Your deadline</dt><dd className="font-semibold text-navy">{fmtDate(order.deadline)}</dd></div>
          </dl>
        </div>

        {err && <p className="rounded-lg bg-alert/10 p-3 text-sm text-alert">{err}</p>}

        {order.status === 'quote_sent' && (
          <div className="card border-tassel/50">
            <h2 className="text-lg font-bold">Your quote: {cedi(order.quoted_price)}</h2>
            <p className="mt-1 text-sm text-slate">Delivery by {fmtDate(order.delivery_date)}. A {order.deposit_percent}% deposit ({cedi(order.quoted_price * order.deposit_percent / 100)}) starts the work; the balance is paid after you preview it.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button onClick={accept} disabled={busy === 'accept'} className="btn-primary">{busy === 'accept' ? 'Accepting…' : 'Accept quote'}</button>
              <a href={waLink(`Hello AEC, I have a question about the quote for ${order.order_number}.`)} target="_blank" rel="noreferrer" className="btn-outline"><WhatsAppIcon /> Discuss on WhatsApp</a>
            </div>
          </div>
        )}

        {order.status === 'payment_rejected' && payments[0]?.reason && (
          <div className="rounded-xl border border-alert/30 bg-alert/5 p-4 text-sm"><span className="font-semibold text-alert">Reason: </span>{payments[0].reason}</div>
        )}

        {due.kind && <PaymentBox order={order} token={token} onDone={load} />}

        {deliverables.map((d) => <Preview key={d.id} d={d} onDownload={download} downloading={busy === d.id} />)}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-bold">Payments</h2>
            {payments.length === 0 ? <p className="mt-2 text-sm text-slate">None yet.</p> : (
              <ul className="mt-3 divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <span><span className="font-semibold capitalize text-navy">{p.kind}</span> · {cedi(p.amount)} <span className="text-slate">· {fmtDate(p.created_at)}</span></span>
                    <span className={`text-xs font-semibold capitalize ${p.status === 'confirmed' ? 'text-action' : p.status === 'rejected' ? 'text-alert' : 'text-[#8a6407]'}`}>{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2 className="text-lg font-bold">Your brief</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              {[['Level', order.level], ['Institution', order.institution], ['Programme', order.programme], ['Method', order.method], ['Referencing', order.referencing_style], ['Length', order.length_text]]
                .filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-28 shrink-0 text-slate">{k}</dt><dd className="text-navy">{v}</dd></div>)}
            </dl>
            {files.length > 0 && <p className="mt-3 text-sm text-slate">{files.length} file(s) uploaded: {files.map((x) => x.file_name).join(', ')}</p>}
          </div>
        </div>

        <div className="text-center">
          <a href={waLink(`Hello AEC, about my order ${order.order_number}:`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold"><WhatsAppIcon /> Questions about this order? Message AEC</a>
        </div>
      </div>
    </section>
  )
}
