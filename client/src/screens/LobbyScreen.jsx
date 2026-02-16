import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerList } from '../components/PlayerAvatar';

export function LobbyScreen() {
  const { gameState, startGame } = useGame();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const isJudge = gameState?.isJudge;
  const players = gameState?.players || [];
  const roomCode = gameState?.roomCode;
  const candidateCount = players.filter(p => !p.isJudge).length;
  const canStart = players.length >= 3;

  const handleStart = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startGame();
    } catch (err) {
      setStartError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 pt-8 pb-8" style={{ background: 'var(--color-bg-base)', paddingTop: 'var(--space-xl)' }}>
      <div className="text-center py-6">
        <h1 className="text-title mb-2" style={{ color: 'var(--color-text-primary)' }}>Room Code</h1>
        <div className="text-mono font-semibold tracking-widest py-2" style={{ fontSize: '28px', color: 'var(--color-brand)' }}>
          {roomCode}
        </div>
        <p className="text-body mt-2" style={{ color: 'var(--color-text-secondary)' }}>Share this code with friends to join</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 className="text-label mb-4" style={{ color: 'var(--color-text-primary)' }}>Players ({players.length})</h2>
        <PlayerList
          players={players.map(p => ({ ...p, id: p.name, isFounder: p.isJudge }))}
          currentPlayerId={gameState?.playerName}
        />
      </div>

      {isJudge && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {startError && (
            <div className="text-body text-sm" style={{ color: 'var(--color-sab-delta)' }}>{startError}</div>
          )}
          {!canStart && (
            <div className="text-body text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Need at least 2 more players
            </div>
          )}
          <button
            onClick={handleStart}
            disabled={!canStart || isStarting}
            className="btn btn-success w-full"
          >
            {isStarting ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      )}

      {!isJudge && (
        <div className="card text-center">
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Waiting for the Judge to start the game...</p>
        </div>
      )}
    </div>
  );
}
