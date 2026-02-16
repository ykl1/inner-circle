import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SabotageMapDial } from '../components/DialCard';

export function GameOverScreen() {
  const { gameState, leaveRoom } = useGame();
  const [showSabotageMap, setShowSabotageMap] = useState(false);

  const categoryMeta = gameState?.categoryMeta || {};
  const sabotageMap = gameState?.sabotageMap || [];
  const judgeVote = gameState?.judgeVote;
  const winnerName = judgeVote;
  const isWinner = gameState?.players?.find(p => p.name === gameState?.playerName)?.isWinner;
  const isJudge = gameState?.isJudge;

  if (showSabotageMap) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-title" style={{ color: 'var(--color-text-primary)' }}>Sabotage Map</h2>
          <div className="flex gap-2" style={{ gap: 'var(--space-sm)' }}>
            <button onClick={() => setShowSabotageMap(false)} className="btn btn-secondary">
              Back
            </button>
            <button onClick={leaveRoom} className="btn btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
        <div className="overflow-auto pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {sabotageMap.map(entry => (
            <div key={entry.candidateName} className="card text-center">
              <div className="text-label mb-1" style={{ color: 'var(--color-text-primary)' }}>{entry.candidateName}</div>
              <div className="text-caption mb-3">
                Sabotaged by: {entry.saboteurName ?? '—'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {entry.cards.map(card => (
                  <SabotageMapDial
                    key={card.cardId}
                    label={card.label}
                    selfPosition={card.selfPosition}
                    finalPosition={card.finalPosition}
                    sabotageApplied={card.sabotageApplied}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isWinner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-display mb-2" style={{ color: 'var(--color-winner)' }}>
            {categoryMeta.winMessage || "You're going on a date!"}
          </h1>
        </div>
        <button onClick={() => setShowSabotageMap(true)} className="btn btn-secondary mb-4">
          See the Sabotage Map
        </button>
        <button onClick={leaveRoom} className="btn btn-secondary">
          Back to Home
        </button>
      </div>
    );
  }

  if (isJudge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
        <div className="card text-center max-w-md mb-6">
          <p className="text-body" style={{ color: 'var(--color-winner)', fontSize: '18px' }}>
            {categoryMeta.judgePrompt?.replace('[Winner\'s name]', winnerName) ||
              `Tell the table why you chose ${winnerName}.`}
          </p>
        </div>
        <button onClick={() => setShowSabotageMap(true)} className="btn btn-secondary mb-4">
          See the Sabotage Map
        </button>
        <button onClick={leaveRoom} className="btn btn-secondary">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">💔</div>
        <h1 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {categoryMeta.lossMessage || 'Left on read.'}
        </h1>
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          {winnerName} got the date.
        </p>
      </div>
      <button onClick={() => setShowSabotageMap(true)} className="btn btn-secondary mb-4">
        See the Sabotage Map
      </button>
      <button onClick={leaveRoom} className="btn btn-secondary">
        Back to Home
      </button>
    </div>
  );
}
