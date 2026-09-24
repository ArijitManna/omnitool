import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

export interface ExcelToPdfOptions {
  allSheets?: boolean
  onProgress?: (msg: string) => void
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sheetToHtml(sheet: XLSX.WorkSheet, name: string): string {
  const table = XLSX.utils.sheet_to_html(sheet, { id: 'sheet', editable: false })
  return `<div><h2 style="font-family:system-ui,sans-serif;font-size:16px;margin:0 0 12px;color:#0f172a">${escapeHtml(name)}</h2>${table}</div>`
}

async function htmlToCanvas(html: string): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas')
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:-12000px;top:0;width:1100px;padding:24px;background:#fff;color:#111;'
  container.innerHTML = `
    <style>
      table { border-collapse: collapse; width: 100%; font-family: system-ui, sans-serif; font-size: 11px; }
      td, th { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; font-weight: 600; }
    </style>
    ${html}
  `
  document.body.appendChild(container)
  try {
    return await html2canvas(container, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    })
  } finally {
    document.body.removeChild(container)
  }
}

/** Convert .xlsx / .xls workbook into a landscape PDF (one sheet starts a new page). */
export async function excelToPdf(
  file: File,
  options: ExcelToPdfOptions = {},
): Promise<Blob> {
  options.onProgress?.('Reading spreadsheet…')
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })

  const sheetNames =
    options.allSheets === false
      ? workbook.SheetNames.slice(0, 1)
      : workbook.SheetNames

  if (!sheetNames.length) throw new Error('Workbook has no sheets')

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })

  for (let i = 0; i < sheetNames.length; i++) {
    const name = sheetNames[i]
    options.onProgress?.(`Rendering sheet ${i + 1}/${sheetNames.length}: ${name}`)
    const sheet = workbook.Sheets[name]
    const canvas = await htmlToCanvas(sheetToHtml(sheet, name))

    if (i > 0) doc.addPage()

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 8
    const usableW = pageW - margin * 2
    const usableH = pageH - margin * 2
    const imgData = canvas.toDataURL('image/jpeg', 0.9)
    const imgW = usableW
    const imgH = (canvas.height * usableW) / canvas.width

    let heightLeft = imgH
    let y = margin
    let chunk = 0

    while (true) {
      if (chunk > 0) doc.addPage()
      doc.addImage(imgData, 'JPEG', margin, y, imgW, imgH)
      heightLeft -= usableH
      if (heightLeft <= 0) break
      y = margin - (imgH - heightLeft)
      chunk++
    }
  }

  options.onProgress?.('Done')
  return doc.output('blob')
}
