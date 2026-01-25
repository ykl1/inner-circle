/**
 * Game State Machine and Room Management
 * Server is authoritative for all game state
 */

import { shuffle, generateRoomCode, assignSabotageTargets } from './utils.js';
import { createDeck } from './cards.js';

// Game phases
export const PHASES = {
  LOBBY: 'LOBBY',
  FLEX_SELECTION: 'FLEX_SELECTION',
  SABOTAGE: 'SABOTAGE',
  PITCHING: 'PITCHING',
  VOTING: 'VOTING',
  ROUND_RESULTS: 'ROUND_RESULTS',
  GAME_OVER: 'GAME_OVER'
};

// In-memory storage for all rooms
const rooms = new Map();

/**
 * Create a new room
 * @param {string} founderId - Socket ID of the founder
 * @param {string} founderName - Display name of the founder
 * @returns {Object} Room state
 */
export function createRoom(founderId, founderName) {
  let roomCode = generateRoomCode();
  
  // Ensure unique room code
  while (rooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }
  
  const room = {
    roomId: roomCode,
    currentPhase: PHASES.LOBBY,
    
    // Players
    players: [{
      id: founderId,
      name: founderName.trim(),
      isFounder: true,
      isConnected: true
    }],
    founderId: founderId,
    
    // Game config (set in lobby)
    categoryId: 'startup',
    groupCapacity: 4,
    
    // Round state
    roundNumber: 0,
    judges: [founderId], // Founder starts as the only judge
    candidates: [], // Set when game starts
    
    // Card state
    deck: createDeck(),
    playerHands: {}, // playerId -> { greens: [], reds: [] }
    
    // Phase-specific state
    flexSelections: {}, // playerId -> [cardId, cardId]
    sabotageTargets: {}, // playerId -> targetId
    sabotageSelections: {}, // playerId -> redCardId
    pitchHands: {}, // playerId -> [card, card, card] (final 3-card hand)
    pitchOrder: [], // Order of candidates for pitching
    currentPitcherIndex: 0,
    
    // Voting state
    votes: {}, // judgeId -> candidateId
    roundWinner: null
  };
  
  rooms.set(roomCode, room);
  return room;
}

/**
 * Get a room by ID
 * @param {string} roomId 
 * @returns {Object|null}
 */
export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Add a player to a room
 * @param {string} roomId 
 * @param {string} playerId - Socket ID
 * @param {string} playerName 
 * @returns {{ room: Object }|{ error: string }} Room or error
 */
export function joinRoom(roomId, playerId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.currentPhase !== PHASES.LOBBY) return { error: 'Game already started' };
  
  // Check if player already exists (reconnect by socket ID)
  const existingPlayer = room.players.find(p => p.id === playerId);
  if (existingPlayer) {
    existingPlayer.isConnected = true;
    return { room };
  }
  
  // Check for duplicate name (case-insensitive)
  const normalizedName = playerName.trim().toLowerCase();
  const duplicateName = room.players.find(
    p => p.name.trim().toLowerCase() === normalizedName
  );
  if (duplicateName) {
    return { error: 'Name already taken in this room' };
  }
  
  room.players.push({
    id: playerId,
    name: playerName.trim(),
    isFounder: false,
    isConnected: true
  });
  
  return { room };
}

/**
 * Update room settings (founder only)
 */
export function updateRoomSettings(roomId, settings) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  if (settings.categoryId) room.categoryId = settings.categoryId;
  if (settings.groupCapacity) room.groupCapacity = settings.groupCapacity;
  
  return room;
}

/**
 * Start the game
 * @param {string} roomId 
 * @returns {Object|null} Updated room or null if failed
 */
export function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.LOBBY) return null;
  
  // Validate player count vs group capacity
  // Survival constraint: Total Players >= Group Capacity + 1
  if (room.players.length < room.groupCapacity + 1) {
    return null;
  }
  
  // Set candidates (all non-founder players)
  room.candidates = room.players
    .filter(p => !p.isFounder)
    .map(p => p.id);
  
  room.roundNumber = 1;
  
  // Deal cards and start flex phase
  dealCards(room);
  room.currentPhase = PHASES.FLEX_SELECTION;
  
  return room;
}

