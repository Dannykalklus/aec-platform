// Turns a PDF into watermarked preview images in the admin's browser.
// The first PREVIEW_PERCENT of pages are clear; the rest are blurred.
// Every page carries the AEC emblem and a tiled diagonal watermark.
import { BUSINESS } from './config'

let pdfjs
async function loadPdfjs() {
  if (pdfjs) return pdfjs
  pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function watermark(ctx, w, h, text, emblem) {
  ctx.save()
  // Tiled diagonal text across the whole page
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 6)
  const size = Math.round(w / 26)
  ctx.font = `700 ${size}px Montserrat, Arial, sans-serif`
  ctx.fillStyle = 'rgba(15, 35, 71, 0.13)'
  ctx.textAlign = 'center'
  const stepY = size * 4.2
  const stepX = ctx.measureText(text).width + size * 3
  for (let y = -h; y < h; y += stepY) {
    const offset = (Math.round(y / stepY) % 2) * (stepX / 2)
    for (let x = -w * 1.2; x < w * 1.2; x += stepX) ctx.fillText(text, x + offset, y)
  }
  ctx.restore()
  // Faint emblem in the centre and a small solid one in the corner
  if (emblem) {
    const big = w * 0.42
    ctx.globalAlpha = 0.08
    ctx.drawImage(emblem, (w - big) / 2, (h - big) / 2, big, big * (emblem.height / emblem.width))
    ctx.globalAlpha = 0.85
    const small = w * 0.07
    ctx.drawImage(emblem, w - small - w * 0.03, h * 0.02, small, small * (emblem.height / emblem.width))
    ctx.globalAlpha = 1
  }
}

/**
 * @param {File} pdfFile  PDF export of the deliverable
 * @param {object} opts   { orderNumber, clientName, previewPercent, onProgress(done, total) }
 * @returns {Promise<{ blobs: Blob[], pageCount: number }>}
 */
export async function buildPreviews(pdfFile, { orderNumber, clientName, previewPercent = BUSINESS.previewPercent, onProgress }) {
  const lib = await loadPdfjs()
  const pdf = await lib.getDocument({ data: await pdfFile.arrayBuffer() }).promise
  const emblem = await loadImage('/brand/aec-emblem.png').catch(() => null)
  const pageCount = pdf.numPages
  const clearPages = Math.max(1, Math.ceil(pageCount * previewPercent / 100))
  const text = `AEC PREVIEW · ${orderNumber}${clientName ? ` · ${clientName}` : ''}`
  const blobs = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.4 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    if (i > clearPages) {
      // Blur the page content so it can't be read, then label it
      const copy = document.createElement('canvas')
      copy.width = canvas.width; copy.height = canvas.height
      copy.getContext('2d').drawImage(canvas, 0, 0)
      ctx.filter = `blur(${Math.round(canvas.width / 90)}px)`
      ctx.drawImage(copy, 0, 0)
      ctx.filter = 'none'
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const bw = canvas.width * 0.7, bh = canvas.width * 0.12
      ctx.fillStyle = '#0F2347'
      ctx.beginPath(); ctx.roundRect((canvas.width - bw) / 2, canvas.height * 0.42, bw, bh, 18); ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.font = `700 ${Math.round(canvas.width / 34)}px Montserrat, Arial, sans-serif`
      ctx.fillText('Unlocks after full payment', canvas.width / 2, canvas.height * 0.42 + bh * 0.45)
      ctx.font = `500 ${Math.round(canvas.width / 48)}px Inter, Arial, sans-serif`
      ctx.fillStyle = '#E6AE1F'
      ctx.fillText(`Page ${i} of ${pageCount}`, canvas.width / 2, canvas.height * 0.42 + bh * 0.78)
    }
    watermark(ctx, canvas.width, canvas.height, text, emblem)

    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.72))
    blobs.push(blob)
    page.cleanup()
    onProgress?.(i, pageCount)
  }
  return { blobs, pageCount, clearPages }
}
