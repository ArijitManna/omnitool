import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import {
  convertImageFormat,
  detectOutputFormat,
  extensionForFormat,
  type OutputFormat,
} from '../lib/compressImage'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function ImageConverter({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [format, setFormat] = useState<OutputFormat>('image/png')
  const [quality, setQuality] = useState(0.92)
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
    const detected = detectOutputFormat(file)
    // Default to a different format so conversion is meaningful
    setFormat(detected === 'image/png' ? 'image/jpeg' : 'image/png')
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
      const result = await convertImageFormat(file, format, quality)
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Format conversion
        </h4>

        <FileDropzone
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          files={files}
          onFiles={setFiles}
          hint="Convert between JPG, PNG, and WebP in your browser"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">Convert to</label>
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

        {format !== 'image/png' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">
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
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Convert image
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel={`As ${extensionForFormat(format).toUpperCase()}`}
        processing={processing}
        progress={processing ? 45 : null}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.[^.]+$/, '')}.${extensionForFormat(format)}`,
                )
            : undefined
        }
        downloadLabel={`Download .${extensionForFormat(format)}`}
      />
    </div>
  )
}
