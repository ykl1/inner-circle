import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerList } from '../components/PlayerAvatar';

/**
 * Lobby screen for waiting for players and configuring the game
 */
export function LobbyScreen() {
  const { 
    gameState, 
    categories, 
    startGame, 
    updateSettings, 
    error 
  } = useGame();
  
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  
  const isFounder = gameState?.isFounder;
  const players = gameState?.players || [];
  const roomId = gameState?.roomId;
  const groupCapacity = gameState?.groupCapacity || 4;
  const categoryId = gameState?.categoryId || 'startup';
  
  const minPlayers = groupCapacity + 1;
  const canStart = players.length >= minPlayers;
  
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
  
  const handleCapacityChange = (e) => {
    const capacity = parseInt(e.target.value);
    updateSettings({ groupCapacity: capacity });
  };
  
  const handleCategoryChange = (e) => {
    updateSettings({ categoryId: e.target.value });
  };
  
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Room Code
        </h1>
        <div className="text-5xl font-mono font-bold tracking-widest text-game-purple">
          {roomId}
        </div>
        <p className="text-white/60 mt-2">
          Share this code with friends to join
        </p>
      </div>
      
      {/* Players */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Players ({players.length})
        </h2>
        <PlayerList 
          players={players} 
          currentPlayerId={gameState?.myId}
        />
      </div>
      
      {/* Founder controls */}
      {isFounder && (
        <div className="card mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Game Settings
          </h2>
          
          {/* Category selection */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="input"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Group capacity */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Group Capacity (how many winners?)
            </label>
            <select
              value={groupCapacity}
              onChange={handleCapacityChange}
              className="input"
            >
              {[3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>
                  {n} players (need {n + 1}+ to play)
                </option>
              ))}
            </select>
          </div>
          
          {/* Start game */}
          <div className="pt-4">
            {startError && (
              <div className="text-red-400 text-sm mb-3">
                {startError}
              </div>
            )}
            
            {!canStart && (
              <div className="text-yellow-400 text-sm mb-3">
                Need at least {minPlayers} players to start
                (currently {players.length})
              </div>
            )}
            
            <button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="btn-success w-full text-lg"
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        </div>
      )}
      
      {/* Non-founder waiting message */}
      {!isFounder && (
        <div className="card text-center">
          <div className="text-white/60 mb-2">
            Waiting for the founder to start the game...
          </div>
          <div className="text-game-gold text-lg">
            👑 {players.find(p => p.isFounder)?.name} is the Founder
          </div>
        </div>
      )}
    </div>
  );
}
