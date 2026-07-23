import { AlertTriangle, Check, Download, Loader2, X } from 'lucide-react'
import type { QueueItem } from '../lib/types'
import { formatBytes, sizeDelta } from '../lib/format'

interface FileListProps {
  items: QueueItem[]
  onRemove: (id: string) => void
  onDownload: (item: QueueItem) => void
}

export function FileList({ items, onRemove, onDownload }: FileListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li
          key={item.id}
          className="rise flex items-center gap-3.5 rounded-xl border border-ink-700 bg-ink-900/50 p-2.5 pr-3"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          {/* Thumbnail */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-600 bg-ink-800">
            <img
              src={item.previewUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-ink-950/80 py-0.5 text-center font-mono text-[0.55rem] uppercase tracking-wide text-cream-300">
              {item.sourceLabel}
            </span>
          </div>

          {/* Meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-cream-50">{item.file.name}</p>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-cream-500">
              <span>{formatBytes(item.originalSize)}</span>
              {item.result && (
                <>
                  <span className="text-gold-500/60">→</span>
                  <span className="text-cream-300">{formatBytes(item.result.size)}</span>
                  <Delta original={item.originalSize} converted={item.result.size} />
                </>
              )}
            </div>
          </div>

          {/* Status / actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge item={item} />
            {item.status === 'done' && item.result && (
              <button
                type="button"
                onClick={() => onDownload(item)}
                title="Download"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold-500/40 text-gold-300 transition-colors hover:border-gold-400 hover:bg-gold-500/10"
              >
                <Download className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              title="Remove"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-cream-500 transition-colors hover:bg-ink-700 hover:text-cream-50"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Delta({ original, converted }: { original: number; converted: number }) {
  const { label, smaller } = sizeDelta(original, converted)
  return (
    <span className={smaller ? 'text-patina-400' : 'text-gold-400'}>{label}</span>
  )
}

function StatusBadge({ item }: { item: QueueItem }) {
  switch (item.status) {
    case 'converting':
      return (
        <span className="flex items-center gap-1.5 font-mono text-xs text-gold-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </span>
      )
    case 'done':
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-patina-400">
          <Check className="h-4 w-4" strokeWidth={2} />
        </span>
      )
    case 'error':
      return (
        <span
          title={item.error}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400"
        >
          <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
        </span>
      )
    default:
      return null
  }
}
