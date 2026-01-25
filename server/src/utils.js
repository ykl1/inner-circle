/**
 * Utility functions for the game server
 */

/**
 * List of inappropriate words/patterns to avoid in room codes
 * Includes common curse words and offensive terms (4-letter patterns)
 */
const BAD_WORDS = [
  'FUCK', 'SHIT', 'DAMN', 'HELL', 'ASS', 'ARSE', 'CUNT', 'DICK', 'COCK',
  'PISS', 'SLUT', 'TWAT', 'WANK', 'CRAP', 'DUMB', 'HOMO', 'SPIC', 'KIKE',
  'NAZI', 'PORN', 'RAPE', 'TITS', 'BOOB', 'NUDE', 'POOP', 'FART', 'BUTT',
  'BICH', 'BTCH', 'FCUK', 'SHYT', 'SUCK', 'BLOW', 'JERK', 'PRIK', 'PUSS',
  'DYKE', 'FAGS', 'GOOK', 'JIZZ', 'KNOB', 'MUFF', 'NIPS', 'ORGY', 'PHUC',
  'SHAT', 'SPAZ', 'TARD', 'TURD', 'WHRE', 'NEGRO', 'NEGR'
];

/**
 * Check if a code contains any bad words
 * @param {string} code - The code to check
 * @returns {boolean} True if code contains bad word
 */
function containsBadWord(code) {
  return BAD_WORDS.some(bad => code.includes(bad));
}

/**
 * Generate a random 4-character room code
 * Ensures no inappropriate words are generated
 * @returns {string} Room code (uppercase letters)
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded I and O to avoid confusion
  let code = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
  } while (containsBadWord(code) && attempts < maxAttempts);
  
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
