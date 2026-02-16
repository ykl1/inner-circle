import { useState } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Initial screen for creating or joining a room
 */
export function JoinScreen() {
  const { createRoom, joinRoom, error, clearError } = useGame();

  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await createRoom(name.trim(), 'dating');
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    setIsLoading(true);
    try {
      await joinRoom(roomCode.trim().toUpperCase(), name.trim());
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8" style={{ background: 'var(--color-bg-base)' }}>
      <div className="w-full max-w-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
        <div className="text-center">
          <h1 className="text-display mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Pick Me
          </h1>
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
            The social party game of pitches and sabotage
          </p>
        </div>

        {error && (
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--color-sab-left)', border: '1px solid var(--color-sab-delta)', color: 'var(--color-text-primary)' }}>
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-mono ml-2" style={{ color: 'var(--color-text-primary)' }}>
              ×
            </button>
          </div>
        )}

        {!mode && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <button onClick={() => setMode('create')} className="btn btn-primary w-full">
                Create Room
              </button>
              <button onClick={() => setMode('join')} className="btn btn-secondary w-full">
                Join Room
              </button>
            </div>

            <div className="card-no-shadow">
              <h2 className="text-label mb-3 text-center" style={{ color: 'var(--color-text-primary)' }}>How to Play</h2>
              <div className="space-y-2 text-body" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="flex gap-2">
                  <span className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>1.</span>
                  <span><strong style={{ color: 'var(--color-text-primary)' }}>Build Your Date</strong> — Set 3 dials to match the Judge&apos;s taste</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>2.</span>
                  <span><strong style={{ color: 'var(--color-text-primary)' }}>Sabotage</strong> — Use 6 points to move a rival&apos;s dials</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>3.</span>
                  <span><strong style={{ color: 'var(--color-text-primary)' }}>Pitch</strong> — Take turns presenting your (possibly sabotaged) dials</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-mono" style={{ color: 'var(--color-text-secondary)' }}>4.</span>
                  <span><strong style={{ color: 'var(--color-text-primary)' }}>Vote</strong> — The Judge picks one date</span>
                </div>
              </div>
            </div>
          </>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label className="block text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="flex gap-3" style={{ gap: 'var(--space-md)' }}>
              <button type="button" onClick={() => setMode(null)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="submit" disabled={!name.trim() || isLoading} className="btn btn-primary flex-1">
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div>
              <label className="block text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="input"
                maxLength={20}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="input text-center text-mono"
                style={{ fontSize: '24px', letterSpacing: '0.2em' }}
                maxLength={4}
              />
            </div>
            <div className="flex gap-3" style={{ gap: 'var(--space-md)' }}>
              <button type="button" onClick={() => setMode(null)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button type="submit" disabled={!name.trim() || roomCode.length !== 4 || isLoading} className="btn btn-primary flex-1">
                {isLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
