import { useCallback, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'

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
        'group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed text-center transition-all duration-300',
        compact ? 'px-6 py-7' : 'px-8 py-16',
        dragging
          ? 'border-blue bg-blue-soft'
          : 'border-line bg-panel-2 hover:border-blue/50 hover:bg-panel',
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
            'flex items-center justify-center rounded-2xl transition-colors',
            compact ? 'h-10 w-10' : 'h-14 w-14',
            dragging ? 'bg-blue text-white' : 'bg-canvas text-blue shadow-card',
          ].join(' ')}
        >
          <ImagePlus className={compact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={2} />
        </div>
        {!compact && (
          <p className="text-xl font-semibold tracking-[-0.01em] text-ink">
            Drop images here
          </p>
        )}
        <p className="text-sm text-muted">
          {compact ? 'Add more images' : 'or click to browse — convert as many as you like'}
        </p>
      </div>
    </div>
  )
}
