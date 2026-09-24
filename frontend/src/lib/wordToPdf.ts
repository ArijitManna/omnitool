import mammoth from 'mammoth'
import { jsPDF } from 'jspdf'

const STYLE_MAP = [
  'table => table.docx-table',
  "p[style-name='Title'] => h1.docx-title:fresh",
  "p[style-name='Subtitle'] => h2.docx-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  'r[style-name="Strong"] => strong',
  'u => u',
  'strike => s',
]

/** CSS applied before html2canvas so tables/lines survive to PDF. */
const DOC_CSS = `
  .docx-root {
    font-family: "Calibri", "Segoe UI", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.45;
    color: #111;
    background: #fff;
  }
  .docx-root h1 { font-size: 22px; margin: 0 0 12px; font-weight: 700; }
  .docx-root h2 { font-size: 18px; margin: 16px 0 8px; font-weight: 700; }
  .docx-root h3 { font-size: 15px; margin: 12px 0 6px; font-weight: 700; }
  .docx-root p { margin: 0 0 8px; }
  .docx-root ul, .docx-root ol { margin: 0 0 10px; padding-left: 24px; }
  .docx-root li { margin: 0 0 4px; }
  .docx-root img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 8px 0;
  }
  .docx-root a { color: #0563c1; text-decoration: underline; }
  .docx-root u { text-decoration: underline; }
  .docx-root s { text-decoration: line-through; }
  .docx-root hr {
    border: none;
    border-top: 1.5px solid #222;
    margin: 14px 0;
    height: 0;
  }
  .docx-root table.docx-table,
  .docx-root table {
    border-collapse: collapse !important;
    width: 100%;
    margin: 12px 0 16px;
    table-layout: auto;
  }
  .docx-root table.docx-table td,
  .docx-root table.docx-table th,
  .docx-root table td,
  .docx-root table th {
    border: 1px solid #000 !important;
    padding: 6px 8px !important;
    vertical-align: top;
    text-align: left;
  }
  .docx-root table.docx-table th,
  .docx-root table th {
    font-weight: 700;
    background: #f3f4f6;
  }
`

/**
 * Mammoth ignores Word table borders — force visible borders + spacing
 * via classes and inline styles (html2canvas is more reliable with inline).
 */
function enrichHtml(html: string): string {
  let out = html || '<p>(Empty document)</p>'

  out = out.replace(/<table(\s[^>]*)?>/gi, (_m, attrs = '') => {
    const cleaned = String(attrs)
      .replace(/\sclass=(["'])(.*?)\1/i, '')
      .replace(/\sstyle=(["'])(.*?)\1/i, '')
    return `<table class="docx-table" style="border-collapse:collapse;width:100%;border:1px solid #000;margin:12px 0"${cleaned}>`
  })

  out = out.replace(/<(td|th)(\s[^>]*)?>/gi, (_m, tag: string, attrs = '') => {
    const a = String(attrs)
    const hasStyle = /\sstyle=/i.test(a)
    const borderStyle =
      'border:1px solid #000;padding:6px 8px;vertical-align:top;' +
      (tag.toLowerCase() === 'th' ? 'font-weight:700;background:#f3f4f6;' : '')
    if (hasStyle) {
      return `<${tag}${a.replace(
        /\sstyle=(["'])(.*?)\1/i,
        (_s, q, style) => ` style=${q}${borderStyle}${style}${q}`,
      )}>`
    }
    return `<${tag}${a} style="${borderStyle}">`
  })

  // Empty paragraphs that often act as spacers / separators in Word
  out = out.replace(/<p>\s*<\/p>/gi, '<p style="margin:0 0 8px;min-height:1em">&nbsp;</p>')

  return out
}

/** Convert a .docx file to PDF via HTML intermediate. */
export async function wordToPdf(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<Blob> {
  onProgress?.('Reading Word document…')
  const arrayBuffer = await file.arrayBuffer()

  const { value: rawHtml } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: STYLE_MAP,
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64')
        return {
          src: `data:${image.contentType};base64,${base64}`,
        }
      }),
    },
  )

  onProgress?.('Rendering pages…')
  const container = document.createElement('div')
  container.className = 'docx-root'
  // ~A4 content width at 96dpi (210mm - margins ≈ 794px with padding)
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;padding:48px 56px;box-sizing:border-box;background:#fff;color:#111;'
  container.innerHTML = `<style>${DOC_CSS}</style>${enrichHtml(rawHtml)}`
  document.body.appendChild(container)

  try {
    // Force layout / computed borders before capture
    void container.offsetHeight

    const canvas = await htmlToCanvas(container)
    const imgData = canvas.toDataURL('image/jpeg', 0.93)
    const pageW = 210
    const pageH = 297
    const margin = 12
    const usableW = pageW - margin * 2
    const usableH = pageH - margin * 2

    const imgW = usableW
    const imgH = (canvas.height * usableW) / canvas.width

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    let heightLeft = imgH
    let position = margin
    let page = 0

    while (true) {
      if (page > 0) doc.addPage()
      doc.addImage(imgData, 'JPEG', margin, position, imgW, imgH)
      heightLeft -= usableH
      if (heightLeft <= 0) break
      position = margin - (imgH - heightLeft)
      page++
    }

    onProgress?.('Done')
    return doc.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}

async function htmlToCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    // Re-apply borders in the cloned DOM (html2canvas clone can drop some styles)
    onclone: (_doc, cloned) => {
      const root = cloned.classList?.contains('docx-root')
        ? cloned
        : cloned.querySelector?.('.docx-root') || cloned

      root.querySelectorAll('table').forEach((table) => {
        const t = table as HTMLTableElement
        t.style.borderCollapse = 'collapse'
        t.style.width = '100%'
        t.style.border = '1px solid #000'
        t.querySelectorAll('td, th').forEach((cell) => {
          const c = cell as HTMLElement
          c.style.border = '1px solid #000'
          c.style.padding = '6px 8px'
          c.style.verticalAlign = 'top'
        })
      })

      root.querySelectorAll('hr').forEach((hr) => {
        const h = hr as HTMLElement
        h.style.border = 'none'
        h.style.borderTop = '1.5px solid #222'
        h.style.margin = '14px 0'
      })
    },
  })
}
