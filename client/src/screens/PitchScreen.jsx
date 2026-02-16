import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { DialCard } from '../components/DialCard';

export function PitchScreen() {
  const { gameState, finishPitch } = useGame();
  const [showMyHand, setShowMyHand] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const pitchOrder = gameState?.pitchOrder || [];
  const currentIndex = gameState?.currentPitcherIndex ?? 0;
  const currentPitcherName = pitchOrder[currentIndex];
  const currentPitcherHand = useMemo(() => {
    const p = gameState?.players?.find(x => x.name === currentPitcherName);
    return p?.hand || [];
  }, [gameState?.players, currentPitcherName]);

  const myHand = useMemo(() => {
    const p = gameState?.players?.find(x => x.name === gameState?.playerName);
    return p?.hand || [];
  }, [gameState?.players, gameState?.playerName]);

  const isJudge = gameState?.isJudge;
  const isMyTurn = currentPitcherName === gameState?.playerName;
  const isCandidate = !isJudge;
  const canAdvance = isMyTurn || isJudge;

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await finishPitch(currentIndex);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  const displayHand = showMyHand && isCandidate ? myHand : currentPitcherHand;

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
      <div className="text-center py-4">
        <h1 className="text-title mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {isMyTurn ? "You're up. Pitch your date." : 'Pitch Phase'}
        </h1>
      </div>

      <div className="flex justify-center gap-2 mb-4" style={{ gap: 'var(--space-sm)' }}>
        {pitchOrder.map((name, idx) => (
          <div
            key={name}
            className="px-3 py-1 rounded-full text-label"
            style={{
              background: idx < currentIndex ? 'var(--color-success)' : idx === currentIndex ? 'var(--color-brand)' : 'var(--color-muted)',
              color: idx <= currentIndex ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
              border: idx === currentIndex ? '2px solid var(--color-dial-thumb)' : undefined,
            }}
          >
            {idx + 1}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="text-center mb-3">
          {showMyHand && isCandidate ? (
            <span className="text-label" style={{ color: 'var(--color-text-primary)', fontSize: '18px' }}>Your hand</span>
          ) : (
            <>
              <span className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Now pitching: </span>
              <span className="text-label" style={{ color: 'var(--color-text-primary)', fontSize: '18px' }}>{currentPitcherName}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {displayHand.map(card => (
            <DialCard
              key={card.cardId}
              label={card.label}
              position={card.finalPosition ?? card.selfPosition ?? 5}
              readOnly
            />
          ))}
        </div>
      </div>

      {isCandidate && myHand.length > 0 && !isMyTurn && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <button onClick={() => setShowMyHand(!showMyHand)} className="btn btn-secondary w-full">
            {showMyHand ? 'Watch Pitch' : 'View My Hand'}
          </button>
        </div>
      )}

      {canAdvance && (
        <div className="mt-auto" style={{ paddingTop: 'var(--space-lg)' }}>
          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className={`btn w-full ${isJudge && !isMyTurn ? 'btn-danger' : 'btn-primary'}`}
          >
            {isFinishing ? 'Moving...' : isJudge && !isMyTurn ? 'Skip to Next (Override)' : 'Finish Pitch'}
          </button>
        </div>
      )}

      {!canAdvance && (
        <div className="mt-auto text-center text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Wait for {currentPitcherName} to finish their pitch...
        </div>
      )}
    </div>
  );
}
