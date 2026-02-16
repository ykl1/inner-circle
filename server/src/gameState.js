/**
 * Game State Machine and Room Management — Pick Me
 * Server is authoritative for all game state
 */

import { shuffle, generateRoomCode } from './utils.js';
import { dealHand, getCategory } from './cards.js';

export const PHASES = {
  LOBBY: 'LOBBY',
  SELF_POSITIONING: 'SELF_POSITIONING',
  SABOTAGE: 'SABOTAGE',
  PITCHING: 'PITCHING',
  VOTING: 'VOTING',
  GAME_OVER: 'GAME_OVER'
};

const rooms = new Map();

/**
 * Assign sabotage targets: randomized circular chain by name.
 * Each player sabotages the next; last sabotages first.
 */
function assignSabotageTargets(candidates) {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  shuffled.forEach((player, i) => {
    player.sabotageTarget = shuffled[(i + 1) % shuffled.length].name;
  });
}

/**
 * Build hand entry for a player from dealt cards (selfPosition default 5)
 */
function buildHand(cards) {
  return cards.map(c => ({
    cardId: c.id,
    label: c.label,
    selfPosition: 5,
    finalPosition: null,
    sabotageApplied: null
  }));
}

/**
 * Create a new room. Creator is the Judge (host).
 */
export function createRoom(hostSocketId, playerName, categoryId = 'dating') {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room = {
    code,
    category: categoryId,
    phase: PHASES.LOBBY,
    hostSocketId,
    players: [{
      id: hostSocketId,
      name: playerName.trim(),
      isJudge: true,
      hand: null,
      sabotageTarget: null,
      sabotageSubmitted: false,
      selfPositioningSubmitted: false,
      pitchDone: false,
      isWinner: false,
      isConnected: true
    }],
    pitchOrder: [],
    currentPitcherIndex: 0,
    judgeVote: null,
    sabotageMap: null,
    createdAt: Date.now()
  };

  rooms.set(code, room);
  return room;
}

export function getRoom(roomCode) {
  const normalized = (roomCode || '').toUpperCase();
  return rooms.get(normalized) || null;
}

/**
 * Join room. Fails if name taken (case-insensitive) or game not in LOBBY.
 */
export function joinRoom(roomCode, playerId, playerName) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return { error: 'room_not_found' };
  if (room.phase !== PHASES.LOBBY) return { error: 'game_in_progress' };

  const normalizedName = playerName.trim().toLowerCase();
  const duplicate = room.players.find(
    p => p.name.trim().toLowerCase() === normalizedName
  );
  if (duplicate) return { error: 'name_taken' };

  room.players.push({
    id: playerId,
    name: playerName.trim(),
    isJudge: false,
    hand: null,
    sabotageTarget: null,
    sabotageSubmitted: false,
    selfPositioningSubmitted: false,
    pitchDone: false,
    isWinner: false,
    isConnected: true
  });

  return { room };
}

/**
 * Rejoin by name; migrate socket ID. Returns { room, oldPlayerId } or null.
 * Caller should check room.phase === GAME_OVER to emit game_ended_while_away.
 */
export function rejoinRoom(roomCode, newSocketId, playerName) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return null;

  const normalizedName = playerName.trim().toLowerCase();
  const player = room.players.find(
    p => p.name.trim().toLowerCase() === normalizedName
  );
  if (!player) return null;

  const oldId = player.id;
  player.id = newSocketId;
  player.isConnected = true;

  if (room.hostSocketId === oldId) {
    room.hostSocketId = newSocketId;
  }

  return { room, oldPlayerId: oldId };
}

/**
 * Leave room. If Judge leaves, room is dissolved (removed). Returns { room, dissolved }.
 */
export function leaveRoom(roomCode, playerName) {
  const code = roomCode.toUpperCase();
  const room = rooms.get(code);
  if (!room) return { room: null, dissolved: false };

  const normalizedName = playerName.trim().toLowerCase();
  const index = room.players.findIndex(
    p => p.name.trim().toLowerCase() === normalizedName
  );
  if (index === -1) return { room, dissolved: false };

  const wasHost = room.players[index].id === room.hostSocketId;
  room.players.splice(index, 1);

  if (room.players.length === 0) {
    rooms.delete(code);
    return { room: null, dissolved: true };
  }

  if (wasHost) {
    rooms.delete(code);
    return { room, dissolved: true };
  }

  return { room, dissolved: false };
}

/**
 * Start game (Judge only). Min 3 players (1 Judge + 2 candidates). Deal hands, phase → SELF_POSITIONING.
 */
