# Image Alchemy

**Transmute any image into any format — entirely in your browser.**

🔮 **Live app:** https://jonathankauch.github.io/image-alchemy

Image Alchemy is a fast, private, client-side image converter. Drop in images of almost
any format and turn them into WebP, AVIF, PNG, JPEG, HEIC, TIFF and more. It's powered by
[ImageMagick](https://imagemagick.org) compiled to WebAssembly, so **nothing ever leaves
your device** — no uploads, no servers, no tracking.

## Features

- **Any-to-any conversion** — WebP, AVIF, PNG, JPEG, GIF, TIFF, BMP, ICO, HEIC, TGA, DDS, PPM…
- **Batch mode** — drop many images at once and download them all as a `.zip`
- **Quality control** — tune compression for lossy formats (WebP, AVIF, JPEG, HEIC)
- **Resize** — scale images during conversion, with optional aspect-ratio lock
- **100% client-side** — all conversion runs in-browser via ImageMagick WASM; fully offline-capable

## Tech stack

- [Vite](https://vitejs.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [`@imagemagick/magick-wasm`](https://github.com/dlemstra/magick-wasm) — the conversion engine
- [JSZip](https://stuk.github.io/jszip/) + [FileSaver.js](https://github.com/eligrey/FileSaver.js) — batch downloads

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # type-check + production build
npm run preview   # preview the production build
npm run deploy    # publish dist/ to GitHub Pages (gh-pages branch)
```

## How it works

On the first conversion the ~14 MB ImageMagick WASM engine is loaded once and cached. Each
image is decoded, optionally resized, re-encoded to the target format, and handed back as a
downloadable blob — all in a Web-safe, memory-managed loop that never touches the network.

---

Built with [Claude Code](https://claude.com/claude-code).
