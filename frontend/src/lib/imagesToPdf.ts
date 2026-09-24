import { jsPDF } from 'jspdf'
import { loadImage } from './compressImage'

export type PageSize = 'a4' | 'letter' | 'fit'

export interface ImagesToPdfOptions {
  pageSize?: PageSize
  marginMm?: number
  /** one image per page (default) */
  onePerPage?: boolean
}

function pageDimensions(pageSize: PageSize, imgW: number, imgH: number): { w: number; h: number } {
  switch (pageSize) {
    case 'letter':
      return { w: 215.9, h: 279.4 }
    case 'fit': {
      // Fit page to image aspect at ~96dpi → mm (approx)
      const maxW = 210
      const scale = maxW / imgW
      return { w: maxW, h: Math.max(1, imgH * scale) }
    }
    default:
      return { w: 210, h: 297 } // A4
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function jpegOrPng(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG'
}

/** Build a multi-page PDF from images (client-side). */
export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions = {},
): Promise<Blob> {
  if (!files.length) throw new Error('Add at least one image')

  const pageSize = options.pageSize ?? 'a4'
  const margin = options.marginMm ?? 10
  let doc: jsPDF | null = null

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const img = await loadImage(file)
    const dataUrl = await fileToDataUrl(file)
    const format = jpegOrPng(dataUrl)
    const { w: pageW, h: pageH } = pageDimensions(pageSize, img.naturalWidth, img.naturalHeight)

    if (!doc) {
      doc = new jsPDF({
        orientation: pageW >= pageH ? 'landscape' : 'portrait',
        unit: 'mm',
        format: pageSize === 'fit' ? [pageW, pageH] : pageSize === 'letter' ? 'letter' : 'a4',
      })
    } else if (i > 0) {
      if (pageSize === 'fit') {
        doc.addPage([pageW, pageH], pageW >= pageH ? 'landscape' : 'portrait')
      } else {
        doc.addPage()
      }
    }

    const usableW = doc.internal.pageSize.getWidth() - margin * 2
    const usableH = doc.internal.pageSize.getHeight() - margin * 2
    const imgRatio = img.naturalWidth / img.naturalHeight
    let drawW = usableW
    let drawH = drawW / imgRatio
    if (drawH > usableH) {
      drawH = usableH
      drawW = drawH * imgRatio
    }
    const x = margin + (usableW - drawW) / 2
    const y = margin + (usableH - drawH) / 2

    doc.addImage(dataUrl, format, x, y, drawW, drawH)
  }

  if (!doc) throw new Error('Failed to create PDF')
  return doc.output('blob')
}
