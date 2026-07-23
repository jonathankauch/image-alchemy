/**
 * Image Alchemy mark: an alchemy flask whose contents are a picture
 * (mountain + sun) — "image" fused with "alchemy".
 */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Flask lip */}
      <path d="M9 3h6" />
      {/* Flask body + neck */}
      <path d="M10 3v5.2L4.8 18.3A1.3 1.3 0 0 0 6 20h12a1.3 1.3 0 0 0 1.2-1.7L14 8.2V3" />
      {/* Picture inside: sun */}
      <circle cx="14.6" cy="12.3" r="1" />
      {/* Picture inside: mountain range */}
      <path d="M6.7 18.2l3.3-3.4 2.1 1.7 2.2-2.1 3.1 3.8" />
    </svg>
  )
}
