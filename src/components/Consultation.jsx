import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LEVELS, SERVICES } from '../lib/config'
import { supabase } from '../lib/supabase'
import { consultationMessage, waLink } from '../lib/whatsapp'
import Icon, { WhatsAppIcon } from './Icon'

const ConsultationContext = createContext({ open: () => {} })
export const useConsultation = () => useContext(ConsultationContext)

export function ConsultationProvider({ children }) {
  const [state, setState] = useState({ open: false, service: '' })
  const open = (service = '') => setState({ open: true, service })
  const close = () => setState((s) => ({ ...s, open: false }))
  return (
    <ConsultationContext.Provider value={{ open }}>
      {children}
      {state.open && <ConsultationModal defaultService={state.service} onClose={close} />}
    </ConsultationContext.Provider>
  )
}

function ConsultationModal({ defaultService, onClose }) {
  const location = useLocation()
  const firstField = useRef(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', whatsapp: '', level: LEVELS[1], institution: '',
    service: defaultService || SERVICES[0].name, need: '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    firstField.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Please enter your name.')
    setError('')
    setSending(true)
    // Open the window first so mobile browsers don't block it as a pop-up.
    const win = window.open('', '_blank')
    let ref = ''
    if (supabase) {
      const { data } = await supabase.rpc('create_lead', {
        p_name: form.name, p_whatsapp: form.whatsapp, p_level: form.level,
        p_institution: form.institution, p_service: form.service,
        p_message: form.need, p_source: location.pathname,
      })
      if (data) ref = data
    }
    const url = waLink(consultationMessage({ ...form, ref }))
    if (win) win.location.href = url
    else window.location.href = url
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
         role="dialog" aria-modal="true" aria-labelledby="consult-title" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8"
           onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Free consultation</p>
            <h2 id="consult-title" className="mt-1 text-2xl font-bold">Tell us what you need</h2>
            <p className="mt-1 text-sm text-slate">We'll continue the conversation on WhatsApp.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate hover:bg-mist" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="c-name">Your name</label>
            <input id="c-name" ref={firstField} className="field" value={form.name} onChange={set('name')} autoComplete="name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-level">Level</label>
              <select id="c-level" className="field" value={form.level} onChange={set('level')}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-inst">Institution</label>
              <input id="c-inst" className="field" placeholder="e.g. UGBS" value={form.institution} onChange={set('institution')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-service">What do you need help with?</label>
            <select id="c-service" className="field" value={form.service} onChange={set('service')}>
              {SERVICES.map((s) => <option key={s.slug}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-need">A line about it <span className="font-normal text-slate">(optional)</span></label>
            <textarea id="c-need" rows={3} className="field" placeholder="e.g. Chapter 4 analysis in SmartPLS, due in three weeks"
                      value={form.need} onChange={set('need')} />
          </div>
          <div>
            <label className="label" htmlFor="c-phone">Your WhatsApp number <span className="font-normal text-slate">(optional)</span></label>
            <input id="c-phone" className="field" inputMode="tel" placeholder="024 000 0000" value={form.whatsapp} onChange={set('whatsapp')} />
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <button type="submit" disabled={sending} className="btn-primary w-full py-3.5 text-base disabled:opacity-60">
            <WhatsAppIcon /> {sending ? 'Opening WhatsApp…' : 'Continue on WhatsApp'}
          </button>
          <p className="text-center text-xs text-slate">Your details stay private and are used only to reply to you.</p>
        </form>
      </div>
    </div>
  )
}
