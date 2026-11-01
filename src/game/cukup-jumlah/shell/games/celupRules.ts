// Celup Dakwat Kekal (CELUP!): the YB is voting. As in a general election, the second
// polling clerk asks the voter to dip the left index finger into the ink bottle before the
// ballot is issued. The YB wants a clean dip for the polling-day photo: steer the swaying
// finger into the narrow mouth, dip it to the nail and hold it there. Hit the rim and the
// bottle wobbles (twice and it tips over); go too deep and the papers laugh.
// Pure rules here; the screen is CelupDakwat.tsx.
//
// Positions are the fingertip's, in % of the stage: x of its width, y of its height.

/** The bottle's centre, and the y of its rim and of the ink surface. */
export const BOTTLE_X = 70;
export const RIM_Y = 70;
export const INK_Y = 74;
/** Half the width of the mouth, and of the fingertip, in % of the stage width. */
export const MOUTH_HALF = 6.5;
export const FINGER_HALF = 1.9;
/** Beyond this distance from the bottle, the finger just rests on the desk. */
export const BOTTLE_REACH = MOUTH_HALF + 7;
/** The tip deep enough to ink the whole nail, and no deeper than this. */
export const BAND_TOP = INK_Y + 3;
export const BAND_BOTTOM = INK_Y + 8;
/** Past this the finger is purple right down to the knuckle. */
export const TOO_DEEP_Y = INK_Y + 13;
/** Seconds held in the band for the ink to take. */
export const SOAK_S = 0.5;
/** Where the finger starts: up and to the side, so it has to be steered in. */
export const START = { x: 87, y: 64 };

export type Tip = { x: number; y: number };

/** Rim bumps forgiven before the bottle tips over; Mesra Rakyat gets one more. */
export function bumpsAllowed(forgiving: boolean): number {
  return forgiving ? 2 : 1;
}

/** The puppet's rod-held hand never keeps quite still: a slow drift and a little bob. */
export function sway(t: number): { dx: number; dy: number } {
  return {
    dx: Math.sin(t * 2.6) * 1.4 + Math.sin(t * 1.1 + 1) * 0.8,
    dy: Math.sin(t * 3.1) * 0.8,
  };
}

export function insideMouth(x: number): boolean {
  return Math.abs(x - BOTTLE_X) <= MOUTH_HALF - FINGER_HALF;
}

/** Away from the bottle the desk stops the finger; the player can't push through it. */
export function restOnDesk(tip: Tip): Tip {
  if (Math.abs(tip.x - BOTTLE_X) > BOTTLE_REACH && tip.y > RIM_Y) return { ...tip, y: RIM_Y };
  return tip;
}

export type DipOutcome = "dipping" | "won" | "deep" | "spilled";
export type Dip = { soak: number; bumps: number; stain: number; outcome: DipOutcome };

export const FRESH_DIP: Dip = { soak: 0, bumps: 0, stain: 0, outcome: "dipping" };

/**
 * One frame with the fingertip at `tip`. Below the rim but outside the mouth is a bump.
 * In the ink the stain grows to the deepest point reached; in the band the ink soaks in;
 * lifting out of the ink before it has taken means dipping again.
 */
export function stepDip(
  d: Dip,
  tip: Tip,
  dt: number,
  allowed: number,
): { dip: Dip; bumped: boolean } {
  if (d.outcome !== "dipping") return { dip: d, bumped: false };
  if (tip.y > RIM_Y && !insideMouth(tip.x) && Math.abs(tip.x - BOTTLE_X) <= BOTTLE_REACH) {
    const bumps = d.bumps + 1;
    return {
      bumped: true,
      dip: { ...d, bumps, soak: 0, outcome: bumps > allowed ? "spilled" : "dipping" },
    };
  }
  const depth = tip.y - INK_Y;
  const stain = Math.max(d.stain, depth);
  if (tip.y >= TOO_DEEP_Y) return { bumped: false, dip: { ...d, stain, outcome: "deep" } };
  if (depth < 0) return { bumped: false, dip: { ...d, soak: 0 } };
  if (tip.y < BAND_TOP || tip.y > BAND_BOTTOM) return { bumped: false, dip: { ...d, stain } };
  const soak = d.soak + dt;
  return { bumped: false, dip: { ...d, stain, soak, outcome: soak >= SOAK_S ? "won" : "dipping" } };
}
