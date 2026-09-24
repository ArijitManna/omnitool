import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { FileDropzone } from '../components/FileDropzone'
import { ResultPreview } from '../components/ResultPreview'
import { excelToPdf } from '../lib/excelToPdf'
import { convertOfficeToPdf, getDocsEngine, type ConversionEngine } from '../lib/officeConvert'
import { downloadBlob, formatBytes } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

function isExcel(file: File): boolean {
  const n = file.name.toLowerCase()
  return (
    n.endsWith('.xlsx') ||
    n.endsWith('.xls') ||
    n.endsWith('.ods') ||
    file.type.includes('spreadsheet') ||
    file.type === 'application/vnd.ms-excel'
  )
}

export function ExcelToPdf({ initialFiles = [] }: Props) {
  const [files, setFiles] = useState<File[]>(
    initialFiles.filter(isExcel).slice(0, 1),
  )
  const [allSheets, setAllSheets] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultSize, setResultSize] = useState<number | undefined>()
  const [engineUsed, setEngineUsed] = useState<ConversionEngine | null>(null)
  const [serverReady, setServerReady] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const file = files[0]

  useEffect(() => {
    void getDocsEngine().then((e) => setServerReady(e.libreOffice))
  }, [])

  const process = async () => {
    if (!file) {
      setError('Select an Excel file (.xlsx / .xls).')
      return
    }
    setError(null)
    setProcessing(true)
    setProgress(15)
    setResultBlob(null)
    setEngineUsed(null)
    try {
      const { blob, engine } = await convertOfficeToPdf(
        file,
        (onProgress) =>
          excelToPdf(file, {
            allSheets,
            onProgress,
          }),
        (msg) => {
          setStatus(msg)
          setProgress((p) => Math.min(90, (p ?? 15) + 12))
        },
      )
      setResultBlob(blob)
      setResultSize(blob.size)
      setEngineUsed(engine)
      setProgress(100)
      setStatus(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
    } finally {
      setProcessing(false)
      setProgress(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="border-b border-slate-200 pb-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:text-slate-200">
          Excel → PDF
        </h4>

        <FileDropzone
          accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          files={files}
          onFiles={(f) => setFiles(f.filter(isExcel).slice(0, 1))}
          hint={
            serverReady
              ? 'LibreOffice available — high-fidelity spreadsheet PDF.'
              : 'Browser fallback renders sheets as tables. Install LibreOffice for full fidelity.'
          }
        />

        {serverReady === false && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            LibreOffice not detected — using browser table rendering.
          </p>
        )}

        {!serverReady && (
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={allSheets}
              onChange={(e) => setAllSheets(e.target.checked)}
              className="accent-brand-600"
            />
            Include all sheets (browser mode)
          </label>
        )}

        {file && (
          <p className="text-xs text-slate-500">Source · {formatBytes(file.size)}</p>
        )}
        {status && <p className="text-xs text-brand-600">{status}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={process}
          disabled={processing || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
          Convert to PDF
        </button>
      </div>

      <ResultPreview
        originalSize={file?.size}
        resultSize={resultSize}
        resultLabel={
          engineUsed === 'server'
            ? 'PDF (LibreOffice)'
            : engineUsed === 'client'
              ? 'PDF (browser)'
              : 'PDF'
        }
        processing={processing}
        progress={progress}
        onDownload={
          resultBlob && file
            ? () =>
                downloadBlob(
                  resultBlob,
                  `${file.name.replace(/\.(xlsx|xls|ods)$/i, '')}.pdf`,
                )
            : undefined
        }
        downloadLabel="Download PDF"
      />
    </div>
  )
}
