// server/src/cards.js
// Repo was renamed from inner-circle to pick-me.
// To rename the GitHub repository: go to GitHub Settings → Repository name → rename to pick-me.
// Then update your local remote: git remote set-url origin <new-github-url>

/**
 * CARD TYPES (internal only — never sent to clients except on sabotage map reveal):
 *   relative — neither end is universally better; judge preference determines attractive position
 *   absolute — one end is always better (10 = good, 0 = bad)
 *
 * HAND COMPOSITION RULE (enforced by dealHand):
 *   Every hand has a maximum of 1 absolute card and a minimum of 2 relative cards.
 *   Usually all 3 are relative.
 *
 * SABOTAGE RULE (server-enforced):
 *   All cards are treated identically by the sabotage system.
 *   Card type distinction is for card design reference only.
 *   Floor = 0, Ceiling = 10. Sabotage cannot push a dial past either bound.
 *   If sabotage points are wasted against a floor/ceiling, they are silently discarded.
 *
 * NOTE TO CARD DESIGNERS:
 *   Relative card format: { id, label: "Anchor A ↔ Anchor B", type: "relative" }
 *   Absolute card format: { id, label: "Quality Name", type: "absolute" }
 *   Absolute cards have an implied spectrum of "None ↔ <Quality>" where 10 = maximum quality.
 */

const CATEGORIES = {
  dating: {
    id: "dating",
    label: "Dating",
    description: "The Judge is looking for a date. Pitch the perfect match.",
    winMessage: "You're going on a date!",
    lossMessage: "Left on read.",
    judgePrompt: "Tell the table why you chose this date.",
    cards: {
      relative: [
        { id: "d_rel_01", label: "Relative Trait #1 ↔ Relative Trait #1 Opposite", type: "relative" },
        { id: "d_rel_02", label: "Relative Trait #2 ↔ Relative Trait #2 Opposite", type: "relative" },
        { id: "d_rel_03", label: "Relative Trait #3 ↔ Relative Trait #3 Opposite", type: "relative" },
        { id: "d_rel_04", label: "Relative Trait #4 ↔ Relative Trait #4 Opposite", type: "relative" },
        { id: "d_rel_05", label: "Relative Trait #5 ↔ Relative Trait #5 Opposite", type: "relative" },
        { id: "d_rel_06", label: "Relative Trait #6 ↔ Relative Trait #6 Opposite", type: "relative" },
        { id: "d_rel_07", label: "Relative Trait #7 ↔ Relative Trait #7 Opposite", type: "relative" },
        { id: "d_rel_08", label: "Relative Trait #8 ↔ Relative Trait #8 Opposite", type: "relative" },
        { id: "d_rel_09", label: "Relative Trait #9 ↔ Relative Trait #9 Opposite", type: "relative" },
        { id: "d_rel_10", label: "Relative Trait #10 ↔ Relative Trait #10 Opposite", type: "relative" },
        { id: "d_rel_11", label: "Relative Trait #11 ↔ Relative Trait #11 Opposite", type: "relative" },
        { id: "d_rel_12", label: "Relative Trait #12 ↔ Relative Trait #12 Opposite", type: "relative" },
        { id: "d_rel_13", label: "Relative Trait #13 ↔ Relative Trait #13 Opposite", type: "relative" },
        { id: "d_rel_14", label: "Relative Trait #14 ↔ Relative Trait #14 Opposite", type: "relative" },
        { id: "d_rel_15", label: "Relative Trait #15 ↔ Relative Trait #15 Opposite", type: "relative" },
      ],
      absolute: [
        { id: "d_abs_01", label: "Absolute Quality #1", type: "absolute" },
        { id: "d_abs_02", label: "Absolute Quality #2", type: "absolute" },
        { id: "d_abs_03", label: "Absolute Quality #3", type: "absolute" },
        { id: "d_abs_04", label: "Absolute Quality #4", type: "absolute" },
        { id: "d_abs_05", label: "Absolute Quality #5", type: "absolute" },
        { id: "d_abs_06", label: "Absolute Quality #6", type: "absolute" },
      ],
    },
  },
};

/**
 * dealHand(categoryId)
 * Returns an array of exactly 3 card objects for a candidate's hand.
 * Enforces: max 1 absolute, min 2 relative.
 * Shuffles the full pool before sampling — no duplicates within a hand.
 * Cards are dealt fresh each game; no persistent deck state.
 */
function dealHand(categoryId) {
  const category = CATEGORIES[categoryId];
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  const { relative, absolute } = category.cards;

  // Shuffle helpers
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const shuffledRelative = shuffle(relative);
  const shuffledAbsolute = shuffle(absolute);

  // Decide hand composition: 10% chance of including 1 absolute card
  const includeAbsolute = Math.random() < 0.1 && shuffledAbsolute.length > 0;

  if (includeAbsolute) {
    // 1 absolute + 2 relative
    return [shuffledAbsolute[0], shuffledRelative[0], shuffledRelative[1]];
  } else {
    // 3 relative
    return [shuffledRelative[0], shuffledRelative[1], shuffledRelative[2]];
  }
}

/**
 * getCategory(categoryId)
 * Returns category metadata (label, winMessage, lossMessage, judgePrompt).
 * Does NOT include the card pool — that is internal only.
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

export { dealHand, getCategory, listCategories };
