import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { scanDocument, type ScanMode } from '../lib/scanDocument'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function DocumentScanner({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter((f) => f.type.startsWith('image/')).slice(0, 1),
  )
  const [mode, setMode] = useState<ScanMode>('original')
  const [contrast, setContrast] = useState(1.3)
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
      setError('Select a document photo.')
      return
    }
    setError(null)
    setProcessing(true)
    try {
      const result = await scanDocument(file, { mode, contrast })
      setResultBlob(result.blob)
      setResultSize(result.size)
      setResultUrl(result.dataUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan cleanup failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Document cleanup
        </h4>

        <FileDropzone
          accept="image/*"
          files={files}
          onFiles={setFiles}
          hint="Phone photo of a document → clearer scan-style image"
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold">Mode</label>
          {(
            [
              { id: 'original', label: 'Original color' },
              { id: 'enhance', label: 'Enhance (color)' },
              { id: 'grayscale', label: 'Grayscale' },
              { id: 'bw', label: 'Black & white' },
            ] as const
          ).map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-600"
            >
              <input
                type="radio"
                name="scan-mode"
                checked={mode === m.id}
                onChange={() => setMode(m.id)}
                className="accent-brand-600"
              />
              {m.label}
            </label>
          ))}
        </div>

        {mode !== 'original' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">
              Contrast: {contrast.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.05}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
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
          Clean up scan
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        originalPreview={origUrl}
        resultPreview={resultUrl}
        resultLabel="Scanned"
        processing={processing}
        progress={processing ? 55 : null}
        onDownload={
          resultBlob
            ? () => downloadBlob(resultBlob, 'document-scan.jpg')
            : undefined
        }
        downloadLabel="Download JPG"
      />
    </div>
  )
}
