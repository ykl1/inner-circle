import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { SabotageSlider } from '../components/SabotageSlider';

const SABOTAGE_BUDGET = 8;

export function SabotageScreen() {
  const { gameState, submitSabotage } = useGame();
  const [deltas, setDeltas] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCardId, setActiveCardId] = useState(null);
  const [showZeroConfirm, setShowZeroConfirm] = useState(false);

  const targetCards = gameState?.sabotageTargetCards || [];
  const targetName = gameState?.sabotageTargetName;
  const hasSubmitted = gameState?.players?.find(p => p.name === gameState?.playerName)?.sabotageSubmitted;
  const candidates = gameState?.players?.filter(p => !p.isJudge) || [];
  const submittedCount = candidates.filter(p => p.sabotageSubmitted).length;

  const totalUsed = useMemo(() => {
    return targetCards.reduce((sum, c) => sum + Math.abs(deltas[c.cardId] ?? 0), 0);
  }, [targetCards, deltas]);

  const remaining = SABOTAGE_BUDGET - totalUsed;

  const setDelta = (cardId, value) => {
    setDeltas(prev => ({ ...prev, [cardId]: value }));
  };

  const handleUnleashClick = () => {
    if (isSubmitting) return;
    if (totalUsed === 0) {
      setShowZeroConfirm(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitSabotage(
        targetCards.map(c => ({ cardId: c.cardId, delta: deltas[c.cardId] ?? 0 }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setShowZeroConfirm(false);
    }
  };

  const handleConfirmSkipSabotage = () => {
    doSubmit();
  };

  const handleCancelZeroConfirm = () => {
    setShowZeroConfirm(false);
  };

  if (gameState?.isJudge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card-dark max-w-sm text-center">
          <h2 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>The sabotage is happening.</h2>
          <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>Candidates are repositioning each other&apos;s dials.</p>
          <p className="text-caption">
            {submittedCount} of {candidates.length} candidates have submitted
          </p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card-dark max-w-sm text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>Waiting for others...</h2>
          <p className="text-caption">
            {submittedCount} of {candidates.length} players have submitted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col px-6 pt-8 pb-8 relative overflow-hidden"
      style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, #3D000012 100%)',
        }}
      />

      {/* Zero-point confirmation modal — app theme */}
      {showZeroConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'var(--color-bg-overlay)' }}
        >
          <div
            className="p-6 max-w-sm w-full rounded-2xl"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '16px',
              boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <h3 className="text-title mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Are you sure you don&apos;t want to sabotage?
            </h3>
            <p className="text-body mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              You haven&apos;t moved any of their dials. Skip and submit zero changes?
            </p>
            <div className="flex gap-3" style={{ gap: 'var(--space-md)' }}>
              <button onClick={handleCancelZeroConfirm} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleConfirmSkipSabotage} className="btn btn-danger flex-1">
                Yes, skip sabotage
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1">
        <h1 className="text-title text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Sabotage {targetName}&apos;s Profile
        </h1>
        <p className="text-body text-center mb-4 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          Ruin their profile. Use your 8 points to move their dials — 1 point per position.
        </p>

        {/* Prominent points counter: used and remaining, real-time */}
        <div
          className="flex items-center justify-center gap-6 py-4 mb-2 rounded-xl"
          style={{
            background: 'var(--color-bg-card-dark)',
            border: '1px solid var(--color-sab-border)',
            paddingLeft: 'var(--space-lg)',
            paddingRight: 'var(--space-lg)',
          }}
        >
          <div className="text-center">
            <div className="text-mono text-label" style={{ color: 'var(--color-sab-delta)' }}>
              {totalUsed} / {SABOTAGE_BUDGET}
            </div>
            <div className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>points used</div>
          </div>
          <div className="text-center">
            <div className="text-mono text-label" style={{ color: remaining === 0 ? 'var(--color-text-secondary)' : 'var(--color-sab-dot-active)' }}>
              {remaining}
            </div>
            <div className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>remaining</div>
          </div>
        </div>

        <div className="flex-1 flex flex-col" style={{ gap: 'var(--space-lg)' }}>
          {targetCards.map(card => {
            const parts = (card.label || '').split(/\s*↔\s*/);
            const leftLabel = parts[0]?.trim() || 'Low';
            const rightLabel = parts[1]?.trim() || 'High';
            const basePosition = card.selfPosition ?? 5;
            return (
              <div key={card.cardId} className="card-dark">
                <SabotageSlider
                  leftLabel={leftLabel}
                  rightLabel={rightLabel}
                  basePosition={basePosition}
                  delta={deltas[card.cardId] ?? 0}
                  totalUsed={totalUsed}
                  onChange={(v) => setDelta(card.cardId, v)}
                  onDragStart={() => setActiveCardId(card.cardId)}
                  onDragEnd={() => setActiveCardId(null)}
                  isActive={activeCardId === card.cardId}
                />
              </div>
            );
          })}
        </div>

        <p className="text-caption text-center py-2">
          {submittedCount} of {candidates.length} players have submitted
        </p>

        <div style={{ paddingTop: 'var(--space-lg)' }}>
          <button
            onClick={handleUnleashClick}
            disabled={isSubmitting}
            className="w-full btn btn-danger"
          >
            {isSubmitting ? 'Submitting...' : 'Unleash'}
          </button>
        </div>
      </div>
    </div>
  );
}
