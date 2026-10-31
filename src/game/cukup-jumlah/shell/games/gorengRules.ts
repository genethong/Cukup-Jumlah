// Goreng Kuey Teow (KACAU!): the photo-op. The real hawker cooks; the YB only grabs the
// senduk when a camera is about to flash. Hold to pose, let go so the hawker can cook. Win
// with enough good photos and the dish done before the fuse burns out.
// Pure rules here; the screen is GorengKueyTeow.tsx.

/** Seconds of the hawker cooking undisturbed to finish the dish. */
export const COOK_SECONDS = 4.6;
/** Seconds the YB must already be posing when the flash fires. */
export const POSE_SECONDS = 0.3;
/** Seconds a camera is up and counting down (3 · 2 · 1) before it flashes. */
export const AIM_SECONDS = 1.2;
/** First flash, and the gap between flashes, in seconds of play. */
export const FIRST_FLASH_S = 1.6;
export const FLASH_GAP_S = 2;
/** Photos needed; Mesra Rakyat needs one fewer. */
export const PHOTOS_NEEDED = 3;

/** When each camera flashes, in seconds of play, leaving room before the fuse runs out. */
export function flashTimes(limitS: number, random: () => number = Math.random): number[] {
  const out: number[] = [];
  for (let t = FIRST_FLASH_S; t <= limitS - 0.5; t += FLASH_GAP_S + (random() - 0.5) * 0.5) {
    out.push(t);
  }
  return out;
}

export type Shoot = { cooked: number; photos: number; missed: number };

export const FRESH_SHOOT: Shoot = { cooked: 0, photos: 0, missed: 0 };

/** The hawker cooks only while the YB isn't hogging the senduk. */
export function stepCook(s: Shoot, dt: number, holding: boolean): Shoot {
  if (holding) return s;
  return { ...s, cooked: Math.min(1, s.cooked + dt / COOK_SECONDS) };
}

/** A flash: a good photo if the YB has been posing long enough, an embarrassing one if not. */
export function judgeFlash(s: Shoot, posingFor: number | null): { shoot: Shoot; good: boolean } {
  const good = posingFor !== null && posingFor >= POSE_SECONDS;
  return {
    good,
    shoot: good ? { ...s, photos: s.photos + 1 } : { ...s, missed: s.missed + 1 },
  };
}

export function photosNeeded(forgiving: boolean, flashes: number): number {
  return Math.min(flashes, forgiving ? PHOTOS_NEEDED - 1 : PHOTOS_NEEDED);
}

/**
 * Won with enough photos and the dish cooked. Lost once the photos can no longer be made
 * (too many missed for the flashes left), or when time runs out.
 */
export function shootVerdict(
  s: Shoot,
  flashes: number,
  needed: number,
  timeUp: boolean,
): "won" | "lost" | "shooting" {
  if (s.photos >= needed && s.cooked >= 1) return "won";
  if (s.photos + (flashes - s.photos - s.missed) < needed) return "lost";
  return timeUp ? "lost" : "shooting";
}
