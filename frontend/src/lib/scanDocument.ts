import { loadImage, type CompressResult } from './compressImage'

export type ScanMode = 'original' | 'enhance' | 'grayscale' | 'bw'

export interface ScanOptions {
  mode: ScanMode
  contrast?: number
  brightness?: number
}

/** Document-photo cleanup: original color, enhance, grayscale, or B&W. */
export async function scanDocument(
  file: File,
  options: ScanOptions,
): Promise<CompressResult> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(img, 0, 0)

  // Original color: keep pixels as-is (only re-encode)
  if (options.mode !== 'original') {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = imageData.data
    const contrast = options.contrast ?? 1.25
    const brightness = options.brightness ?? 12
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      r = clamp(factor * (r - 128) + 128 + brightness)
      g = clamp(factor * (g - 128) + 128 + brightness)
      b = clamp(factor * (b - 128) + 128 + brightness)

      if (options.mode === 'grayscale' || options.mode === 'bw') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        if (options.mode === 'bw') {
          const v = gray > 160 ? 255 : 0
          r = g = b = v
        } else {
          r = g = b = gray
        }
      }

      d[i] = r
      d[i + 1] = g
      d[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const format = 'image/jpeg'
  const quality = 0.92
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encode failed'))),
      format,
      quality,
    )
  })

  return {
    blob,
    dataUrl: canvas.toDataURL(format, quality),
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}
