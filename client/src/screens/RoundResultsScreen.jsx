import { useGame } from '../context/GameContext';

/**
 * Round results screen - show winner
 */
export function RoundResultsScreen() {
  const { gameState, proceedFromResults } = useGame();
  
  const roundWinner = gameState?.roundWinner;
  const voteCounts = gameState?.voteCounts || {};
  const isFounder = gameState?.isFounder;
  const roundNumber = gameState?.roundNumber || 1;
  const judges = gameState?.judges || [];
  const groupCapacity = gameState?.groupCapacity || 4;
  const players = gameState?.players || [];
  
  // Sort candidates by vote count
  const sortedResults = Object.entries(voteCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([candidateId, votes]) => ({
      id: candidateId,
      name: players.find(p => p.id === candidateId)?.name,
      votes,
      isWinner: candidateId === roundWinner?.id
    }));
  
  const handleProceed = async () => {
    try {
      await proceedFromResults();
    } catch (err) {
      console.error('Failed to proceed:', err);
    }
  };
  
  const remainingRounds = groupCapacity - judges.length;
  
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-6">
        <div className="text-white/60 text-sm">Round {roundNumber} Results</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          We Have a Winner!
        </h1>
      </div>
      
      {/* Winner spotlight */}
      <div className="card bg-gradient-to-br from-game-purple/30 to-game-gold/20 border-game-gold mb-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <div className="text-game-gold text-sm font-bold uppercase tracking-wider">
            Joins the Inner Circle
          </div>
          <div className="text-3xl font-bold text-white mt-2">
            {roundWinner?.name}
          </div>
          <div className="text-white/60 mt-2">
            with {voteCounts[roundWinner?.id] || 0} vote(s)
          </div>
        </div>
      </div>
      
      {/* Vote breakdown */}
      <div className="card mb-6">
        <h3 className="text-white/70 text-sm font-semibold mb-3">
          Vote Results
        </h3>
        <div className="space-y-2">
          {sortedResults.map(result => (
            <div
              key={result.id}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${result.isWinner 
                  ? 'bg-game-green/20 border border-game-green' 
                  : 'bg-white/5'
                }
              `}
            >
              <span className={result.isWinner ? 'text-game-green font-bold' : 'text-white'}>
                {result.name}
                {result.isWinner && ' 🏆'}
              </span>
              <span className="text-white/60">
                {result.votes} vote{result.votes !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Progress */}
      <div className="text-center text-white/60 mb-6">
        <div className="text-sm">
          Inner Circle: {judges.length} / {groupCapacity}
        </div>
        {remainingRounds > 0 && (
          <div className="text-sm mt-1">
            {remainingRounds} round{remainingRounds !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
      
      {/* Proceed button (founder only) */}
      {isFounder && (
        <div className="mt-auto">
          <button
            onClick={handleProceed}
            className="btn-primary w-full text-lg"
          >
            {remainingRounds > 0 ? 'Next Round' : 'See Final Results'}
          </button>
        </div>
      )}
      
      {/* Non-founder waiting */}
      {!isFounder && (
        <div className="mt-auto text-center text-white/60">
          Waiting for founder to continue...
        </div>
      )}
    </div>
  );
}
