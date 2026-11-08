// Returns one order for its owner, a guest with the private link, or the admin.
import { admin, handler, json, loadOrder, readBody } from '../lib/aec.mjs'

export default handler(async (req) => {
  const body = await readBody(req)
  const { order, who } = await loadOrder(req, body)

  const [{ data: files }, { data: deliverables }, { data: payments }] = await Promise.all([
    admin.from('order_files').select('id, file_name, purpose, size_bytes, created_at').eq('order_id', order.id).order('created_at'),
    admin.from('deliverables').select('*').eq('order_id', order.id).order('version', { ascending: false }),
    admin.from('payments').select('id, kind, amount, txn_id, status, reason, created_at').eq('order_id', order.id).order('created_at', { ascending: false }),
  ])

  // Preview images are private; hand out links that expire in an hour.
  const withPreviews = await Promise.all((deliverables || []).map(async (d) => {
    let previews = []
    if (d.preview_paths?.length) {
      const { data } = await admin.storage.from('previews').createSignedUrls(d.preview_paths, 3600)
      previews = (data || []).map((x) => x.signedUrl)
    }
    return {
      id: d.id, version: d.version, label: d.label, locked: d.locked,
      preview_page_count: d.preview_page_count, previews,
      downloads_left: Math.max(d.download_limit - d.download_count, 0),
      created_at: d.created_at,
    }
  }))

  const { access_token, admin_notes, ...safe } = order
  return json(200, {
    order: who.isAdmin ? order : safe,
    files: files || [],
    deliverables: withPreviews,
    payments: payments || [],
  })
})