/**
 * Deal cards to all candidates
 * Each candidate gets 4 Green and 2 Red
 */
function dealCards(room) {
  const { deck, candidates } = room;
  
  // Shuffle decks
  deck.greenDeck = shuffle(deck.greenDeck);
  deck.redDeck = shuffle(deck.redDeck);
  
  for (const candidateId of candidates) {
    // Get current hand or create new
    const currentHand = room.playerHands[candidateId] || { greens: [], reds: [] };
    
    // Calculate how many cards needed
    const greensNeeded = 4 - currentHand.greens.length;
    const redsNeeded = 2 - currentHand.reds.length;
    
    // Draw greens
    const newGreens = deck.greenDeck.splice(0, greensNeeded);
    currentHand.greens = [...currentHand.greens, ...newGreens];
    
    // Draw reds
    const newReds = deck.redDeck.splice(0, redsNeeded);
    currentHand.reds = [...currentHand.reds, ...newReds];
    
    room.playerHands[candidateId] = currentHand;
  }
}

/**
 * Submit flex selection for a player
 * @param {string} roomId 
 * @param {string} playerId 
 * @param {string[]} selectedCardIds - Array of 2 green card IDs
 * @returns {Object|null}
 */
export function submitFlex(roomId, playerId, selectedCardIds) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.FLEX_SELECTION) return null;
  if (!room.candidates.includes(playerId)) return null;
  if (selectedCardIds.length !== 2) return null;
  
  // Validate that player owns these cards
  const hand = room.playerHands[playerId];
  const hasCards = selectedCardIds.every(cardId => 
    hand.greens.some(c => c.id === cardId)
  );
  if (!hasCards) return null;
  
  room.flexSelections[playerId] = selectedCardIds;
  
  // Check if all candidates have submitted
  const allSubmitted = room.candidates.every(id => room.flexSelections[id]);
  if (allSubmitted) {
    startSabotagePhase(room);
  }
  
  return room;
}

/**
 * Start the sabotage phase
 */
function startSabotagePhase(room) {
  room.currentPhase = PHASES.SABOTAGE;
  room.sabotageTargets = assignSabotageTargets(room.candidates);
  room.sabotageSelections = {};
}

/**
 * Submit sabotage selection
 * @param {string} roomId 
 * @param {string} playerId 
 * @param {string} redCardId - The red card to give to target
 * @returns {Object|null}
 */
export function submitSabotage(roomId, playerId, redCardId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.SABOTAGE) return null;
  if (!room.candidates.includes(playerId)) return null;
  
  // Validate player owns this red card
  const hand = room.playerHands[playerId];
  const hasCard = hand.reds.some(c => c.id === redCardId);
  if (!hasCard) return null;
  
  room.sabotageSelections[playerId] = redCardId;
  
  // Check if all candidates have submitted
  const allSubmitted = room.candidates.every(id => room.sabotageSelections[id]);
  if (allSubmitted) {
    finalizePitchHands(room);
    startPitchingPhase(room);
  }
  
  return room;
}

/**
 * Build final 3-card pitch hands for each candidate
 * 2 Greens (self-selected) + 1 Red (received from saboteur)
 */
