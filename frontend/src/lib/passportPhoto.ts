import {
  compressToTargetKb,
  loadImage,
  type CompressResult,
  type OutputFormat,
} from './compressImage'

export interface PassportSize {
  id: string
  label: string
  widthPx: number
  heightPx: number
}

/** Common application sizes at ~300 DPI */
export const PASSPORT_SIZES: PassportSize[] = [
  { id: 'india-35x45', label: 'India / ICAO 35×45 mm', widthPx: 413, heightPx: 531 },
  { id: 'us-2x2', label: 'US 2×2 in', widthPx: 600, heightPx: 600 },
  { id: 'uk-35x45', label: 'UK 35×45 mm', widthPx: 413, heightPx: 531 },
  { id: 'schengen-35x45', label: 'Schengen 35×45 mm', widthPx: 413, heightPx: 531 },
  { id: 'custom', label: 'Custom pixels', widthPx: 400, heightPx: 400 },
]

export interface PassportOptions {
  widthPx: number
  heightPx: number
  /** cover-crop vs contain with pad */
  fit: 'cover' | 'contain'
  background: string
  format?: OutputFormat
  quality?: number
}

/** Center-crop or letterbox photo to exact passport dimensions. */
export async function generatePassportPhoto(
  file: File,
  options: PassportOptions,
): Promise<CompressResult> {
  const img = await loadImage(file)
  const tw = Math.max(1, Math.round(options.widthPx))
  const th = Math.max(1, Math.round(options.heightPx))
  const format = options.format ?? 'image/jpeg'
  const quality = options.quality ?? 0.92

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = options.background
  ctx.fillRect(0, 0, tw, th)

  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  const targetRatio = tw / th
  const srcRatio = srcW / srcH

  let sx = 0
  let sy = 0
  let sw = srcW
  let sh = srcH
  let dx = 0
  let dy = 0
  let dw = tw
  let dh = th

  if (options.fit === 'cover') {
    if (srcRatio > targetRatio) {
      sw = Math.round(srcH * targetRatio)
      sx = Math.round((srcW - sw) / 2)
    } else {
      sh = Math.round(srcW / targetRatio)
      sy = Math.round((srcH - sh) / 2)
    }
  } else {
    if (srcRatio > targetRatio) {
      dw = tw
      dh = Math.round(tw / srcRatio)
      dy = Math.round((th - dh) / 2)
    } else {
      dh = th
      dw = Math.round(th * srcRatio)
      dx = Math.round((tw - dw) / 2)
    }
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)

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
    width: tw,
    height: th,
    size: blob.size,
  }
}

export async function resizeSignature(
  file: File,
  maxWidth: number,
  maxHeight: number,
  targetKb?: number,
): Promise<CompressResult> {
  const img = await loadImage(file)
  let w = img.naturalWidth
  let h = img.naturalHeight
  const scale = Math.min(1, maxWidth / w, maxHeight / h)
  w = Math.max(1, Math.round(w * scale))
  h = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const format: OutputFormat = 'image/png'
  let blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encode failed'))), format)
  })

  if (targetKb && blob.size > targetKb * 1024) {
    // PNG may not shrink enough — try JPEG target compress from resized canvas as file
    const resizedFile = new File([blob], 'sig.png', { type: 'image/png' })
    return compressToTargetKb(resizedFile, targetKb, 'image/jpeg')
  }

  return {
    blob,
    dataUrl: canvas.toDataURL(format),
    width: w,
    height: h,
    size: blob.size,
  }
}
