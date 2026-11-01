// Baling Risalah (EDAR!): villagers stroll past the stall. Flick campaign leaflets to them;
// the tray also deals gifts (an envelope of cash, a sack of rice), which must go in the bin.
// Giving money or gifts to influence a vote is bribery, and food or drink is treating
// (Election Offences Act 1954), so flicking a gift ends the round.
// Pure rules here; the screen is BalingRisalah.tsx.
//
// Positions are in % of the stage: x of its width, y of its height.

export type Item = "leaflet" | "cash" | "rice";

export const LEAFLETS_NEEDED = 5;
/** Share of the tray that is gifts. */
export const GIFT_SHARE = 0.3;
/** Where the tray is, and the lane the villagers walk along. */
export const TRAY = { x: 64, y: 76 };
export const LANE_Y = 50;
/** The stage is 9:16, so a % of height is this many % of width. */
const ASPECT = 16 / 9;
/** Seconds a flicked leaflet takes to reach the lane. */
export const FLIGHT_S = 0.24;
/** How close (in % of width) a villager must be to catch a leaflet. */
export const CATCH = 8;

export function leafletsNeeded(forgiving: boolean): number {
  return forgiving ? LEAFLETS_NEEDED - 1 : LEAFLETS_NEEDED;
}

export function isGift(item: Item): boolean {
  return item !== "leaflet";
}

/** The tray's next items: the first is always a leaflet, and never three gifts in a row. */
export function dealItems(count: number, random: () => number = Math.random): Item[] {
  const out: Item[] = [];
  for (let i = 0; i < count; i++) {
    const giftsInARow = out.length >= 2 && isGift(out.at(-1)!) && isGift(out.at(-2)!);
    const gift = i > 0 && !giftsInARow && random() < GIFT_SHARE;
    out.push(gift ? (random() < 0.5 ? "cash" : "rice") : "leaflet");
  }
  return out;
}

export type Villager = {
  id: number;
  /** x when spawned, and the second it was spawned. */
  x0: number;
  t0: number;
  /** % of width per second; negative walks left. */
  speed: number;
  /** Got a leaflet already: walks on smiling, can't take another. */
  served: boolean;
};

export function villagerX(v: Villager, t: number): number {
  return v.x0 + v.speed * (t - v.t0);
}

/** A villager steps in from one side every so often, at a stroll. */
export function spawnVillager(id: number, t: number, random: () => number = Math.random): Villager {
  const fromLeft = random() < 0.5;
  const speed = 10 + random() * 8;
  return { id, x0: fromLeft ? -6 : 106, t0: t, speed: fromLeft ? speed : -speed, served: false };
}

export function onStage(v: Villager, t: number): boolean {
  const x = villagerX(v, t);
  return x > -8 && x < 108;
}

/**
 * Where a flick lands on the lane: the swipe's direction from the tray, carried up to the
 * lane. `dx`, `dy` are the swipe in % of width and % of height (dy < 0 is up).
 */
export function flickTarget(dx: number, dy: number): number {
  const rise = TRAY.y - LANE_Y;
  const x = TRAY.x + (dx / Math.max(1, -dy)) * rise * ASPECT;
  return Math.min(98, Math.max(2, x));
}

/** The unserved villager closest to where the leaflet lands, if near enough to catch it. */
export function catcher(villagers: Villager[], x: number, t: number): Villager | null {
  let best: Villager | null = null;
  let gap = CATCH;
  for (const v of villagers) {
    if (v.served) continue;
    const d = Math.abs(villagerX(v, t) - x);
    if (d <= gap) {
      gap = d;
      best = v;
    }
  }
  return best;
}

export type Stall = { delivered: number; bribed: boolean };

export function stallVerdict(s: Stall, needed: number, timeUp: boolean): "won" | "lost" | "going" {
  if (s.bribed) return "lost";
  if (s.delivered >= needed) return "won";
  return timeUp ? "lost" : "going";
}
