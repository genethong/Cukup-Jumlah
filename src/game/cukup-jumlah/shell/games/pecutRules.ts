// Pecut SPR (PECUT!): nomination morning. Nomination papers are only accepted from 9 to 10am,
// and the centre is packed with supporters. Dash up three lanes to the counter, switching
// lanes to dodge crowds, banners and a kompang troupe, and reporters who step into your path
// for a quote. You speed up as you go. Bumping into anything costs time.
// Pure rules here; the screen is PecutSPR.tsx.

export const LANES = 3;
/** Distance to the counter in metres. */
export const DISTANCE = 150;
/** Running speed in metres per second: a jog at the start, a sprint near the counter. */
export const SPEED_START = 13;
export const SPEED_END = 22;
/** Seconds lost stumbling after a bump. */
export const STUMBLE_S = 0.8;
/** How close (in metres) an obstacle in your lane must be to bump into you. */
export const HIT_RANGE = 2.2;
/** A reporter steps sideways into the next lane when you're this many metres away. */
export const STEP_IN_M = 16;

export type Kind = "crowd" | "banner" | "kompang" | "reporter";
/** An obstacle; a reporter moves from `lane` to `toLane` as you come near. */
export type Obstacle = { at: number; lane: number; kind: Kind; toLane?: number };

export function speedAt(distance: number): number {
  return SPEED_START + (SPEED_END - SPEED_START) * Math.min(1, distance / DISTANCE);
}

/** The lane an obstacle is in when you're at `distance`. */
export function laneAt(o: Obstacle, distance: number): number {
  return o.toLane !== undefined && o.at - distance <= STEP_IN_M ? o.toLane : o.lane;
}

/** Whether a reporter is about to step across: shown as a warning before they move. */
export function aboutToStep(o: Obstacle, distance: number): boolean {
  return o.toLane !== undefined && o.at - distance > STEP_IN_M && o.at - distance <= STEP_IN_M + 10;
}

/**
 * Obstacles along the way: a row every 7–11 m, starting a little way in so the first steps
 * are clear. Half the rows hold two. A lone obstacle may be a reporter who steps into the
 * next lane. No row ever blocks all three lanes, before or after anyone steps.
 */
export function layCourse(random: () => number = Math.random): Obstacle[] {
  const out: Obstacle[] = [];
  const kinds: Kind[] = ["crowd", "banner", "kompang"];
  const pick = () => kinds[Math.floor(random() * kinds.length)]!;
  for (let at = 14; at < DISTANCE - 6; at += 7 + random() * 4) {
    const lane = Math.floor(random() * LANES);
    if (random() < 0.5) {
      const other = (lane + 1 + Math.floor(random() * (LANES - 1))) % LANES;
      out.push({ at, lane, kind: pick() }, { at, lane: other, kind: pick() });
    } else if (random() < 0.45) {
      const toLane = lane === 0 ? 1 : lane === LANES - 1 ? LANES - 2 : random() < 0.5 ? 0 : 2;
      out.push({ at, lane, kind: "reporter", toLane });
    } else {
      out.push({ at, lane, kind: pick() });
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
  const distance = Math.min(DISTANCE, r.distance + speedAt(r.distance) * dt);
  const i = course.findIndex(
    (o, k) =>
      !r.hit.includes(k) &&
      laneAt(o, distance) === r.lane &&
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

/** Seconds a run with no bumps takes. */
export function cleanRunS(): number {
  let d = 0;
  let t = 0;
  while (d < DISTANCE) {
    d += speedAt(d) * 0.01;
    t += 0.01;
  }
  return t;
}
