/**
 * Socket.io Event Handlers
 * All game logic is server-authoritative
 */

import {
  createRoom,
  getRoom,
  joinRoom,
  updateRoomSettings,
  startGame,
  submitFlex,
  submitSabotage,
  finishPitch,
  castVote,
  proceedFromResults,
  getPlayerView,
  playerDisconnect,
  cleanupRoom,
  PHASES
} from './gameState.js';
import { categories } from './cards.js';

/**
 * Initialize socket handlers
 * @param {import('socket.io').Server} io 
 */
export function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Store current room for this socket
    let currentRoomId = null;
    
    /**
     * Create a new room (become founder)
     */
    socket.on('create_room', ({ playerName }, callback) => {
      try {
        const room = createRoom(socket.id, playerName);
        currentRoomId = room.roomId;
        
        socket.join(room.roomId);
        
        callback({
          success: true,
          roomId: room.roomId,
          categories
        });
        
        emitRoomUpdate(io, room);
      } catch (error) {
        console.error('create_room error:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });
    
    /**
     * Join an existing room
     */
    socket.on('join_room', ({ roomId, playerName }, callback) => {
      try {
        const room = joinRoom(roomId.toUpperCase(), socket.id, playerName);
        
        if (!room) {
          callback({ success: false, error: 'Room not found or game already started' });
          return;
        }
        
        currentRoomId = room.roomId;
        socket.join(room.roomId);
        
        callback({
          success: true,
          roomId: room.roomId,
          categories
        });
        
        emitRoomUpdate(io, room);
      } catch (error) {
        console.error('join_room error:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });
    
    /**
     * Update room settings (founder only)
     */
    socket.on('update_settings', ({ categoryId, groupCapacity }) => {
      if (!currentRoomId) return;
      
      const room = getRoom(currentRoomId);
      if (!room || room.founderId !== socket.id) return;
      
      updateRoomSettings(currentRoomId, { categoryId, groupCapacity });
      emitRoomUpdate(io, room);
    });
    
    /**
     * Start the game (founder only)
     */
    socket.on('start_game', (_, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const room = getRoom(currentRoomId);
      if (!room || room.founderId !== socket.id) {
        callback?.({ success: false, error: 'Only founder can start game' });
        return;
      }
      
      const result = startGame(currentRoomId);
      if (!result) {
        callback?.({ 
          success: false, 
          error: `Need at least ${room.groupCapacity + 1} players to start` 
        });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      emitPhaseChange(io, result);
    });
    
    /**
     * Submit flex selection (2 green cards)
     */
    socket.on('submit_flex', ({ selectedCardIds }, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = submitFlex(currentRoomId, socket.id, selectedCardIds);
      if (!result) {
        callback?.({ success: false, error: 'Invalid flex selection' });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      
      if (result.currentPhase === PHASES.SABOTAGE) {
        emitPhaseChange(io, result);
      }
    });
    
    /**
     * Submit sabotage (1 red card to target)
     */
    socket.on('submit_sabotage', ({ redCardId }, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = submitSabotage(currentRoomId, socket.id, redCardId);
      if (!result) {
        callback?.({ success: false, error: 'Invalid sabotage selection' });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      
      if (result.currentPhase === PHASES.PITCHING) {
        emitPhaseChange(io, result);
      }
    });
    
    /**
     * Finish pitch (current pitcher or founder)
     */
    socket.on('finish_pitch', (_, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = finishPitch(currentRoomId, socket.id);
      if (!result) {
        callback?.({ success: false, error: 'Cannot finish pitch' });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      
      if (result.currentPhase === PHASES.VOTING) {
        emitPhaseChange(io, result);
      }
    });
    
    /**
     * Cast vote (judges only)
     */
    socket.on('cast_vote', ({ candidateId }, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const result = castVote(currentRoomId, socket.id, candidateId);
      if (!result) {
        callback?.({ success: false, error: 'Invalid vote' });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      
      if (result.currentPhase === PHASES.ROUND_RESULTS) {
        emitPhaseChange(io, result);
      }
    });
    
    /**
     * Proceed from round results to next round
     */
    socket.on('proceed_from_results', (_, callback) => {
      if (!currentRoomId) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }
      
      const room = getRoom(currentRoomId);
      if (!room || room.founderId !== socket.id) {
        callback?.({ success: false, error: 'Only founder can proceed' });
        return;
      }
      
      const result = proceedFromResults(currentRoomId);
      if (!result) {
        callback?.({ success: false, error: 'Cannot proceed' });
        return;
      }
      
      callback?.({ success: true });
      emitRoomUpdate(io, result);
      emitPhaseChange(io, result);
    });
    
    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      const room = playerDisconnect(socket.id);
      if (room) {
        emitRoomUpdate(io, room);
        
        // Cleanup after delay
        setTimeout(() => {
          cleanupRoom(room.roomId);
        }, 60000); // 1 minute
      }
    });
  });
}

/**
 * Emit personalized room state to each player
 */
function emitRoomUpdate(io, room) {
  for (const player of room.players) {
    const view = getPlayerView(room.roomId, player.id);
    io.to(player.id).emit('room_state_update', view);
  }
}

/**
 * Emit phase change to all players in room
 */
function emitPhaseChange(io, room) {
  io.to(room.roomId).emit('phase_change', {
    phase: room.currentPhase,
    roundNumber: room.roundNumber
  });
}
