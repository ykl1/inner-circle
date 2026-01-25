import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Card, PitchHand } from '../components/Card';
import { PlayerAvatar } from '../components/PlayerAvatar';

/**
 * Sabotage screen - give 1 red card to target
 */
export function SabotageScreen() {
  const { gameState, submitSabotage } = useGame();
  
  const [selectedRedId, setSelectedRedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const myHand = gameState?.myHand;
  const redCards = myHand?.reds || [];
  const hasSubmitted = gameState?.hasSubmittedSabotage;
  const sabotageTarget = gameState?.sabotageTarget;
  const roundNumber = gameState?.roundNumber || 1;
  
  const handleSubmit = async () => {
    if (!selectedRedId) return;
    
    setIsSubmitting(true);
    try {
      await submitSabotage(selectedRedId);
    } catch (err) {
      console.error('Failed to submit sabotage:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Founder/Judge view
  if (gameState?.isJudge && !gameState?.isCandidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">🎭</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sabotage Phase
          </h2>
          <p className="text-white/60">
            Candidates are sabotaging each other...
          </p>
          <div className="mt-4 text-game-purple">
            You are a Judge
          </div>
        </div>
      </div>
    );
  }
  
  // Already submitted view
  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">🎭</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sabotage Sent!
          </h2>
          <p className="text-white/60">
            Waiting for other candidates...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-white/60 text-sm">Round {roundNumber}</div>
        <h1 className="text-2xl font-bold text-game-red mb-1">
          Sabotage Your Rival!
        </h1>
        <p className="text-white/60">
          Give them one of your red cards
        </p>
      </div>
      
      {/* Target info */}
      {sabotageTarget && (
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="text-white/60 text-sm">Your Target</div>
              <div className="text-white font-bold text-lg">
                {sabotageTarget.name}
              </div>
            </div>
          </div>
          
          <div className="text-white/60 text-sm mb-2">
            Their chosen strengths:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sabotageTarget.selectedGreens?.map(card => (
              <Card
                key={card.id}
                card={card}
                size="small"
                disabled
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Red cards to choose from */}
      <div className="flex-1">
        <div className="text-white/60 text-sm mb-2 text-center">
          Choose a flaw to give them:
        </div>
        <div className="grid grid-cols-1 gap-3">
          {redCards.map(card => (
            <Card
              key={card.id}
              card={card}
              selected={selectedRedId === card.id}
              onClick={() => setSelectedRedId(card.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Submit button */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedRedId || isSubmitting}
          className="btn-danger w-full text-lg"
        >
          {isSubmitting ? 'Sending...' : 'Send Sabotage'}
        </button>
      </div>
    </div>
  );
}
