// Borang 14 (ASINGKAN!): the player is a counting agent at one polling stream. Ballots
// come up one at a time; swipe each onto the right pile, the player's own or the rival's,
// before the fuse burns out. A wrong pile is a mistake and the ballot stays to be sorted
// again. Pure rules here; the screen is Borang14.tsx.

export type Pile = "yours" | "rival";

export const BALLOTS = 6;

/** Swipe distance, as a share of the card's width, that counts as a throw. */
export const THROW_AT = 0.28;

/**
 * The ballots for a round. The first is always the player's, so the first swipe teaches
 * the rule, and both piles always get at least one.
 */
export function ballotSequence(count = BALLOTS, random: () => number = Math.random): Pile[] {
  const seq: Pile[] = Array.from({ length: count }, (_, i) =>
    i === 0 ? "yours" : random() < 0.5 ? "yours" : "rival",
  );
  if (count > 1 && !seq.includes("rival")) seq[1 + Math.floor(random() * (count - 1))] = "rival";
  return seq;
}

/** Which pile a swipe throws to (yours on the left), or null if it should snap back. */
export function pileForSwipe(dx: number, cardWidth: number): Pile | null {
  if (cardWidth <= 0 || Math.abs(dx) < cardWidth * THROW_AT) return null;
  return dx < 0 ? "yours" : "rival";
}

export type Count = { yours: number; rival: number; mistakes: number };

export const EMPTY_COUNT: Count = { yours: 0, rival: 0, mistakes: 0 };

/** Sorting the ballot at `index` onto `pile`. Returns the new count and whether it was right. */
export function sortBallot(
  count: Count,
  ballots: readonly Pile[],
  index: number,
  pile: Pile,
): { count: Count; correct: boolean } {
  const correct = ballots[index] === pile;
  return {
    correct,
    count: correct
      ? { ...count, [pile]: count[pile] + 1 }
      : { ...count, mistakes: count.mistakes + 1 },
  };
}

export function sorted(count: Count): number {
  return count.yours + count.rival;
}

/** Won once every ballot is sorted; lost past the mistakes allowed or when time runs out. */
export function verdict(
  count: Count,
  total: number,
  allowed: number,
  timeUp: boolean,
): "won" | "lost" | "sorting" {
  if (count.mistakes > allowed) return "lost";
  if (sorted(count) >= total) return "won";
  return timeUp ? "lost" : "sorting";
}
