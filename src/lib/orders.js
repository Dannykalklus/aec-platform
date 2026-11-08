import { authHeader } from './auth'
import { supabase } from './supabase'

export const STATUS = {
  awaiting_quote: { label: 'Awaiting quote', tone: 'blue', text: 'We are reviewing your brief and will send a quote soon.' },
  quote_sent: { label: 'Quote sent', tone: 'gold', text: 'Your quote is ready. Accept it to continue.' },
  awaiting_deposit: { label: 'Awaiting deposit', tone: 'gold', text: 'Pay the deposit to start work.' },
  in_progress: { label: 'In progress', tone: 'blue', text: 'We are working on your order.' },
  ready_for_preview: { label: 'Ready for preview', tone: 'gold', text: 'Preview your work, then pay the balance to download it.' },
  payment_submitted: { label: 'Payment submitted', tone: 'gold', text: 'We are checking your payment against our MoMo records.' },
  payment_rejected: { label: 'Payment not confirmed', tone: 'red', text: 'We could not confirm your payment. See the reason below.' },
  delivered: { label: 'Delivered', tone: 'green', text: 'Your work is unlocked and ready to download.' },
  revision_requested: { label: 'Revision requested', tone: 'blue', text: 'We are working on your requested changes.' },
  closed: { label: 'Closed', tone: 'slate', text: 'This order is closed.' },
  cancelled: { label: 'Cancelled', tone: 'slate', text: 'This order was cancelled.' },
}

const TONES = {
  blue: 'bg-library/10 text-library',
  gold: 'bg-tassel/15 text-[#8a6407]',
  green: 'bg-scholar/15 text-action',
  red: 'bg-alert/10 text-alert',
  slate: 'bg-mist text-slate',
}

export function statusClass(status) {
  return TONES[STATUS[status]?.tone || 'slate']
}

export const cedi = (n) => (n == null ? '-' : `GH₵ ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`)

// What the client owes right now, and for which stage.
export function amountDue(order) {
  if (!order?.quoted_price) return { kind: null, amount: 0 }
  const price = Number(order.quoted_price)
  const paid = Number(order.amount_paid || 0)
  const deposit = Math.round(price * (order.deposit_percent ?? 50)) / 100
  const depositStage = ['awaiting_deposit'].includes(order.status) || (order.status === 'payment_rejected' && paid < deposit)
  if (depositStage) return { kind: 'deposit', amount: Math.max(deposit - paid, 0) }
  if (['ready_for_preview', 'payment_rejected'].includes(order.status)) return { kind: 'balance', amount: Math.max(price - paid, 0) }
  return { kind: null, amount: Math.max(price - paid, 0) }
}

// Guests keep their private links in this browser so they can find orders again.
const KEY = 'aec_guest_orders'
export function rememberGuestOrder(orderNumber, token) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]').filter((o) => o.orderNumber !== orderNumber)
    list.unshift({ orderNumber, token, savedAt: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)))
  } catch { /* storage unavailable */ }
}
export function guestOrders() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export const guestLink = (orderNumber, token) => `${window.location.origin}/o/${orderNumber}?t=${token}`

// Calls a Netlify Function, adding the login token when there is one.
export async function callFn(name, body) {
  const res = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

// Upload one client file through a short-lived signed upload link.
export async function uploadClientFile({ orderId, token, file, purpose }) {
  const { path, uploadToken } = await callFn('upload-url', {
    orderId, token, fileName: file.name, size: file.size, purpose,
  })
  const { error } = await supabase.storage.from('client-uploads').uploadToSignedUrl(path, uploadToken, file)
  if (error) throw error
  return path
}

export const MAX_UPLOAD_MB = 25
export const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.sav,.dta,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg'
