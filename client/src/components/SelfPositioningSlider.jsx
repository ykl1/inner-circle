import { useRef, useCallback, useState, useEffect } from 'react';

const MIN = 0;
const MAX = 10;

function hapticLight() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export function SelfPositioningSlider({ leftLabel, rightLabel, value, onChange }) {
  const trackRef = useRef(null);
  const lastInt = useRef(value);
  const [isDragging, setIsDragging] = useState(false);

  const clamp = (v) => Math.max(MIN, Math.min(MAX, Math.round(v)));

  const valueToPercent = (v) => (v - MIN) / (MAX - MIN);
  const percent = valueToPercent(value);

  const getValueFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      const x = clientX - rect.left;
      const p = Math.max(0, Math.min(1, x / rect.width));
      return MIN + p * (MAX - MIN);
    },
    [value]
  );

  const handleMove = useCallback(
    (clientX) => {
      const v = clamp(getValueFromClientX(clientX));
      const prev = lastInt.current;
      onChange(v);
      if (prev !== v) {
        lastInt.current = v;
        hapticLight();
      }
    },
    [onChange, getValueFromClientX]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    lastInt.current = value;
  }, [value]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handleMove(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, handleMove]);

  const thumbSizePx = 44;
  const thumbRadius = thumbSizePx / 2;

  return (
    <div className="w-full">
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
          {leftLabel}
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
            background: 'linear-gradient(to right, var(--color-dial-left), var(--color-dial-right))',
          }}
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-[left] duration-200 ease-out"
            style={{
              width: `${thumbSizePx}px`,
              height: `${thumbSizePx}px`,
              borderRadius: `${thumbRadius}px`,
              left: `calc(${percent * 100}% - ${thumbRadius}px)`,
              background: 'var(--color-dial-thumb)',
              boxShadow: '0px 2px 12px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      </div>
      <div className="mt-2 text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
        Position: {value}
      </div>
    </div>
  );
}