function finalizePitchHands(room) {
  for (const candidateId of room.candidates) {
    // Get the 2 green cards they selected
    const selectedGreenIds = room.flexSelections[candidateId];
    const hand = room.playerHands[candidateId];
    const selectedGreens = hand.greens.filter(c => selectedGreenIds.includes(c.id));
    
    // Find who sabotaged this candidate and get the red card
    let receivedRed = null;
    for (const [sabotagerId, targetId] of Object.entries(room.sabotageTargets)) {
      if (targetId === candidateId) {
        const redCardId = room.sabotageSelections[sabotagerId];
        const sabotagerHand = room.playerHands[sabotagerId];
        receivedRed = sabotagerHand.reds.find(c => c.id === redCardId);
        
        // Remove the red card from sabotager's hand
        sabotagerHand.reds = sabotagerHand.reds.filter(c => c.id !== redCardId);
        break;
      }
    }
    
    // Remove used greens from hand
    hand.greens = hand.greens.filter(c => !selectedGreenIds.includes(c.id));
    
    // Build pitch hand
    room.pitchHands[candidateId] = [...selectedGreens, receivedRed];
  }
}

/**
 * Start the pitching phase
 */
function startPitchingPhase(room) {
  room.currentPhase = PHASES.PITCHING;
  room.pitchOrder = shuffle([...room.candidates]);
  room.currentPitcherIndex = 0;
}

/**
 * Finish current pitch and move to next pitcher
 * @param {string} roomId 
 * @param {string} playerId - Must be current pitcher or founder
 * @param {number} expectedIndex - The pitcher index the client expects to advance from
 * @returns {Object|null}
 */
export function finishPitch(roomId, playerId, expectedIndex) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.PITCHING) return null;
  
  // Validate expected index matches current state (prevents race condition)
  if (typeof expectedIndex === 'number' && room.currentPitcherIndex !== expectedIndex) {
    // Already advanced by another request, silently succeed (idempotent)
    return room;
  }
  
  const currentPitcher = room.pitchOrder[room.currentPitcherIndex];
  
  // Only current pitcher or founder can advance
  if (playerId !== currentPitcher && playerId !== room.founderId) {
    return null;
  }
  
  room.currentPitcherIndex++;
  
  // Check if all pitches are done
  if (room.currentPitcherIndex >= room.pitchOrder.length) {
    startVotingPhase(room);
  }
  
  return room;
}

/**
 * Start the voting phase
 */
function startVotingPhase(room) {
  room.currentPhase = PHASES.VOTING;
  room.votes = {};
}

/**
 * Cast a vote
 * @param {string} roomId 
 * @param {string} judgeId 
 * @param {string} candidateId 
 * @returns {Object|null}
 */
export function castVote(roomId, judgeId, candidateId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.VOTING) return null;
  
  // Validate judge
  if (!room.judges.includes(judgeId)) return null;
  
  // Validate candidate
  if (!room.candidates.includes(candidateId)) return null;
  
  room.votes[judgeId] = candidateId;
  
  // Check if all judges have voted
  const allVoted = room.judges.every(id => room.votes[id]);
  if (allVoted) {
    determineRoundWinner(room);
  }
  
  return room;
}

/**
 * Determine the round winner based on votes
 * Founder's vote breaks ties
 */
function determineRoundWinner(room) {
  // Count votes
  const voteCounts = {};
  for (const candidateId of room.candidates) {
    voteCounts[candidateId] = 0;
  }
  
  for (const candidateId of Object.values(room.votes)) {
    voteCounts[candidateId]++;
  }
  
  // Find max votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const topCandidates = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id, _]) => id);
  
  let winner;
  if (topCandidates.length === 1) {
    winner = topCandidates[0];
  } else {
    // Tie: Founder's choice wins
    const founderChoice = room.votes[room.founderId];
    if (topCandidates.includes(founderChoice)) {
      winner = founderChoice;
    } else {
      // Edge case: founder didn't vote for any tied candidate
      // Pick first in tie (shouldn't happen normally)
      winner = topCandidates[0];
    }
  }
  
  room.roundWinner = winner;
  room.currentPhase = PHASES.ROUND_RESULTS;
}

/**
 * Proceed to next round or end game
 * @param {string} roomId 
 * @returns {Object|null}
 */
