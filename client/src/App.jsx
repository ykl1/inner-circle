import { useGame, PHASES } from './context/GameContext';
import { GameHeader } from './components/GameHeader';
import { JoinScreen } from './screens/JoinScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SelfPositioningScreen } from './screens/SelfPositioningScreen';
import { SabotageScreen } from './screens/SabotageScreen';
import { PitchScreen } from './screens/PitchScreen';
import { VotingScreen } from './screens/VotingScreen';
import { GameOverScreen } from './screens/GameOverScreen';

function SyncingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--color-bg-overlay)' }}>
      <div
        className="rounded-xl flex items-center gap-3 px-6 py-4"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
          gap: 'var(--space-md)',
        }}
      >
        <div className="animate-spin text-xl">🔄</div>
        <div className="text-body" style={{ color: 'var(--color-text-primary)' }}>Syncing...</div>
      </div>
    </div>
  );
}

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

  if (isRejoining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--color-bg-base)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🔄</div>
          <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>Reconnecting...</div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return <JoinScreen />;
  }

  const phase = gameState.phase;

  if (phase === PHASES.GAME_OVER) {
    return (
      <>
        {isSyncing && <SyncingOverlay />}
        <GameOverScreen />
      </>
    );
  }

  let screen;
  switch (phase) {
    case PHASES.LOBBY:
      screen = <LobbyScreen />;
      break;
    case PHASES.SELF_POSITIONING:
      screen = <SelfPositioningScreen />;
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
    default:
      screen = (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
          <div className="text-center text-body" style={{ color: 'var(--color-text-primary)' }}>
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
