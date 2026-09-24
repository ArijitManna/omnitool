export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export interface CompressOptions {
  quality: number
  format: OutputFormat
  maxWidth?: number
  width?: number
  height?: number
}

export interface CompressResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  size: number
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Failed to encode image'))
        else resolve(blob)
      },
      format,
      quality,
    )
  })
}

function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: OutputFormat,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
): Promise<CompressResult> {
  const q = Math.min(0.98, Math.max(0.05, quality))
  const blob = await canvasToBlob(canvas, format, q)
  const dataUrl = canvas.toDataURL(format, q)
  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    size: blob.size,
  }
}

export async function compressImage(
  file: File,
  options: CompressOptions,
): Promise<CompressResult> {
  const img = await loadImage(file)
  let width = options.width ?? img.naturalWidth
  let height = options.height ?? img.naturalHeight

  if (options.maxWidth && width > options.maxWidth) {
    const scale = options.maxWidth / width
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = drawToCanvas(img, width, height, options.format)
  return encodeCanvas(canvas, options.format, options.quality)
}

/** Binary-search quality (and scale down if needed) to hit a target KB size. */
export async function compressToTargetKb(
  file: File,
  targetKb: number,
  format: OutputFormat = 'image/jpeg',
): Promise<CompressResult> {
  const targetBytes = Math.max(5, targetKb) * 1024
  const img = await loadImage(file)
  let width = img.naturalWidth
  let height = img.naturalHeight
  let best: CompressResult | null = null

  for (let scalePass = 0; scalePass < 8; scalePass++) {
    const canvas = drawToCanvas(img, width, height, format)
    let lo = 0.05
    let hi = 0.95

    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2
      const result = await encodeCanvas(canvas, format, mid)
      best = result

      if (result.size > targetBytes) {
        hi = mid
      } else {
        lo = mid
      }
    }

    if (best && best.size <= targetBytes) {
      return best
    }

    // Still too large at lowest quality — shrink dimensions and retry
    width = Math.max(32, Math.round(width * 0.85))
    height = Math.max(32, Math.round(height * 0.85))
  }

  if (!best) throw new Error('Failed to compress to target size')
  return best
}

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  format: OutputFormat,
  quality = 0.92,
): Promise<CompressResult> {
  const img = await loadImage(file)
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const canvas = drawToCanvas(img, w, h, format)
  return encodeCanvas(canvas, format, quality)
}

export async function convertImageFormat(
  file: File,
  format: OutputFormat,
  quality = 0.92,
): Promise<CompressResult> {
  return compressImage(file, { format, quality })
}

export function extensionForFormat(format: OutputFormat): string {
  switch (format) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    default:
      return 'jpg'
  }
}

export function detectOutputFormat(file: File): OutputFormat {
  if (file.type === 'image/png') return 'image/png'
  if (file.type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}
