import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

const SESSION_KEY = 'inner_circle_session';

export const PHASES = {
  LOBBY: 'LOBBY',
  FLEX_SELECTION: 'FLEX_SELECTION',
  SABOTAGE: 'SABOTAGE',
  PITCHING: 'PITCHING',
  VOTING: 'VOTING',
  ROUND_RESULTS: 'ROUND_RESULTS',
  GAME_OVER: 'GAME_OVER'
};

// Helper to save session
function saveSession(roomId, playerName) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerName }));
}

// Helper to get session
function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Helper to clear session
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRejoining, setIsRejoining] = useState(true);
  const rejoinAttempted = useRef(false);
  
  const handleRoomUpdate = useCallback((data) => {
    setGameState(data);
    setError(null);
  }, []);
  
  const handlePhaseChange = useCallback((data) => {
    console.log('Phase changed to:', data.phase);
  }, []);
  
  const socket = useSocket(handleRoomUpdate, handlePhaseChange);
  
  // Store socket in ref to avoid dependency issues
  const socketRef = useRef(socket);
  socketRef.current = socket;
  
  // Try to rejoin on mount
  useEffect(() => {
    if (rejoinAttempted.current) return;
    rejoinAttempted.current = true;
    
    const session = getSession();
    if (session && session.roomId && session.playerName) {
      console.log('Attempting to rejoin room:', session.roomId);
      
      // Wait for socket connection, then try to rejoin
      const attemptRejoin = async () => {
        try {
          // Wait for socket to be connected (with timeout)
          const connectionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          );
          
          await Promise.race([
            socketRef.current.waitForConnection(),
            connectionTimeout
          ]);
          
          const result = await socketRef.current.rejoinRoom(session.roomId, session.playerName);
          setPlayerName(session.playerName);
          setCategories(result.categories || []);
          setIsConnected(true);
          console.log('Rejoined room successfully');
        } catch (err) {
          console.log('Failed to rejoin, clearing session:', err.message);
          clearSession();
        } finally {
          setIsRejoining(false);
        }
      };
      
      attemptRejoin();
    } else {
      setIsRejoining(false);
    }
  }, []); // Empty dependency - runs once on mount
  
  const handleCreateRoom = async (name) => {
    try {
      setPlayerName(name);
      const result = await socket.createRoom(name);
      setCategories(result.categories || []);
      setIsConnected(true);
      saveSession(result.roomId, name);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleJoinRoom = async (roomId, name) => {
    try {
      setPlayerName(name);
      const result = await socket.joinRoom(roomId, name);
      setCategories(result.categories || []);
      setIsConnected(true);
      saveSession(result.roomId, name);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleLeaveRoom = () => {
    clearSession();
    setGameState(null);
    setPlayerName('');
    setIsConnected(false);
    setError(null);
    // Reload to get fresh socket connection
    window.location.reload();
  };
  
  const handleStartGame = async () => {
    try {
      await socket.startGame();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleUpdateSettings = (settings) => {
    socket.updateSettings(settings);
  };
  
  const handleSubmitFlex = async (selectedCardIds) => {
    try {
      await socket.submitFlex(selectedCardIds);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleSubmitSabotage = async (redCardId) => {
    try {
      await socket.submitSabotage(redCardId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleFinishPitch = async (expectedIndex) => {
    try {
      await socket.finishPitch(expectedIndex);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleCastVote = async (candidateId) => {
    try {
      await socket.castVote(candidateId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleProceedFromResults = async () => {
    try {
      await socket.proceedFromResults();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const value = {
    // State
    gameState,
    playerName,
    error,
    categories,
    isConnected,
    isRejoining,
    
    // Actions
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    startGame: handleStartGame,
    updateSettings: handleUpdateSettings,
    submitFlex: handleSubmitFlex,
    submitSabotage: handleSubmitSabotage,
    finishPitch: handleFinishPitch,
    castVote: handleCastVote,
    proceedFromResults: handleProceedFromResults,
    clearError: () => setError(null)
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
