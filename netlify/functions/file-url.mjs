// Lets the admin open a client-uploaded file through a 10-minute link.
import { admin, fail, handler, json, loadOrder, readBody } from '../lib/aec.mjs'

export default handler(async (req) => {
  const body = await readBody(req)
  const { order, who } = await loadOrder(req, body)
  if (!who.isAdmin) return fail(403, 'Admin only.')
  const { data: f } = await admin.from('order_files').select('storage_path, file_name')
    .eq('id', body.fileId).eq('order_id', order.id).maybeSingle()
  if (!f) return fail(404, 'File not found.')
  const { data, error } = await admin.storage.from('client-uploads').createSignedUrl(f.storage_path, 600, { download: f.file_name })
  if (error) throw error
  return json(200, { url: data.signedUrl })
})
