import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { SelfPositioningSlider } from '../components/SelfPositioningSlider';

export function SelfPositioningScreen() {
  const { gameState, submitSelfPositioning } = useGame();
  const [positions, setPositions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const myHand = useMemo(() => {
    const me = gameState?.players?.find(p => p.name === gameState?.playerName);
    return me?.hand || [];
  }, [gameState?.players, gameState?.playerName]);

  const hasSubmitted = myHand.length > 0 && gameState?.players?.find(p => p.name === gameState?.playerName)?.selfPositioningSubmitted;
  const candidates = gameState?.players?.filter(p => !p.isJudge) || [];
  const submittedCount = candidates.filter(p => p.selfPositioningSubmitted).length;

  const updatePosition = (cardId, position) => {
    setPositions(prev => ({ ...prev, [cardId]: position }));
  };

  const getPosition = (card) => positions[card.cardId] ?? card.selfPosition ?? 5;

  const parseLabel = (label) => {
    const parts = (label || '').split(/\s*↔\s*/);
    return { left: parts[0] || 'Low', right: parts[1] || 'High' };
  };

  const judgeName = useMemo(() => gameState?.players?.find(p => p.isJudge)?.name || 'the Judge', [gameState?.players]);

  const handleLockIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitSelfPositioning(
        myHand.map(c => ({ cardId: c.cardId, position: getPosition(c) }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (gameState?.isJudge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card max-w-sm text-center">
          <h2 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>Sit tight.</h2>
          <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>Candidates are building their dates.</p>
          <p className="text-caption">
            {submittedCount} of {candidates.length} candidates have locked in
          </p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card max-w-sm text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>Waiting for others...</h2>
          <p className="text-caption">
            {submittedCount} of {candidates.length} players have locked in
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
      <h1 className="text-title text-center mb-1" style={{ color: 'var(--color-text-primary)' }}>
        Build Your Date
      </h1>
      <p className="text-body text-center mb-4 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
        Set each dial to create the ideal date for {judgeName}.
      </p>

      <div className="flex-1 flex flex-col py-4" style={{ gap: 'var(--space-lg)' }}>
        {myHand.map(card => {
          const { left, right } = parseLabel(card.label);
          return (
            <div key={card.cardId} className="card">
              <SelfPositioningSlider
                leftLabel={left}
                rightLabel={right}
                value={getPosition(card)}
                onChange={(pos) => updatePosition(card.cardId, pos)}
              />
            </div>
          );
        })}
      </div>

      <p className="text-caption text-center py-2">
        {submittedCount} of {candidates.length} players have locked in
      </p>

      <div style={{ paddingTop: 'var(--space-lg)' }}>
        <button
          onClick={handleLockIn}
          disabled={isSubmitting}
          className="w-full btn btn-primary"
        >
          {isSubmitting ? 'Submitting...' : 'Lock In'}
        </button>
      </div>
    </div>
  );
}
