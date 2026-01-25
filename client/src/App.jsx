import { useGame, PHASES } from './context/GameContext';
import { JoinScreen } from './screens/JoinScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { FlexScreen } from './screens/FlexScreen';
import { SabotageScreen } from './screens/SabotageScreen';
import { PitchScreen } from './screens/PitchScreen';
import { VotingScreen } from './screens/VotingScreen';
import { RoundResultsScreen } from './screens/RoundResultsScreen';
import { GameOverScreen } from './screens/GameOverScreen';

function App() {
  const { gameState } = useGame();
  
  // Not connected to a room yet
  if (!gameState) {
    return <JoinScreen />;
  }
  
  // Render based on current phase
  const phase = gameState.currentPhase;
  
  switch (phase) {
    case PHASES.LOBBY:
      return <LobbyScreen />;
    
    case PHASES.FLEX_SELECTION:
      return <FlexScreen />;
    
    case PHASES.SABOTAGE:
      return <SabotageScreen />;
    
    case PHASES.PITCHING:
      return <PitchScreen />;
    
    case PHASES.VOTING:
      return <VotingScreen />;
    
    case PHASES.ROUND_RESULTS:
      return <RoundResultsScreen />;
    
    case PHASES.GAME_OVER:
      return <GameOverScreen />;
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-4">🤔</div>
            <div>Unknown phase: {phase}</div>
          </div>
        </div>
      );
  }
}

export default App;