export function startGame(roomCode) {
  const room = getRoom(roomCode);
  if (!room || room.phase !== PHASES.LOBBY) return null;
  if (room.hostSocketId !== room.players.find(p => p.id === room.hostSocketId)?.id) return null;

  const candidates = room.players.filter(p => !p.isJudge);
  if (candidates.length < 2) return null;

  room.phase = PHASES.SELF_POSITIONING;
  room.category = room.category || 'dating';

  for (const p of candidates) {
    const cards = dealHand(room.category);
    p.hand = buildHand(cards);
  }

  return room;
}

/**
 * Submit self-positioning. positions: [{ cardId, position }], each 0–10. When all submitted → SABOTAGE.
 */
export function submitSelfPositioning(roomCode, playerId, positions) {
  const room = getRoom(roomCode);
  if (!room || room.phase !== PHASES.SELF_POSITIONING) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player || player.isJudge) return null;
  if (!player.hand || player.hand.length !== 3) return null;
  if (!Array.isArray(positions) || positions.length !== 3) return null;

  const cardIds = new Set(player.hand.map(c => c.cardId));
  for (const { cardId, position } of positions) {
    const pos = Number(position);
    if (!cardIds.has(cardId) || !Number.isInteger(pos) || pos < 0 || pos > 10) return null;
    const card = player.hand.find(c => c.cardId === cardId);
    if (card) card.selfPosition = pos;
  }

  player.selfPositioningSubmitted = true;

  const candidates = room.players.filter(p => !p.isJudge);
  const allSubmitted = candidates.every(p => p.selfPositioningSubmitted);
  if (allSubmitted) {
    assignSabotageTargets(candidates);
    room.phase = PHASES.SABOTAGE;
  }

  return room;
}

/**
 * Submit sabotage. deltas: [{ cardId, delta }]. Total |delta| must be 0–6. CardIds must belong to target.
 */
export function submitSabotage(roomCode, playerId, deltas) {
  const room = getRoom(roomCode);
  if (!room || room.phase !== PHASES.SABOTAGE) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player || player.isJudge) return null;
  const target = room.players.find(p => p.name === player.sabotageTarget);
  if (!target || !target.hand) return null;

  const targetCardIds = new Set(target.hand.map(c => c.cardId));
  let totalAbs = 0;
  const applied = [];
  for (const { cardId, delta } of deltas) {
    const d = Number(delta);
    if (!Number.isInteger(d) || !targetCardIds.has(cardId)) return null;
    totalAbs += Math.abs(d);
    applied.push({ cardId, delta: d });
  }
  if (totalAbs > 6) return null;

  for (const { cardId, delta } of applied) {
    const card = target.hand.find(c => c.cardId === cardId);
    if (card) {
      const final = Math.max(0, Math.min(10, card.selfPosition + delta));
      card.finalPosition = final;
      card.sabotageApplied = final - card.selfPosition;
    }
  }

  player.sabotageSubmitted = true;

  const candidates = room.players.filter(p => !p.isJudge);
  const allSubmitted = candidates.every(p => p.sabotageSubmitted);
  if (allSubmitted) {
    room.pitchOrder = shuffle(candidates.map(p => p.name));
    room.currentPitcherIndex = 0;
    room.phase = PHASES.PITCHING;
  }

  return room;
}

/**
 * Finish pitch. expectedIndex must match current. When all pitched → VOTING.
 */
export function finishPitch(roomCode, playerId, expectedIndex) {
  const room = getRoom(roomCode);
  if (!room || room.phase !== PHASES.PITCHING) return null;

  if (room.currentPitcherIndex !== expectedIndex) return room;

  const currentName = room.pitchOrder[room.currentPitcherIndex];
  const currentPlayer = room.players.find(p => p.name === currentName);
  const isHost = room.hostSocketId === playerId;
  if (!currentPlayer || (currentPlayer.id !== playerId && !isHost)) return null;

  currentPlayer.pitchDone = true;
  room.currentPitcherIndex++;

  const candidates = room.players.filter(p => !p.isJudge);
  if (room.currentPitcherIndex >= room.pitchOrder.length) {
    room.phase = PHASES.VOTING;
  }

  return room;
}

/**
 * Judge submits vote. votedForName must be a candidate. Phase → GAME_OVER, build sabotageMap.
 */
