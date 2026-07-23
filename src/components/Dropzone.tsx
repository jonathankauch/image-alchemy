import { useCallback, useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

interface DropzoneProps {
  onFiles: (files: File[]) => void
  compact?: boolean
}

export function Dropzone({ onFiles, compact = false }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) onFiles(files)
    },
    [onFiles],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      className={[
        'group relative cursor-pointer overflow-hidden rounded-2xl border text-center transition-all duration-300',
        compact ? 'px-6 py-6' : 'px-8 py-16',
        dragging
          ? 'border-gold-400 bg-gold-500/10 shadow-[0_0_50px_-12px_rgba(229,189,92,0.5)]'
          : 'border-ink-600 bg-ink-900/40 hover:border-gold-500/60 hover:bg-ink-800/40',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif,.tiff,.tga,.dds,.bmp,.ico"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <div className="pointer-events-none flex flex-col items-center gap-3">
        <div
          className={[
            'flex items-center justify-center rounded-full border transition-colors',
            compact ? 'h-10 w-10' : 'h-16 w-16',
            dragging ? 'border-gold-400 text-gold-300' : 'border-gold-500/40 text-gold-400/80',
          ].join(' ')}
        >
          <UploadCloud className={compact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={1.5} />
        </div>
        {!compact && (
          <p className="font-display text-2xl text-cream-50">
            Drop your images into the crucible
          </p>
        )}
        <p className="font-mono text-xs tracking-wide text-cream-500">
          {compact ? 'Add more images' : 'drag & drop, or click to browse'}
        </p>
      </div>
    </div>
  )
}
