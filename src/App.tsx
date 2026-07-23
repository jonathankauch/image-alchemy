import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { Atom, Loader2, Lock, Package, Sparkles, Trash2 } from 'lucide-react'
import { Dropzone } from './components/Dropzone'
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
    <div className="alchemy-bg min-h-full">
      <div className="mx-auto flex max-w-5xl flex-col px-5 py-10 sm:px-8 sm:py-14">
        {/* Header */}
        <header className="rise flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 blur-2xl">
              <div className="mx-auto h-16 w-16 rounded-full bg-gold-500/40" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-500/50 bg-ink-900">
              <Atom className="slow-spin h-8 w-8 text-gold-400" strokeWidth={1.25} />
            </div>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-cream-50 sm:text-5xl">
            Image <span className="italic text-gold-400">Alchemy</span>
          </h1>
          <p className="max-w-md text-balance text-sm leading-relaxed text-cream-300">
            Transmute any image into any format — WebP, AVIF, PNG, JPEG, HEIC, TIFF and more.
            Powered by ImageMagick, distilled to run entirely in your browser.
          </p>
          <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-patina-400">
            <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
            Nothing leaves your device
          </div>
        </header>

        <div className="rule-gold mx-auto my-10 h-px w-full max-w-3xl" />

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* Settings */}
          <aside className="rise lg:sticky lg:top-8 lg:self-start" style={{ animationDelay: '80ms' }}>
            <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-6">
              <ConversionPanel settings={settings} onChange={patchSettings} />
            </div>
          </aside>

          {/* Queue + actions */}
          <main className="rise flex flex-col gap-5" style={{ animationDelay: '140ms' }}>
            <Dropzone onFiles={addFiles} compact={hasItems} />

            {hasItems && (
              <>
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-cream-500">
                    {items.length} image{items.length > 1 ? 's' : ''}
                    {doneCount > 0 && ` · ${doneCount} converted`}
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-1.5 font-mono text-xs text-cream-500 transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Clear
                  </button>
                </div>

                <FileList items={items} onRemove={removeItem} onDownload={downloadOne} />

                {/* Action bar */}
                <div className="sticky bottom-4 mt-2 flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-900/80 p-3 backdrop-blur-md sm:flex-row">
                  <button
                    type="button"
                    onClick={convertAll}
                    disabled={isConverting}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-400 to-gold-600 px-5 py-3 font-medium text-ink-950 shadow-[0_0_30px_-8px_rgba(229,189,92,0.7)] transition-all hover:from-gold-300 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {engineWarming ? 'Warming the crucible…' : 'Transmuting…'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" strokeWidth={2} />
                        Transmute to {settings.target.label}
                      </>
                    )}
                  </button>
                  {doneCount > 1 && (
                    <button
                      type="button"
                      onClick={downloadZip}
                      className="flex items-center justify-center gap-2 rounded-xl border border-gold-500/40 px-5 py-3 font-medium text-gold-300 transition-colors hover:border-gold-400 hover:bg-gold-500/10"
                    >
                      <Package className="h-4 w-4" strokeWidth={1.75} />
                      Download all (.zip)
                    </button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        <footer className="mt-16 text-center font-mono text-[0.68rem] text-ink-600">
          <span className="text-cream-500">Image Alchemy</span> · client-side conversion via
          ImageMagick WASM
        </footer>
      </div>
    </div>
  )
}
