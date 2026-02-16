import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

const ROOM_CODE_KEY = 'pickme_roomCode';
const PLAYER_NAME_KEY = 'pickme_playerName';

export const PHASES = {
  LOBBY: 'LOBBY',
  SELF_POSITIONING: 'SELF_POSITIONING',
  SABOTAGE: 'SABOTAGE',
  PITCHING: 'PITCHING',
  VOTING: 'VOTING',
  GAME_OVER: 'GAME_OVER'
};

function saveSession(roomCode, playerName) {
  localStorage.setItem(ROOM_CODE_KEY, roomCode);
  localStorage.setItem(PLAYER_NAME_KEY, playerName);
}

function getSession() {
  const roomCode = localStorage.getItem(ROOM_CODE_KEY);
  const playerName = localStorage.getItem(PLAYER_NAME_KEY);
  if (!roomCode || !playerName) return null;
  return { roomId: roomCode, roomCode, playerName };
}

function clearSession() {
  localStorage.removeItem(ROOM_CODE_KEY);
  localStorage.removeItem(PLAYER_NAME_KEY);
}

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRejoining, setIsRejoining] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const rejoinAttempted = useRef(false);

  const handleRoomUpdate = useCallback((data) => {
    setGameState(data);
    setError(null);
  }, []);

  const handlePhaseChange = useCallback((data) => {
    console.log('Phase changed to:', data?.phase);
  }, []);

  const handleGameEndedWhileAway = useCallback(() => {
    clearSession();
    setGameState(null);
    setIsConnected(false);
    setError('The game has ended while you were away.');
  }, []);

  const handleRoomDissolved = useCallback(() => {
    clearSession();
    setGameState(null);
    setIsConnected(false);
    setError(null);
    window.location.reload();
  }, []);

  const socketRef = useRef(null);

  const rejoinWithRetries = useCallback(async (maxRetries = 3, attempt = 1) => {
    const session = getSession();
    if (!session?.roomCode || !session?.playerName) {
      return { success: false, error: 'No session' };
    }
    try {
      const result = await socketRef.current.rejoinRoom(session.roomCode, session.playerName);
      setPlayerName(session.playerName);
      setCategories(result.categories || []);
      setIsConnected(true);
      return { success: true };
    } catch (err) {
      if (err.message?.includes('game_ended_while_away') || err.message?.includes('not found') || err.message?.includes('Could not rejoin')) {
        return { success: false, error: 'room_not_found' };
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        return rejoinWithRetries(maxRetries, attempt + 1);
      }
      return { success: false, error: 'max_retries' };
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    const session = getSession();
    if (!session?.roomCode || !session?.playerName) return;
    setIsSyncing(true);
    try {
      const result = await rejoinWithRetries(3);
      if (!result.success) {
        if (result.error === 'room_not_found') {
          clearSession();
          setGameState(null);
          setIsConnected(false);
          setError('The game has ended while you were away.');
        } else {
          setError('Failed to sync. Please refresh the page.');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [rejoinWithRetries]);

  const socket = useSocket(
    handleRoomUpdate,
    handlePhaseChange,
    handleReconnect,
    handleGameEndedWhileAway,
    handleRoomDissolved
  );

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    fetch(window.location.origin + '/api/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (rejoinAttempted.current) return;
    rejoinAttempted.current = true;
    const session = getSession();
    if (session?.roomCode && session?.playerName) {
      const attemptRejoin = async () => {
        try {
          const connectionTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000));
          await Promise.race([socketRef.current.waitForConnection(), connectionTimeout]);
          const result = await rejoinWithRetries(3);
          if (!result.success) {
            if (result.error === 'room_not_found') setError('The game has ended while you were away.');
            clearSession();
          }
        } catch {
          clearSession();
        } finally {
          setIsRejoining(false);
        }
      };
      attemptRejoin();
    } else {
      setIsRejoining(false);
    }
  }, []);

  const handleCreateRoom = async (name, category = 'dating') => {
    try {
      setPlayerName(name);
      const result = await socket.createRoom(name, category);
      setIsConnected(true);
      saveSession(result.roomCode, name);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleJoinRoom = async (roomCode, name) => {
    try {
      setPlayerName(name);
      const result = await socket.joinRoom((roomCode || '').toUpperCase(), name);
      setIsConnected(true);
      saveSession(result.roomCode, name);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleLeaveRoom = () => {
    if (gameState?.roomCode && playerName) {
      socket.leaveRoom(gameState.roomCode, playerName);
    }
    clearSession();
    setGameState(null);
    setPlayerName('');
    setIsConnected(false);
    setError(null);
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

  const handleSubmitSelfPositioning = async (positions) => {
    try {
      await socket.submitSelfPositioning(positions);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleSubmitSabotage = async (deltas) => {
    try {
      await socket.submitSabotage(deltas);
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

  const handleSubmitVote = async (votedForName) => {
    try {
      await socket.submitVote(votedForName);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    gameState,
    playerName,
    error,
    categories,
    isConnected,
    isRejoining,
    isSyncing,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    startGame: handleStartGame,
    submitSelfPositioning: handleSubmitSelfPositioning,
    submitSabotage: handleSubmitSabotage,
    finishPitch: handleFinishPitch,
    submitVote: handleSubmitVote,
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
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
