// Joget Trend (JOGET!): copy the viral dance. A trend-setter on a phone shows a short dance,
// one pose a beat; then it's the YB's turn to strike the same poses in the same order (swipe
// anywhere, or the arrow keys). A wrong pose is a mistake and the dance is shown again.
// Copy every dance before the trend dies (the fuse).
// Pure rules here; the screen is JogetTrend.tsx.

export type Move = "up" | "left" | "right" | "down";
export const MOVES: readonly Move[] = ["up", "left", "right", "down"];

/** How many poses each dance has. */
export const DANCE_LENGTHS = [3, 3, 4];
/** Beats of rest before a dance is shown (the first gets one, so play opens on it). */
export const REST_BEATS = 1;

/** Dances with no pose straight after itself, so each step reads as a change. */
export function makeDances(rand: () => number = Math.random): Move[][] {
  return DANCE_LENGTHS.map((n) => {
    const dance: Move[] = [];
    while (dance.length < n) {
      const m = MOVES[Math.floor(rand() * MOVES.length)]!;
      if (m !== dance.at(-1)) dance.push(m);
    }
    return dance;
  });
}

export type Stage =
  /** The trend-setter shows dance `dance`, starting at `from` (seconds of play). */
  | { kind: "show"; dance: number; from: number }
  /** The YB copies it; `step` poses done so far. */
  | { kind: "copy"; dance: number; step: number }
  | { kind: "done" };

export type Floor = { stage: Stage; mistakes: number };

export const FRESH_FLOOR: Floor = { stage: { kind: "show", dance: 0, from: 0 }, mistakes: 0 };

/** The pose the trend-setter is striking at `t`, or null while resting. */
export function shownMove(dances: Move[][], f: Floor, t: number, spb: number): Move | null {
  if (f.stage.kind !== "show") return null;
  const beat = Math.floor((t - f.stage.from) / spb) - REST_BEATS;
  return beat >= 0 ? (dances[f.stage.dance]![beat] ?? null) : null;
}

/** The poses of the dance being shown so far, for the phone's caption. */
export function shownSoFar(dances: Move[][], f: Floor, t: number, spb: number): Move[] {
  if (f.stage.kind !== "show") return [];
  const beat = Math.floor((t - f.stage.from) / spb) - REST_BEATS;
  return beat >= 0 ? dances[f.stage.dance]!.slice(0, beat + 1) : [];
}

/** Once the last pose has been shown for a beat, the floor is the YB's. */
export function advanceShow(dances: Move[][], f: Floor, t: number, spb: number): Floor {
  if (f.stage.kind !== "show") return f;
  const beats = (t - f.stage.from) / spb;
  if (beats < REST_BEATS + dances[f.stage.dance]!.length) return f;
  return { ...f, stage: { kind: "copy", dance: f.stage.dance, step: 0 } };
}

export type Step = { floor: Floor; result: "right" | "wrong" | "danced" | "ignored" };

/** The YB strikes `move` at `t`. */
export function strike(dances: Move[][], f: Floor, move: Move, t: number): Step {
  if (f.stage.kind !== "copy") return { floor: f, result: "ignored" };
  const { dance, step } = f.stage;
  const want = dances[dance]![step];
  if (move !== want) {
    return {
      floor: { mistakes: f.mistakes + 1, stage: { kind: "show", dance, from: t } },
      result: "wrong",
    };
  }
  if (step + 1 < dances[dance]!.length) {
    return { floor: { ...f, stage: { kind: "copy", dance, step: step + 1 } }, result: "right" };
  }
  const next: Stage =
    dance + 1 < dances.length ? { kind: "show", dance: dance + 1, from: t } : { kind: "done" };
  return { floor: { ...f, stage: next }, result: "danced" };
}

export function floorVerdict(f: Floor, allowed: number, timeUp: boolean): "won" | "lost" | "going" {
  if (f.stage.kind === "done") return "won";
  if (f.mistakes > allowed) return "lost";
  return timeUp ? "lost" : "going";
}
