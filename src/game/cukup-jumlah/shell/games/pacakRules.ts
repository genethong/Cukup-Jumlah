// Pacak Bendera (PACAK!): the last night of the campaign. Plant flags around the kampung and
// keep them standing until the clock reaches 11:59pm, when campaigning has to stop. The
// rival's people sneak up to pull your flags down: tap them away before they do. Never plant
// inside the ring around a polling centre: campaign material within 50 m of a polling
// centre is an offence. The clock runs faster near the end.
// Pure rules here; the screen is PacakBendera.tsx.
//
// Spots are in % of the stage: x of its width, y of its height.

/** Flags that must still be standing at midnight. */
export const FLAGS_NEEDED = 8;
/** The polling centres and their no-campaign rings (radius in % of width). */
export const CENTRES = [
  { x: 70, y: 64, r: 15 },
  { x: 24, y: 56, r: 12 },
] as const;
/** Flags must stand at least this far apart (% of width). */
export const MIN_GAP = 8;
/** The stage is 9:16, so a % of height is this many % of width. */
const ASPECT = 16 / 9;
/** The clock face: from 11:50pm to midnight. */
export const CLOCK_FROM_MIN = 50;
/** Seconds between the rival's people creeping in, and how long one takes to pull a flag. */
export const SNEAK_GAP_S = 1.1;
export const SNEAK_S = 0.9;

/** Ring taps forgiven before the round is lost; Mesra Rakyat gets one more. */
export function offencesAllowed(forgiving: boolean): number {
  return forgiving ? 1 : 0;
}

/** When midnight strikes, in seconds of play: late in the round, but not always as late. */
export function midnightAt(limitS: number, random: () => number = Math.random): number {
  return limitS * (0.84 + random() * 0.1);
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
  return CENTRES.some((c) => gap(spot, c) <= c.r);
}

export type Flag = { id: number; x: number; y: number };
/** One of the rival's people creeping up to `flagId`; it comes down at `pullAt`. */
export type Sneak = { id: number; flagId: number; pullAt: number };
export type Night = { flags: Flag[]; sneaks: Sneak[]; offences: number; nextId: number };

export const FRESH_NIGHT: Night = { flags: [], sneaks: [], offences: 0, nextId: 1 };

export type Tap = "planted" | "chased" | "ring" | "taken";

/**
 * A tap at `spot`. Near a flag someone is creeping up on, it chases them off. Inside a ring
 * it's an offence. Near another flag there's no room. Anywhere else it plants a flag.
 */
export function tap(n: Night, spot: { x: number; y: number }): { night: Night; result: Tap } {
  const sneak = n.sneaks.find((s) => {
    const f = n.flags.find((g) => g.id === s.flagId);
    return f && gap(f, spot) < MIN_GAP * 1.2;
  });
  if (sneak) {
    return { night: { ...n, sneaks: n.sneaks.filter((s) => s !== sneak) }, result: "chased" };
  }
  if (inRing(spot)) return { night: { ...n, offences: n.offences + 1 }, result: "ring" };
  if (n.flags.some((f) => gap(f, spot) < MIN_GAP)) return { night: n, result: "taken" };
  const flag = { id: n.nextId, x: spot.x, y: spot.y };
  return { night: { ...n, flags: [...n.flags, flag], nextId: n.nextId + 1 }, result: "planted" };
}

/** Someone creeps up on a flag nobody is after yet, if there is one. */
export function sneakIn(n: Night, t: number, random: () => number = Math.random): Night {
  const free = n.flags.filter((f) => !n.sneaks.some((s) => s.flagId === f.id));
  if (free.length === 0) return n;
  const f = free[Math.floor(random() * free.length)]!;
  const sneak = { id: n.nextId, flagId: f.id, pullAt: t + SNEAK_S };
  return { ...n, sneaks: [...n.sneaks, sneak], nextId: n.nextId + 1 };
}

/** Flags whose sneak got there in time come down. Returns how many fell. */
export function pullDown(n: Night, t: number): { night: Night; fell: number } {
  const due = n.sneaks.filter((s) => t >= s.pullAt);
  if (due.length === 0) return { night: n, fell: 0 };
  const gone = new Set(due.map((s) => s.flagId));
  return {
    fell: gone.size,
    night: {
      ...n,
      flags: n.flags.filter((f) => !gone.has(f.id)),
      sneaks: n.sneaks.filter((s) => !gone.has(s.flagId)),
    },
  };
}

/** Lost on too many ring offences; at midnight, won with enough flags still standing. */
export function nightVerdict(
  n: Night,
  needed: number,
  allowed: number,
  midnight: boolean,
): "won" | "lost" | "going" {
  if (n.offences > allowed) return "lost";
  if (!midnight) return "going";
  return n.flags.length >= needed ? "won" : "lost";
}
