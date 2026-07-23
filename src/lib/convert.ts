import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from '@imagemagick/magick-wasm'
// Vite resolves this to a hashed, base-prefixed asset URL at build time.
import wasmUrl from '@imagemagick/magick-wasm/magick.wasm?url'

/* -------------------------------------------------------------------------- */
/*  Supported formats                                                          */
/* -------------------------------------------------------------------------- */

export interface FormatDef {
  /** MagickFormat used when writing. */
  format: MagickFormat
  /** Short label shown in the UI. */
  label: string
  /** Output file extension (no dot). */
  ext: string
  /** MIME type for the produced Blob. */
  mime: string
  /** Whether a quality/compression setting is meaningful for this format. */
  lossy: boolean
}

export interface FormatGroup {
  category: string
  formats: FormatDef[]
}

/** Output formats offered in the target dropdown, grouped by family. */
export const OUTPUT_FORMATS: FormatGroup[] = [
  {
    category: 'Web',
    formats: [
      { format: MagickFormat.WebP, label: 'WebP', ext: 'webp', mime: 'image/webp', lossy: true },
      { format: MagickFormat.Avif, label: 'AVIF', ext: 'avif', mime: 'image/avif', lossy: true },
      { format: MagickFormat.Png, label: 'PNG', ext: 'png', mime: 'image/png', lossy: false },
      { format: MagickFormat.Jpeg, label: 'JPEG', ext: 'jpg', mime: 'image/jpeg', lossy: true },
      { format: MagickFormat.Gif, label: 'GIF', ext: 'gif', mime: 'image/gif', lossy: false },
    ],
  },
  {
    category: 'Raster',
    formats: [
      { format: MagickFormat.Tiff, label: 'TIFF', ext: 'tiff', mime: 'image/tiff', lossy: false },
      { format: MagickFormat.Bmp, label: 'BMP', ext: 'bmp', mime: 'image/bmp', lossy: false },
      { format: MagickFormat.Ico, label: 'ICO', ext: 'ico', mime: 'image/x-icon', lossy: false },
      { format: MagickFormat.Heic, label: 'HEIC', ext: 'heic', mime: 'image/heic', lossy: true },
    ],
  },
  {
    category: 'Other',
    formats: [
      { format: MagickFormat.Tga, label: 'TGA', ext: 'tga', mime: 'image/x-tga', lossy: false },
      { format: MagickFormat.Dds, label: 'DDS', ext: 'dds', mime: 'image/vnd.ms-dds', lossy: false },
      { format: MagickFormat.Ppm, label: 'PPM', ext: 'ppm', mime: 'image/x-portable-pixmap', lossy: false },
    ],
  },
]

export const ALL_FORMATS: FormatDef[] = OUTPUT_FORMATS.flatMap((g) => g.formats)

export function findFormat(ext: string): FormatDef | undefined {
  const clean = ext.toLowerCase().replace(/^\./, '')
  return ALL_FORMATS.find((f) => f.ext === clean)
}

/* -------------------------------------------------------------------------- */
/*  Engine initialization (lazy, once)                                         */
/* -------------------------------------------------------------------------- */

let initPromise: Promise<void> | null = null

/** Initialize the ImageMagick WASM engine exactly once. */
export function ensureEngine(): Promise<void> {
  if (!initPromise) {
    initPromise = initializeImageMagick(new URL(wasmUrl, window.location.href)).catch((err) => {
      // Allow a later retry if init failed.
      initPromise = null
      throw err
    })
  }
  return initPromise
}

/* -------------------------------------------------------------------------- */
/*  Conversion                                                                 */
/* -------------------------------------------------------------------------- */

export interface ConvertOptions {
  target: FormatDef
  /** 1-100; only applied for lossy targets. */
  quality?: number
  /** Optional resize. If only one dimension is given, aspect is preserved. */
  width?: number
  height?: number
}

export interface ConvertResult {
  blob: Blob
  width: number
  height: number
}

/**
 * Convert a single image File to the requested target format.
 * Runs entirely in-browser via ImageMagick WASM.
 */
export async function convertImage(file: File, opts: ConvertOptions): Promise<ConvertResult> {
  await ensureEngine()
  const bytes = new Uint8Array(await file.arrayBuffer())

  return ImageMagick.read(bytes, (image) => {
    if (opts.width || opts.height) {
      // A zero dimension lets ImageMagick preserve aspect ratio from the other.
      const geometry = new MagickGeometry(opts.width ?? 0, opts.height ?? 0)
      // When both dimensions are supplied, honor them exactly.
      if (opts.width && opts.height) geometry.ignoreAspectRatio = true
      image.resize(geometry)
    }

    if (opts.target.lossy && opts.quality != null) {
      image.quality = Math.max(1, Math.min(100, Math.round(opts.quality)))
    }

    const outWidth = image.width
    const outHeight = image.height

    return image.write(opts.target.format, (data) => {
      // Copy out of WASM memory before it is reclaimed after this callback.
      const copy = new Uint8Array(data.length)
      copy.set(data)
      return {
        blob: new Blob([copy], { type: opts.target.mime }),
        width: outWidth,
        height: outHeight,
      }
    })
  })
}

/** Read an image's intrinsic dimensions without a full conversion. */
export async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  await ensureEngine()
  const bytes = new Uint8Array(await file.arrayBuffer())
  return ImageMagick.read(bytes, (image) => ({ width: image.width, height: image.height }))
}
