/**
 * Socket.io Event Handlers — Pick Me
 * All game logic is server-authoritative
 */

import {
  createRoom,
  getRoom,
  joinRoom,
  rejoinRoom,
  leaveRoom,
  startGame,
  submitSelfPositioning,
  submitSabotage,
  finishPitch,
  submitVote,
  getPlayerView,
  playerDisconnect,
  cleanupRoom,
  PHASES
} from './gameState.js';
import { listCategories } from './cards.js';

/**
 * Initialize socket handlers
 * @param {import('socket.io').Server} io
 */
export function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    let currentRoomCode = null;

    socket.on('create_room', ({ playerName, category }, callback) => {
      try {
        const room = createRoom(socket.id, playerName, category || 'dating');
        currentRoomCode = room.code;
        socket.join(room.code);

        const view = getPlayerView(room.code, socket.id);
        callback({ success: true, roomCode: room.code });
        socket.emit('room_state_update', view);
      } catch (err) {
        console.error('create_room error:', err);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    socket.on('join_room', ({ roomCode, playerName }, callback) => {
      try {
        const code = (roomCode || '').toUpperCase();
        const result = joinRoom(code, socket.id, playerName);

        if (result.error) {
          const message =
            result.error === 'name_taken'
              ? 'Name already taken in this room.'
              : result.error === 'room_not_found'
                ? 'Room not found.'
                : result.error === 'game_in_progress'
                  ? 'Game already in progress.'
                  : result.error;
          callback({ success: false, error: message });
          return;
        }

        const room = result.room;
        currentRoomCode = room.code;
        socket.join(room.code);

        callback({ success: true, roomCode: room.code });
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('join_room error:', err);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    socket.on('rejoin_room', ({ roomCode, playerName }, callback) => {
      try {
        const code = (roomCode || '').toUpperCase();
        const result = rejoinRoom(code, socket.id, playerName);

        if (!result) {
          callback({ success: false, error: 'Could not rejoin room' });
          return;
        }

        const { room } = result;
        if (room.phase === PHASES.GAME_OVER) {
          socket.emit('game_ended_while_away');
          callback({ success: false, error: 'game_ended_while_away' });
          return;
        }

        currentRoomCode = room.code;
        socket.join(room.code);

        console.log(`Player rejoined: ${playerName}`);
        callback({ success: true, roomCode: room.code });
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('rejoin_room error:', err);
        callback({ success: false, error: 'Could not rejoin room' });
      }
    });

    socket.on('leave_room', ({ roomCode, playerName }) => {
      const code = (roomCode || currentRoomCode || '').toUpperCase();
      const result = leaveRoom(code, playerName);

      socket.leave(code);
      currentRoomCode = null;

      if (result.dissolved && result.room) {
        for (const p of result.room.players) {
          io.to(p.id).emit('room_dissolved');
        }
      } else if (result.room) {
        emitRoomUpdate(io, result.room);
      }
    });

    socket.on('start_game', (_, callback) => {
      if (!currentRoomCode) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }

      const room = getRoom(currentRoomCode);
      if (!room || room.hostSocketId !== socket.id) {
        callback?.({ success: false, error: 'Only the Judge can start the game' });
        return;
      }

      const updated = startGame(currentRoomCode);
      if (!updated) {
        callback?.({ success: false, error: 'Need at least 3 players (1 Judge + 2 candidates) to start' });
        return;
      }

      callback?.({ success: true });
      emitRoomUpdate(io, updated);
    });

    socket.on('submit_self_positioning', ({ roomCode, positions }, callback) => {
      const code = (roomCode || currentRoomCode || '').toUpperCase();
      if (!code) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }

      const result = submitSelfPositioning(code, socket.id, positions);
      if (!result) {
        callback?.({ success: false, error: 'Invalid self-positioning' });
        return;
      }

      callback?.({ success: true });
      emitRoomUpdate(io, result);
    });

    socket.on('submit_sabotage', ({ roomCode, deltas }, callback) => {
      const code = (roomCode || currentRoomCode || '').toUpperCase();
      if (!code) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }

      const result = submitSabotage(code, socket.id, deltas);
      if (!result) {
        callback?.({ success: false, error: 'Invalid sabotage (point total must be 0–8)' });
        return;
      }

      callback?.({ success: true });
      emitRoomUpdate(io, result);
    });

    socket.on('finish_pitch', ({ roomCode, expectedIndex }, callback) => {
      const code = (roomCode || currentRoomCode || '').toUpperCase();
      if (!code) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }

      const result = finishPitch(code, socket.id, expectedIndex);
      if (!result) {
        callback?.({ success: false, error: 'Cannot finish pitch' });
        return;
      }

      callback?.({ success: true });
      emitRoomUpdate(io, result);
    });

    socket.on('submit_vote', ({ roomCode, votedForName }, callback) => {
      const code = (roomCode || currentRoomCode || '').toUpperCase();
      if (!code) {
        callback?.({ success: false, error: 'Not in a room' });
        return;
      }

      const result = submitVote(code, socket.id, votedForName);
      if (!result) {
        callback?.({ success: false, error: 'Invalid vote' });
        return;
      }

      callback?.({ success: true });
      emitRoomUpdate(io, result);
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      const room = playerDisconnect(socket.id);
      if (room) {
        currentRoomCode = null;
        emitRoomUpdate(io, room);
        setTimeout(() => {
          cleanupRoom(room.code);
        }, 60000);
      }
    });
  });
}

/**
 * Emit personalized room state to each player in the room
 */
function emitRoomUpdate(io, room) {
  for (const player of room.players) {
    const view = getPlayerView(room.code, player.id);
    if (view) {
      io.to(player.id).emit('room_state_update', view);
    }
  }
}
