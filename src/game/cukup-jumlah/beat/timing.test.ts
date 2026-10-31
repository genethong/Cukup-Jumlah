import { describe, expect, it } from "vitest";
import {
  SECONDS_PER_BEAT,
  beatPosition,
  beatTime,
  computeCalibration,
  eventToAudioTime,
  hitWindows,
  judgeTap,
  nearestTarget,
} from "./timing";

describe("tempo", () => {
  it("is 480 ms per beat at 125 BPM", () => {
    expect(SECONDS_PER_BEAT).toBeCloseTo(0.48, 10);
  });

  it("places beats on the grid", () => {
    expect(beatTime(10, 0)).toBe(10);
    expect(beatTime(10, 4)).toBeCloseTo(11.92, 10);
    expect(beatPosition(10.72, 10)).toBeCloseTo(1.5, 10);
  });
});

describe("hitWindows", () => {
  it("uses ±180 ms normally and ±260 ms with Mesra Rakyat", () => {
    expect(hitWindows(false).good).toBe(0.18);
    expect(hitWindows(true).good).toBe(0.26);
    expect(hitWindows(true).perfect).toBeGreaterThan(hitWindows(false).perfect);
  });
});

describe("judgeTap", () => {
  const w = hitWindows(false);

  it("grades perfect, good and miss by distance", () => {
    expect(judgeTap(5.0, 5.0, w).grade).toBe("perfect");
    expect(judgeTap(5.07, 5.0, w).grade).toBe("perfect");
    expect(judgeTap(4.9, 5.0, w).grade).toBe("good");
    expect(judgeTap(5.18, 5.0, w).grade).toBe("good");
    expect(judgeTap(5.19, 5.0, w).grade).toBe("miss");
  });

  it("reports early taps as negative and late taps as positive", () => {
    expect(judgeTap(4.95, 5.0, w).offsetMs).toBe(-50);
    expect(judgeTap(5.12, 5.0, w).offsetMs).toBe(120);
  });

  it("accepts a tap Mesra Rakyat allows but normal play doesn't", () => {
    expect(judgeTap(5.22, 5.0, hitWindows(false)).grade).toBe("miss");
    expect(judgeTap(5.22, 5.0, hitWindows(true)).grade).toBe("good");
  });
});

describe("nearestTarget", () => {
  const start = 2;
  const at = (beats: number) => start + beats * SECONDS_PER_BEAT;

  it("finds beat 4 of the nearest bar", () => {
    expect(nearestTarget(at(3), start, 4, 3)).toBe(3);
    expect(nearestTarget(at(2.2), start, 4, 3)).toBe(3);
    expect(nearestTarget(at(6.9), start, 4, 3)).toBe(7);
    expect(nearestTarget(at(5.2), start, 4, 3)).toBe(7);
    expect(nearestTarget(at(4.9), start, 4, 3)).toBe(3);
  });

  it("finds the nearest beat when every beat is a target", () => {
    expect(nearestTarget(at(5.4), start, 1, 0)).toBe(5);
    expect(nearestTarget(at(5.6), start, 1, 0)).toBe(6);
  });

  it("never returns a target before the first one", () => {
    expect(nearestTarget(at(-3), start, 4, 3)).toBe(3);
  });
});

describe("computeCalibration", () => {
  it("returns the median offset after dropping warm-up taps", () => {
    const result = computeCalibration([250, -200, 40, 50, 45, 60, 35, 55]);
    expect(result).toEqual({ offsetMs: 48, spreadMs: 8, samples: 6 });
  });

  it("ignores wild taps", () => {
    const result = computeCalibration([0, 0, 80, 90, 85, 900, -700, 95, 88]);
    expect(result?.offsetMs).toBe(88);
    expect(result?.samples).toBe(5);
  });

  it("needs at least five good taps", () => {
    expect(computeCalibration([10, 10, 20, 20, 20, 20])).toBeNull();
    expect(computeCalibration([])).toBeNull();
  });
});

describe("eventToAudioTime", () => {
  it("backdates the audio clock by how long ago the event happened", () => {
    expect(eventToAudioTime(1000, 5.5, 1030)).toBeCloseTo(5.47, 10);
  });
});
