// Susun Manifesto (JANJI!): stack the manifesto. Each promise slides back and forth above the
// tower; tap to drop it. Whatever hangs over the promise below breaks off and falls on the
// pile of broken promises, so the tower narrows. Drop it dead on and nothing breaks. Miss
// the tower entirely and the promise crashes.
// Pure rules here; the screen is SusunManifesto.tsx.
//
// x and widths are in % of the stage width.

export const PROMISES_NEEDED = 8;
/** The manifesto's base, and the first promise's width. */
export const BASE = { x: 22, w: 56 };
/** Where a sliding promise may go, and how close to dead on counts as perfect. */
export const LEFT = 3;
export const RIGHT = 97;
export const PERFECT = 1.6;

export type Block = { x: number; w: number };

/** Promises dropped wide of the tower forgiven; Mesra Rakyat gets one more. */
export function missesAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

/** Slide speed in % of width per second: each promise up the tower comes faster. */
export function slideSpeed(level: number): number {
  return 48 + level * 9;
}

/** Where a sliding promise of width `w` is, `t` seconds after it appeared: back and forth. */
export function slideX(t: number, level: number, w: number): number {
  const span = Math.max(1, RIGHT - LEFT - w);
  const d = (t * slideSpeed(level)) % (2 * span);
  return LEFT + (d <= span ? d : 2 * span - d);
}

export type Drop =
  | { kind: "perfect"; block: Block }
  | { kind: "chopped"; block: Block; broken: Block }
  | { kind: "missed" };

/** Drop a promise at `x` with width `w` onto `top`. */
export function drop(top: Block, x: number, w: number): Drop {
  if (Math.abs(x - top.x) <= PERFECT && w <= top.w + 0.01) {
    return { kind: "perfect", block: { x: top.x, w } };
  }
  const left = Math.max(top.x, x);
  const right = Math.min(top.x + top.w, x + w);
  if (right - left <= 0.5) return { kind: "missed" };
  const block = { x: left, w: right - left };
  const broken = x < top.x ? { x, w: top.x - x } : { x: right, w: x + w - right };
  return { kind: "chopped", block, broken };
}

export type Tower = { blocks: Block[]; misses: number };

export const FRESH_TOWER: Tower = { blocks: [], misses: 0 };

export function topOf(t: Tower): Block {
  return t.blocks.at(-1) ?? BASE;
}

export function place(t: Tower, d: Drop): Tower {
  if (d.kind === "missed") return { ...t, misses: t.misses + 1 };
  return { ...t, blocks: [...t.blocks, d.block] };
}

export function towerVerdict(t: Tower, allowed: number, timeUp: boolean): "won" | "lost" | "going" {
  if (t.blocks.length >= PROMISES_NEEDED) return "won";
  if (t.misses > allowed) return "lost";
  return timeUp ? "lost" : "going";
}
