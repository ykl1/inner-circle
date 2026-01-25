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
      await createRoom(name.trim());
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Inner Circle
          </h1>
          <p className="text-white/60">
            The social party game of pitches and sabotage
          </p>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 text-red-200">
            {error}
            <button 
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Mode selection */}
        {!mode && (
          <>
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="btn-primary w-full text-lg"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="btn bg-white/10 hover:bg-white/20 w-full text-lg"
              >
                Join Room
              </button>
            </div>
            
            {/* Game Rules */}
            <div className="card bg-white/5 text-sm">
              <h2 className="text-game-gold font-bold mb-3 text-center">How to Play</h2>
              <div className="space-y-2 text-white/80">
                <div className="flex gap-2">
                  <span className="text-game-green">1.</span>
                  <span><strong>Flex</strong> — Pick 2 strength cards to show off</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-game-red">2.</span>
                  <span><strong>Sabotage</strong> — Secretly give a flaw card to a rival</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-game-purple">3.</span>
                  <span><strong>Pitch</strong> — Present your 3-card hand (2 strengths + 1 flaw)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-game-gold">4.</span>
                  <span><strong>Vote</strong> — Judges pick who joins the Inner Circle</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-white/60 text-xs text-center">
                👑 The Founder's vote breaks all ties
              </div>
            </div>
          </>
        )}
        
        {/* Create room form */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">
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
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="btn bg-white/10 hover:bg-white/20 flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
        
        {/* Join room form */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">
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
              <label className="block text-white/70 text-sm mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                className="input text-center text-2xl tracking-widest"
                maxLength={4}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="btn bg-white/10 hover:bg-white/20 flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!name.trim() || roomCode.length !== 4 || isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
