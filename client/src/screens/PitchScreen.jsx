import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PitchHand } from '../components/Card';
import { PlayerAvatar } from '../components/PlayerAvatar';

/**
 * Pitching screen - watch/give pitches
 */
export function PitchScreen() {
  const { gameState, finishPitch } = useGame();
  
  const [showMyHand, setShowMyHand] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const pitchOrder = gameState?.pitchOrder || [];
  const currentPitcherIndex = gameState?.currentPitcherIndex || 0;
  const currentPitcher = pitchOrder[currentPitcherIndex];
  const currentPitcherHand = gameState?.currentPitcherHand;
  const myPitchHand = gameState?.myPitchHand;
  const roundNumber = gameState?.roundNumber || 1;
  const players = gameState?.players || [];
  
  const isMyTurn = currentPitcher?.id === gameState?.myId;
  const isFounder = gameState?.isFounder;
  const canAdvance = isMyTurn || isFounder;
  const isCandidate = gameState?.isCandidate;
  
  const handleFinishPitch = async () => {
    setIsFinishing(true);
    try {
      await finishPitch();
    } catch (err) {
      console.error('Failed to finish pitch:', err);
    } finally {
      setIsFinishing(false);
    }
  };
  
  // Progress indicator
  const progress = pitchOrder.map((pitcher, index) => ({
    ...pitcher,
    isDone: index < currentPitcherIndex,
    isCurrent: index === currentPitcherIndex,
    isUpcoming: index > currentPitcherIndex
  }));
  
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-white/60 text-sm">Round {roundNumber}</div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Pitch Phase
        </h1>
      </div>
      
      {/* Progress bar */}
      <div className="flex justify-center gap-2 mb-6">
        {progress.map((pitcher, index) => (
          <div
            key={pitcher.id}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              text-sm font-bold transition-all
              ${pitcher.isDone 
                ? 'bg-game-green text-white' 
                : pitcher.isCurrent 
                  ? 'bg-game-purple text-white ring-2 ring-white' 
                  : 'bg-white/10 text-white/50'
              }
            `}
            title={pitcher.name}
          >
            {pitcher.isDone ? '✓' : index + 1}
          </div>
        ))}
      </div>
      
      {/* Current pitcher */}
      <div className="card mb-4">
        <div className="text-center mb-4">
          <div className="text-white/60 text-sm mb-2">
            {isMyTurn ? "It's your turn!" : 'Now pitching:'}
          </div>
          <div className={`
            text-2xl font-bold
            ${isMyTurn ? 'text-game-purple' : 'text-white'}
          `}>
            {currentPitcher?.name}
          </div>
        </div>
        
        {/* Pitcher's cards */}
        {currentPitcherHand && (
          <PitchHand 
            cards={currentPitcherHand}
            label="Their pitch hand:"
          />
        )}
      </div>
      
      {/* Toggle to view own hand */}
      {isCandidate && myPitchHand && !isMyTurn && (
        <div className="mb-4">
          <button
            onClick={() => setShowMyHand(!showMyHand)}
            className="btn bg-white/10 hover:bg-white/20 w-full"
          >
            {showMyHand ? 'Hide My Hand' : 'View My Hand'}
          </button>
          
          {showMyHand && (
            <div className="mt-3 card">
              <PitchHand 
                cards={myPitchHand}
                label="Your pitch hand:"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Finish pitch button */}
      {canAdvance && (
        <div className="mt-auto pt-4">
          {isFounder && !isMyTurn && (
            <div className="text-white/60 text-sm text-center mb-2">
              👑 Founder override available
            </div>
          )}
          <button
            onClick={handleFinishPitch}
            disabled={isFinishing}
            className={`btn w-full text-lg ${
              isFounder && !isMyTurn 
                ? 'bg-red-500 hover:bg-red-600 active:scale-95' 
                : 'bg-game-purple hover:bg-purple-600 active:scale-95'
            }`}
          >
            {isFinishing 
              ? 'Moving to next...' 
              : isMyTurn 
                ? 'Finish My Pitch' 
                : 'Skip to Next (Override)'
            }
          </button>
        </div>
      )}
      
      {/* Non-pitcher waiting message */}
      {!canAdvance && (
        <div className="mt-auto text-center text-white/60">
          Wait for {currentPitcher?.name} to finish their pitch...
        </div>
      )}
    </div>
  );
}
