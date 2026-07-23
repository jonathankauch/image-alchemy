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
        <legend className="text-[0.9rem] font-semibold tracking-[-0.01em] text-ink">
          Convert to
        </legend>
        <div className="flex flex-col gap-4">
          {OUTPUT_FORMATS.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-faint">
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
                        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                        active
                          ? 'border-blue bg-blue text-white'
                          : 'border-line bg-canvas text-ink hover:border-blue/50 hover:text-blue',
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

      <div className="h-px bg-line-soft" />

      {/* Quality (lossy only) */}
      {target.lossy && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <label className="text-[0.9rem] font-semibold tracking-[-0.01em] text-ink">
              Quality
            </label>
            <span className="font-mono text-sm text-muted">{quality}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={quality}
            onChange={(e) => onChange({ quality: Number(e.target.value) })}
            className="ios-range w-full"
            style={{ ['--_pct' as string]: `${quality}%` }}
          />
        </div>
      )}

      {/* Resize */}
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-[0.9rem] font-semibold tracking-[-0.01em] text-ink">Resize</span>
          <input
            type="checkbox"
            checked={resizeEnabled}
            onChange={(e) => onChange({ resizeEnabled: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-blue)]"
          />
        </label>
        {resizeEnabled && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <NumberField label="W" value={width} onChange={(v) => onChange({ width: v })} />
              <span className="text-faint">×</span>
              <NumberField label="H" value={height} onChange={(v) => onChange({ height: v })} />
              <span className="text-sm text-faint">px</span>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => onChange({ lockAspect: e.target.checked })}
                className="h-3.5 w-3.5 accent-[var(--color-blue)]"
              />
              Keep aspect ratio (leave one blank)
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
    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-panel-2 px-3 py-2 focus-within:border-blue">
      <span className="font-mono text-[0.7rem] text-faint">{label}</span>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={value}
        placeholder="auto"
        onChange={(e) => onChange(e.target.value)}
        className="w-16 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint/60"
      />
    </div>
  )
}
