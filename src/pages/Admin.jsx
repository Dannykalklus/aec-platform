import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useParams } from 'react-router-dom'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { useAuth } from '../lib/auth'
import { BUSINESS } from '../lib/config'
import { callFn, cedi, STATUS } from '../lib/orders'
import { buildPreviews } from '../lib/preview'
import { supabase } from '../lib/supabase'
import { StatusPill } from './Account'

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-')
const fmtTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-')
const clientName = (o) => o.profiles?.full_name || o.guest_name || o.profiles?.email || 'Client'
const clientPhone = (o) => o.profiles?.whatsapp || o.guest_whatsapp || ''
export function waTo(phone, text = '') {
  const digits = (phone || '').replace(/\D/g, '')
  const intl = digits.startsWith('0') ? `233${digits.slice(1)}` : digits
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
const ORDER_SELECT = '*, services(name, slug), profiles(full_name, email, whatsapp)'

// ---------- Shell with admin gate ---------------------------------------
export function AdminLayout() {
  const { loading, user, isAdmin } = useAuth()
  if (!supabase) return <div className="wrap py-20">Connect Supabase to use the admin dashboard.</div>
  if (loading) return <div className="wrap py-20 text-slate">Loading…</div>
  if (!user) return <Navigate to="/login?next=/admin" replace />
  if (!isAdmin) return <div className="wrap py-20"><h1 className="text-2xl font-bold">Admin only</h1><p className="mt-2 text-slate">This account does not have admin access.</p></div>
  const tab = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold no-underline ${isActive ? 'bg-white text-navy' : 'text-white/75 hover:text-white'}`
  return (
    <div className="min-h-[70vh] bg-mist">
      <div className="bg-navy">
        <div className="wrap flex flex-wrap items-center gap-2 py-3">
          <span className="mr-3 font-display text-sm font-bold text-tassel">ADMIN</span>
          <NavLink end to="/admin" className={tab}>Dashboard</NavLink>
          <NavLink to="/admin/orders" className={tab}>Orders</NavLink>
          <NavLink to="/admin/payments" className={tab}>Payments</NavLink>
          <NavLink to="/admin/leads" className={tab}>Leads</NavLink>
        </div>
      </div>
      <div className="wrap py-8"><Outlet /></div>
    </div>
  )
}

// ---------- Payment row with confirm / reject ---------------------------
function PaymentRow({ p, onChange }) {
  const [busy, setBusy] = useState(false)
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const o = p.orders
  const expected = o?.quoted_price ? (p.kind === 'deposit' ? o.quoted_price * o.deposit_percent / 100 : o.quoted_price - o.amount_paid) : null
  const mismatch = expected != null && Math.abs(Number(p.amount) - expected) > 0.009

  async function confirm() {
    if (!window.confirm(`Confirm ${cedi(p.amount)} from ${p.sender_name}, Txn ${p.txn_id}?\n\nOnly confirm if this money shows in your MoMo wallet or network SMS.`)) return
    setBusy(true)
    const { error } = await supabase.rpc('confirm_payment', { p_payment: p.id })
    setBusy(false)
    if (error) alert(error.message); else onChange()
  }
  async function doReject() {
    if (!reason.trim()) return
    setBusy(true)
    const { error } = await supabase.rpc('reject_payment', { p_payment: p.id, p_reason: reason.trim() })
    setBusy(false)
    if (error) alert(error.message); else onChange()
  }

  return (
    <li className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm">
          <p><Link to={`/admin/orders/${o?.id}`} className="font-semibold">{o?.order_number}</Link> <span className="capitalize text-slate">· {p.kind}</span> <span className="text-slate">· {fmtTime(p.created_at)}</span></p>
          <p className="mt-1 font-display text-lg font-bold text-navy">{cedi(p.amount)} {mismatch && <span className="ml-2 rounded bg-tassel/20 px-2 py-0.5 font-sans text-xs font-semibold text-[#8a6407]">Expected {cedi(expected)}</span>}</p>
          <p className="text-slate">Txn <span className="font-mono font-semibold text-ink">{p.txn_id}</span> · from {p.sender_name} ({p.sender_number})</p>
        </div>
        {p.status === 'submitted' ? (
          <div className="flex gap-2">
            <button disabled={busy} onClick={confirm} className="btn-primary">Confirm</button>
            <button disabled={busy} onClick={() => setReject(!reject)} className="btn-outline">Reject</button>
          </div>
        ) : <span className={`text-sm font-semibold capitalize ${p.status === 'confirmed' ? 'text-action' : 'text-alert'}`}>{p.status}{p.reason ? `: ${p.reason}` : ''}</span>}
      </div>
      {reject && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input className="field" placeholder="Reason the client will see, e.g. Transaction ID not found" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button disabled={busy || !reason.trim()} onClick={doReject} className="btn bg-alert text-white">Reject payment</button>
        </div>
      )}
    </li>
  )
}

function usePayments(status) {
  const [rows, setRows] = useState(null)
  const load = useCallback(() => {
    let q = supabase.from('payments').select('*, orders(id, order_number, quoted_price, amount_paid, deposit_percent)').order('created_at', { ascending: false }).limit(100)
    if (status) q = q.eq('status', status)
    q.then(({ data }) => setRows(data || []))
  }, [status])
  useEffect(load, [load])
  return [rows, load]
}

// ---------- Dashboard --------------------------------------------------
export function AdminDashboard() {
  const [pending, reloadPay] = usePayments('submitted')
  const [orders, setOrders] = useState([])
  const [leads, setLeads] = useState([])
  const load = useCallback(() => {
    supabase.from('orders').select(ORDER_SELECT).not('status', 'in', '(closed,cancelled,delivered)').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
    supabase.from('leads').select('*').eq('status', 'new').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setLeads(data || []))
  }, [])
  useEffect(load, [load])

  const soon = Date.now() + 72 * 3600 * 1000
  const awaitingQuote = orders.filter((o) => o.status === 'awaiting_quote')
  const dueSoon = orders.filter((o) => o.delivery_date && new Date(o.delivery_date).getTime() <= soon)
  const tiles = [
    ['Payments to check', pending?.length ?? '-', 'text-[#8a6407]'],
    ['Awaiting quote', awaitingQuote.length, 'text-library'],
    ['Due in 72 hours', dueSoon.length, 'text-alert'],
    ['New leads', leads.length, 'text-action'],
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(([label, n, c]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-card"><p className="text-sm text-slate">{label}</p><p className={`mt-1 font-display text-3xl font-extrabold ${c}`}>{n}</p></div>
        ))}
      </div>
      <section>
        <h2 className="text-lg font-bold">Payments waiting for confirmation</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
          {pending?.length ? <ul className="divide-y divide-line">{pending.map((p) => <PaymentRow key={p.id} p={p} onChange={() => { reloadPay(); load() }} />)}</ul>
            : <p className="p-5 text-sm text-slate">Nothing to check.</p>}
        </div>
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-bold">Orders awaiting a quote</h2>
          <OrderList rows={awaitingQuote} empty="No new orders." />
        </section>
        <section>
          <h2 className="text-lg font-bold">Delivery due in the next 72 hours</h2>
          <OrderList rows={dueSoon} empty="Nothing due soon." showDate />
        </section>
      </div>
      <section>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">New consultation leads</h2><Link to="/admin/leads" className="text-sm font-semibold">All leads →</Link></div>
        <LeadTable rows={leads} onChange={load} />
      </section>
    </div>
  )
}

function OrderList({ rows, empty, showDate }) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
      {rows.length === 0 ? <p className="p-5 text-sm text-slate">{empty}</p> : (
        <ul className="divide-y divide-line">
          {rows.map((o) => (
            <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 no-underline hover:bg-mist">
              <div className="min-w-0"><p className="text-xs font-semibold text-slate">{o.order_number} · {clientName(o)}</p><p className="truncate font-semibold text-navy">{o.topic}</p></div>
              <div className="shrink-0 text-right">{showDate ? <p className="text-sm font-semibold text-alert">{fmt(o.delivery_date)}</p> : <StatusPill status={o.status} />}</div>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------- Orders list -------------------------------------------------
export function AdminOrders() {
  const [rows, setRows] = useState(null)
  const [status, setStatus] = useState('open')
  const [q, setQ] = useState('')
  useEffect(() => {
    let query = supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }).limit(300)
    if (status === 'open') query = query.not('status', 'in', '(closed,cancelled)')
    else if (status !== 'all') query = query.eq('status', status)
    query.then(({ data }) => setRows(data || []))
  }, [status])
  const shown = useMemo(() => (rows || []).filter((o) => !q || `${o.order_number} ${o.topic} ${clientName(o)}`.toLowerCase().includes(q.toLowerCase())), [rows, q])

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-extrabold">Orders</h1>
        <div className="flex gap-2">
          <input className="field w-48" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">All open</option><option value="all">Everything</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr><th className="p-3">Order</th><th className="p-3">Client</th><th className="p-3">Topic</th><th className="p-3">Price</th><th className="p-3">Paid</th><th className="p-3">Delivery</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows === null ? <tr><td className="p-4 text-slate" colSpan={7}>Loading…</td></tr>
              : shown.length === 0 ? <tr><td className="p-4 text-slate" colSpan={7}>No orders.</td></tr>
              : shown.map((o) => (
                <tr key={o.id} className="hover:bg-mist/60">
                  <td className="p-3"><Link to={`/admin/orders/${o.id}`} className="font-semibold">{o.order_number}</Link><p className="text-xs text-slate">{fmt(o.created_at)}</p></td>
                  <td className="p-3">{clientName(o)}{!o.client_id && <span className="ml-1 text-xs text-slate">(guest)</span>}</td>
                  <td className="max-w-[260px] truncate p-3">{o.topic}</td>
                  <td className="p-3">{o.quoted_price ? cedi(o.quoted_price) : '-'}</td>
                  <td className="p-3">{cedi(o.amount_paid)}</td>
                  <td className="p-3">{fmt(o.delivery_date)}</td>
                  <td className="p-3"><StatusPill status={o.status} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- One order ---------------------------------------------------
function QuoteForm({ order, onSaved }) {
  const [f, setF] = useState({
    price: order.quoted_price ?? (order.services?.slug === 'thesis' ? BUSINESS.thesisStandardPrice : ''),
    deposit: order.deposit_percent ?? BUSINESS.depositPercent,
    delivery: order.delivery_date || '',
  })
  const [busy, setBusy] = useState(false)
  async function save(send) {
    if (!f.price || !f.delivery) return alert('Add a price and a delivery date.')
    setBusy(true)
    const patch = { quoted_price: Number(f.price), deposit_percent: Number(f.deposit), delivery_date: f.delivery }
    if (send && ['awaiting_quote', 'quote_sent'].includes(order.status)) patch.status = 'quote_sent'
    const { error } = await supabase.from('orders').update(patch).eq('id', order.id)
    setBusy(false)
    if (error) alert(error.message); else onSaved()
  }
  return (
    <div className="card">
      <h2 className="text-lg font-bold">Quote</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><label className="label">Price (GH₵)</label><input className="field" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        <div><label className="label">Deposit %</label><input className="field" inputMode="numeric" value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} /></div>
        <div><label className="label">Delivery date</label><input type="date" className="field" value={f.delivery} onChange={(e) => setF({ ...f, delivery: e.target.value })} /></div>
      </div>
      <p className="mt-2 text-xs text-slate">Deposit: {cedi((Number(f.price) || 0) * (Number(f.deposit) || 0) / 100)}. Agree any negotiated price on WhatsApp first, then enter it here.</p>
      <div className="mt-4 flex gap-2">
        {['awaiting_quote', 'quote_sent'].includes(order.status) && <button disabled={busy} onClick={() => save(true)} className="btn-primary">{order.status === 'quote_sent' ? 'Update quote' : 'Send quote'}</button>}
        <button disabled={busy} onClick={() => save(false)} className="btn-outline">Save only</button>
      </div>
    </div>
  )
}

function DeliverableUpload({ order, nextVersion, onDone }) {
  const [original, setOriginal] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [label, setLabel] = useState('Full work')
  const [progress, setProgress] = useState('')
  const [err, setErr] = useState('')

  async function upload() {
    setErr('')
    if (!original || !pdf) return setErr('Choose the original file and its PDF export.')
    try {
      setProgress('Building watermarked preview…')
      const { blobs, pageCount } = await buildPreviews(pdf, {
        orderNumber: order.order_number, clientName: clientName(order),
        onProgress: (d, t) => setProgress(`Building preview: page ${d} of ${t}`),
      })
      const base = `${order.id}/v${nextVersion}`
      const paths = []
      for (let i = 0; i < blobs.length; i++) {
        setProgress(`Uploading preview ${i + 1} of ${blobs.length}`)
        const path = `${base}/p${String(i + 1).padStart(3, '0')}.jpg`
        const { error } = await supabase.storage.from('previews').upload(path, blobs[i], { contentType: 'image/jpeg', upsert: true })
        if (error) throw error
        paths.push(path)
      }
      setProgress('Uploading original file…')
      const originalPath = `${base}/v${nextVersion}-${original.name.replace(/[^\w.\- ]+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('deliverables').upload(originalPath, original, { upsert: true })
      if (upErr) throw upErr
      const fullyPaid = order.quoted_price && Number(order.amount_paid) >= Number(order.quoted_price)
      const { error: insErr } = await supabase.from('deliverables').insert({
        order_id: order.id, version: nextVersion, label, original_path: originalPath,
        preview_paths: paths, preview_page_count: pageCount, locked: !fullyPaid,
      })
      if (insErr) throw insErr
      if (!fullyPaid && ['in_progress', 'revision_requested', 'awaiting_deposit'].includes(order.status)) {
        await supabase.from('orders').update({ status: 'ready_for_preview' }).eq('id', order.id)
      } else if (fullyPaid) {
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
      }
      setProgress(''); setOriginal(null); setPdf(null); onDone()
    } catch (e) { setErr(e.message || String(e)); setProgress('') }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold">Upload finished work <span className="text-sm font-normal text-slate">(version {nextVersion})</span></h2>
      <p className="mt-1 text-sm text-slate">Upload the original (Word, PowerPoint, Excel) and a PDF export of it. The PDF becomes the watermarked preview: first {BUSINESS.previewPercent}% clear, the rest blurred.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><label className="label">Label</label><input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Chapters 1 to 3" /></div>
        <div><label className="label">Original file</label><input type="file" className="field py-2 text-sm" onChange={(e) => setOriginal(e.target.files?.[0] || null)} /></div>
        <div><label className="label">PDF export</label><input type="file" accept="application/pdf" className="field py-2 text-sm" onChange={(e) => setPdf(e.target.files?.[0] || null)} /></div>
      </div>
      {err && <p className="mt-3 text-sm text-alert">{err}</p>}
      <button disabled={Boolean(progress)} onClick={upload} className="btn-primary mt-4">{progress || 'Upload and create preview'}</button>
    </div>
  )
}

export function AdminOrder() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [extra, setExtra] = useState({ files: [], deliverables: [] })
  const [payments, reloadPayments] = useState(0)
  const [payRows, setPayRows] = useState([])
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).single()
    setOrder(data); setNotes(data?.admin_notes || '')
    if (data) {
      try { setExtra(await callFn('order-get', { orderId: id })) } catch { /* functions offline locally */ }
      const { data: p } = await supabase.from('payments').select('*, orders(id, order_number, quoted_price, amount_paid, deposit_percent)').eq('order_id', id).order('created_at', { ascending: false })
      setPayRows(p || [])
    }
  }, [id])
  useEffect(() => { load() }, [load, payments])

  if (!order) return <p className="text-slate">Loading…</p>
  const phone = clientPhone(order)

  async function setStatus(status) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) alert(error.message); else load()
  }
  async function saveNotes() { await supabase.from('orders').update({ admin_notes: notes }).eq('id', id) }
  async function openFile(fileId) {
    try { const { url } = await callFn('file-url', { orderId: id, fileId }); window.open(url, '_blank') } catch (e) { alert(e.message) }
  }
  async function toggleLock(d) {
    const { error } = await supabase.from('deliverables').update({ locked: !d.locked }).eq('id', d.id)
    if (error) alert(error.message); else load()
  }
  async function resetDownloads(d) {
    await supabase.from('deliverables').update({ download_count: 0 }).eq('id', d.id); load()
  }
  const guestUrl = !order.client_id ? `${window.location.origin}/o/${order.order_number}?t=${order.access_token}` : null

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="text-sm font-semibold no-underline">← All orders</Link>
      <div className="card">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold text-slate">{order.order_number} · {order.services?.name} · placed {fmtTime(order.created_at)}</p>
            <h1 className="mt-1 text-2xl font-extrabold">{order.topic}</h1>
            <p className="mt-2 text-sm">{clientName(order)} {!order.client_id && <span className="text-slate">(guest)</span>} · {phone} {order.profiles?.email || order.guest_email ? `· ${order.profiles?.email || order.guest_email}` : ''}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={order.status} />
            {phone && <a className="btn-primary" target="_blank" rel="noreferrer" href={waTo(phone, `Hello ${clientName(order).split(' ')[0]}, this is AEC about your order ${order.order_number}.`)}><WhatsAppIcon /> WhatsApp client</a>}
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-4">
          <div><p className="text-slate">Price</p><p className="font-semibold">{cedi(order.quoted_price)}</p></div>
          <div><p className="text-slate">Paid</p><p className="font-semibold">{cedi(order.amount_paid)}</p></div>
          <div><p className="text-slate">Client deadline</p><p className="font-semibold">{fmt(order.deadline)}</p></div>
          <div>
            <p className="text-slate">Change status</p>
            <select className="field mt-1 py-1.5" value={order.status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {guestUrl && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl bg-mist p-3 text-sm sm:flex-row sm:items-center">
            <span className="shrink-0 font-semibold text-navy">Guest link:</span>
            <input readOnly className="field bg-white py-1.5 text-xs" value={guestUrl} onFocus={(e) => e.target.select()} />
            <a className="btn-outline shrink-0 py-2" target="_blank" rel="noreferrer" href={waTo(phone, `Here is your private AEC order link for ${order.order_number}: ${guestUrl}`)}>Send to client</a>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-bold">Brief</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {[['Level', order.level], ['Institution', order.institution], ['Programme', order.programme], ['Supervisor', order.supervisor], ['Method', order.method], ['Referencing', order.referencing_style], ['Length', order.length_text]]
              .filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-28 shrink-0 text-slate">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {order.notes && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-mist p-3 text-sm">{order.notes}</p>}
          <h3 className="mt-5 text-sm font-bold">Client files</h3>
          {extra.files.length === 0 ? <p className="mt-1 text-sm text-slate">None.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {extra.files.map((f) => <li key={f.id}><button onClick={() => openFile(f.id)} className="text-library underline-offset-2 hover:underline">{f.file_name}</button> <span className="text-xs capitalize text-slate">· {f.purpose}</span></li>)}
            </ul>
          )}
        </div>
        <QuoteForm order={order} onSaved={load} />
      </div>

      <section>
        <h2 className="text-lg font-bold">Payments</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
          {payRows.length ? <ul className="divide-y divide-line">{payRows.map((p) => <PaymentRow key={p.id} p={p} onChange={() => reloadPayments((n) => n + 1)} />)}</ul>
            : <p className="p-5 text-sm text-slate">No payments yet.</p>}
        </div>
      </section>

      <DeliverableUpload order={order} nextVersion={(extra.deliverables[0]?.version || 0) + 1} onDone={load} />

      {extra.deliverables.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Delivered versions</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {extra.deliverables.map((d) => (
              <li key={d.id} className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-semibold text-navy">v{d.version} · {d.label}</p><p className="text-slate">{d.preview_page_count} pages · {d.downloads_left} downloads left · {d.locked ? 'Locked' : 'Unlocked'}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => toggleLock(d)} className="btn-outline py-2">{d.locked ? 'Unlock' : 'Re-lock'}</button>
                  <button onClick={() => resetDownloads(d)} className="btn-outline py-2">Reset downloads</button>
                  <button onClick={async () => { const { url } = await callFn('download', { orderId: id, deliverableId: d.id }); window.location.href = url }} className="btn-outline py-2"><Icon name="arrow" className="h-4 w-4 rotate-90" /></button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="card">
        <h2 className="text-lg font-bold">Private notes</h2>
        <textarea rows={3} className="field mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Only you see these" />
      </div>
    </div>
  )
}

// ---------- Payments and leads -----------------------------------------
export function AdminPayments() {
  const [filter, setFilter] = useState('submitted')
  const [rows, reload] = usePayments(filter === 'all' ? null : filter)
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Payments</h1>
        <select className="field w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="submitted">To check</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option><option value="all">All</option>
        </select>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        {rows === null ? <p className="p-5 text-slate">Loading…</p> : rows.length === 0 ? <p className="p-5 text-sm text-slate">None.</p>
          : <ul className="divide-y divide-line">{rows.map((p) => <PaymentRow key={p.id} p={p} onChange={reload} />)}</ul>}
      </div>
    </div>
  )
}

function LeadTable({ rows, onChange }) {
  async function setStatus(id, status) { await supabase.from('leads').update({ status }).eq('id', id); onChange() }
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-wide text-slate"><tr><th className="p-3">Ref</th><th className="p-3">Name</th><th className="p-3">Need</th><th className="p-3">When</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 ? <tr><td colSpan={6} className="p-4 text-slate">No leads.</td></tr> : rows.map((l) => (
            <tr key={l.id}>
              <td className="p-3 font-semibold">{l.ref}</td>
              <td className="p-3">{l.name}<p className="text-xs text-slate">{l.level}{l.institution ? `, ${l.institution}` : ''}</p></td>
              <td className="max-w-[280px] p-3">{l.service}{l.message && <p className="truncate text-xs text-slate">{l.message}</p>}</td>
              <td className="p-3 text-slate">{fmtTime(l.created_at)}</td>
              <td className="p-3"><select className="field py-1" value={l.status} onChange={(e) => setStatus(l.id, e.target.value)}>{['new', 'contacted', 'converted', 'closed'].map((s) => <option key={s}>{s}</option>)}</select></td>
              <td className="p-3">{l.whatsapp && <a href={waTo(l.whatsapp, `Hello ${l.name}, this is AEC following up on your consultation request (${l.ref}).`)} target="_blank" rel="noreferrer" className="text-action"><WhatsAppIcon /></a>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminLeads() {
  const [rows, setRows] = useState([])
  const load = useCallback(() => { supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(300).then(({ data }) => setRows(data || [])) }, [])
  useEffect(load, [load])
  return <div><h1 className="text-2xl font-extrabold">Consultation leads</h1><LeadTable rows={rows} onChange={load} /></div>
}
