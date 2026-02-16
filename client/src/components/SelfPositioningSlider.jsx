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

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4" style={{ marginBottom: 'var(--space-md)' }}>
        <span className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
          {leftLabel}
        </span>
        <span className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
          {rightLabel}
        </span>
      </div>
      <div
        ref={trackRef}
        className="relative w-full rounded-full cursor-pointer select-none touch-none"
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
            width: '32px',
            height: '32px',
            borderRadius: '16px',
            left: `calc(${percent * 100}% - 16px)`,
            background: 'var(--color-dial-thumb)',
            boxShadow: '0px 2px 12px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </div>
  );
}
