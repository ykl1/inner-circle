import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const RECONNECT_DEBOUNCE_MS = 500;

export function useSocket(onRoomUpdate, onPhaseChange, onReconnect, onGameEndedWhileAway, onRoomDissolved) {
  const socketRef = useRef(null);
  const onConnectCallbacks = useRef([]);
  const isFirstConnect = useRef(true);
  const reconnectDebounceTimer = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      onConnectCallbacks.current.forEach(cb => cb());
      onConnectCallbacks.current = [];

      if (isFirstConnect.current) {
        isFirstConnect.current = false;
      } else {
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
      if (reconnectDebounceTimer.current) {
        clearTimeout(reconnectDebounceTimer.current);
        reconnectDebounceTimer.current = null;
      }
    });

    socket.on('room_state_update', (data) => {
      onRoomUpdate?.(data);
    });

    socket.on('phase_change', (data) => {
      onPhaseChange?.(data);
    });

    socket.on('game_ended_while_away', () => {
      onGameEndedWhileAway?.();
    });

    socket.on('room_dissolved', () => {
      onRoomDissolved?.();
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

  const waitForConnection = useCallback(() => {
    return new Promise((resolve) => {
      const s = socketRef.current;
      if (s?.connected) {
        resolve();
      } else {
        onConnectCallbacks.current.push(resolve);
      }
    });
  }, []);

  const createRoom = useCallback((playerName, category = 'dating') => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('create_room', { playerName, category }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((roomCode, playerName) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('join_room', { roomCode: (roomCode || '').toUpperCase(), playerName }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const rejoinRoom = useCallback((roomCode, playerName) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      const timeout = setTimeout(() => reject(new Error('Rejoin timeout')), 5000);
      socket.emit('rejoin_room', { roomCode: (roomCode || '').toUpperCase(), playerName }, (response) => {
        clearTimeout(timeout);
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback((roomCode, playerName) => {
    socketRef.current?.emit('leave_room', { roomCode: (roomCode || '').toUpperCase(), playerName });
  }, []);

  const startGame = useCallback(() => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('start_game', {}, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);

  const submitSelfPositioning = useCallback((positions) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('submit_self_positioning', { positions }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);

  const submitSabotage = useCallback((deltas) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('submit_sabotage', { deltas }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);

  const finishPitch = useCallback((expectedIndex) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('finish_pitch', { expectedIndex }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);

  const submitVote = useCallback((votedForName) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('submit_vote', { votedForName }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);

  return {
    socket: socketRef.current,
    waitForConnection,
    createRoom,
    joinRoom,
    rejoinRoom,
    leaveRoom,
    startGame,
    submitSelfPositioning,
    submitSabotage,
    finishPitch,
    submitVote
  };
}
