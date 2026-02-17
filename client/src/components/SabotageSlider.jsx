import { useRef, useCallback, useState, useEffect } from 'react';

const BUDGET = 8;
const MIN_POS = 0;
const MAX_POS = 10;

function hapticLight() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/**
 * Sabotage dial: shows target's current position ("Their pick") and a thumb for the saboteur's
 * chosen position. Delta = thumb - basePosition. 1 point per position moved. Clamped 0–10.
 */
export function SabotageSlider({
  leftLabel,
  rightLabel,
  basePosition,
  delta,
  totalUsed,
  onChange,
  onDragStart,
  onDragEnd,
  isActive,
}) {
  const trackRef = useRef(null);
  const lastInt = useRef(delta);
  const [isDragging, setIsDragging] = useState(false);

  const base = Math.max(MIN_POS, Math.min(MAX_POS, Number(basePosition) ?? 5));
  const currentPosition = Math.max(MIN_POS, Math.min(MAX_POS, base + delta));
  const remainingBudget = BUDGET - totalUsed + Math.abs(delta);

  const clampDelta = useCallback(
    (rawDelta) => {
      const d = Math.round(rawDelta);
      const byRange = Math.max(-base, Math.min(MAX_POS - base, d));
      const byBudget = Math.max(-remainingBudget, Math.min(remainingBudget, byRange));
      return byBudget;
    },
    [base, remainingBudget]
  );

  const positionToPercent = (pos) => (pos - MIN_POS) / (MAX_POS - MIN_POS);
  const thumbPercent = positionToPercent(currentPosition);
  const basePercent = positionToPercent(base);

  const getPositionFromClientX = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return currentPosition;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const p = Math.max(0, Math.min(1, x / rect.width));
    return MIN_POS + p * (MAX_POS - MIN_POS);
  }, [currentPosition]);

  const getDeltaFromClientX = useCallback(
    (clientX) => {
      const pos = getPositionFromClientX(clientX);
      return clampDelta(pos - base);
    },
    [base, clampDelta, getPositionFromClientX]
  );

  const handleMove = useCallback(
    (clientX) => {
      const v = getDeltaFromClientX(clientX);
      const prev = lastInt.current;
      onChange(v);
      if (prev !== v) {
        lastInt.current = v;
        hapticLight();
      }
    },
    [onChange, getDeltaFromClientX]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    handleMove(e.clientX);
  };

  useEffect(() => {
    lastInt.current = delta;
  }, [delta]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMove(e.clientX);
    const onUp = () => {
      setIsDragging(false);
      onDragEnd?.();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, handleMove, onDragEnd]);

  const indicatorText =
    delta > 0 ? `→ ${delta}` : delta < 0 ? `← ${Math.abs(delta)}` : '0';

  return (
    <div className="w-full">
      <div
        className="flex justify-between items-start gap-2"
        style={{ marginBottom: 'var(--space-md)', gap: 'var(--space-sm)' }}
      >
        <span
          className="dial-anchor-label"
          style={{
            color: 'var(--color-sab-left)',
            flex: '0 1 48%',
            minWidth: 0,
            textAlign: 'left',
            fontWeight: 500,
          }}
        >
          {leftLabel}
        </span>
        <span
          className="dial-anchor-label"
          style={{
            color: 'var(--color-sab-right)',
            flex: '0 1 48%',
            minWidth: 0,
            textAlign: 'right',
            fontWeight: 500,
          }}
        >
          {rightLabel}
        </span>
      </div>

      <div className="dial-track-touch items-center">
        <div
          ref={trackRef}
          className="relative w-full rounded-full cursor-pointer select-none touch-none flex-1"
          style={{
            height: '18px',
            borderRadius: '9px',
            background: 'linear-gradient(to right, var(--color-sab-left), var(--color-sab-right))',
          }}
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-[1]"
            style={{
              left: `calc(${basePercent * 100}% - 6px)`,
              width: '12px',
              height: '12px',
              borderRadius: '6px',
              background: 'var(--color-dial-thumb)',
              border: '2px solid var(--color-sab-right)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-[left] duration-100 z-[2]"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              left: `calc(${thumbPercent * 100}% - 22px)`,
              transform: 'translateY(-50%)',
              background: 'var(--color-sab-thumb)',
              border: '1.5px solid var(--color-sab-right)',
              boxShadow: '0px 2px 12px rgba(139, 26, 26, 0.5)',
            }}
          />
        </div>
      </div>

      {/* Labels row: "Their pick" and delta at original position (easier to see) */}
      <div className="relative w-full mt-2" style={{ minHeight: '18px' }}>
        <span
          className="absolute text-caption whitespace-nowrap"
          style={{
            left: `${basePercent * 100}%`,
            transform: 'translateX(-50%)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Their pick
        </span>
        <span
          className="absolute text-mono text-caption font-medium whitespace-nowrap"
          style={{
            left: `${basePercent * 100}%`,
            transform: 'translateX(-50%)',
            top: '18px',
            color: 'var(--color-sab-delta)',
          }}
        >
          {indicatorText}
        </span>
      </div>
    </div>
  );
}
