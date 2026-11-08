import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { useAuth } from '../lib/auth'
import { cedi, guestOrders, STATUS, statusClass } from '../lib/orders'
import { supabase } from '../lib/supabase'

export function StatusPill({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{STATUS[status]?.label || status}</span>
}

export default function Account() {
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('id, order_number, topic, status, quoted_price, amount_paid, delivery_date, created_at, services(name)')
      .eq('client_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [user])

  if (loading) return <div className="wrap py-20 text-slate">Loading…</div>
  if (!user) return <Navigate to="/login?next=/account" replace />
  const saved = guestOrders()

  return (
    <section className="bg-mist py-12 sm:py-16">
      <div className="wrap">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">My account</p>
            <h1 className="mt-1 text-3xl font-extrabold">Hello{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
          </div>
          <div className="flex gap-3">
            {isAdmin && <Link to="/admin" className="btn-navy">Admin dashboard</Link>}
            <Link to="/order" className="btn-primary">New order</Link>
            <button onClick={signOut} className="btn-outline">Log out</button>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
          {orders === null ? <p className="p-6 text-slate">Loading orders…</p>
            : orders.length === 0 ? (
              <div className="p-10 text-center">
                <Icon name="doc" className="mx-auto h-10 w-10 text-line" />
                <p className="mt-3 font-semibold text-navy">No orders yet</p>
                <Link to="/order" className="btn-primary mt-5">Place your first order</Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link to={`/orders/${o.order_number}`} className="flex flex-col gap-2 p-5 no-underline hover:bg-mist sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate">{o.order_number} · {o.services?.name}</p>
                        <p className="mt-0.5 font-semibold text-navy">{o.topic}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate">{o.quoted_price ? cedi(o.quoted_price) : 'Quote pending'}</span>
                        <StatusPill status={o.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </div>

        {saved.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold">Guest orders saved on this device</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {saved.map((g) => (
                <li key={g.orderNumber}><Link className="btn-outline" to={`/o/${g.orderNumber}?t=${g.token}`}>{g.orderNumber}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
