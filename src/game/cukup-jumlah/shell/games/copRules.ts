// Cop Watikah (COP!): stamp the party's letters of authority. As party leader, the YB sits
// at the desk while candidates' letters slide past on a belt; tap to bring the seal down
// on the stamp line. It must land in the letter's seal box. Letters with the name crossed
// out are candidates the party dropped: let them go by. A good letter that leaves
// unstamped is a candidate without the party's letter.
// Pure rules here; the screen is CopWatikah.tsx.
//
// x is in % of the stage width, the letter's centre; the belt runs left to right.

export const STAMP_X = 50;
/** Half the seal box's width; a seal this close to its centre counts. */
export const BOX_HALF = 6;
/** This close to dead centre is a clean seal. */
export const CLEAN = 2;
/** Half a letter's width: a seal further off than this misses the paper. */
export const LETTER_HALF = 12;
/** Gap between letters on the belt, where the first one starts, and where they leave. */
export const GAP = 34;
export const ENTRY = -14;
export const EXIT = 112;
/** Seconds the seal takes to lift again, so mashing doesn't work. */
export const RELOAD_S = 0.3;

export const LETTERS = 7;
export const CROSSED = 2;
export const NEEDED = LETTERS - CROSSED;

/** How far the belt has run after `t` seconds: it speeds up as the queue grows impatient. */
export function beltAt(t: number): number {
  return 28 * t + 1.5 * t * t;
}

export function letterX(i: number, t: number): number {
  return ENTRY + beltAt(t) - i * GAP;
}

/** Which letters have a crossed-out name: never the first, never two in a row. */
export function dealLetters(rand: () => number = Math.random): boolean[] {
  for (;;) {
    const crossed = Array.from({ length: LETTERS }, () => false);
    let n = 0;
    while (n < CROSSED) {
      const i = 1 + Math.floor(rand() * (LETTERS - 1));
      if (!crossed[i]) {
        crossed[i] = true;
        n += 1;
      }
    }
    if (!crossed.some((c, i) => c && crossed[i + 1])) return crossed;
  }
}

/** Where a seal landed on a letter: off is the seal's offset from the box centre. */
export type Seal = { letter: number; off: number };

export type Desk = {
  seals: Seal[];
  /** Good letters that left without a seal, counted once each. */
  gone: number[];
  mistakes: number;
};

export const FRESH_DESK: Desk = { seals: [], gone: [], mistakes: 0 };

export type Stamp =
  | { kind: "clean" | "ok"; letter: number; off: number }
  | { kind: "crooked"; letter: number; off: number }
  | { kind: "crossed"; letter: number; off: number }
  | { kind: "again"; letter: number }
  | { kind: "empty" };

/** Bring the seal down at time `t`. */
export function stampAt(desk: Desk, crossed: boolean[], t: number): Stamp {
  for (let i = 0; i < crossed.length; i += 1) {
    const off = STAMP_X - letterX(i, t);
    if (Math.abs(off) > LETTER_HALF) continue;
    if (desk.seals.some((s) => s.letter === i)) return { kind: "again", letter: i };
    if (crossed[i]) return { kind: "crossed", letter: i, off };
    if (Math.abs(off) <= CLEAN) return { kind: "clean", letter: i, off };
    if (Math.abs(off) <= BOX_HALF) return { kind: "ok", letter: i, off };
    return { kind: "crooked", letter: i, off };
  }
  return { kind: "empty" };
}

export function applyStamp(desk: Desk, s: Stamp): Desk {
  if (s.kind === "empty" || s.kind === "again") return desk;
  const seals = [...desk.seals, { letter: s.letter, off: s.off }];
  const bad = s.kind === "crooked" || s.kind === "crossed";
  return { ...desk, seals, mistakes: desk.mistakes + (bad ? 1 : 0) };
}

/** Good letters that slid off the belt unstamped since the last look. */
export function newlyGone(desk: Desk, crossed: boolean[], t: number): number[] {
  return crossed.flatMap((c, i) =>
    !c && letterX(i, t) > EXIT && !desk.seals.some((s) => s.letter === i) && !desk.gone.includes(i)
      ? [i]
      : [],
  );
}

export function markGone(desk: Desk, letters: number[]): Desk {
  if (!letters.length) return desk;
  return { ...desk, gone: [...desk.gone, ...letters], mistakes: desk.mistakes + letters.length };
}

/** Good letters sealed inside the box. */
export function sealedCount(desk: Desk, crossed: boolean[]): number {
  return desk.seals.filter((s) => !crossed[s.letter] && Math.abs(s.off) <= BOX_HALF).length;
}

/** Won once every good letter has been dealt with (sealed, crooked or let slip) within the
 *  mistakes allowed. */
export function deskVerdict(
  desk: Desk,
  crossed: boolean[],
  allowed: number,
  timeUp: boolean,
): "won" | "lost" | "going" {
  if (desk.mistakes > allowed) return "lost";
  const open = crossed.some(
    (c, i) => !c && !desk.gone.includes(i) && !desk.seals.some((s) => s.letter === i),
  );
  if (!open) return "won";
  return timeUp ? "lost" : "going";
}