export function proceedFromResults(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.currentPhase !== PHASES.ROUND_RESULTS) return null;
  
  const winner = room.roundWinner;
  
  // Move winner to judges
  room.judges.push(winner);
  room.candidates = room.candidates.filter(id => id !== winner);
  
  // Clear winner's cards
  delete room.playerHands[winner];
  delete room.pitchHands[winner];
  
  // Check game end condition
  // Game ends when judges.length === groupCapacity
  if (room.judges.length >= room.groupCapacity) {
    room.currentPhase = PHASES.GAME_OVER;
    return room;
  }
  
  // Prepare next round
  room.roundNumber++;
  room.roundWinner = null;
  room.flexSelections = {};
  room.sabotageTargets = {};
  room.sabotageSelections = {};
  room.pitchHands = {};
  room.pitchOrder = [];
  room.currentPitcherIndex = 0;
  room.votes = {};
  
  // Replenish cards for remaining candidates
  dealCards(room);
  
  room.currentPhase = PHASES.FLEX_SELECTION;
  
  return room;
}

/**
 * Get sanitized room state for a specific player
 * Hides other players' hands and sensitive info
 */
export function getPlayerView(roomId, playerId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;
  
  // Base state visible to all
  const view = {
    roomId: room.roomId,
    currentPhase: room.currentPhase,
    categoryId: room.categoryId,
    groupCapacity: room.groupCapacity,
    roundNumber: room.roundNumber,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isFounder: p.isFounder,
      isConnected: p.isConnected
    })),
    founderId: room.founderId,
    judges: room.judges,
    candidates: room.candidates,
    
    // Player's own info
    myId: playerId,
    isFounder: player.isFounder,
    isJudge: room.judges.includes(playerId),
    isCandidate: room.candidates.includes(playerId),
    myHand: room.playerHands[playerId] || null,
    
    // Phase-specific visible info
    hasSubmittedFlex: !!room.flexSelections[playerId],
    hasSubmittedSabotage: !!room.sabotageSelections[playerId]
  };
  
  // Phase-specific additions
  if (room.currentPhase === PHASES.SABOTAGE && room.candidates.includes(playerId)) {
    const targetId = room.sabotageTargets[playerId];
    const targetFlexIds = room.flexSelections[targetId];
    const targetHand = room.playerHands[targetId];
    
    view.sabotageTarget = {
      id: targetId,
      name: room.players.find(p => p.id === targetId)?.name,
      selectedGreens: targetHand.greens.filter(c => targetFlexIds.includes(c.id))
    };
  }
  
  if (room.currentPhase === PHASES.PITCHING) {
    view.pitchOrder = room.pitchOrder.map(id => ({
      id,
      name: room.players.find(p => p.id === id)?.name
    }));
    view.currentPitcherIndex = room.currentPitcherIndex;
    
    const currentPitcherId = room.pitchOrder[room.currentPitcherIndex];
    if (currentPitcherId) {
      view.currentPitcherHand = room.pitchHands[currentPitcherId];
    }
    
    // Include player's own pitch hand
    if (room.pitchHands[playerId]) {
      view.myPitchHand = room.pitchHands[playerId];
    }
  }
  
  if (room.currentPhase === PHASES.VOTING) {
    // Show all pitch hands for voting reference
    view.candidatePitchHands = {};
    for (const candidateId of room.candidates) {
      const candidateName = room.players.find(p => p.id === candidateId)?.name;
      view.candidatePitchHands[candidateId] = {
        name: candidateName,
        cards: room.pitchHands[candidateId]
      };
    }
    view.hasVoted = !!room.votes[playerId];
  }
  
  if (room.currentPhase === PHASES.ROUND_RESULTS) {
    view.roundWinner = {
      id: room.roundWinner,
      name: room.players.find(p => p.id === room.roundWinner)?.name
    };
    view.voteCounts = {};
    for (const candidateId of room.candidates.concat([room.roundWinner])) {
      view.voteCounts[candidateId] = Object.values(room.votes).filter(v => v === candidateId).length;
    }
  }
  
  if (room.currentPhase === PHASES.GAME_OVER) {
    view.winners = room.judges.map(id => ({
      id,
      name: room.players.find(p => p.id === id)?.name,
      isFounder: id === room.founderId
    }));
    view.losers = room.players
      .filter(p => !room.judges.includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name
      }));
  }
  
  return view;
}

