import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/Blocks'
import { useConsultation } from '../components/Consultation'
import Icon, { WhatsAppIcon } from '../components/Icon'
import { useAuth } from '../lib/auth'
import { BUSINESS, LEVELS, SERVICES } from '../lib/config'
import { ACCEPTED, MAX_UPLOAD_MB, rememberGuestOrder, uploadClientFile } from '../lib/orders'
import { supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'

const METHODS = ['Not sure yet', 'Quantitative', 'Qualitative', 'Mixed methods', 'Not applicable']
const STYLES = ['APA 7', 'Harvard', 'Chicago', 'MLA', 'IEEE', 'As in my guidelines']

function Field({ label, hint, children, id }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}{hint && <span className="font-normal text-slate"> ({hint})</span>}</label>
      {children}
    </div>
  )
}

export default function Order() {
  const { user, profile } = useAuth()
  const { open } = useConsultation()
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [f, setF] = useState({
    service: SERVICES[0].slug, topic: '', level: LEVELS[1], institution: '', programme: '', supervisor: '',
    method: METHODS[0], referencing: STYLES[0], length: '', deadline: '', notes: '',
    guest_name: '', guest_email: '', guest_whatsapp: '', agree: false,
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  if (!supabase) {
    return (
      <>
        <PageHeader eyebrow="Place an order" title="Start your order on WhatsApp">Online ordering switches on once the database is connected.</PageHeader>
        <section className="wrap max-w-2xl py-16 text-center">
          <button onClick={() => open()} className="btn-primary"><WhatsAppIcon /> Fill a short form</button>
        </section>
      </>
    )
  }

  function addFiles(e) {
    const picked = Array.from(e.target.files || [])
    const tooBig = picked.find((x) => x.size > MAX_UPLOAD_MB * 1024 * 1024)
    if (tooBig) setError(`${tooBig.name} is over ${MAX_UPLOAD_MB} MB.`)
    setFiles((cur) => [...cur, ...picked.filter((x) => x.size <= MAX_UPLOAD_MB * 1024 * 1024).map((file) => ({ file, purpose: 'guideline' }))].slice(0, 10))
    e.target.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.topic.trim()) return setError('Add your topic or a short title for the work.')
    if (!user && (!f.guest_name.trim() || !f.guest_whatsapp.trim())) return setError('Add your name and WhatsApp number so we can reach you.')
    if (!f.agree) return setError('Please accept the terms to continue.')
    setBusy('Creating your order…')
    const { data, error: err } = await supabase.rpc('create_order', {
      p_service_slug: f.service, p_topic: f.topic, p_level: f.level, p_institution: f.institution,
      p_programme: f.programme, p_supervisor: f.supervisor, p_method: f.method, p_referencing: f.referencing,
      p_length: f.length, p_deadline: f.deadline || null, p_notes: f.notes,
      p_guest_name: user ? null : f.guest_name, p_guest_email: user ? null : f.guest_email || null,
      p_guest_whatsapp: user ? null : f.guest_whatsapp,
    })
    if (err || !data?.[0]) { setBusy(''); return setError(err?.message || 'Could not create the order.') }
    const { order_id, order_number, access_token } = data[0]

    const failed = []
    for (let i = 0; i < files.length; i++) {
      setBusy(`Uploading file ${i + 1} of ${files.length}…`)
      try { await uploadClientFile({ orderId: order_id, token: user ? null : access_token, file: files[i].file, purpose: files[i].purpose }) }
      catch { failed.push(files[i].file.name) }
    }
    if (!user) rememberGuestOrder(order_number, access_token)
    const to = user ? `/orders/${order_number}` : `/o/${order_number}?t=${access_token}`
    navigate(`${to}${to.includes('?') ? '&' : '?'}new=1${failed.length ? `&failed=${failed.length}` : ''}`)
  }

  return (
    <>
      <PageHeader eyebrow="Place an order" title="Tell us about your work">
        Send your brief and files. We'll review it and send your quote. Work starts after the {BUSINESS.depositPercent}% deposit.
      </PageHeader>
      <section className="bg-mist py-12">
        <form onSubmit={submit} className="wrap grid max-w-4xl gap-6">
          {!user && (
            <div className="card">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <h2 className="text-lg font-bold">Your details</h2>
                <p className="text-sm text-slate">Ordering as a guest. <Link to="/login?next=/order">Log in</Link> instead</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Full name" id="g-name"><input id="g-name" className="field" autoComplete="name" value={f.guest_name} onChange={set('guest_name')} required /></Field>
                <Field label="WhatsApp number" id="g-wa"><input id="g-wa" className="field" inputMode="tel" placeholder="024 000 0000" value={f.guest_whatsapp} onChange={set('guest_whatsapp')} required /></Field>
                <Field label="Email" hint="optional" id="g-email"><input id="g-email" type="email" className="field" autoComplete="email" value={f.guest_email} onChange={set('guest_email')} /></Field>
              </div>
            </div>
          )}
          {user && <p className="text-sm text-slate">Ordering as <span className="font-semibold text-navy">{profile?.full_name || user.email}</span>.</p>}

          <div className="card">
            <h2 className="text-lg font-bold">The work</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Service" id="o-service">
                <select id="o-service" className="field" value={f.service} onChange={set('service')}>
                  {SERVICES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="Deadline" id="o-deadline"><input id="o-deadline" type="date" className="field" value={f.deadline} onChange={set('deadline')} min={new Date().toISOString().slice(0, 10)} /></Field>
              <div className="sm:col-span-2">
                <Field label="Topic or title" id="o-topic"><input id="o-topic" className="field" placeholder="e.g. Tax compliance costs and SME performance in Accra" value={f.topic} onChange={set('topic')} required /></Field>
              </div>
              <Field label="Level" id="o-level"><select id="o-level" className="field" value={f.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
              <Field label="Institution" id="o-inst"><input id="o-inst" className="field" placeholder="e.g. UGBS" value={f.institution} onChange={set('institution')} /></Field>
              <Field label="Programme" id="o-prog"><input id="o-prog" className="field" placeholder="e.g. MSc Accounting and Finance" value={f.programme} onChange={set('programme')} /></Field>
              <Field label="Supervisor" hint="optional" id="o-sup"><input id="o-sup" className="field" value={f.supervisor} onChange={set('supervisor')} /></Field>
              <Field label="Method" id="o-method"><select id="o-method" className="field" value={f.method} onChange={set('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Referencing style" id="o-ref"><select id="o-ref" className="field" value={f.referencing} onChange={set('referencing')}>{STYLES.map((m) => <option key={m}>{m}</option>)}</select></Field>
              <div className="sm:col-span-2">
                <Field label="Length or chapters" hint="optional" id="o-len"><input id="o-len" className="field" placeholder="e.g. Chapters 1 to 5, about 15,000 words" value={f.length} onChange={set('length')} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Anything else we should know" hint="optional" id="o-notes"><textarea id="o-notes" rows={4} className="field" placeholder="Supervisor comments, what is done already, data you have…" value={f.notes} onChange={set('notes')} /></Field>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold">Files</h2>
            <p className="mt-1 text-sm text-slate">Guidelines, supervisor comments, drafts or data. Up to 10 files, {MAX_UPLOAD_MB} MB each.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-mist/60 px-4 py-8 text-center hover:border-library">
              <Icon name="upload" className="h-8 w-8 text-library" />
              <span className="mt-2 font-semibold text-navy">Choose files</span>
              <span className="text-xs text-slate">PDF, Word, Excel, PowerPoint, CSV, SPSS, Stata, images</span>
              <input type="file" multiple accept={ACCEPTED} onChange={addFiles} className="sr-only" />
            </label>
            {files.length > 0 && (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {files.map((x, i) => (
                  <li key={i} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="truncate font-medium text-navy">{x.file.name} <span className="font-normal text-slate">({(x.file.size / 1048576).toFixed(1)} MB)</span></span>
                    <div className="flex items-center gap-2">
                      <select className="field py-1.5 text-sm" value={x.purpose} onChange={(e) => setFiles(files.map((y, j) => (j === i ? { ...y, purpose: e.target.value } : y)))}>
                        <option value="guideline">Guidelines</option><option value="comment">Supervisor comments</option>
                        <option value="draft">My draft</option><option value="data">Data</option><option value="other">Other</option>
                      </select>
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded p-1.5 text-slate hover:bg-mist" aria-label={`Remove ${x.file.name}`}><Icon name="close" className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#357A14]" checked={f.agree} onChange={set('agree')} />
              <span>I agree to the <Link to="/terms" target="_blank">terms</Link>, <Link to="/refunds" target="_blank">payment and refund policy</Link> and <Link to="/privacy" target="_blank">privacy policy</Link>.</span>
            </label>
            {error && <p className="mt-4 rounded-lg bg-alert/10 p-3 text-sm text-alert">{error}</p>}
            <button disabled={Boolean(busy)} className="btn-primary mt-5 w-full py-3.5 text-base disabled:opacity-60">{busy || 'Submit order'}</button>
            <p className="mt-3 text-center text-xs text-slate">Prefer to talk first? <a href={waLink('Hello AEC, I have a question before I place an order.')} target="_blank" rel="noreferrer">Message us on WhatsApp</a></p>
          </div>
        </form>
      </section>
    </>
  )
}
