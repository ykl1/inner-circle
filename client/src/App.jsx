import { useGame, PHASES } from './context/GameContext';
import { GameHeader } from './components/GameHeader';
import { JoinScreen } from './screens/JoinScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { FlexScreen } from './screens/FlexScreen';
import { SabotageScreen } from './screens/SabotageScreen';
import { PitchScreen } from './screens/PitchScreen';
import { VotingScreen } from './screens/VotingScreen';
import { RoundResultsScreen } from './screens/RoundResultsScreen';
import { GameOverScreen } from './screens/GameOverScreen';

/**
 * Syncing overlay - shows when reconnecting after mobile app switch
 */
function SyncingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-game-dark border border-white/20 rounded-xl px-6 py-4 flex items-center gap-3">
        <div className="animate-spin text-xl">🔄</div>
        <div className="text-white">Syncing...</div>
      </div>
    </div>
  );
}

/**
 * Wrapper for in-game screens with header
 */
function GameLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

function App() {
  const { gameState, isRejoining, isSyncing } = useGame();
  
  // Show loading while attempting to rejoin (initial page load)
  if (isRejoining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔄</div>
          <div className="text-white/60">Reconnecting...</div>
        </div>
      </div>
    );
  }
  
  // Not connected to a room yet
  if (!gameState) {
    return <JoinScreen />;
  }
  
  // Render based on current phase
  const phase = gameState.currentPhase;
  
  // Game over doesn't need the header (has its own back button)
  if (phase === PHASES.GAME_OVER) {
    return (
      <>
        {isSyncing && <SyncingOverlay />}
        <GameOverScreen />
      </>
    );
  }
  
  // All other phases get the header
  let screen;
  switch (phase) {
    case PHASES.LOBBY:
      screen = <LobbyScreen />;
      break;
    case PHASES.FLEX_SELECTION:
      screen = <FlexScreen />;
      break;
    case PHASES.SABOTAGE:
      screen = <SabotageScreen />;
      break;
    case PHASES.PITCHING:
      screen = <PitchScreen />;
      break;
    case PHASES.VOTING:
      screen = <VotingScreen />;
      break;
    case PHASES.ROUND_RESULTS:
      screen = <RoundResultsScreen />;
      break;
    default:
      screen = (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-4">🤔</div>
            <div>Unknown phase: {phase}</div>
          </div>
        </div>
      );
  }
  
  return (
    <>
      {isSyncing && <SyncingOverlay />}
      <GameLayout>{screen}</GameLayout>
    </>
  );
}

export default App;
