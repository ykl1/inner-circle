import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Socket URL: use env var, or same origin (when frontend is served from backend)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Debounce delay for reconnection (wait for stable connection)
const RECONNECT_DEBOUNCE_MS = 1500;

/**
 * Custom hook for Socket.io connection
 */
export function useSocket(onRoomUpdate, onPhaseChange, onReconnect) {
  const socketRef = useRef(null);
  const onConnectCallbacks = useRef([]);
  const isFirstConnect = useRef(true);
  const reconnectDebounceTimer = useRef(null);
  
  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      
      // Fire any waiting callbacks (for initial connection)
      onConnectCallbacks.current.forEach(cb => cb());
      onConnectCallbacks.current = [];
      
      // Handle reconnection (not the first connect)
      if (isFirstConnect.current) {
        isFirstConnect.current = false;
      } else {
        // Debounce reconnection to wait for stable connection
        if (reconnectDebounceTimer.current) {
          clearTimeout(reconnectDebounceTimer.current);
        }
        
        reconnectDebounceTimer.current = setTimeout(() => {
          console.log('Stable reconnection detected, triggering sync...');
          onReconnect?.();
        }, RECONNECT_DEBOUNCE_MS);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      // Clear debounce timer on disconnect (connection not stable yet)
      if (reconnectDebounceTimer.current) {
        clearTimeout(reconnectDebounceTimer.current);
        reconnectDebounceTimer.current = null;
      }
    });
    
    socket.on('room_state_update', (data) => {
      console.log('Room state update:', data);
      onRoomUpdate?.(data);
    });
    
    socket.on('phase_change', (data) => {
      console.log('Phase change:', data);
      onPhaseChange?.(data);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    return () => {
      if (reconnectDebounceTimer.current) {
        clearTimeout(reconnectDebounceTimer.current);
      }
      socket.disconnect();
    };
  }, []);
  
  // Helper to wait for socket connection
  const waitForConnection = useCallback(() => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        resolve();
      } else {
        onConnectCallbacks.current.push(resolve);
      }
    });
  }, []);
  
  // Create room
  const createRoom = useCallback((playerName) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('create_room', { playerName }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Join room
  const joinRoom = useCallback((roomId, playerName) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('join_room', { roomId, playerName }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Rejoin room after refresh (with timeout and connection check)
  const rejoinRoom = useCallback((roomId, playerName) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      
      // Check if socket exists and is connected
      if (!socket || !socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      // Set timeout to prevent hanging forever
      const timeout = setTimeout(() => {
        reject(new Error('Rejoin timeout'));
      }, 5000);
      
      socket.emit('rejoin_room', { roomId, playerName }, (response) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Update settings
  const updateSettings = useCallback((settings) => {
    socketRef.current?.emit('update_settings', settings);
  }, []);
  
  // Start game
  const startGame = useCallback(() => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('start_game', {}, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Submit flex selection
  const submitFlex = useCallback((selectedCardIds) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('submit_flex', { selectedCardIds }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Submit sabotage
  const submitSabotage = useCallback((redCardId) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('submit_sabotage', { redCardId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Finish pitch (with expected index to prevent race condition)
  const finishPitch = useCallback((expectedIndex) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('finish_pitch', { expectedIndex }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Cast vote
  const castVote = useCallback((candidateId) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('cast_vote', { candidateId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  // Proceed from results
  const proceedFromResults = useCallback(() => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('proceed_from_results', {}, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);
  
  return {
    socket: socketRef.current,
    waitForConnection,
    createRoom,
    joinRoom,
    rejoinRoom,
    updateSettings,
    startGame,
    submitFlex,
    submitSabotage,
    finishPitch,
    castVote,
    proceedFromResults
  };
}
