import { createContext, useContext, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

export const PHASES = {
  LOBBY: 'LOBBY',
  FLEX_SELECTION: 'FLEX_SELECTION',
  SABOTAGE: 'SABOTAGE',
  PITCHING: 'PITCHING',
  VOTING: 'VOTING',
  ROUND_RESULTS: 'ROUND_RESULTS',
  GAME_OVER: 'GAME_OVER'
};

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const handleRoomUpdate = useCallback((data) => {
    setGameState(data);
    setError(null);
  }, []);
  
  const handlePhaseChange = useCallback((data) => {
    console.log('Phase changed to:', data.phase);
  }, []);
  
  const socket = useSocket(handleRoomUpdate, handlePhaseChange);
  
  const handleCreateRoom = async (name) => {
    try {
      setPlayerName(name);
      const result = await socket.createRoom(name);
      setCategories(result.categories || []);
      setIsConnected(true);
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
    } catch (err) {
      setError(err.message);
      throw err;
    }
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
  
  const handleFinishPitch = async () => {
    try {
      await socket.finishPitch();
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
    
    // Actions
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
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
