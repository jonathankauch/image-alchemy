/** Human-readable byte size. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1)
  const value = bytes / Math.pow(k, i)
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
}

/** Percentage change from original to converted size, signed. */
export function sizeDelta(original: number, converted: number): { label: string; smaller: boolean } {
  if (original === 0) return { label: '—', smaller: false }
  const pct = Math.round(((converted - original) / original) * 100)
  const smaller = pct <= 0
  return { label: `${pct > 0 ? '+' : ''}${pct}%`, smaller }
}

/** File name without its extension. */
export function stripExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

/** Extension (lowercase, no dot) or a fallback derived from MIME. */
export function extOf(file: File): string {
  const dot = file.name.lastIndexOf('.')
  if (dot >= 0) return file.name.slice(dot + 1).toLowerCase()
  const slash = file.type.indexOf('/')
  return slash >= 0 ? file.type.slice(slash + 1).toUpperCase() : 'IMG'
}
