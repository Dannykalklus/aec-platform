import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { BUSINESS } from '../lib/config'
import { isSupabaseReady } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'
import { useConsultation } from './Consultation'
import Icon, { WhatsAppIcon } from './Icon'

const NAV = [
  { to: '/services', label: 'Services' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQs' },
  { to: '/contact', label: 'Contact' },
]

function Brand({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Academic Experts Consults home">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${light ? 'bg-white' : ''}`}>
        <img src="/brand/aec-emblem.webp" alt="" width="44" height="44" className={light ? 'h-9 w-9' : 'h-11 w-11'} />
      </span>
      <span className="leading-none">
        <span className={`block font-display text-[15px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>ACADEMIC EXPERTS</span>
        <span className="mt-1 block font-display text-[10px] font-semibold tracking-[0.42em] text-scholar">CONSULTS</span>
      </span>
    </Link>
  )
}

function Header() {
  const [menu, setMenu] = useState(false)
  const { open } = useConsultation()
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  useEffect(() => setMenu(false), [location.pathname])
  const acct = !isSupabaseReady ? null : user
    ? { to: isAdmin ? '/admin' : '/account', label: isAdmin ? 'Admin' : 'My orders' }
    : { to: '/login', label: 'Log in' }

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 backdrop-blur">
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) => `text-sm font-medium no-underline transition-colors ${isActive ? 'text-navy' : 'text-slate hover:text-navy'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {acct && <Link to={acct.to} className="text-sm font-semibold text-navy no-underline hover:text-library">{acct.label}</Link>}
          <Link to="/order" className="btn-outline">Place an order</Link>
          <button onClick={() => open()} className="btn-primary">Free consultation</button>
        </div>
        <button className="rounded-lg p-2 text-navy lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menu">
          <Icon name={menu ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </div>
      {menu && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="wrap flex flex-col py-3" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="border-b border-line/60 py-3.5 font-medium text-navy no-underline last:border-0">{n.label}</NavLink>
            ))}
            {acct && <NavLink to={acct.to} className="border-b border-line/60 py-3.5 font-medium text-navy no-underline">{acct.label}</NavLink>}
            <div className="grid grid-cols-2 gap-3 py-4">
              <Link to="/order" className="btn-outline">Place an order</Link>
              <button onClick={() => open()} className="btn-primary">Consultation</button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const { open } = useConsultation()
  return (
    <footer className="bg-navy-900 text-white/75">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Brand light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Thesis, dissertation and assignment support for students in Ghana. {BUSINESS.tagline}
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-white">Services</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-white/75 no-underline hover:text-white" to="/services#thesis">Theses and long essays</Link></li>
            <li><Link className="text-white/75 no-underline hover:text-white" to="/services#analysis">Data analysis</Link></li>
            <li><Link className="text-white/75 no-underline hover:text-white" to="/services#assignments">Assignments</Link></li>
            <li><Link className="text-white/75 no-underline hover:text-white" to="/services#presentations">Presentations</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-white">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-white/75 no-underline hover:text-white" to="/how-it-works">How it works</Link></li>
            <li><Link className="text-white/75 no-underline hover:text-white" to="/pricing">Pricing</Link></li>
            <li><Link className="text-white/75 no-underline hover:text-white" to="/faq">FAQs</Link></li>
            <li><button onClick={() => open()} className="text-white/75 hover:text-white">Book a consultation</button></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display text-sm font-bold text-white">Talk to us</h3>
          <a href={waLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white no-underline hover:text-scholar">
            <WhatsAppIcon /> {BUSINESS.whatsappDisplay}
          </a>
          <p className="mt-2 text-sm">{BUSINESS.location}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link className="text-white/60 no-underline hover:text-white" to="/terms">Terms</Link>
            <Link className="text-white/60 no-underline hover:text-white" to="/privacy">Privacy</Link>
            <Link className="text-white/60 no-underline hover:text-white" to="/refunds">Payments and refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppFloat() {
  return (
    <a href={waLink('Hello AEC, I would like to ask about your services.')} target="_blank" rel="noreferrer"
       className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-action text-white shadow-lg shadow-ink/25 transition-transform hover:scale-105"
       aria-label="Chat with AEC on WhatsApp">
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppFloat />
    </div>
  )
}
