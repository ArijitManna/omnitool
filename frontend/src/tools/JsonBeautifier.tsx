import { useEffect, useState } from 'react'
import { Braces, Check, ClipboardCopy, Download, RefreshCw, Upload } from 'lucide-react'
import { formatJson, type JsonIndent } from '../lib/jsonFormat'
import { downloadBlob } from '../lib/utils'

interface Props {
  initialFiles?: File[]
}

export function JsonBeautifier({ initialFiles = [] }: Props) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'beautify' | 'minify'>('beautify')
  const [indent, setIndent] = useState<JsonIndent>(2)
  const [error, setError] = useState<string | null>(null)
  const [bytes, setBytes] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const run = (text = input) => {
    const result = formatJson(text, mode, indent)
    setError(result.error ?? null)
    setOutput(result.output)
    setBytes(result.bytes)
  }

  useEffect(() => {
    const jsonFile = initialFiles.find(
      (f) =>
        f.type === 'application/json' ||
        f.name.toLowerCase().endsWith('.json') ||
        f.type === 'text/plain',
    )
    if (!jsonFile) return
    void jsonFile.text().then((text) => {
      setInput(text)
      setFileName(jsonFile.name)
    })
  }, [initialFiles])

  useEffect(() => {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setBytes(0)
      return
    }
    const t = window.setTimeout(() => run(), 120)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on options/input
  }, [input, mode, indent])

  const onUpload = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const text = await file.text()
    setInput(text)
    setFileName(file.name)
  }

  const onCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const onDownload = () => {
    if (!output) return
    const base = (fileName ?? 'formatted.json').replace(/\.json$/i, '')
    const name = mode === 'minify' ? `${base}.min.json` : `${base}.pretty.json`
    downloadBlob(new Blob([output], { type: 'application/json' }), name)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
            <Braces className="h-4 w-4 text-brand-600" />
            Input JSON
          </h4>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <Upload className="h-3.5 w-3.5" />
            Upload
            <input
              type="file"
              accept=".json,application/json,text/plain"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files)}
            />
          </label>
        </div>

        {fileName && (
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{fileName}</p>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder='Paste JSON here… e.g. {"name":"SwiftDoc","tools":[1,2,3]}'
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900"
        />

        <div className="flex flex-wrap gap-2">
          {(['beautify', 'minify'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
                mode === m
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {m === 'beautify' ? 'Beautify' : 'Minify'}
            </button>
          ))}
        </div>

        {mode === 'beautify' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">Indent</label>
            <div className="flex gap-2">
              {(
                [
                  { label: '2 spaces', value: 2 as JsonIndent },
                  { label: '4 spaces', value: 4 as JsonIndent },
                  { label: 'Tab', value: '\t' as JsonIndent },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setIndent(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    indent === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="button"
          onClick={() => run()}
          disabled={!input.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          {mode === 'beautify' ? 'Beautify JSON' : 'Minify JSON'}
        </button>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Output</h4>
          {output && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {(bytes / 1024).toFixed(bytes >= 1024 ? 1 : 2)} KB · valid
            </span>
          )}
        </div>

        <textarea
          value={output}
          readOnly
          rows={14}
          spellCheck={false}
          placeholder="Formatted JSON will appear here"
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed outline-none dark:border-slate-600 dark:bg-slate-900"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onCopy()}
            disabled={!output}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!output}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download .json
          </button>
        </div>
      </div>
    </div>
  )
}
