// Gives a short-lived signed link to upload one client file to private storage.
import { randomUUID } from 'node:crypto'
import { admin, fail, handler, json, loadOrder, readBody } from '../lib/aec.mjs'

const MAX_BYTES = 25 * 1024 * 1024
const ALLOWED = /\.(pdf|docx?|xlsx?|csv|sav|dta|pptx?|txt|zip|png|jpe?g)$/i
const PURPOSES = ['guideline', 'comment', 'data', 'draft', 'other']

export default handler(async (req) => {
  const body = await readBody(req)
  const { fileName, size, purpose } = body
  if (!fileName || !ALLOWED.test(fileName)) return fail(400, 'That file type is not accepted.')
  if (!size || size > MAX_BYTES) return fail(400, 'Each file must be under 25 MB.')
  const { order, who } = await loadOrder(req, body)
  if (['closed', 'cancelled'].includes(order.status)) return fail(400, 'This order is closed.')

  const safeName = fileName.replace(/[^\w.\- ]+/g, '_').slice(-120)
  const path = `${order.id}/${randomUUID()}-${safeName}`
  const { data, error } = await admin.storage.from('client-uploads').createSignedUploadUrl(path)
  if (error) throw error

  await admin.from('order_files').insert({
    order_id: order.id, uploaded_by: who.userId, file_name: safeName, storage_path: path,
    size_bytes: size, purpose: PURPOSES.includes(purpose) ? purpose : 'other',
  })
  return json(200, { path, uploadToken: data.token })
})
