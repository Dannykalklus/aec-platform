// Shared helpers for AEC Netlify Functions. Runs on the server only.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const admin = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export const fail = (status, error) => json(status, { error })

export async function readBody(req) {
  if (req.method !== 'POST') throw Object.assign(new Error('Use POST'), { status: 405 })
  try { return await req.json() } catch { throw Object.assign(new Error('Bad request'), { status: 400 }) }
}

// Who is calling? Returns { userId, isAdmin } from the Bearer token, if any.
export async function caller(req) {
  const auth = req.headers.get('authorization') || ''
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!jwt) return { userId: null, isAdmin: false }
  const { data, error } = await admin.auth.getUser(jwt)
  if (error || !data?.user) return { userId: null, isAdmin: false }
  const { data: p } = await admin.from('profiles').select('role').eq('id', data.user.id).single()
  return { userId: data.user.id, isAdmin: p?.role === 'admin' }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Load an order the caller may see: admin, the signed-in owner, or a guest with the right token.
export async function loadOrder(req, { orderId, orderNumber, token }) {
  if (!admin) throw Object.assign(new Error('Server is not configured yet'), { status: 503 })
  const who = await caller(req)
  let q = admin.from('orders').select('*, services(name, slug)')
  if (orderId) { if (!UUID.test(orderId)) throw Object.assign(new Error('Order not found'), { status: 404 }); q = q.eq('id', orderId) }
  else if (orderNumber) q = q.eq('order_number', String(orderNumber).toUpperCase())
  else throw Object.assign(new Error('Order not found'), { status: 404 })
  const { data: order } = await q.maybeSingle()
  const ok = order && (
    who.isAdmin ||
    (who.userId && order.client_id === who.userId) ||
    (token && UUID.test(token) && order.access_token === token)
  )
  // Same answer for "missing" and "not yours", so order numbers can't be probed.
  if (!ok) throw Object.assign(new Error('Order not found'), { status: 404 })
  return { order, who }
}

export async function audit(actorId, action, target, detail, req) {
  await admin.from('audit_log').insert({
    actor_id: actorId, action, target, detail,
    ip: req?.headers.get('x-nf-client-connection-ip') || req?.headers.get('x-forwarded-for') || null,
  })
}

export function handler(fn) {
  return async (req) => {
    try { return await fn(req) } catch (e) {
      if (!e.status) console.error(e)
      return fail(e.status || 500, e.status ? e.message : 'Something went wrong. Please try again.')
    }
  }
}
