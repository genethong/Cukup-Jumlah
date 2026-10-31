import { BEATS_PER_BAR, HIT_BEAT_IN_BAR } from "../../beat/timing";

// Borang 14: the player is a counting agent at one polling stream. Each bar the presiding
// officer holds up a ballot. A vote for the player: tap on beat 4 to tally it. A vote for
// the rival: leave it. Pure rules here; the screen is Borang14.tsx.

export type Ballot = "yours" | "rival";

/** Mistakes allowed before the count is lost. */
export const MISTAKES_ALLOWED = 1;

/**
 * The ballots for a round. The first is always the player's, so the first tap teaches the
 * rule, and there is always at least one rival ballot to leave alone.
 */
export function ballotSequence(bars: number, random: () => number = Math.random): Ballot[] {
  const seq: Ballot[] = Array.from({ length: bars }, (_, i) =>
    i === 0 ? "yours" : random() < 0.5 ? "yours" : "rival",
  );
  if (bars > 1 && !seq.includes("rival")) seq[1 + Math.floor(random() * (bars - 1))] = "rival";
  return seq;
}

/** Beat index (0-based, counted from the lead-in) where ballot `b` is shown. */
export function ballotShownAt(b: number): number {
  return (b + 1) * BEATS_PER_BAR;
}

/** Beat index of the tap target for ballot `b`. */
export function ballotTarget(b: number): number {
  return ballotShownAt(b) + HIT_BEAT_IN_BAR;
}

/** Which ballot a beat position belongs to, or -1 during the lead-in or after the last one. */
export function ballotAt(beatPos: number, bars: number): number {
  const b = Math.floor(beatPos / BEATS_PER_BAR) - 1;
  return b >= 0 && b < bars ? b : -1;
}

export type Tally = { yours: number; rival: number; mistakes: number; judged: number };

export const EMPTY_TALLY: Tally = { yours: 0, rival: 0, mistakes: 0, judged: 0 };

/** Won, lost, or still counting. */
export function verdict(tally: Tally, bars: number): "won" | "lost" | "counting" {
  if (tally.mistakes > MISTAKES_ALLOWED) return "lost";
  return tally.judged >= bars ? "won" : "counting";
}
