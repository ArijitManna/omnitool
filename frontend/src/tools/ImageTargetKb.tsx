import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import {
  compressToTargetKb,
  extensionForFormat,
  type OutputFormat,
} from '../lib/compressImage'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

const PRESETS = [50, 100, 200, 500]

export function ImageTargetKb({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [targetKb, setTargetKb] = useState(150)
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
      const result = await compressToTargetKb(file, targetKb, format)
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compression failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Target size controls
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint="Processed in your browser to ~target KB"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold">Target file size (KB)</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => setTargetKb(kb)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  targetKb === kb
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-slate-300 hover:border-brand-500 dark:border-slate-600'
                }`}
              >
                {kb} KB
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min={10}
              max={1000}
              value={targetKb}
              onChange={(e) => setTargetKb(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <div className="flex w-24 items-center gap-1">
              <input
                type="number"
                min={5}
                max={5000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value) || 5)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-xs font-medium">KB</span>
            </div>
          </div>
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
          Compress to target
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="Result"
        processing={processing}
        progress={processing ? 55 : null}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.[^.]+$/, '')}-${targetKb}kb.${extensionForFormat(format)}`,
                )
            : undefined
        }
        downloadLabel="Download processed image"
      />
    </div>
  )
}
