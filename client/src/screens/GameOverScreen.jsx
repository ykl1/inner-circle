import { useGame } from '../context/GameContext';

/**
 * Game over screen - show winners and losers
 */
export function GameOverScreen() {
  const { gameState, categories } = useGame();
  
  const winners = gameState?.winners || [];
  const losers = gameState?.losers || [];
  const categoryId = gameState?.categoryId || 'startup';
  const myId = gameState?.myId;
  
  const category = categories.find(c => c.id === categoryId);
  const isWinner = winners.some(w => w.id === myId);
  
  // Loser messages by category
  const loserMessages = {
    'startup': 'The startup pivoted without you',
    'rap-group': 'They left you on read'
  };
  
  const loserMessage = loserMessages[categoryId] || 'Better luck next time!';
  
  if (isWinner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-game-dark to-purple-900">
        {/* Winner view */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            You're In!
          </h1>
          <p className="text-game-gold text-lg">
            Welcome to the Inner Circle
          </p>
        </div>
        
        {/* Inner Circle roster */}
        <div className="card w-full max-w-sm bg-gradient-to-br from-game-purple/30 to-game-gold/20 border-game-gold">
          <h2 className="text-center text-game-gold font-bold text-lg mb-4">
            {category?.name || 'The Inner Circle'}
          </h2>
          
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <div
                key={winner.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg
                  ${winner.id === myId 
                    ? 'bg-game-purple/30 border border-game-purple' 
                    : 'bg-white/5'
                  }
                `}
              >
                <div className="w-8 h-8 rounded-full bg-game-purple flex items-center justify-center font-bold text-white">
                  {winner.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-white font-medium flex-1">
                  {winner.name}
                  {winner.id === myId && ' (You)'}
                </span>
                {winner.isFounder && (
                  <span className="text-game-gold">👑</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Confetti effect placeholder */}
        <div className="mt-8 text-4xl animate-bounce">
          🎉
        </div>
      </div>
    );
  }
  
  // Loser view
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-game-dark to-gray-900">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">😭</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Loser's Lounge
        </h1>
        <p className="text-white/60 text-lg italic">
          "{loserMessage}"
        </p>
      </div>
      
      {/* Fellow losers */}
      {losers.length > 1 && (
        <div className="card w-full max-w-sm bg-white/5">
          <h2 className="text-center text-white/70 font-medium mb-4">
            At least you're not alone...
          </h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            {losers.map(loser => (
              <div
                key={loser.id}
                className={`
                  px-4 py-2 rounded-full bg-white/10
                  ${loser.id === myId ? 'border border-white/30' : ''}
                `}
              >
                <span className="text-white/80">
                  {loser.name}
                  {loser.id === myId && ' (You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* The winners */}
      <div className="mt-8 card w-full max-w-sm">
        <h2 className="text-center text-white/50 text-sm mb-3">
          The Inner Circle (without you)
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {winners.map(winner => (
            <div
              key={winner.id}
              className="px-3 py-1 rounded-full bg-game-purple/20 text-game-purple text-sm"
            >
              {winner.name}
              {winner.isFounder && ' 👑'}
            </div>
          ))}
        </div>
      </div>
      
      {/* Sad emoji */}
      <div className="mt-8 text-4xl">
        💔
      </div>
    </div>
  );
}
