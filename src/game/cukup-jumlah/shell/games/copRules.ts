// Cop Watikah (COP!): stamp the party's letters of authority. As party leader, the YB sits
// at the desk while candidates' letters slide past on a belt, unevenly spaced; tap to bring
// the seal down on the stamp line. It must land in the letter's seal box, which sits left,
// centre or right on each letter. Two kinds of letter must go by unsealed: a crossed-out
// name (a candidate the party dropped) and a rival party's letterhead. A good letter that
// leaves unstamped is a candidate without the party's letter.
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
/** Where the first letter starts, and where letters leave. */
export const ENTRY = -14;
export const EXIT = 112;
/** Seconds the seal takes to lift again, so mashing doesn't work. */
export const RELOAD_S = 0.3;

export const LETTERS = 9;
/** Letters to let go by: crossed-out names and rival letterheads. */
export const SKIPS = 3;
export const NEEDED = LETTERS - SKIPS;
/** Spacing between letters on the belt (a letter is 24 wide), and where its seal box sits:
 *  off centre, but clear of the letter's edges. */
const GAPS = [27, 31, 38, 44];
const BOX_AT = [-3.5, 0, 3.5];

export type Kind = "good" | "crossed" | "rival";
export type Letter = {
  kind: Kind;
  /** belt offset behind the first letter */ at: number;
  box: number;
};

/** How far the belt has run after `t` seconds: it speeds up as the queue grows impatient. */
export function beltAt(t: number): number {
  return 30 * t + 1.8 * t * t;
}

export function letterX(l: Letter, t: number): number {
  return ENTRY + beltAt(t) - l.at;
}

/** The queue of letters: the first is always good, no two skips in a row, at least one of
 *  each kind of skip. */
export function dealLetters(rand: () => number = Math.random): Letter[] {
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  for (;;) {
    const kinds: Kind[] = Array.from({ length: LETTERS }, () => "good");
    let n = 0;
    while (n < SKIPS) {
      const i = 1 + Math.floor(rand() * (LETTERS - 1));
      if (kinds[i] === "good") {
        kinds[i] = n === 0 ? "crossed" : n === 1 ? "rival" : pick(["crossed", "rival"] as const);
        n += 1;
      }
    }
    if (kinds.some((k, i) => k !== "good" && kinds[i + 1] && kinds[i + 1] !== "good")) continue;
    let at = 0;
    return kinds.map((kind, i) => {
      if (i > 0) at += pick(GAPS);
      return { kind, at, box: pick(BOX_AT) };
    });
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
  | { kind: "crossed" | "rival"; letter: number; off: number }
  | { kind: "again"; letter: number }
  | { kind: "empty" };

/** Bring the seal down at time `t`. */
export function stampAt(desk: Desk, letters: Letter[], t: number): Stamp {
  for (let i = 0; i < letters.length; i += 1) {
    const l = letters[i]!;
    if (Math.abs(STAMP_X - letterX(l, t)) > LETTER_HALF) continue;
    if (desk.seals.some((s) => s.letter === i)) return { kind: "again", letter: i };
    const off = STAMP_X - letterX(l, t) - l.box;
    if (l.kind !== "good") return { kind: l.kind, letter: i, off };
    if (Math.abs(off) <= CLEAN) return { kind: "clean", letter: i, off };
    if (Math.abs(off) <= BOX_HALF) return { kind: "ok", letter: i, off };
    return { kind: "crooked", letter: i, off };
  }
  return { kind: "empty" };
}

export function applyStamp(desk: Desk, s: Stamp): Desk {
  if (s.kind === "empty" || s.kind === "again") return desk;
  const seals = [...desk.seals, { letter: s.letter, off: s.off }];
  const bad = s.kind === "crooked" || s.kind === "crossed" || s.kind === "rival";
  return { ...desk, seals, mistakes: desk.mistakes + (bad ? 1 : 0) };
}

/** Good letters that slid off the belt unstamped since the last look. */
export function newlyGone(desk: Desk, letters: Letter[], t: number): number[] {
  return letters.flatMap((l, i) =>
    l.kind === "good" &&
    letterX(l, t) > EXIT &&
    !desk.seals.some((s) => s.letter === i) &&
    !desk.gone.includes(i)
      ? [i]
      : [],
  );
}

export function markGone(desk: Desk, letters: number[]): Desk {
  if (!letters.length) return desk;
  return { ...desk, gone: [...desk.gone, ...letters], mistakes: desk.mistakes + letters.length };
}

/** Good letters sealed inside the box. */
export function sealedCount(desk: Desk, letters: Letter[]): number {
  return desk.seals.filter((s) => letters[s.letter]?.kind === "good" && Math.abs(s.off) <= BOX_HALF)
    .length;
}

/** Won once every good letter has been dealt with (sealed, crooked or let slip) within the
 *  mistakes allowed. */
export function deskVerdict(
  desk: Desk,
  letters: Letter[],
  allowed: number,
  timeUp: boolean,
): "won" | "lost" | "going" {
  if (desk.mistakes > allowed) return "lost";
  const open = letters.some(
    (l, i) =>
      l.kind === "good" && !desk.gone.includes(i) && !desk.seals.some((s) => s.letter === i),
  );
  if (!open) return "won";
  return timeUp ? "lost" : "going";
}
