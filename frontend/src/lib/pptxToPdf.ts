import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

/** Pull visible text runs from a PPTX slide XML. */
function extractSlideText(xml: string): string[] {
  const lines: string[] = []
  const paraRegex = /<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g
  let paraMatch: RegExpExecArray | null
  while ((paraMatch = paraRegex.exec(xml))) {
    const parts: string[] = []
    const textRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g
    let t: RegExpExecArray | null
    while ((t = textRegex.exec(paraMatch[1]))) {
      parts.push(decodeXmlEntities(t[1]))
    }
    const line = parts.join('').trim()
    if (line) lines.push(line)
  }
  return lines
}

function naturalSlideSort(a: string, b: string): number {
  const na = Number(/slide(\d+)\.xml$/i.exec(a)?.[1] ?? 0)
  const nb = Number(/slide(\d+)\.xml$/i.exec(b)?.[1] ?? 0)
  return na - nb
}

async function renderSlideCanvas(
  title: string,
  lines: string[],
): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  const el = document.createElement('div')
  el.style.cssText =
    'position:fixed;left:-14000px;top:0;width:1280px;height:720px;padding:48px 56px;box-sizing:border-box;background:linear-gradient(160deg,#0f172a 0%,#1e293b 55%,#334155 100%);color:#f8fafc;font-family:system-ui,sans-serif;overflow:hidden;'
  const body = lines
    .map(
      (l, i) =>
        `<p style="margin:0 0 10px;font-size:${i === 0 ? 36 : 22}px;font-weight:${i === 0 ? 700 : 400};line-height:1.35;opacity:${i === 0 ? 1 : 0.92}">${escapeHtml(l)}</p>`,
    )
    .join('')
  el.innerHTML = `
    <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.55;margin-bottom:20px">${escapeHtml(title)}</div>
    <div>${body || '<p style="opacity:0.5;font-size:20px">(No text on this slide)</p>'}</div>
  `
  document.body.appendChild(el)
  try {
    return await html2canvas(el, {
      scale: 1.25,
      backgroundColor: null,
      logging: false,
    })
  } finally {
    document.body.removeChild(el)
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Convert .pptx to PDF — text-focused slides (images/charts not fully preserved). */
export async function pptxToPdf(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<Blob> {
  onProgress?.('Reading presentation…')
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort(naturalSlideSort)

  if (!slidePaths.length) {
    throw new Error('No slides found. Use a .pptx file (not legacy .ppt).')
  }

  // Widescreen 16:9 in mm
  const pageW = 338.67
  const pageH = 190.5
  const doc = new jsPDF({ unit: 'mm', format: [pageW, pageH], orientation: 'landscape' })

  for (let i = 0; i < slidePaths.length; i++) {
    onProgress?.(`Slide ${i + 1}/${slidePaths.length}`)
    const xml = await zip.files[slidePaths[i]].async('string')
    const lines = extractSlideText(xml)
    const canvas = await renderSlideCanvas(`Slide ${i + 1}`, lines)
    if (i > 0) doc.addPage([pageW, pageH], 'landscape')
    const img = canvas.toDataURL('image/jpeg', 0.92)
    doc.addImage(img, 'JPEG', 0, 0, pageW, pageH)
  }

  onProgress?.('Done')
  return doc.output('blob')
}
