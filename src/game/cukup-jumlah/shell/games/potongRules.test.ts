import { describe, expect, it } from "vitest";
import {
  BOW_REACH,
  MAX_SAG,
  RIBBON,
  TAUT,
  bowX,
  ceremonyVerdict,
  crossing,
  judgeCut,
  ribbonY,
  sag,
} from "./potongRules";

describe("Potong Reben rules", () => {
  it("lets the ribbon pull taut some of the time, and not most of it", () => {
    let taut = 0;
    const n = 400;
    for (let i = 0; i < n; i++) {
      const s = sag(i * 0.01, 0);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(MAX_SAG);
      if (s <= TAUT) taut++;
    }
    expect(taut / n).toBeGreaterThan(0.12);
    expect(taut / n).toBeLessThan(0.45);
  });

  it("keeps the bow near the middle", () => {
    for (let t = 0; t < 10; t += 0.3) expect(Math.abs(bowX(t, 2) - 50)).toBeLessThanOrEqual(14);
  });

  it("finds where a stroke crosses the ribbon", () => {
    const x = crossing({ x: 40, y: RIBBON.y - 10 }, { x: 60, y: RIBBON.y + 10 }, 0);
    expect(x).toBeCloseTo(50, 5);
    expect(crossing({ x: 40, y: RIBBON.y - 10 }, { x: 60, y: RIBBON.y - 2 }, 0)).toBe(null);
    expect(ribbonY(50, 4)).toBe(RIBBON.y + 4);
    // A stroke point landing exactly on the line still counts.
    expect(crossing({ x: 50, y: RIBBON.y - 4 }, { x: 50, y: RIBBON.y }, 0)).toBe(50);
  });

  it("only cuts clean when taut and near the bow", () => {
    expect(judgeCut(50, 0, 50)).toBe("clean");
    expect(judgeCut(50, TAUT + 1, 50)).toBe("slack");
    expect(judgeCut(50 + BOW_REACH + 1, 0, 50)).toBe("off");
  });

  it("wins after three ribbons, loses on too many bad cuts or time", () => {
    expect(ceremonyVerdict({ cut: 3, mistakes: 1 }, 1, false)).toBe("won");
    expect(ceremonyVerdict({ cut: 1, mistakes: 2 }, 1, false)).toBe("lost");
    expect(ceremonyVerdict({ cut: 2, mistakes: 0 }, 1, true)).toBe("lost");
  });
});
