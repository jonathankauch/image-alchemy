import { OUTPUT_FORMATS, type FormatDef } from '../lib/convert'

export interface Settings {
  target: FormatDef
  quality: number
  resizeEnabled: boolean
  width: string
  height: string
  lockAspect: boolean
}

interface ConversionPanelProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

export function ConversionPanel({ settings, onChange }: ConversionPanelProps) {
  const { target, quality, resizeEnabled, width, height, lockAspect } = settings

  return (
    <div className="flex flex-col gap-7">
      {/* Target format */}
      <fieldset className="flex flex-col gap-3">
        <legend className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cream-500">
          Transmute into
        </legend>
        <div className="flex flex-col gap-4">
          {OUTPUT_FORMATS.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold-500/70">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.formats.map((f) => {
                  const active = f.format === target.format
                  return (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => onChange({ target: f })}
                      className={[
                        'rounded-lg border px-3 py-1.5 text-sm transition-all duration-200',
                        active
                          ? 'border-gold-400 bg-gold-500/15 text-gold-300 shadow-[0_0_20px_-8px_rgba(229,189,92,0.7)]'
                          : 'border-ink-600 text-cream-300 hover:border-gold-500/50 hover:text-cream-50',
                      ].join(' ')}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Quality (lossy only) */}
      {target.lossy && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cream-500">
              Quality
            </label>
            <span className="font-mono text-sm text-gold-300">{quality}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={quality}
            onChange={(e) => onChange({ quality: Number(e.target.value) })}
            className="alchemy-range w-full"
            style={{ ['--_pct' as string]: `${quality}%` }}
          />
        </div>
      )}

      {/* Resize */}
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={resizeEnabled}
            onChange={(e) => onChange({ resizeEnabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-gold-500)]"
          />
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-cream-500">
            Resize
          </span>
        </label>
        {resizeEnabled && (
          <div className="flex flex-col gap-3 pl-6">
            <div className="flex items-center gap-2">
              <NumberField
                label="W"
                value={width}
                onChange={(v) => onChange({ width: v })}
              />
              <span className="text-cream-500">×</span>
              <NumberField
                label="H"
                value={height}
                onChange={(v) => onChange({ height: v })}
              />
              <span className="font-mono text-xs text-cream-500">px</span>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-cream-500">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => onChange({ lockAspect: e.target.checked })}
                className="h-3.5 w-3.5 accent-[var(--color-gold-500)]"
              />
              Preserve aspect ratio (leave one blank)
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900/60 px-2.5 py-1.5 focus-within:border-gold-500/60">
      <span className="font-mono text-[0.62rem] text-gold-500/70">{label}</span>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={value}
        placeholder="auto"
        onChange={(e) => onChange(e.target.value)}
        className="w-16 bg-transparent font-mono text-sm text-cream-50 outline-none placeholder:text-ink-600"
      />
    </div>
  )
}
