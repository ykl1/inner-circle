import { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { DialCard } from '../components/DialCard';

export function VotingScreen() {
  const { gameState, submitVote } = useGame();
  const [isVoting, setIsVoting] = useState(false);
  const [showMyHand, setShowMyHand] = useState(false);

  const isJudge = gameState?.isJudge;
  const candidates = gameState?.players?.filter(p => !p.isJudge) || [];
  const myHand = useMemo(() => {
    const me = gameState?.players?.find(p => p.name === gameState?.playerName);
    return me?.hand || [];
  }, [gameState?.players, gameState?.playerName]);

  const handleChoose = async (name) => {
    if (isVoting) return;
    setIsVoting(true);
    try {
      await submitVote(name);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  if (!isJudge) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card text-center max-w-sm mx-auto">
          <div className="text-4xl mb-4">🗳️</div>
          <h2 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>Waiting for the Judge to decide...</h2>
          <p className="text-caption mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Reference your profile while you pitch or answer the Judge.
          </p>
          <button
            type="button"
            onClick={() => setShowMyHand(!showMyHand)}
            className="btn btn-secondary w-full"
          >
            {showMyHand ? 'Hide my profile' : 'View my profile'}
          </button>
        </div>

        {showMyHand && myHand.length > 0 && (
          <div className="mt-6 max-w-sm mx-auto w-full" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card">
              <div className="text-label mb-3" style={{ color: 'var(--color-text-primary)' }}>Your profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {myHand.map(card => (
                  <DialCard
                    key={card.cardId}
                    label={card.label}
                    position={card.finalPosition ?? card.selfPosition ?? 5}
                    readOnly
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
      <div className="text-center py-4">
        <h1 className="text-title mb-1" style={{ color: 'var(--color-text-primary)' }}>Choose Your Date</h1>
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Pick the candidate you&apos;d want to go on a date with.</p>
      </div>

      <div className="flex-1 overflow-auto" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {candidates.map(candidate => (
          <div key={candidate.name} className="card">
            <div className="text-label mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '18px' }}>{candidate.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              {(candidate.hand || []).map(card => (
                <DialCard
                  key={card.cardId}
                  label={card.label}
                  position={card.finalPosition ?? card.selfPosition ?? 5}
                  readOnly
                />
              ))}
            </div>
            <button
              onClick={() => handleChoose(candidate.name)}
              disabled={isVoting}
              className="btn btn-primary w-full"
            >
              Choose {candidate.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
