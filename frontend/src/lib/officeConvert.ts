/** Shared Office → PDF helpers: prefer LibreOffice API, fall back to browser. */

export type ConversionEngine = 'server' | 'client'

export interface OfficePdfResult {
  blob: Blob
  engine: ConversionEngine
}

export async function getDocsEngine(): Promise<{ libreOffice: boolean; message?: string }> {
  try {
    const res = await fetch('/api/docs/engine')
    if (!res.ok) return { libreOffice: false }
    return (await res.json()) as { libreOffice: boolean; message?: string }
  } catch {
    return { libreOffice: false }
  }
}

export async function convertViaLibreOffice(file: File): Promise<Blob> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/docs/to-pdf', { method: 'POST', body: form })
  if (!res.ok) {
    let message = `Server conversion failed (${res.status})`
    try {
      const data = (await res.json()) as { error?: string; code?: string }
      if (data.error) message = data.error
      if (data.code === 'LIBREOFFICE_UNAVAILABLE') {
        const err = new Error(message) as Error & { code?: string }
        err.code = 'LIBREOFFICE_UNAVAILABLE'
        throw err
      }
    } catch (e) {
      if (e instanceof Error && (e as Error & { code?: string }).code) throw e
    }
    throw new Error(message)
  }
  return res.blob()
}

/**
 * Try LibreOffice first; on unavailability run `clientFallback`.
 */
export async function convertOfficeToPdf(
  file: File,
  clientFallback: (onProgress?: (msg: string) => void) => Promise<Blob>,
  onProgress?: (msg: string) => void,
): Promise<OfficePdfResult> {
  onProgress?.('Checking conversion engine…')
  const engine = await getDocsEngine()

  if (engine.libreOffice) {
    onProgress?.('Converting with LibreOffice (high fidelity)…')
    try {
      const blob = await convertViaLibreOffice(file)
      return { blob, engine: 'server' }
    } catch (e) {
      const code = (e as Error & { code?: string }).code
      if (code !== 'LIBREOFFICE_UNAVAILABLE') {
        // Real conversion error — don't silently fall back (user expects fidelity)
        throw e
      }
    }
  }

  onProgress?.('LibreOffice unavailable — using browser conversion…')
  const blob = await clientFallback(onProgress)
  return { blob, engine: 'client' }
}