/**
 * Handle player disconnect
 */
export function playerDisconnect(playerId) {
  for (const [roomId, room] of rooms.entries()) {
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
      return room;
    }
  }
  return null;
}

/**
 * Delete empty rooms
 */
export function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.players.every(p => !p.isConnected)) {
    rooms.delete(roomId);
  }
}

/**
 * Rejoin a room with a new socket ID
 * Matches player by name and room ID
 * @param {string} roomId 
 * @param {string} newSocketId - New socket ID
 * @param {string} playerName - Player's name to match
 * @returns {Object|null} Room and old player ID if successful
 */
export function rejoinRoom(roomId, newSocketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  // Find player by name (case-insensitive)
  const normalizedName = playerName.trim().toLowerCase();
  const player = room.players.find(p => p.name.trim().toLowerCase() === normalizedName);
  if (!player) return null;
  
  const oldPlayerId = player.id;
  
  // Update player's socket ID
  player.id = newSocketId;
  player.isConnected = true;
  
  // Update founderId if this player is the founder
  if (room.founderId === oldPlayerId) {
    room.founderId = newSocketId;
  }
  
  // Update judges array
  const judgeIndex = room.judges.indexOf(oldPlayerId);
  if (judgeIndex !== -1) {
    room.judges[judgeIndex] = newSocketId;
  }
  
  // Update candidates array
  const candidateIndex = room.candidates.indexOf(oldPlayerId);
  if (candidateIndex !== -1) {
    room.candidates[candidateIndex] = newSocketId;
  }
  
  // Update playerHands
  if (room.playerHands[oldPlayerId]) {
    room.playerHands[newSocketId] = room.playerHands[oldPlayerId];
    delete room.playerHands[oldPlayerId];
  }
  
  // Update flexSelections
  if (room.flexSelections[oldPlayerId]) {
    room.flexSelections[newSocketId] = room.flexSelections[oldPlayerId];
    delete room.flexSelections[oldPlayerId];
  }
  
  // Update sabotageTargets (both as key and value)
  if (room.sabotageTargets[oldPlayerId]) {
    room.sabotageTargets[newSocketId] = room.sabotageTargets[oldPlayerId];
    delete room.sabotageTargets[oldPlayerId];
  }
  for (const [key, value] of Object.entries(room.sabotageTargets)) {
    if (value === oldPlayerId) {
      room.sabotageTargets[key] = newSocketId;
    }
  }
  
  // Update sabotageSelections
  if (room.sabotageSelections[oldPlayerId]) {
    room.sabotageSelections[newSocketId] = room.sabotageSelections[oldPlayerId];
    delete room.sabotageSelections[oldPlayerId];
  }
  
  // Update pitchHands
  if (room.pitchHands[oldPlayerId]) {
    room.pitchHands[newSocketId] = room.pitchHands[oldPlayerId];
    delete room.pitchHands[oldPlayerId];
  }
  
  // Update pitchOrder
  const pitchOrderIndex = room.pitchOrder.indexOf(oldPlayerId);
  if (pitchOrderIndex !== -1) {
    room.pitchOrder[pitchOrderIndex] = newSocketId;
  }
  
  // Update votes (both as key and value)
  if (room.votes[oldPlayerId]) {
    room.votes[newSocketId] = room.votes[oldPlayerId];
    delete room.votes[oldPlayerId];
  }
  for (const [key, value] of Object.entries(room.votes)) {
    if (value === oldPlayerId) {
      room.votes[key] = newSocketId;
    }
  }
  
  // Update roundWinner if needed
  if (room.roundWinner === oldPlayerId) {
    room.roundWinner = newSocketId;
  }
  
  return { room, oldPlayerId };
}
