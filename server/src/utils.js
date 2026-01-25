/**
 * Utility functions for the game server
 */

/**
 * Generate a random 4-character room code
 * @returns {string} Room code (uppercase letters)
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded I and O to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} The shuffled array
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a unique player ID
 * @returns {string} Player ID
 */
export function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Assign sabotage targets in a circular manner
 * Each player targets the next player in the shuffled list
 * @param {string[]} candidateIds - Array of candidate player IDs
 * @returns {Object} Map of playerId -> targetId
 */
export function assignSabotageTargets(candidateIds) {
  const shuffled = shuffle(candidateIds);
  const targets = {};
  
  for (let i = 0; i < shuffled.length; i++) {
    const targetIndex = (i + 1) % shuffled.length;
    targets[shuffled[i]] = shuffled[targetIndex];
  }
  
  return targets;
}
