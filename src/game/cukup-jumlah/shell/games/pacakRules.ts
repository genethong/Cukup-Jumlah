// Pacak Bendera (PACAK!): the last night of the campaign. Hammer flags into the kampung
// before the clock reaches 11:59pm, when campaigning has to stop. Each flag takes a few
// hammer taps. Never plant inside the ring around the polling centre: campaign material
// within 50 m of a polling centre is an offence. The clock runs faster near the end.
// Pure rules here; the screen is PacakBendera.tsx.
//
// Spots are in % of the stage: x of its width, y of its height.

export const FLAGS_NEEDED = 7;
export const HITS_PER_FLAG = 3;
/** The polling centre and its no-campaign ring (radius in % of width). */
export const CENTRE = { x: 66, y: 66 };
export const RING = 15;
/** Flags must stand at least this far apart (% of width). */
export const MIN_GAP = 8;
/** The stage is 9:16, so a % of height is this many % of width. */
const ASPECT = 16 / 9;
/** The clock face: from 11:50pm to midnight. */
export const CLOCK_FROM_MIN = 50;

/** Ring taps forgiven before the round is lost; Mesra Rakyat gets one more. */
export function offencesAllowed(forgiving: boolean): number {
  return forgiving ? 1 : 0;
}

/** When midnight strikes, in seconds of play: late in the round, but not always as late. */
export function midnightAt(limitS: number, random: () => number = Math.random): number {
  return limitS * (0.78 + random() * 0.12);
}

/**
 * Minutes past 11pm shown on the clock at `playS`: it creeps at first, then races, so the
 * last minutes come sooner than they seem.
 */
export function clockMinutes(playS: number, midnightS: number): number {
  const f = Math.min(1.2, Math.max(0, playS / midnightS));
  const eased = f <= 1 ? Math.pow(f, 1.7) : f;
  return CLOCK_FROM_MIN + (60 - CLOCK_FROM_MIN) * eased;
}

/** Distance in % of width, with y converted from % of height. */
export function gap(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, (a.y - b.y) * ASPECT);
}

export function inRing(spot: { x: number; y: number }): boolean {
  return gap(spot, CENTRE) <= RING;
}

export type Flag = { x: number; y: number; hits: number };
export type Night = { flags: Flag[]; offences: number; late: boolean };

export const FRESH_NIGHT: Night = { flags: [], offences: 0, late: false };

export function planted(n: Night): number {
  return n.flags.filter((f) => f.hits >= HITS_PER_FLAG).length;
}

export type Hammer = "hit" | "planted" | "ring" | "taken" | "late";

/**
 * A hammer tap at `spot`. After midnight it's campaigning on polling day. Inside the ring
 * it's an offence. On an unfinished flag nearby it hammers that flag; near a finished one
 * there's no room; anywhere else it starts a new flag.
 */
export function hammer(
  n: Night,
  spot: { x: number; y: number },
  afterMidnight: boolean,
): { night: Night; result: Hammer } {
  if (afterMidnight) return { night: { ...n, late: true }, result: "late" };
  if (inRing(spot)) return { night: { ...n, offences: n.offences + 1 }, result: "ring" };
  const near = n.flags.findIndex((f) => gap(f, spot) < MIN_GAP);
  if (near >= 0) {
    const f = n.flags[near]!;
    if (f.hits >= HITS_PER_FLAG) return { night: n, result: "taken" };
    const hits = f.hits + 1;
    const flags = n.flags.map((g, i) => (i === near ? { ...g, hits } : g));
    return { night: { ...n, flags }, result: hits >= HITS_PER_FLAG ? "planted" : "hit" };
  }
  const flags = [...n.flags, { x: spot.x, y: spot.y, hits: 1 }];
  return { night: { ...n, flags }, result: HITS_PER_FLAG <= 1 ? "planted" : "hit" };
}

export function nightVerdict(
  n: Night,
  needed: number,
  allowed: number,
  afterMidnight: boolean,
): "won" | "lost" | "going" {
  if (n.late || n.offences > allowed) return "lost";
  if (planted(n) >= needed) return "won";
  return afterMidnight ? "lost" : "going";
}
