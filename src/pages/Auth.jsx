import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function Shell({ title, sub, children }) {
  return (
    <section className="bg-mist py-14 sm:py-20">
      <div className="wrap max-w-md">
        <div className="card p-7 sm:p-8">
          <img src="/brand/aec-emblem.webp" alt="" className="h-14 w-14" />
          <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
          {sub && <p className="mt-1 text-sm text-slate">{sub}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function NotConnected() {
  return <p className="rounded-lg bg-tassel/15 p-3 text-sm text-[#7a5806]">Accounts are not switched on yet. You can still order as a guest.</p>
}

export function Login() {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') || '/account'
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg('')
    const { error } = await supabase.auth.signInWithPassword(form)
    setBusy(false)
    if (error) setMsg(error.message === 'Invalid login credentials' ? 'Email or password is not correct.' : error.message)
    else navigate(next, { replace: true })
  }

  async function reset() {
    if (!form.email) return setMsg('Enter your email first, then tap "Forgot password".')
    await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` })
    setMsg('If that email has an account, a reset link is on its way.')
  }

  return (
    <Shell title="Log in" sub="See all your AEC orders in one place.">
      {!supabase ? <NotConnected /> : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="l-email">Email</label>
            <input id="l-email" type="email" className="field" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label" htmlFor="l-pass">Password</label>
            <input id="l-pass" type="password" className="field" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          {msg && <p className="text-sm text-alert">{msg}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Logging in…' : 'Log in'}</button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={reset} className="text-library">Forgot password?</button>
            <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
          </div>
        </form>
      )}
    </Shell>
  )
}

export function Signup() {
  const [params] = useSearchParams()
  const next = params.get('next') || '/account'
  const [form, setForm] = useState({ full_name: '', whatsapp: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (form.password.length < 8) return setMsg('Use at least 8 characters for your password.')
    setBusy(true); setMsg('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, whatsapp: form.whatsapp }, emailRedirectTo: `${window.location.origin}${next}` },
    })
    setBusy(false)
    if (error) return setMsg(error.message)
    if (!data.session) setDone(true)
  }

  if (done) {
    return (
      <Shell title="Check your email" sub={`We sent a confirmation link to ${form.email}. Open it to finish creating your account.`}>
        <Link to="/" className="btn-outline w-full">Back to the home page</Link>
      </Shell>
    )
  }

  return (
    <Shell title="Create an account" sub="Optional. You can also order as a guest.">
      {!supabase ? <NotConnected /> : (
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="s-name">Full name</label>
            <input id="s-name" className="field" autoComplete="name" required value={form.full_name} onChange={set('full_name')} /></div>
          <div><label className="label" htmlFor="s-wa">WhatsApp number</label>
            <input id="s-wa" className="field" inputMode="tel" required placeholder="024 000 0000" value={form.whatsapp} onChange={set('whatsapp')} /></div>
          <div><label className="label" htmlFor="s-email">Email</label>
            <input id="s-email" type="email" className="field" autoComplete="email" required value={form.email} onChange={set('email')} /></div>
          <div><label className="label" htmlFor="s-pass">Password</label>
            <input id="s-pass" type="password" className="field" autoComplete="new-password" required value={form.password} onChange={set('password')} /></div>
          {msg && <p className="text-sm text-alert">{msg}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-center text-sm text-slate">Already have one? <Link to={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></p>
        </form>
      )}
    </Shell>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setMsg('Use at least 8 characters.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setMsg(error.message); else navigate('/account', { replace: true })
  }
  return (
    <Shell title="Set a new password">
      <form onSubmit={submit} className="space-y-4">
        <input type="password" className="field" autoComplete="new-password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {msg && <p className="text-sm text-alert">{msg}</p>}
        <button className="btn-primary w-full py-3">Save password</button>
      </form>
    </Shell>
  )
}
