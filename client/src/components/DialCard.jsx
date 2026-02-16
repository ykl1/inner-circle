/**
 * Dial card: label with optional slider (0–10) or read-only position display.
 * Uses design tokens: --color-bg-card, --color-dial-*, --color-border-*, --color-text-*.
 */
export function DialCard({
  label,
  position = 5,
  onChange,
  readOnly = false,
  showDelta,
  selfLabel,
  finalLabel,
  deltaLabel,
  center = true
}) {
  const parts = (label || '').split(/\s*↔\s*/);
  const leftAnchor = parts[0] || 'Low';
  const rightAnchor = parts[1] || 'High';
  const value = Math.max(0, Math.min(10, Number(position)));
  const centerClass = center ? 'text-center' : '';

  if (readOnly) {
    const percent = (value / 10) * 100;
    return (
      <div className={`card ${centerClass}`}>
        {/* Spectrum labels on opposite ends, same layout as Build Your Date / Sabotage */}
        <div className="flex justify-between items-center mb-4" style={{ marginBottom: 'var(--space-md)' }}>
          <span className="text-label truncate mr-2" style={{ color: 'var(--color-text-secondary)' }}>{leftAnchor}</span>
          <span className="text-label truncate text-right ml-2" style={{ color: 'var(--color-text-secondary)' }}>{rightAnchor}</span>
        </div>
        {/* Full gradient track with thumb at position so current value is visually clear */}
        <div
          className="relative w-full rounded-full"
          style={{
            height: '18px',
            borderRadius: '9px',
            background: 'linear-gradient(to right, var(--color-dial-left), var(--color-dial-right))',
          }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '16px',
              left: `calc(${percent}% - 16px)`,
              background: 'var(--color-dial-thumb)',
              boxShadow: '0px 2px 12px rgba(0,0,0,0.5)',
            }}
          />
        </div>
        {(selfLabel != null || finalLabel != null || deltaLabel != null) && (
          <div className={`mt-2 flex items-center justify-center text-mono text-caption ${centerClass}`} style={{ color: 'var(--color-text-secondary)' }}>
            {selfLabel != null && <span className="ml-2">{selfLabel}</span>}
            {finalLabel != null && <span className="ml-2">{finalLabel}</span>}
            {deltaLabel != null && <span className="ml-2">{deltaLabel}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`card ${centerClass}`}>
      <div className="text-label mb-2" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-caption w-16 truncate">{leftAnchor}</span>
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-3 accent-brand"
          style={{ accentColor: 'var(--color-brand)' }}
        />
        <span className="text-caption w-16 truncate text-right">{rightAnchor}</span>
      </div>
      <div className={`mt-2 text-mono ${centerClass}`} style={{ color: 'var(--color-text-primary)' }}>{value}</div>
    </div>
  );
}

/**
 * Sabotage Map dial: shows "your pick" vs "final (after sabotage)" so it's obvious
 * where the player set the dial and how much they were moved. Trait labels on opposite ends.
 */
export function SabotageMapDial({ label, selfPosition, finalPosition, sabotageApplied }) {
  const self = Math.max(0, Math.min(10, Number(selfPosition)));
  const final = Math.max(0, Math.min(10, Number(finalPosition)));
  const delta = Number(sabotageApplied) || 0;
  const wasSabotaged = delta !== 0;
  const segmentLeft = (Math.min(self, final) / 10) * 100;
  const segmentWidth = (Math.abs(final - self) / 10) * 100;

  const parts = (label || '').split(/\s*↔\s*/);
  const leftAnchor = parts[0]?.trim() || 'Low';
  const rightAnchor = parts[1]?.trim() || 'High';

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderColor: wasSabotaged ? 'rgba(196, 75, 26, 0.5)' : undefined,
      }}
    >
      {/* Trait labels on opposite ends, same as Build Your Date / Sabotage */}
      <div className="flex justify-between items-center mb-3" style={{ marginBottom: 'var(--space-md)' }}>
        <span className="text-label truncate mr-2" style={{ color: 'var(--color-text-secondary)' }}>{leftAnchor}</span>
        <span className="text-label truncate text-right ml-2" style={{ color: 'var(--color-text-secondary)' }}>{rightAnchor}</span>
      </div>

      {/* Track: gradient bar only — no text on the bar so it stays readable */}
      <div
        className="relative w-full rounded-full"
        style={{
          height: '20px',
          borderRadius: '10px',
          background: 'linear-gradient(to right, var(--color-dial-left), var(--color-dial-right))',
        }}
      >
        {/* Sabotage segment: shows how far they were moved */}
        {wasSabotaged && (
          <div
            className="absolute inset-y-0 rounded-full opacity-80"
            style={{
              left: `${segmentLeft}%`,
              width: `${segmentWidth}%`,
              background: 'var(--color-damaged)',
            }}
          />
        )}

        {/* You marker: circle only */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full flex-shrink-0 border-2 border-white pointer-events-none"
          style={{
            left: `calc(${(self / 10) * 100}% - 10px)`,
            width: '20px',
            height: '20px',
            background: 'var(--color-dial-thumb)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        />

        {/* Final marker: circle only (when sabotaged) */}
        {wasSabotaged && (
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full flex-shrink-0 border-2 border-white pointer-events-none"
            style={{
              left: `calc(${(final / 10) * 100}% - 10px)`,
              width: '20px',
              height: '20px',
              background: 'var(--color-damaged)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              zIndex: 2,
            }}
          />
        )}
      </div>

      {/* Labels row: "You" and "Final" on card background, aligned under markers — high contrast */}
      <div className="relative w-full mt-2" style={{ minHeight: '20px' }}>
        <span
          className="absolute text-caption font-medium whitespace-nowrap"
          style={{
            left: `${(self / 10) * 100}%`,
            transform: 'translateX(-50%)',
            color: 'var(--color-text-primary)',
          }}
        >
          You
        </span>
        {wasSabotaged && (
          <span
            className="absolute text-caption font-medium whitespace-nowrap"
            style={{
              left: `${(final / 10) * 100}%`,
              transform: 'translateX(-50%)',
              color: 'var(--color-damaged)',
            }}
          >
            Final
          </span>
        )}
      </div>

      {/* One-line summary: makes the numbers obvious at a glance */}
      <div className="mt-4 text-mono text-caption text-center" style={{ color: 'var(--color-text-secondary)' }}>
        {wasSabotaged ? (
          <>You: {self} → {final} <span style={{ color: 'var(--color-damaged)' }}>({delta > 0 ? '+' : ''}{delta})</span></>
        ) : (
          <>Unchanged at {self}</>
        )}
      </div>
    </div>
  );
}
