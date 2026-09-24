import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import {
  compressImage,
  extensionForFormat,
  type OutputFormat,
} from '../lib/compressImage'
import { downloadBlob } from '../lib/utils'

interface ImageCompressorProps {
  initialFiles?: File[]
}

export function ImageCompressor({ initialFiles = [] }: ImageCompressorProps) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [quality, setQuality] = useState(0.7)
  const [format, setFormat] = useState<OutputFormat>('image/jpeg')
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  useEffect(() => {
    if (!file) {
      setOrigUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setOrigUrl(url)
    setResultUrl(null)
    setResultBlob(null)
    setResultSize(undefined)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const process = async () => {
    if (!file) {
      setError('Please select an image first.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const result = await compressImage(file, { quality, format })
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed')
    } finally {
      setProcessing(false)
    }
  }

  const download = () => {
    if (!resultBlob || !file) return
    const base = file.name.replace(/\.[^.]+$/, '')
    downloadBlob(resultBlob, `${base}-compressed.${extensionForFormat(format)}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Compression controls
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint="JPG, PNG, WebP — processed in your browser"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold">
            Quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min={5}
            max={98}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            className="w-full accent-brand-600"
          />
          <p className="text-[11px] text-slate-500">
            Lower quality = smaller file. Encoding stays on this device.
          </p>
        </div>

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
          Compress &amp; process
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="Compressed"
        processing={processing}
        progress={processing ? 60 : null}
        onDownload={resultBlob ? download : undefined}
        downloadLabel="Download processed image"
      />
    </div>
  )
}
