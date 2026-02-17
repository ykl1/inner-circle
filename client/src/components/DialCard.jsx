/**
 * Dial card: spectrum labels (left_anchor = position 1, right_anchor = position 10) with
 * optional slider (0–10) or read-only position display. Anchors left-aligned / right-aligned
 * and visually distinct; min 13px mobile / 14px web; wrap when long. Handle min 44px touch on mobile.
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
  const leftAnchor = (parts[0] || 'Low').trim();
  const rightAnchor = (parts[1] || 'High').trim();
  const value = Math.max(0, Math.min(10, Number(position)));
  const centerClass = center ? 'text-center' : '';

  const anchorBlock = (
    <div
      className="flex justify-between items-start gap-2"
      style={{ marginBottom: 'var(--space-md)', gap: 'var(--space-sm)' }}
    >
      <span
        className="dial-anchor-label"
        style={{
          color: 'var(--color-dial-left)',
          flex: '0 1 48%',
          minWidth: 0,
          textAlign: 'left',
          fontWeight: 500,
        }}
      >
        {leftAnchor}
      </span>
      <span
        className="dial-anchor-label"
        style={{
          color: 'var(--color-dial-right)',
          flex: '0 1 48%',
          minWidth: 0,
          textAlign: 'right',
          fontWeight: 500,
        }}
      >
        {rightAnchor}
      </span>
    </div>
  );

  if (readOnly) {
    const percent = (value / 10) * 100;
    const thumbSize = 32;
    const thumbOffset = thumbSize / 2;
    return (
      <div className={`card ${centerClass}`}>
        {anchorBlock}
        <div className="dial-track-touch">
          <div
            className="relative w-full rounded-full flex-1"
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
                left: `calc(${percent}% - ${thumbOffset}px)`,
                background: 'var(--color-dial-thumb)',
                boxShadow: '0px 2px 12px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
        <div className="mt-2 text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          Position: {value}
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
      {anchorBlock}
      <div className="dial-track-touch flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-brand"
          style={{
            accentColor: 'var(--color-brand)',
            minHeight: '44px',
            touchAction: 'none',
          }}
        />
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
      <div
        className="flex justify-between items-start gap-2"
        style={{ marginBottom: 'var(--space-md)', gap: 'var(--space-sm)' }}
      >
        <span
          className="dial-anchor-label"
          style={{
            color: 'var(--color-dial-left)',
            flex: '0 1 48%',
            minWidth: 0,
            textAlign: 'left',
            fontWeight: 500,
          }}
        >
          {leftAnchor}
        </span>
        <span
          className="dial-anchor-label"
          style={{
            color: 'var(--color-dial-right)',
            flex: '0 1 48%',
            minWidth: 0,
            textAlign: 'right',
            fontWeight: 500,
          }}
        >
          {rightAnchor}
        </span>
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
