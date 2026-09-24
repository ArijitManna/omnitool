import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import heic2any from 'heic2any'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

function isHeic(file: File): boolean {
  const n = file.name.toLowerCase()
  return (
    n.endsWith('.heic') ||
    n.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  )
}

export function HeicToJpg({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter(isHeic).slice(0, 1),
  )
  const [quality, setQuality] = useState(0.92)
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  const onFiles = (list: File[]) => {
    const f = list[0]
    setFiles(f ? [f] : [])
    setResultUrl(null)
    setResultBlob(null)
    setResultSize(undefined)
    setOrigUrl(null)
    setError(null)
  }

  const process = async () => {
    if (!file) {
      setError('Select a HEIC/HEIF image.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality,
      })
      const blob = Array.isArray(converted) ? converted[0] : converted
      setResultBlob(blob)
      setResultSize(blob.size)
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      // Preview original via conversion thumbnail only (HEIC often won't show in <img>)
      setOrigUrl(url)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'HEIC conversion failed. Try another file or browser.',
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          HEIC → JPG
        </h4>

        <FileDropzone
          accept=".heic,.heif,image/heic,image/heif"
          files={files}
          onFiles={onFiles}
          hint="iPhone HEIC/HEIF → JPEG in your browser"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold">
            JPG quality: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min={40}
            max={98}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
            className="w-full accent-brand-600"
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Convert to JPG
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="JPG"
        processing={processing}
        progress={processing ? 40 : null}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.(heic|heif)$/i, '')}.jpg`,
                )
            : undefined
        }
        downloadLabel="Download JPG"
      />
    </div>
  )
}
