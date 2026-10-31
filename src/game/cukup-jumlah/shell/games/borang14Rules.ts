// Borang 14 (ASINGKAN!): the player is a counting agent at one polling stream. A stack of
// ballots sits in the middle; swipe each onto the right pile, the player's own or the
// rival's, before the fuse burns down. A wrong pile bounces the ballot back and burns time
// off the fuse. Pure rules here; the screen is Borang14.tsx.

export type Pile = "yours" | "rival";

export const BALLOTS = 10;

/** Seconds a wrong pile burns off the fuse. */
export const PENALTY_S = 1;

/** Correct throws in a row that count as a combo. */
export const COMBO_AT = 3;

/** Swipe distance, as a share of the card's width, that counts as a throw. */
export const THROW_AT = 0.25;

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

export type Count = { yours: number; rival: number; mistakes: number; streak: number };

export const EMPTY_COUNT: Count = { yours: 0, rival: 0, mistakes: 0, streak: 0 };

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
      ? { ...count, [pile]: count[pile] + 1, streak: count.streak + 1 }
      : { ...count, mistakes: count.mistakes + 1, streak: 0 },
  };
}

export function sorted(count: Count): number {
  return count.yours + count.rival;
}

/** Seconds burnt off the fuse so far. `freeMistakes` (Mesra Rakyat) cost nothing. */
export function penaltySeconds(mistakes: number, freeMistakes = 0): number {
  return Math.max(0, mistakes - freeMistakes) * PENALTY_S;
}

/** Won once every ballot is sorted; lost if the fuse burns out first. */
export function verdict(count: Count, total: number, timeUp: boolean): "won" | "lost" | "sorting" {
  if (sorted(count) >= total) return "won";
  return timeUp ? "lost" : "sorting";
}
