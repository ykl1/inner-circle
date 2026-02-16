import { useState } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Game header with room info and leave button
 * Shows on all in-game screens
 */
export function GameHeader() {
  const { gameState, leaveRoom } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);
  
  const roomCode = gameState?.roomCode;
  
  if (!roomCode) return null;
  
  return (
    <>
      <div
        className="flex items-center justify-between py-2"
        style={{
          paddingLeft: 'var(--space-lg)',
          paddingRight: 'var(--space-lg)',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Room: <span className="font-mono font-semibold" style={{ color: 'var(--color-text-primary)' }}>{roomCode}</span>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="text-body rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-sm) var(--space-md)' }}
        >
          Leave
        </button>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'var(--color-bg-overlay)' }}
        >
          <div
            className="p-6 max-w-sm w-full"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '16px',
              boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            <h3 className="text-title mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Leave Game?
            </h3>
            <p className="text-body mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to leave? You won&apos;t be able to rejoin this game.
            </p>
            <div className="flex gap-3" style={{ gap: 'var(--space-md)' }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={leaveRoom} className="btn btn-danger flex-1">
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
