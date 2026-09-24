import { createWorker } from 'tesseract.js'
import { loadImage } from './compressImage'
import { pdfToImages } from './pdfClient'

export interface OcrResult {
  text: string
  pages: { page: number; text: string }[]
}

/** OCR an image file with Tesseract.js */
export async function ocrImage(
  file: File,
  onProgress?: (status: string, progress: number) => void,
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.status, m.progress)
      }
    },
  })
  try {
    const url = URL.createObjectURL(file)
    try {
      const {
        data: { text },
      } = await worker.recognize(url)
      return text.trim()
    } finally {
      URL.revokeObjectURL(url)
    }
  } finally {
    await worker.terminate()
  }
}

/** Render PDF pages and OCR each (for scanned PDFs). */
export async function ocrPdf(
  file: File,
  onProgress?: (status: string, progress: number) => void,
): Promise<OcrResult> {
  onProgress?.('Rendering pages…', 0.05)
  const images = await pdfToImages(file, {
    scale: 1.8,
    format: 'image/png',
    onProgress: (done, total) =>
      onProgress?.(`Rendering ${done}/${total}`, (done / total) * 0.35),
  })

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.('Recognizing…', 0.35 + m.progress * 0.6)
      }
    },
  })

  const pages: { page: number; text: string }[] = []
  try {
    for (let i = 0; i < images.length; i++) {
      onProgress?.(
        `OCR page ${i + 1}/${images.length}`,
        0.35 + (i / images.length) * 0.6,
      )
      const {
        data: { text },
      } = await worker.recognize(images[i].dataUrl)
      pages.push({ page: images[i].page, text: text.trim() })
    }
  } finally {
    await worker.terminate()
  }

  const text = pages
    .map((p) => `===== Page ${p.page} =====\n${p.text || '[no text]'}`)
    .join('\n\n')

  onProgress?.('Done', 1)
  return { text, pages }
}

export async function ocrFile(
  file: File,
  onProgress?: (status: string, progress: number) => void,
): Promise<OcrResult> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    return ocrPdf(file, onProgress)
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Select an image or PDF for OCR')
  }

  // Verify image loads
  await loadImage(file)
  const text = await ocrImage(file, onProgress)
  return { text, pages: [{ page: 1, text }] }
}
