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
          className="rise flex items-center gap-3.5 rounded-2xl border border-line-soft bg-canvas p-2.5 pr-3 shadow-card"
          style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
        >
          {/* Thumbnail */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line-soft bg-panel">
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center font-mono text-[0.55rem] font-medium uppercase tracking-wide text-white">
              {item.sourceLabel}
            </span>
          </div>

          {/* Meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted">
              <span>{formatBytes(item.originalSize)}</span>
              {item.result && (
                <>
                  <span className="text-faint">→</span>
                  <span className="text-ink">{formatBytes(item.result.size)}</span>
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
                className="flex h-8 w-8 items-center justify-center rounded-full text-blue transition-colors hover:bg-blue-soft"
              >
                <Download className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              title="Remove"
              className="flex h-8 w-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-panel hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Delta({ original, converted }: { original: number; converted: number }) {
  const { label, smaller } = sizeDelta(original, converted)
  return <span className={smaller ? 'text-green' : 'text-muted'}>{label}</span>
}

function StatusBadge({ item }: { item: QueueItem }) {
  switch (item.status) {
    case 'converting':
      return (
        <span className="flex h-8 w-8 items-center justify-center text-blue">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )
    case 'done':
      return (
        <span className="flex h-8 w-8 items-center justify-center text-green">
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
      )
    case 'error':
      return (
        <span title={item.error} className="flex h-8 w-8 items-center justify-center text-red">
          <AlertTriangle className="h-4 w-4" strokeWidth={2} />
        </span>
      )
    default:
      return null
  }
}
