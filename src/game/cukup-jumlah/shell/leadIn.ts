import { BEATS_PER_BAR } from "../beat/timing";
import { cempala, gong } from "../beat/wayangSounds";

// The dalang's start signal before every microgame: three knocks of the cempala on the
// puppet chest (3 · 2 · 1), then a gong and MULA! on the fourth beat. Games schedule it in
// their first bar and report the step so the shell can show the count.

export const LEAD_IN_BEATS = BEATS_PER_BAR;

/** Schedules the lead-in sound for beat `index`. Returns true while still in the lead-in. */
export function scheduleLeadIn(
  ctx: BaseAudioContext,
  out: AudioNode,
  index: number,
  when: number,
): boolean {
  if (index >= LEAD_IN_BEATS) return false;
  if (index < LEAD_IN_BEATS - 1) cempala(ctx, out, when, index === LEAD_IN_BEATS - 2);
  else gong(ctx, out, when);
  return true;
}

/** Lead-in step for a heard beat position: 1–3 are the knocks, 4 is MULA!, 0 is play. */
export function leadInStep(beatPos: number): number {
  return beatPos >= 0 && beatPos < LEAD_IN_BEATS ? Math.floor(beatPos) + 1 : 0;
}
