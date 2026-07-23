import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { Loader2, Lock, Package, Trash2 } from 'lucide-react'
import { Dropzone } from './components/Dropzone'
import { LogoGlyph } from './components/LogoGlyph'
import { ConversionPanel, type Settings } from './components/ConversionPanel'
import { FileList } from './components/FileList'
import { ALL_FORMATS, convertImage, ensureEngine } from './lib/convert'
import type { QueueItem } from './lib/types'
import { extOf, stripExt } from './lib/format'

let idCounter = 0
const nextId = () => `item-${++idCounter}`

const DEFAULT_SETTINGS: Settings = {
  target: ALL_FORMATS.find((f) => f.ext === 'webp')!,
  quality: 82,
  resizeEnabled: false,
  width: '',
  height: '',
  lockAspect: true,
}

export default function App() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isConverting, setIsConverting] = useState(false)
  const [engineWarming, setEngineWarming] = useState(false)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Revoke all object URLs on unmount.
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.previewUrl)
        if (it.result) URL.revokeObjectURL(it.result.url)
      })
    }
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const additions: QueueItem[] = files.map((file) => ({
      id: nextId(),
      file,
      previewUrl: URL.createObjectURL(file),
      sourceLabel: extOf(file),
      originalSize: file.size,
      status: 'queued',
    }))
    setItems((prev) => [...prev, ...additions])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const found = prev.find((it) => it.id === id)
      if (found) {
        URL.revokeObjectURL(found.previewUrl)
        if (found.result) URL.revokeObjectURL(found.result.url)
      }
      return prev.filter((it) => it.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => {
        URL.revokeObjectURL(it.previewUrl)
        if (it.result) URL.revokeObjectURL(it.result.url)
      })
      return []
    })
  }, [])

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const convertAll = useCallback(async () => {
    const pending = itemsRef.current.filter((it) => it.status !== 'done')
    if (!pending.length) return

    setIsConverting(true)
    setEngineWarming(true)
    try {
      await ensureEngine()
    } catch {
      setEngineWarming(false)
      setIsConverting(false)
      pending.forEach((it) =>
        patchItem(it.id, { status: 'error', error: 'Failed to load conversion engine.' }),
      )
      return
    }
    setEngineWarming(false)

    const w = settings.resizeEnabled && settings.width ? Number(settings.width) : undefined
    const h = settings.resizeEnabled && settings.height ? Number(settings.height) : undefined

    // Sequential: the WASM engine is a single, non-reentrant instance.
    for (const it of pending) {
      patchItem(it.id, { status: 'converting', error: undefined })
      try {
        const { blob, width, height } = await convertImage(it.file, {
          target: settings.target,
          quality: settings.quality,
          width: w,
          height: h,
        })
        const filename = `${stripExt(it.file.name)}.${settings.target.ext}`
        patchItem(it.id, {
          status: 'done',
          result: {
            blob,
            url: URL.createObjectURL(blob),
            filename,
            size: blob.size,
            width,
            height,
          },
        })
      } catch (err) {
        patchItem(it.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Conversion failed.',
        })
      }
    }
    setIsConverting(false)
  }, [patchItem, settings])

  const downloadOne = useCallback((item: QueueItem) => {
    if (item.result) saveAs(item.result.blob, item.result.filename)
  }, [])

  const downloadZip = useCallback(async () => {
    const done = itemsRef.current.filter((it) => it.result)
    if (!done.length) return
    const zip = new JSZip()
    const used = new Map<string, number>()
    done.forEach((it) => {
      let name = it.result!.filename
      const count = used.get(name) ?? 0
      if (count > 0) {
        const dot = name.lastIndexOf('.')
        name = `${name.slice(0, dot)}-${count}${name.slice(dot)}`
      }
      used.set(it.result!.filename, count + 1)
      zip.file(name, it.result!.blob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, 'image-alchemy.zip')
  }, [])

  const doneCount = items.filter((it) => it.status === 'done').length
  const hasItems = items.length > 0

  return (
    <div className="apple-bg min-h-full">
      <div className="mx-auto flex max-w-5xl flex-col px-5 py-14 sm:px-8 sm:py-20">
        {/* Hero — shares the main grid's column template so the description
            lines up with the dropzone below it. */}
        <header className="rise grid gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Left: logo + wordmark, title */}
          <div className="flex flex-col items-start gap-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#3a9bff] to-blue text-white shadow-icon">
                <LogoGlyph className="h-7 w-7" />
              </div>
              <p className="font-mono text-sm font-medium uppercase tracking-[0.22em] text-faint">
                Image
                <br />
                Alchemy
              </p>
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl lg:whitespace-nowrap">
              Any image.
              <br />
              <span className="text-blue">Any format.</span>
            </h1>
          </div>

          {/* Right: description + privacy pill */}
          <div className="flex flex-col items-start gap-6 self-start">
            <p className="max-w-lg text-left text-xl leading-relaxed text-muted">
              A fast, private image converter that runs entirely in your browser. WebP, AVIF,
              PNG, JPEG, HEIC, TIFF and more — nothing is ever uploaded.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3.5 py-1.5 text-[0.8rem] font-medium text-muted">
              <Lock className="h-3.5 w-3.5 text-green" strokeWidth={2.25} />
              100% on-device · nothing leaves your browser
            </div>
          </div>
        </header>

        {/* Main grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Settings */}
          <aside className="rise lg:sticky lg:top-8 lg:self-start" style={{ animationDelay: '80ms' }}>
            <div className="rounded-3xl border border-line-soft bg-canvas p-6 shadow-card">
              <ConversionPanel settings={settings} onChange={patchSettings} />
            </div>
          </aside>

          {/* Queue + actions */}
          <main className="rise flex flex-col gap-5" style={{ animationDelay: '140ms' }}>
            <Dropzone onFiles={addFiles} compact={hasItems} />

            {hasItems && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-muted">
                    {items.length} image{items.length > 1 ? 's' : ''}
                    {doneCount > 0 && ` · ${doneCount} converted`}
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-sm font-medium text-faint transition-colors hover:text-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Clear
                  </button>
                </div>

                <FileList items={items} onRemove={removeItem} onDownload={downloadOne} />

                {/* Action bar */}
                <div className="glass sticky bottom-4 mt-2 flex flex-col gap-3 rounded-3xl border border-line-soft p-3 shadow-pop sm:flex-row">
                  <button
                    type="button"
                    onClick={convertAll}
                    disabled={isConverting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue px-6 py-3 font-medium text-white transition-all hover:bg-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {engineWarming ? 'Preparing…' : 'Converting…'}
                      </>
                    ) : (
                      `Convert to ${settings.target.label}`
                    )}
                  </button>
                  {doneCount > 1 && (
                    <button
                      type="button"
                      onClick={downloadZip}
                      className="flex items-center justify-center gap-2 rounded-full border border-line bg-canvas px-6 py-3 font-medium text-blue transition-colors hover:bg-panel"
                    >
                      <Package className="h-4 w-4" strokeWidth={2} />
                      Download all
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        <footer className="mt-20 flex flex-col items-center gap-1 text-center text-[0.8rem] text-faint">
          <span>Client-side conversion via ImageMagick WASM · Built with AI</span>
          <span>Image Alchemy™ © 2026 Jonathan Kauch — All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}
