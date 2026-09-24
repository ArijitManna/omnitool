import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import {
  detectOutputFormat,
  extensionForFormat,
  loadImage,
  resizeImage,
  type OutputFormat,
} from '../lib/compressImage'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function ImageResizer({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [mode, setMode] = useState<'pixels' | 'percent'>('pixels')
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [percent, setPercent] = useState(50)
  const [lockAspect, setLockAspect] = useState(true)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [format, setFormat] = useState<OutputFormat>('image/jpeg')
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const file = files[0]
  const aspect = natural ? natural.w / natural.h : 1

  useEffect(() => {
    if (!file) {
      setOrigUrl(null)
      setNatural(null)
      return
    }
    const url = URL.createObjectURL(file)
    setOrigUrl(url)
    setResultUrl(null)
    setResultBlob(null)
    setResultSize(undefined)
    setFormat(detectOutputFormat(file))

    void loadImage(file).then((img) => {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight })
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
    })

    return () => URL.revokeObjectURL(url)
  }, [file])

  const onWidthChange = (w: number) => {
    setWidth(w)
    if (lockAspect && natural) {
      setHeight(Math.max(1, Math.round(w / aspect)))
    }
  }

  const onHeightChange = (h: number) => {
    setHeight(h)
    if (lockAspect && natural) {
      setWidth(Math.max(1, Math.round(h * aspect)))
    }
  }

  const process = async () => {
    if (!file || !natural) {
      setError('Please select an image first.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const outW =
        mode === 'percent' ? Math.max(1, Math.round((natural.w * percent) / 100)) : width
      const outH =
        mode === 'percent' ? Math.max(1, Math.round((natural.h * percent) / 100)) : height
      const result = await resizeImage(file, outW, outH, format)
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resize failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Resize controls
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint={
            natural
              ? `Original ${natural.w}×${natural.h}px — resized in browser`
              : 'JPG, PNG, WebP'
          }
        />

        <div className="flex gap-2">
          {(['pixels', 'percent'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
                mode === m
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {m === 'pixels' ? 'By pixels' : 'By %'}
            </button>
          ))}
        </div>

        {mode === 'pixels' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold">Width (px)</label>
                <input
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => onWidthChange(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Height (px)</label>
                <input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => onHeightChange(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
                className="accent-brand-600"
              />
              Lock aspect ratio
            </label>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-semibold">Scale: {percent}%</label>
            <input
              type="range"
              min={5}
              max={200}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            {natural && (
              <p className="mt-1 text-[11px] text-slate-500">
                Output ≈ {Math.round((natural.w * percent) / 100)}×
                {Math.round((natural.h * percent) / 100)}px
              </p>
            )}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold">Output format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutputFormat)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
          >
            <option value="image/jpeg">JPG / JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WEBP</option>
          </select>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Resize image
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="Resized"
        processing={processing}
        progress={processing ? 50 : null}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.[^.]+$/, '')}-resized.${extensionForFormat(format)}`,
                )
            : undefined
        }
        downloadLabel="Download resized image"
      />
    </div>
  )
}
