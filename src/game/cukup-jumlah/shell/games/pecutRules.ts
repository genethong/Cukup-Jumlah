// Pecut SPR (PECUT!): nomination morning. Nomination papers are only accepted from 9 to 10am,
// and the centre is packed with supporters. Dash up three lanes to the counter, switching
// lanes to dodge crowds, banners and a kompang troupe. Bumping into one costs time.
// Pure rules here; the screen is PecutSPR.tsx.

export const LANES = 3;
/** Distance to the counter, and running speed, in metres and metres per second. */
export const DISTANCE = 150;
export const SPEED = 15;
/** Seconds lost stumbling after a bump. */
export const STUMBLE_S = 0.7;
/** How close (in metres) an obstacle in your lane must be to bump into you. */
export const HIT_RANGE = 2.2;

export type Kind = "crowd" | "banner" | "kompang";
export type Obstacle = { at: number; lane: number; kind: Kind };

/**
 * Obstacles along the way: one every 9–14 m, never blocking all lanes at once, starting a
 * little way in so the first steps are clear. Some rows hold two.
 */
export function layCourse(random: () => number = Math.random): Obstacle[] {
  const out: Obstacle[] = [];
  const kinds: Kind[] = ["crowd", "banner", "kompang"];
  for (let at = 14; at < DISTANCE - 6; at += 9 + random() * 5) {
    const lane = Math.floor(random() * LANES);
    out.push({ at, lane, kind: kinds[Math.floor(random() * kinds.length)]! });
    if (random() < 0.35) {
      const other = (lane + 1 + Math.floor(random() * (LANES - 1))) % LANES;
      out.push({ at, lane: other, kind: kinds[Math.floor(random() * kinds.length)]! });
    }
  }
  return out;
}

export type Run = { distance: number; lane: number; stunned: number; bumps: number; hit: number[] };

export const FRESH_RUN: Run = { distance: 0, lane: 1, stunned: 0, bumps: 0, hit: [] };

export function switchLane(r: Run, dir: -1 | 1): Run {
  return { ...r, lane: Math.min(LANES - 1, Math.max(0, r.lane + dir)) };
}

/** One frame: run on unless stumbling, and bump into anything just ahead in your lane. */
export function stepRun(r: Run, course: Obstacle[], dt: number): { run: Run; bumped: boolean } {
  if (r.stunned > 0) return { run: { ...r, stunned: Math.max(0, r.stunned - dt) }, bumped: false };
  const distance = Math.min(DISTANCE, r.distance + SPEED * dt);
  const i = course.findIndex(
    (o, k) =>
      !r.hit.includes(k) &&
      o.lane === r.lane &&
      o.at - distance <= HIT_RANGE &&
      o.at - distance > -1,
  );
  if (i < 0) return { run: { ...r, distance }, bumped: false };
  return {
    bumped: true,
    run: { ...r, distance, stunned: STUMBLE_S, bumps: r.bumps + 1, hit: [...r.hit, i] },
  };
}

export function runVerdict(r: Run, timeUp: boolean): "won" | "lost" | "going" {
  if (r.distance >= DISTANCE) return "won";
  return timeUp ? "lost" : "going";
}
