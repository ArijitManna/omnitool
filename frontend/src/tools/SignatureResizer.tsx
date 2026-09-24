import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { resizeSignature } from '../lib/passportPhoto'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function SignatureResizer({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [maxW, setMaxW] = useState(300)
  const [maxH, setMaxH] = useState(100)
  const [targetKb, setTargetKb] = useState<number | ''>('')
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [ext, setExt] = useState('png')
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
      setError('Select a signature image first.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const kb = targetKb === '' ? undefined : Number(targetKb)
      const result = await resizeSignature(file, maxW, maxH, kb)
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
      setExt(result.blob.type.includes('jpeg') ? 'jpg' : 'png')
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
          Signature resize
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint="Fits within max size; optional target KB for uploads"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Max width (px)</label>
            <input
              type="number"
              min={20}
              value={maxW}
              onChange={(e) => setMaxW(Number(e.target.value) || 20)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Max height (px)</label>
            <input
              type="number"
              min={20}
              value={maxH}
              onChange={(e) => setMaxH(Number(e.target.value) || 20)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Target size (KB) — optional
          </label>
          <input
            type="number"
            min={5}
            placeholder="e.g. 50"
            value={targetKb}
            onChange={(e) =>
              setTargetKb(e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-700"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            If set and still too large as PNG, converts to JPG to hit the target.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Resize signature
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="Signature"
        processing={processing}
        progress={processing ? 45 : null}
        onDownload={
          resultBlob
            ? () => downloadBlob(resultBlob, `signature.${ext}`)
            : undefined
        }
        downloadLabel={`Download .${ext}`}
      />
    </div>
  )
}
