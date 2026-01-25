import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PitchHand } from '../components/Card';

/**
 * Voting screen - judges vote for a candidate
 */
export function VotingScreen() {
  const { gameState, castVote } = useGame();
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  
  const isJudge = gameState?.isJudge;
  const isCandidate = gameState?.isCandidate;
  const hasVoted = gameState?.hasVoted;
  const candidatePitchHands = gameState?.candidatePitchHands || {};
  const candidates = Object.entries(candidatePitchHands);
  const judges = gameState?.judges || [];
  const players = gameState?.players || [];
  const founderId = gameState?.founderId;
  const roundNumber = gameState?.roundNumber || 1;
  
  const handleVote = async () => {
    if (!selectedCandidate) return;
    
    setIsVoting(true);
    try {
      await castVote(selectedCandidate);
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setIsVoting(false);
    }
  };
  
  // Candidate waiting view
  if (isCandidate && !isJudge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">🗳️</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Voting in Progress
          </h2>
          <p className="text-white/60 mb-4">
            The judges are deciding your fate...
          </p>
          
          <div className="text-white/50 text-sm">
            Judges: {judges.map(jId => 
              players.find(p => p.id === jId)?.name
            ).join(', ')}
          </div>
        </div>
      </div>
    );
  }
  
  // Already voted view
  if (hasVoted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Vote Cast!
          </h2>
          <p className="text-white/60">
            Waiting for other judges...
          </p>
        </div>
      </div>
    );
  }
  
  // Judge voting view
  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="text-white/60 text-sm">Round {roundNumber}</div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Cast Your Vote
        </h1>
        <p className="text-white/60">
          Who deserves to join the Inner Circle?
        </p>
      </div>
      
      {/* Tie-breaker note */}
      <div className="bg-game-gold/20 border border-game-gold rounded-xl p-3 mb-4 text-center">
        <span className="text-game-gold">👑</span>
        <span className="text-yellow-200 text-sm ml-2">
          Founder's vote breaks ties automatically
        </span>
      </div>
      
      {/* Candidate cards */}
      <div className="flex-1 space-y-4">
        {candidates.map(([candidateId, data]) => (
          <button
            key={candidateId}
            onClick={() => setSelectedCandidate(candidateId)}
            className={`
              w-full p-4 rounded-xl border-2 transition-all text-left
              ${selectedCandidate === candidateId
                ? 'border-game-purple bg-purple-500/20 ring-2 ring-game-purple'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className="font-bold text-white mb-3">
              {data.name}
            </div>
            <PitchHand cards={data.cards} />
          </button>
        ))}
      </div>
      
      {/* Vote button */}
      <div className="pt-4">
        <button
          onClick={handleVote}
          disabled={!selectedCandidate || isVoting}
          className="btn-primary w-full text-lg"
        >
          {isVoting ? 'Voting...' : 'Submit Vote'}
        </button>
      </div>
    </div>
  );
}