export function submitVote(roomCode, playerId, votedForName) {
  const room = getRoom(roomCode);
  if (!room || room.phase !== PHASES.VOTING) return null;
  if (room.hostSocketId !== playerId) return null;

  const candidates = room.players.filter(p => !p.isJudge);
  const winner = candidates.find(p => p.name === votedForName);
  if (!winner) return null;

  room.judgeVote = votedForName;
  winner.isWinner = true;
  room.phase = PHASES.GAME_OVER;

  room.sabotageMap = room.players
    .filter(p => !p.isJudge && p.hand)
    .map(p => ({
      candidateName: p.name,
      saboteurName: (() => {
        const saboteur = room.players.find(x => x.sabotageTarget === p.name);
        return saboteur ? saboteur.name : null;
      })(),
      cards: p.hand.map(c => ({
        cardId: c.cardId,
        label: c.label,
        selfPosition: c.selfPosition,
        finalPosition: c.finalPosition,
        sabotageApplied: c.sabotageApplied
      }))
    }));

  return room;
}

/**
 * Personalized view for one player. Hand visibility and sabotageMap per spec.
 */
export function getPlayerView(roomCode, playerId) {
  const room = getRoom(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  const categoryMeta = getCategory(room.category) || {};

  const view = {
    phase: room.phase,
    roomCode: room.code,
    category: room.category,
    categoryMeta,
    playerName: player.name,
    isJudge: player.isJudge,
    players: room.players.map(p => ({
      name: p.name,
      id: p.id,
      isJudge: p.isJudge,
      isWinner: p.isWinner ?? false,
      selfPositioningSubmitted: p.selfPositioningSubmitted ?? false,
      sabotageSubmitted: p.sabotageSubmitted ?? false,
      pitchDone: p.pitchDone ?? false,
      isConnected: p.isConnected ?? true,
      hand: null
    })),
    pitchOrder: room.pitchOrder,
    currentPitcherIndex: room.currentPitcherIndex,
    judgeVote: room.judgeVote,
    sabotageMap: room.phase === PHASES.GAME_OVER ? room.sabotageMap : null,
    sabotageTargetName: room.phase === PHASES.SABOTAGE && !player.isJudge ? player.sabotageTarget : null,
    sabotageTargetCards: null
  };

  if (room.phase === PHASES.SABOTAGE && !player.isJudge && player.sabotageTarget) {
    const target = room.players.find(p => p.name === player.sabotageTarget);
    view.sabotageTargetCards = target?.hand ? target.hand.map(c => ({ cardId: c.cardId, label: c.label, selfPosition: c.selfPosition })) : null;
  }

  const currentPitcherName = room.pitchOrder[room.currentPitcherIndex];

  for (let i = 0; i < room.players.length; i++) {
    const p = room.players[i];
    const viewPlayer = view.players[i];

    if (room.phase === PHASES.SELF_POSITIONING) {
      if (p.id === playerId) {
        viewPlayer.hand = p.hand ? p.hand.map(c => ({ ...c, finalPosition: undefined, sabotageApplied: undefined })) : null;
      }
    } else if (room.phase === PHASES.SABOTAGE) {
      if (p.id === playerId && p.sabotageTarget) {
        const target = room.players.find(x => x.name === p.sabotageTarget);
        viewPlayer.hand = target?.hand ? target.hand.map(c => ({ cardId: c.cardId, label: c.label })) : null;
      }
    } else if (room.phase === PHASES.PITCHING) {
      if (p.name === currentPitcherName && p.hand) {
        viewPlayer.hand = p.hand.map(c => ({ ...c }));
      } else if (p.id === playerId && p.hand) {
        viewPlayer.hand = p.hand.map(c => ({ ...c }));
      }
    } else if (room.phase === PHASES.VOTING) {
      if (player.isJudge && !p.isJudge && p.hand) {
        viewPlayer.hand = p.hand.map(c => ({ ...c }));
      } else if (!player.isJudge && p.id === playerId && p.hand) {
        viewPlayer.hand = p.hand.map(c => ({ ...c }));
      }
    } else if (room.phase === PHASES.GAME_OVER) {
      viewPlayer.hand = null;
    }
  }

  return view;
}

export function playerDisconnect(playerId) {
  for (const [, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      return room;
    }
  }
  return null;
}

/**
 * Cleanup: remove room if all players disconnected (called after 60s delay)
 */
export function cleanupRoom(roomCode) {
  const code = (roomCode || '').toUpperCase();
  const room = rooms.get(code);
  if (room && room.players.every(p => !p.isConnected)) {
    rooms.delete(code);
  }
}
