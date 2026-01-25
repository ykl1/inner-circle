/**
 * Hardcoded card data for MVP
 * 40 dummy cards: 25 Green, 15 Red
 */

// Generate Green cards (strengths)
const greenCards = [];
for (let i = 1; i <= 25; i++) {
  greenCards.push({
    id: `green_${i}`,
    type: 'green',
    text: `Green Trait #${i}`
  });
}

// Generate Red cards (flaws)
const redCards = [];
for (let i = 1; i <= 15; i++) {
  redCards.push({
    id: `red_${i}`,
    type: 'red',
    text: `Red Flaw #${i}`
  });
}

// Hardcoded categories (cosmetic only for MVP)
export const categories = [
  {
    id: 'startup',
    name: 'Startup Team',
    loserMessage: 'The startup pivoted without you'
  },
  {
    id: 'rap-group',
    name: 'Rap Group',
    loserMessage: 'They left you on read'
  }
];

export const allGreenCards = greenCards;
export const allRedCards = redCards;

/**
 * Create a fresh deck instance for a room
 * @returns {{ greenDeck: Array, redDeck: Array }}
 */
export function createDeck() {
  return {
    greenDeck: [...greenCards],
    redDeck: [...redCards]
  };
}
