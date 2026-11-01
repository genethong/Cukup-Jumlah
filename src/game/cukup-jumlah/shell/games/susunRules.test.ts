import { describe, expect, it } from "vitest";
import {
  BASE,
  FRESH_TOWER,
  LEFT,
  PROMISES_NEEDED,
  RIGHT,
  drop,
  missesAllowed,
  place,
  slideSpeed,
  slideX,
  topOf,
  towerVerdict,
} from "./susunRules";

describe("Susun Manifesto rules", () => {
  it("slides back and forth within the stage, faster up the tower", () => {
    for (let t = 0; t < 6; t += 0.07) {
      const x = slideX(t, 2, 40);
      expect(x).toBeGreaterThanOrEqual(LEFT);
      expect(x + 40).toBeLessThanOrEqual(RIGHT + 1e-9);
    }
    expect(slideSpeed(5)).toBeGreaterThan(slideSpeed(0));
  });

  it("keeps the whole promise when dropped dead on", () => {
    const d = drop(BASE, BASE.x + 1, BASE.w);
    expect(d).toEqual({ kind: "perfect", block: BASE });
  });

  it("breaks off whatever overhangs, on either side", () => {
    const right = drop(BASE, BASE.x + 10, BASE.w);
    expect(right.kind).toBe("chopped");
    if (right.kind === "chopped") {
      expect(right.block).toEqual({ x: BASE.x + 10, w: BASE.w - 10 });
      expect(right.broken.w).toBeCloseTo(10);
    }
    const left = drop(BASE, BASE.x - 8, BASE.w);
    if (left.kind === "chopped") {
      expect(left.block).toEqual({ x: BASE.x, w: BASE.w - 8 });
      expect(left.broken).toEqual({ x: BASE.x - 8, w: 8 });
    }
  });

  it("drops a promise that misses the tower", () => {
    expect(drop(BASE, BASE.x + BASE.w + 2, 20).kind).toBe("missed");
    const t = place(FRESH_TOWER, { kind: "missed" });
    expect(t.misses).toBe(1);
    expect(topOf(t)).toBe(BASE);
  });

  it("wins at eight promises; loses on one miss too many or on time", () => {
    const blocks = Array.from({ length: PROMISES_NEEDED }, () => BASE);
    expect(towerVerdict({ blocks, misses: 0 }, 1, false)).toBe("won");
    expect(towerVerdict({ blocks: [], misses: 2 }, missesAllowed(false), false)).toBe("lost");
    expect(towerVerdict({ blocks: [], misses: 2 }, missesAllowed(true), false)).toBe("going");
    expect(towerVerdict({ blocks: [BASE], misses: 0 }, 1, true)).toBe("lost");
  });
});
