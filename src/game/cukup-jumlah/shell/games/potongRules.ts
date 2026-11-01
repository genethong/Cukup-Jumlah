// Potong Reben (GUNTING!): opening ceremonies, one after another. The ribbon sags and
// flutters between two posts; swipe across it in one stroke at the moment it pulls taut,
// through the bow in the middle. A slack ribbon just bends; missing the bow is a messy cut.
// Pure rules here; the screen is PotongReben.tsx.
//
// Positions are in % of the stage: x of its width, y of its height.

export const RIBBONS_NEEDED = 3;
/** The ribbon's line between the posts. */
export const RIBBON = { left: 8, right: 92, y: 66 };
/** How far the ribbon sags at its slackest, and the sag below which it counts as taut. */
export const MAX_SAG = 9;
export const TAUT = 2.2;
/** How close to the bow (in % of width) the cut must be. */
export const BOW_REACH = 9;

export function mistakesAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

/**
 * The ribbon's sag at time `t` for ceremony `n`: it pulls taut and goes slack in waves that
 * come quicker each ceremony, with a flutter on top.
 */
export function sag(t: number, n: number, phase = 0): number {
  const w = 2.6 + n * 0.9;
  const wave = (1 + Math.sin(t * w + phase)) / 2;
  const flutter = (Math.sin(t * 11 + phase * 3) + 1) * 0.35;
  return Math.min(MAX_SAG, wave * MAX_SAG + flutter * wave);
}

/** Where the bow sits along the ribbon: it drifts as the aides shuffle. */
export function bowX(t: number, n: number, phase = 0): number {
  return 50 + Math.sin(t * (0.9 + n * 0.4) + phase) * (6 + n * 4);
}

/** The ribbon's y at `x`, sagging most in the middle. */
export function ribbonY(x: number, s: number): number {
  const f = (x - RIBBON.left) / (RIBBON.right - RIBBON.left);
  return RIBBON.y + s * Math.sin(Math.PI * Math.min(1, Math.max(0, f)));
}

export type Cut = "clean" | "slack" | "off";

/** A swipe crosses the ribbon at `x`: clean if taut and near the bow. */
export function judgeCut(x: number, s: number, bow: number): Cut {
  if (s > TAUT) return "slack";
  if (Math.abs(x - bow) > BOW_REACH) return "off";
  return "clean";
}

/**
 * Where a stroke from `a` to `b` crosses the ribbon, if it does: the x where the stroke's
 * line meets the ribbon's (near-flat) line.
 */
export function crossing(
  a: { x: number; y: number },
  b: { x: number; y: number },
  s: number,
): number | null {
  const da = a.y - ribbonY(a.x, s);
  const db = b.y - ribbonY(b.x, s);
  // A point exactly on the ribbon counts as touching it; a stroke lying along it doesn't.
  if (da * db > 0 || da === db) return null;
  const x = a.x + ((b.x - a.x) * da) / (da - db);
  return x >= RIBBON.left && x <= RIBBON.right ? x : null;
}

export type Ceremony = { cut: number; mistakes: number };

export function ceremonyVerdict(
  c: Ceremony,
  allowed: number,
  timeUp: boolean,
): "won" | "lost" | "going" {
  if (c.cut >= RIBBONS_NEEDED) return "won";
  if (c.mistakes > allowed) return "lost";
  return timeUp ? "lost" : "going";
}
