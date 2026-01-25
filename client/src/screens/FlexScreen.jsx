import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CardHand } from '../components/Card';

/**
 * Flex selection screen - choose 2 green cards
 */
export function FlexScreen() {
  const { gameState, submitFlex } = useGame();
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const myHand = gameState?.myHand;
  const greenCards = myHand?.greens || [];
  const hasSubmitted = gameState?.hasSubmittedFlex;
  const roundNumber = gameState?.roundNumber || 1;
  
  const handleCardClick = (card) => {
    if (hasSubmitted) return;
    
    setSelectedIds(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      }
      if (prev.length >= 2) {
        return [...prev.slice(1), card.id];
      }
      return [...prev, card.id];
    });
  };
  
  const handleSubmit = async () => {
    if (selectedIds.length !== 2) return;
    
    setIsSubmitting(true);
    try {
      await submitFlex(selectedIds);
    } catch (err) {
      console.error('Failed to submit flex:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Founder/Judge view
  if (gameState?.isJudge && !gameState?.isCandidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">👑</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Round {roundNumber}
          </h2>
          <p className="text-white/60">
            Candidates are choosing their strengths to flex...
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
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Flex Submitted!
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
        <h1 className="text-2xl font-bold text-white mb-1">
          Choose Your Strengths
        </h1>
        <p className="text-white/60">
          Select 2 green cards to flex
        </p>
      </div>
      
      {/* Selection count */}
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1].map(i => (
          <div
            key={i}
            className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${i < selectedIds.length 
                ? 'bg-game-green border-game-green text-white' 
                : 'border-white/30 text-white/30'
              }
            `}
          >
            {i < selectedIds.length ? '✓' : i + 1}
          </div>
        ))}
      </div>
      
      {/* Green cards */}
      <div className="flex-1">
        <CardHand
          cards={greenCards}
          selectedIds={selectedIds}
          onCardClick={handleCardClick}
        />
      </div>
      
      {/* Submit button */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={selectedIds.length !== 2 || isSubmitting}
          className="btn-success w-full text-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Lock In Flex'}
        </button>
      </div>
      
      {/* Red cards preview */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-white/50 text-sm text-center mb-2">
          Your Red Cards (for sabotage)
        </div>
        <div className="flex gap-2 justify-center">
          {myHand?.reds?.map(card => (
            <div
              key={card.id}
              className="text-xs px-3 py-1 bg-red-500/20 border border-game-red rounded-full text-red-200"
            >
              {card.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
