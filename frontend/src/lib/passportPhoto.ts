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
  /** Replace solid/near-solid photo background with selected color */
  replaceBackground?: boolean
  format?: OutputFormat
  quality?: number
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** Sample likely backdrop color from corners + edge midpoints. */
function sampleBackdrop(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const pick = (x: number, y: number): [number, number, number] => {
    const i = (Math.min(w - 1, Math.max(0, x)) + Math.min(h - 1, Math.max(0, y)) * w) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  const samples = [
    pick(2, 2),
    pick(w - 3, 2),
    pick(2, h - 3),
    pick(w - 3, h - 3),
    pick(Math.floor(w / 2), 2),
    pick(Math.floor(w / 2), h - 3),
    pick(2, Math.floor(h / 2)),
    pick(w - 3, Math.floor(h / 2)),
  ]
  // Median-ish: average of samples that cluster near the first corner
  const [br, bg, bb] = samples[0]
  const cluster = samples.filter(([r, g, b]) => colorDist(r, g, b, br, bg, bb) < 48)
  const list = cluster.length >= 3 ? cluster : samples
  const n = list.length
  return [
    Math.round(list.reduce((s, c) => s + c[0], 0) / n),
    Math.round(list.reduce((s, c) => s + c[1], 0) / n),
    Math.round(list.reduce((s, c) => s + c[2], 0) / n),
  ]
}

/**
 * Replace near-backdrop pixels with solid fill.
 * Soft edge: feather by alpha blend near the threshold.
 */
function replaceSolidBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fillHex: string,
  threshold = 52,
) {
  const image = ctx.getImageData(0, 0, width, height)
  const { data } = image
  const [sr, sg, sb] = sampleBackdrop(data, width, height)
  const [tr, tg, tb] = parseHex(fillHex)
  const soft = 18

  for (let i = 0; i < data.length; i += 4) {
    const d = colorDist(data[i], data[i + 1], data[i + 2], sr, sg, sb)
    if (d <= threshold) {
      data[i] = tr
      data[i + 1] = tg
      data[i + 2] = tb
      data[i + 3] = 255
    } else if (d < threshold + soft) {
      const t = (d - threshold) / soft
      data[i] = Math.round(tr * (1 - t) + data[i] * t)
      data[i + 1] = Math.round(tg * (1 - t) + data[i + 1] * t)
      data[i + 2] = Math.round(tb * (1 - t) + data[i + 2] * t)
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
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
  const replaceBg = options.replaceBackground !== false

  // Work on a source canvas so we can replace background before sizing
  const src = document.createElement('canvas')
  src.width = img.naturalWidth
  src.height = img.naturalHeight
  const sctx = src.getContext('2d', { willReadFrequently: true })
  if (!sctx) throw new Error('Canvas not supported')
  sctx.drawImage(img, 0, 0)
  if (replaceBg) {
    replaceSolidBackground(sctx, src.width, src.height, options.background)
  }

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = options.background
  ctx.fillRect(0, 0, tw, th)

  const srcW = src.width
  const srcH = src.height
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

  ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh)

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
