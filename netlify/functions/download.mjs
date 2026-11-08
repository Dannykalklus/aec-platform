// Releases a deliverable through a 10-minute link, only after full payment is confirmed.
import { admin, audit, fail, handler, json, loadOrder, readBody } from '../lib/aec.mjs'

export default handler(async (req) => {
  const body = await readBody(req)
  const { order, who } = await loadOrder(req, body)
  const { data: d } = await admin.from('deliverables').select('*')
    .eq('id', body.deliverableId).eq('order_id', order.id).maybeSingle()
  if (!d) return fail(404, 'File not found.')

  if (!who.isAdmin) {
    if (d.locked) return fail(403, 'This file unlocks once your balance is confirmed.')
    if (d.download_count >= d.download_limit) return fail(403, 'Download limit reached. Message AEC on WhatsApp to reset it.')
    await admin.from('deliverables').update({ download_count: d.download_count + 1 }).eq('id', d.id)
  }

  const name = d.original_path.split('/').pop()
  const { data, error } = await admin.storage.from('deliverables')
    .createSignedUrl(d.original_path, 600, { download: `${order.order_number}-${name.replace(/^v\d+-/, '')}` })
  if (error) throw error
  await audit(who.userId, who.isAdmin ? 'admin_download' : 'download', order.order_number, { deliverable: d.id, version: d.version }, req)
  return json(200, { url: data.signedUrl })
})
