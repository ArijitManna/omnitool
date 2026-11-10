export type JsonIndent = 2 | 4 | '\t'

export interface JsonFormatResult {
  output: string
  valid: boolean
  error?: string
  bytes: number
}

export function formatJson(
  input: string,
  mode: 'beautify' | 'minify',
  indent: JsonIndent = 2,
): JsonFormatResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { output: '', valid: false, error: 'Paste or upload JSON first.', bytes: 0 }
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    const output =
      mode === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent)
    return {
      output,
      valid: true,
      bytes: new TextEncoder().encode(output).length,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid JSON'
    return {
      output: '',
      valid: false,
      error: message.replace(/^JSON\.parse:\s*/i, ''),
      bytes: 0,
    }
  }
}
