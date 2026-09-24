import * as pdfjs from 'pdfjs-dist'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

// Vite-friendly worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PdfPageImage {
  page: number
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

export async function loadPdfDocument(file: File) {
  const data = new Uint8Array(await file.arrayBuffer())
  return pdfjs.getDocument({ data }).promise
}

/** Render each PDF page to a JPEG (or PNG) blob. */
export async function pdfToImages(
  file: File,
  options: {
    scale?: number
    format?: 'image/jpeg' | 'image/png'
    quality?: number
    onProgress?: (done: number, total: number) => void
  } = {},
): Promise<PdfPageImage[]> {
  const scale = options.scale ?? 1.5
  const format = options.format ?? 'image/jpeg'
  const quality = options.quality ?? 0.85
  const pdf = await loadPdfDocument(file)
  const results: PdfPageImage[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Encode failed'))),
        format,
        quality,
      )
    })

    results.push({
      page: pageNum,
      blob,
      dataUrl: canvas.toDataURL(format, quality),
      width: canvas.width,
      height: canvas.height,
    })
    options.onProgress?.(pageNum, pdf.numPages)
  }

  return results
}

export async function imagesZip(
  pages: PdfPageImage[],
  ext: 'jpg' | 'png',
): Promise<Blob> {
  const zip = new JSZip()
  for (const p of pages) {
    zip.file(`page-${String(p.page).padStart(3, '0')}.${ext}`, p.blob)
  }
  return zip.generateAsync({ type: 'blob' })
}

/** Lossy PDF compress: rasterize pages → JPEG → rebuild PDF. */
export async function compressPdfLossy(
  file: File,
  options: {
    scale?: number
    quality?: number
    onProgress?: (done: number, total: number) => void
  } = {},
): Promise<Blob> {
  const pages = await pdfToImages(file, {
    scale: options.scale ?? 1.25,
    format: 'image/jpeg',
    quality: options.quality ?? 0.72,
    onProgress: options.onProgress,
  })

  let doc: jsPDF | null = null
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    const wMm = (p.width * 25.4) / 96
    const hMm = (p.height * 25.4) / 96
    const orientation = wMm >= hMm ? 'landscape' : 'portrait'

    if (!doc) {
      doc = new jsPDF({ orientation, unit: 'mm', format: [wMm, hMm] })
    } else {
      doc.addPage([wMm, hMm], orientation)
    }

    doc.addImage(p.dataUrl, 'JPEG', 0, 0, wMm, hMm)
  }

  if (!doc) throw new Error('PDF has no pages')
  return doc.output('blob')
}

/** Binary-search JPEG quality to approach a target PDF size (KB). */
export async function compressPdfToTargetKb(
  file: File,
  targetKb: number,
  onProgress?: (msg: string) => void,
): Promise<Blob> {
  const targetBytes = Math.max(20, targetKb) * 1024
  let lo = 0.35
  let hi = 0.9
  let best: Blob | null = null
  const scale = 1.2

  for (let i = 0; i < 5; i++) {
    const mid = (lo + hi) / 2
    onProgress?.(`Pass ${i + 1}/5 · quality ${Math.round(mid * 100)}%`)
    const blob = await compressPdfLossy(file, { scale, quality: mid })
    best = blob
    if (blob.size > targetBytes) {
      hi = mid
    } else {
      lo = mid
    }
  }

  // If still too large, reduce scale once
  if (best && best.size > targetBytes) {
    onProgress?.('Reducing resolution…')
    best = await compressPdfLossy(file, { scale: 0.9, quality: 0.55 })
  }

  if (!best) throw new Error('Compression failed')
  return best
}
