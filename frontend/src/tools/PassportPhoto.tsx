import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import {
  generatePassportPhoto,
  PASSPORT_SIZES,
} from '../lib/passportPhoto'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function PassportPhoto({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [sizeId, setSizeId] = useState(PASSPORT_SIZES[0].id)
  const [customW, setCustomW] = useState(400)
  const [customH, setCustomH] = useState(400)
  const [fit, setFit] = useState<'cover' | 'contain'>('cover')
  const [bg, setBg] = useState('#ffffff')
  const [replaceBg, setReplaceBg] = useState(true)
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [dims, setDims] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regenKey, setRegenKey] = useState(0)

  const file = files[0]
  const preset = PASSPORT_SIZES.find((s) => s.id === sizeId) ?? PASSPORT_SIZES[0]

  useEffect(() => {
    if (!file) {
      setOrigUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setOrigUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!file) {
      setResultUrl(null)
      setResultBlob(null)
      setResultSize(undefined)
      setDims(null)
      return
    }

    let cancelled = false
    const run = async () => {
      setError(null)
      setProcessing(true)
      try {
        const widthPx = sizeId === 'custom' ? customW : preset.widthPx
        const heightPx = sizeId === 'custom' ? customH : preset.heightPx
        const result = await generatePassportPhoto(file, {
          widthPx,
          heightPx,
          fit,
          background: bg,
          replaceBackground: replaceBg,
        })
        if (cancelled) return
        setResultBlob(result.blob)
        setResultSize(result.size)
        setResultUrl(result.dataUrl)
        setDims(`${result.width}×${result.height}px`)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to generate photo')
        setResultUrl(null)
        setResultBlob(null)
        setResultSize(undefined)
        setDims(null)
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }

    const t = window.setTimeout(run, 120)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [
    file,
    sizeId,
    customW,
    customH,
    fit,
    bg,
    replaceBg,
    preset.widthPx,
    preset.heightPx,
    regenKey,
  ])

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Passport / ID photo
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint="Background replaced & sized in your browser"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">Standard size</label>
          <select
            value={sizeId}
            onChange={(e) => setSizeId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
          >
            {PASSPORT_SIZES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.id !== 'custom' ? ` (${s.widthPx}×${s.heightPx}px)` : ''}
              </option>
            ))}
          </select>
        </div>

        {sizeId === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">Width px</label>
              <input
                type="number"
                min={50}
                value={customW}
                onChange={(e) => setCustomW(Number(e.target.value) || 50)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Height px</label>
              <input
                type="number"
                min={50}
                value={customH}
                onChange={(e) => setCustomH(Number(e.target.value) || 50)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {(['cover', 'contain'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFit(f)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
                fit === f
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {f === 'cover' ? 'Crop fill' : 'Fit + pad'}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Background</label>
          <div className="mb-2 flex items-center gap-2">
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-600"
            />
            <button
              type="button"
              onClick={() => setBg('#ffffff')}
              className={`rounded-lg border px-2 py-1 text-xs ${
                bg.toLowerCase() === '#ffffff'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              White
            </button>
            <button
              type="button"
              onClick={() => setBg('#e8f0fe')}
              className={`rounded-lg border px-2 py-1 text-xs ${
                bg.toLowerCase() === '#e8f0fe'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              Light blue
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={replaceBg}
              onChange={(e) => setReplaceBg(e.target.checked)}
              className="rounded border-slate-300"
            />
            Replace photo background with selected color
          </label>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => setRegenKey((k) => k + 1)}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          {processing ? 'Generating…' : 'Regenerate photo'}
        </button>
      </div>

      <div className="space-y-2">
        <ResultPreview
          originalSize={file?.size}
          resultSize={resultSize}
          originalPreview={origUrl}
          resultPreview={resultUrl}
          resultLabel={dims ? `Result ${dims}` : 'Result'}
          processing={processing}
          progress={processing ? 50 : null}
          onDownload={
            resultBlob
              ? () => downloadBlob(resultBlob, 'passport-photo.jpg')
              : undefined
          }
          downloadLabel="Download JPG"
        />
      </div>
    </div>
  )
}
