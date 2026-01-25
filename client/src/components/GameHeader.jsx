import { useState } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Game header with room info and leave button
 * Shows on all in-game screens
 */
export function GameHeader() {
  const { gameState, leaveRoom } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);
  
  const roomId = gameState?.roomId;
  
  if (!roomId) return null;
  
  return (
    <>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="text-white/60 text-sm">
          Room: <span className="font-mono font-bold text-white/80">{roomId}</span>
        </div>
        
        <button
          onClick={() => setShowConfirm(true)}
          className="text-white/50 hover:text-white/80 text-sm px-3 py-1 
                     rounded-lg hover:bg-white/10 transition-colors"
        >
          Leave
        </button>
      </div>
      
      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-game-dark border border-white/20 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-3">
              Leave Game?
            </h3>
            <p className="text-white/60 mb-6">
              Are you sure you want to leave? You won't be able to rejoin this game.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn bg-white/10 hover:bg-white/20 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={leaveRoom}
                className="btn bg-red-500 hover:bg-red-600 flex-1"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
