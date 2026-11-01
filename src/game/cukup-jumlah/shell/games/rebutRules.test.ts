import { describe, expect, it } from "vitest";
import {
  FIGURE_W,
  LATE_S,
  LINE_LEFT,
  LINE_RIGHT,
  MEMBERS,
  PHOTOS,
  WALK,
  judgeShot,
  lateAt,
  lineAt,
  memberX,
  planPhotos,
  shotsVerdict,
  shutterAt,
  swayAt,
  walk,
} from "./rebutRules";

/** Where the gap the latecomer leaves open sits at the click. */
function gapCentre(plan: ReturnType<typeof planPhotos>, i: number): number {
  return plan[i]!.gaps.find((g) => g !== plan[i]!.late)! + swayAt(shutterAt(i));
}

describe("Rebut Kamera rules", () => {
  it("lays every line inside the stage with members apart", () => {
    for (let n = 0; n < 30; n += 1) {
      const plan = planPhotos();
      expect(plan).toHaveLength(PHOTOS);
      plan.forEach((p, i) => {
        expect(p.slots).toHaveLength(MEMBERS);
        expect(p.late === null).toBe(i === 0);
        for (const x of p.slots) {
          expect(x - FIGURE_W / 2).toBeGreaterThanOrEqual(LINE_LEFT);
          expect(x + FIGURE_W / 2).toBeLessThanOrEqual(LINE_RIGHT + 1e-9);
        }
        const sorted = [...p.slots].sort((a, b) => a - b);
        sorted.slice(1).forEach((x, k) => expect(x - sorted[k]!).toBeGreaterThanOrEqual(FIGURE_W));
      });
    }
  });

  it("slides members to the new line at the start of each photo", () => {
    const plan = planPhotos();
    const t = shutterAt(1);
    expect(memberX(plan, 0, t) - swayAt(t)).toBeCloseTo(plan[1]!.slots[0]!);
  });

  it("brings the latecomer into the line just before the click", () => {
    const plan = planPhotos();
    expect(lateAt(plan, shutterAt(0))).toBeNull();
    expect(lateAt(plan, shutterAt(1) - LATE_S - 0.1)?.stepped).toBe(false);
    expect(lateAt(plan, shutterAt(1))?.stepped).toBe(true);
    expect(lineAt(plan, shutterAt(1))).toHaveLength(MEMBERS + 1);
  });

  it("is a good shot in the open gap and an elbow shot on someone", () => {
    for (let n = 0; n < 30; n += 1) {
      const plan = planPhotos();
      for (let i = 0; i < PHOTOS; i += 1) {
        expect(judgeShot(plan, i, gapCentre(plan, i))).toBe("good");
        expect(judgeShot(plan, i, memberX(plan, 0, shutterAt(i)) + 2)).toBe("elbow");
      }
      expect(judgeShot(plan, 1, lateAt(plan, shutterAt(1))!.x)).toBe("elbow");
    }
  });

  it("walks no faster than WALK and stays on the stage", () => {
    expect(walk(50, 90, 0.1)).toBeCloseTo(50 + WALK * 0.1);
    expect(walk(50, 51, 0.1)).toBe(51);
    expect(walk(50, 0, 10)).toBe(LINE_LEFT + FIGURE_W / 2);
  });

  it("wins after three photos; loses on one elbow too many", () => {
    expect(shotsVerdict(["good", "elbow", "good"], 1)).toBe("won");
    expect(shotsVerdict(["good", "elbow"], 1)).toBe("going");
    expect(shotsVerdict(["elbow", "elbow"], 1)).toBe("lost");
    expect(shotsVerdict(["elbow", "elbow"], 2)).toBe("going");
  });
});
