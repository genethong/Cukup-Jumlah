// Rebut Kamera (SENYUM!): the nomination-day group photo. Party colleagues stand in a line
// that keeps shuffling and swaying; the YB walks along it and must be standing in a gap when
// the shutter fires. Overlapping someone is an elbow shot. From the second photo a latecomer
// waits behind one of the gaps and steps into it just before the click.
// Pure rules here; the screen is RebutKamera.tsx.
//
// x is in % of the stage width, each figure's centre; t is seconds of play.

export const PHOTOS = 3;
export const MEMBERS = 4;
export const FIGURE_W = 12;
/** The line runs between these edges. */
export const LINE_LEFT = 4;
export const LINE_RIGHT = 96;
/** Each photo: the shuffle into a new line, the 3-2-1, the click, then a beat to look. */
export const PHOTO_S = 2.9;
export const SHUFFLE_S = 0.5;
export const SHUTTER_S = 2.4;
/** The latecomer steps in this long before the click. */
export const LATE_S = 0.6;
/** Overlap (in %) that still passes as standing close. */
export const TOUCH = 1.5;
/** How fast the YB walks, in % of the width per second. */
export const WALK = 85;

/** Gaps get tighter and the line sways more with each photo. */
const GAP_W = [21, 19, 17.5];
const SWAY = [3, 5, 7];

export type Photo = {
  /** Where each member stands once the line has shuffled. */
  slots: number[];
  /** The middle of each gap, before any sway. */
  gaps: number[];
  /** The gap the latecomer will fill, if any. */
  late: number | null;
};

export function shutterAt(i: number): number {
  return i * PHOTO_S + SHUTTER_S;
}

/** Which photo is being set up at `t`. */
export function photoAt(t: number): number {
  return Math.min(PHOTOS - 1, Math.max(0, Math.floor(t / PHOTO_S)));
}

/** Lay out one line: the members and the gaps in a shuffled order, evenly spaced. */
function layLine(i: number, rand: () => number): Photo {
  const gaps = i === 0 ? 1 : 2;
  for (;;) {
    const items: ("m" | "g")[] = [...Array(MEMBERS).fill("m"), ...Array(gaps).fill("g")];
    for (let k = items.length - 1; k > 0; k -= 1) {
      const j = Math.floor(rand() * (k + 1));
      [items[k], items[j]] = [items[j]!, items[k]!];
    }
    // Two gaps side by side would make one big gap.
    if (items.some((it, k) => it === "g" && items[k + 1] === "g")) continue;
    const gapW = GAP_W[i]!;
    const used = MEMBERS * FIGURE_W + gaps * gapW;
    const space = (LINE_RIGHT - LINE_LEFT - used) / (items.length + 1);
    const slots: number[] = [];
    const gapAt: number[] = [];
    let x = LINE_LEFT + space;
    for (const it of items) {
      const w = it === "m" ? FIGURE_W : gapW;
      (it === "m" ? slots : gapAt).push(x + w / 2);
      x += w + space;
    }
    const late = gaps > 1 ? gapAt[Math.floor(rand() * gapAt.length)]! : null;
    return { slots, gaps: gapAt, late };
  }
}

export function planPhotos(rand: () => number = Math.random): Photo[] {
  return Array.from({ length: PHOTOS }, (_, i) => layLine(i, rand));
}

/** The whole line drifts side to side as people jostle. */
export function swayAt(t: number): number {
  const i = photoAt(t);
  return SWAY[i]! * Math.sin((t - i * PHOTO_S) * 2.6 + i * 1.7);
}

function ease(p: number): number {
  const c = Math.min(1, Math.max(0, p));
  return c * c * (3 - 2 * c);
}

/** Where member `k` stands at `t`: sliding from the last line into the new one, swaying. */
export function memberX(plan: Photo[], k: number, t: number): number {
  const i = photoAt(t);
  const to = plan[i]!.slots[k]!;
  const from = i === 0 ? to : plan[i - 1]!.slots[k]!;
  const p = ease((t - i * PHOTO_S) / SHUFFLE_S);
  return from + (to - from) * p + swayAt(t);
}

/** The latecomer: waiting behind their gap, then in the line just before the click. */
export function lateAt(plan: Photo[], t: number): { x: number; stepped: boolean } | null {
  const i = photoAt(t);
  const gap = plan[i]!.late;
  if (gap === null) return null;
  return { x: gap + swayAt(t), stepped: t >= shutterAt(i) - LATE_S };
}

/** The figures in the line at `t` (members, plus the latecomer once stepped in). */
export function lineAt(plan: Photo[], t: number): number[] {
  const xs = plan[0]!.slots.map((_, k) => memberX(plan, k, t));
  const late = lateAt(plan, t);
  if (late?.stepped) xs.push(late.x);
  return xs;
}

/** The YB walks toward `target`, no faster than WALK. */
export function walk(x: number, target: number, dt: number): number {
  const step = WALK * dt;
  const lo = LINE_LEFT + FIGURE_W / 2;
  const hi = LINE_RIGHT - FIGURE_W / 2;
  const goal = Math.min(hi, Math.max(lo, target));
  if (Math.abs(goal - x) <= step) return goal;
  return x + Math.sign(goal - x) * step;
}

/** The click: is the YB in a gap, or elbowing someone? */
export function judgeShot(plan: Photo[], i: number, ybX: number): "good" | "elbow" {
  const t = shutterAt(i);
  const clash = lineAt(plan, t).some((m) => FIGURE_W - Math.abs(m - ybX) > TOUCH);
  return clash ? "elbow" : "good";
}

export function shotsVerdict(
  shots: ("good" | "elbow")[],
  allowed: number,
): "won" | "lost" | "going" {
  if (shots.filter((s) => s === "elbow").length > allowed) return "lost";
  return shots.length >= PHOTOS ? "won" : "going";
}
