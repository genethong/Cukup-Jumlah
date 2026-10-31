// Pure timing maths for the beat clock. All times are in seconds on the AudioContext
// clock unless a name says otherwise.

export const BPM = 125;
export const SECONDS_PER_BEAT = 60 / BPM; // 0.48
export const BEATS_PER_BAR = 4;
/** Beat 4 of each bar (0-based index 3) is the hit beat. */
export const HIT_BEAT_IN_BAR = 3;

export type Grade = "perfect" | "good" | "miss";

export type HitWindows = { perfect: number; good: number };

/** ±180 ms to count as a hit, ±260 ms with the Mesra Rakyat talent. Perfect is the tight core. */
export function hitWindows(mesraRakyat: boolean): HitWindows {
  return mesraRakyat ? { perfect: 0.09, good: 0.26 } : { perfect: 0.07, good: 0.18 };
}

export function beatTime(startTime: number, index: number, spb = SECONDS_PER_BEAT): number {
  return startTime + index * spb;
}

/** Fractional beat count since `startTime` (negative before the start). */
export function beatPosition(time: number, startTime: number, spb = SECONDS_PER_BEAT): number {
  return (time - startTime) / spb;
}

/**
 * Index of the target beat nearest to `time`. Targets are every `every` beats starting at
 * `phase` (e.g. every=4, phase=3 for beat 4 of each bar; every=1, phase=0 for every beat).
 */
export function nearestTarget(
  time: number,
  startTime: number,
  every: number,
  phase: number,
  spb = SECONDS_PER_BEAT,
): number {
  const k = Math.round((beatPosition(time, startTime, spb) - phase) / every);
  return Math.max(0, k) * every + phase;
}

export type Judgement = { grade: Grade; offsetMs: number };

/** Positive offset = late, negative = early. */
export function judgeTap(tapTime: number, targetTime: number, windows: HitWindows): Judgement {
  const offset = tapTime - targetTime;
  // Window edges count as inside; the epsilon absorbs float noise like 5.07 - 5.0.
  const abs = Math.abs(offset) - 1e-9;
  const grade: Grade = abs <= windows.perfect ? "perfect" : abs <= windows.good ? "good" : "miss";
  return { grade, offsetMs: Math.round(offset * 1000) };
}

export type Calibration = { offsetMs: number; spreadMs: number; samples: number };

const WARMUP_TAPS = 2;
const MIN_SAMPLES = 5;
const MAX_ABS_OFFSET_MS = 300;

/**
 * Turns tap offsets (ms, tap minus scheduled beat) from a tap-along into one latency
 * correction. Drops warm-up taps and wild taps, then takes the median so a single
 * stray tap can't skew it. Returns null when there aren't enough good taps.
 */
export function computeCalibration(offsetsMs: readonly number[]): Calibration | null {
  const usable = offsetsMs
    .slice(WARMUP_TAPS)
    .filter((o) => Number.isFinite(o) && Math.abs(o) <= MAX_ABS_OFFSET_MS);
  if (usable.length < MIN_SAMPLES) return null;
  const sorted = [...usable].sort((a, b) => a - b);
  const median = medianOfSorted(sorted);
  const deviations = sorted.map((o) => Math.abs(o - median)).sort((a, b) => a - b);
  return {
    offsetMs: Math.round(median),
    spreadMs: Math.round(medianOfSorted(deviations)),
    samples: usable.length,
  };
}

function medianOfSorted(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Converts a DOM event timestamp (performance.now() clock, ms) to AudioContext time, given
 * both clocks read at the same moment. This removes the delay between the tap and the
 * handler running.
 */
export function eventToAudioTime(
  eventTimeStampMs: number,
  audioNow: number,
  performanceNowMs: number,
): number {
  return audioNow - (performanceNowMs - eventTimeStampMs) / 1000;
}
