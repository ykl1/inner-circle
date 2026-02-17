// server/src/cards.js
// Dial cards are loaded from official_dial_cards.csv (left_anchor, right_anchor, category).
// Dealing: 3 cards per non-judge player, 1 per category per hand, no duplicate hands in a round.

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Path to the official dial card CSV (project root). */
const DIAL_CARDS_CSV_PATH = join(__dirname, '..', '..', 'official_dial_cards.csv');

/**
 * Category metadata for game modes (e.g. dating). Used by getCategory/listCategories.
 * Card content comes only from the CSV.
 */
const CATEGORIES = {
  dating: {
    id: 'dating',
    label: 'Dating',
    description: 'The Judge is looking for a date. Pitch the perfect match.',
    winMessage: "You're going on a date!",
    lossMessage: 'Left on read.',
    judgePrompt: 'Tell the table why you chose this date.',
  },
};

/**
 * Parse a single CSV row, handling quoted fields.
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || (c === '\r' && !inQuotes)) {
      result.push(current.trim());
      current = '';
    } else if (c !== '\r') {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Load all dial cards from official_dial_cards.csv.
 * Returns array of { id, left_anchor, right_anchor, category }.
 */
function loadDialCards() {
  const raw = readFileSync(DIAL_CARDS_CSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const leftIdx = headers.indexOf('left_anchor');
  const rightIdx = headers.indexOf('right_anchor');
  const catIdx = headers.indexOf('category');
  if (leftIdx === -1 || rightIdx === -1 || catIdx === -1) {
    throw new Error('official_dial_cards.csv must have columns: left_anchor, right_anchor, category');
  }

  const cards = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const left_anchor = (row[leftIdx] || '').replace(/^"|"$/g, '').trim();
    const right_anchor = (row[rightIdx] || '').replace(/^"|"$/g, '').trim();
    const category = (row[catIdx] || '').trim();
    if (!left_anchor && !right_anchor) continue;
    cards.push({
      id: `dial_${i - 1}`,
      left_anchor: left_anchor || 'Low',
      right_anchor: right_anchor || 'High',
      category: category || 'Unknown',
    });
  }
  return cards;
}

/**
 * Shuffle array in place (Fisher–Yates) and return it.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Signature for a hand: sorted card ids for duplicate detection.
 */
function handSignature(cards) {
  return cards.map((c) => c.id).sort().join(',');
}

/**
 * Draw one card from available pool that is (1) not in consumed, (2) optionally not in usedCategories.
 * If requireUniqueCategory is true, only pick cards whose category is not in usedCategories.
 * Returns { card, indexInPool } or null.
 */
function pickOne(pool, consumed, usedCategories, requireUniqueCategory) {
  const available = pool
    .map((c, idx) => ({ card: c, idx }))
    .filter(({ card }) => !consumed.has(card.id));
  if (requireUniqueCategory) {
    const allowed = available.filter(({ card }) => !usedCategories.has(card.category));
    if (allowed.length > 0) {
      const pick = allowed[Math.floor(Math.random() * allowed.length)];
      return { card: pick.card, indexInPool: pick.idx };
    }
  }
  if (available.length > 0) {
    const pick = available[Math.floor(Math.random() * available.length)];
    return { card: pick.card, indexInPool: pick.idx };
  }
  return null;
}

/**
 * Find category with smallest count in hand (for fallback when a category is exhausted).
 */
function leastRepresentedCategory(handCards) {
  const count = {};
  for (const c of handCards) {
    count[c.category] = (count[c.category] || 0) + 1;
  }
  let minCat = null;
  let minCount = Infinity;
  for (const [cat, n] of Object.entries(count)) {
    if (n < minCount) {
      minCount = n;
      minCat = cat;
    }
  }
  return minCat;
}

/**
 * Deal hands for all candidates in a round.
 * - Reads CSV once, shuffles full pool, maintains consumed set.
 * - Each hand: 3 cards, each from a different category when possible.
 * - If a category is exhausted and we can't get a third unique category, relax for that player and substitute from least-represented category in their hand (log warning).
 * - No two players get identical hands (same set of card ids).
 * Returns array of arrays of card objects { id, left_anchor, right_anchor, category, label }.
 */
function dealAllHandsForRound(candidateCount) {
  let pool = loadDialCards();
  if (pool.length < 3) {
    throw new Error('official_dial_cards.csv must have at least 3 cards');
  }
  pool = shuffle([...pool]);
  const consumed = new Set();
  const hands = [];
  const handSignatures = new Set();

  for (let p = 0; p < candidateCount; p++) {
    const handCards = [];
    const usedCategories = new Set();
    let fallbackUsed = false;

    for (let slot = 0; slot < 3; slot++) {
      const requireUnique = true;
      let pick = pickOne(pool, consumed, usedCategories, requireUnique);
      if (!pick) {
        // Category exhaustion: relax and take from least-represented category in current hand
        const fallbackCat = leastRepresentedCategory(handCards);
        const usedForFallback = fallbackCat != null ? new Set([fallbackCat]) : new Set();
        pick = pickOne(pool, consumed, usedForFallback, false);
        if (pick) {
          console.warn(
            `[dial cards] Category exhaustion: player ${p + 1} slot ${slot + 1} received card from same category (${pick.card.category}) as fallback.`
          );
          fallbackUsed = true;
        }
      }
      if (!pick) {
        throw new Error('Not enough dial cards to deal unique hands; add more rows to official_dial_cards.csv');
      }
      handCards.push(pick.card);
      consumed.add(pick.card.id);
      usedCategories.add(pick.card.category);
    }

    let sig = handSignature(handCards);
    const maxAttempts = 50;
    let attempts = 0;
    while (handSignatures.has(sig) && attempts < maxAttempts) {
      // Try to swap one card to get a different hand (keep same categories if possible)
      const swapIdx = Math.floor(Math.random() * 3);
      const swappedOut = handCards[swapIdx];
      consumed.delete(swappedOut.id);
      usedCategories.delete(swappedOut.category);
      const others = handCards.filter((_, i) => i !== swapIdx);
      const usedCat = new Set(others.map((c) => c.category));
      const pick = pickOne(pool, consumed, usedCat, true) || pickOne(pool, consumed, usedCat, false);
      if (!pick) {
        consumed.add(swappedOut.id);
        usedCategories.add(swappedOut.category);
        attempts++;
        continue;
      }
      handCards[swapIdx] = pick.card;
      consumed.add(pick.card.id);
      usedCategories.add(pick.card.category);
      sig = handSignature(handCards);
      attempts++;
    }
    if (handSignatures.has(sig)) {
      throw new Error('Could not deal unique hands for all players; add more cards to official_dial_cards.csv');
    }
    handSignatures.add(sig);

    hands.push(
      handCards.map((c) => ({
        id: c.id,
        left_anchor: c.left_anchor,
        right_anchor: c.right_anchor,
        category: c.category,
        label: `${c.left_anchor} ↔ ${c.right_anchor}`,
      }))
    );
  }

  return hands;
}

/**
 * getCategory(categoryId)
 * Returns category metadata (label, winMessage, lossMessage, judgePrompt).
 */
function getCategory(categoryId) {
  const cat = CATEGORIES[categoryId];
  if (!cat) return null;
  const { id, label, description, winMessage, lossMessage, judgePrompt } = cat;
  return { id, label, description, winMessage, lossMessage, judgePrompt };
}

/**
 * listCategories()
 * Returns public metadata for all categories. Used by GET /api/categories.
 */
function listCategories() {
  return Object.values(CATEGORIES).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}

export { loadDialCards, dealAllHandsForRound, getCategory, listCategories };
