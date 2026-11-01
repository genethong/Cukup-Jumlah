import { describe, expect, it } from "vitest";
import {
  DISTANCE,
  FRESH_RUN,
  LANES,
  STEP_IN_M,
  STUMBLE_S,
  cleanRunS,
  laneAt,
  layCourse,
  runVerdict,
  stepRun,
  switchLane,
} from "./pecutRules";

describe("Pecut SPR rules", () => {
  it("lays a course that never blocks every lane", () => {
    for (let k = 0; k < 20; k++) {
      const course = layCourse();
      expect(course.length).toBeGreaterThan(4);
      const rows = new Map<number, Set<number>>();
      for (const o of course) {
        const lanes = rows.get(o.at) ?? new Set<number>();
        lanes.add(o.lane);
        if (o.toLane !== undefined) lanes.add(o.toLane);
        rows.set(o.at, lanes);
      }
      for (const lanes of rows.values()) expect(lanes.size).toBeLessThan(LANES);
    }
  });

  it("switches lanes within the three", () => {
    expect(switchLane(FRESH_RUN, -1).lane).toBe(0);
    expect(switchLane(switchLane(FRESH_RUN, -1), -1).lane).toBe(0);
    expect(switchLane(FRESH_RUN, 1).lane).toBe(2);
  });

  it("runs on, and stumbles on an obstacle in the lane", () => {
    const course = [{ at: 5, lane: 1, kind: "crowd" as const }];
    let r = FRESH_RUN;
    let bumped = false;
    for (let i = 0; i < 40 && !bumped; i++) ({ run: r, bumped } = stepRun(r, course, 0.02));
    expect(bumped).toBe(true);
    expect(r.stunned).toBe(STUMBLE_S);
    const still = stepRun(r, course, 0.1).run;
    expect(still.distance).toBe(r.distance);
    // The same obstacle doesn't trip you twice.
    let after = { ...still, stunned: 0 };
    for (let i = 0; i < 20; i++) after = stepRun(after, course, 0.05).run;
    expect(after.bumps).toBe(1);
  });

  it("has reporters step into the next lane as you come near", () => {
    const o = { at: 40, lane: 0, kind: "reporter" as const, toLane: 1 };
    expect(laneAt(o, 0)).toBe(0);
    expect(laneAt(o, 40 - STEP_IN_M)).toBe(1);
  });

  it("dodges by being in another lane", () => {
    const course = [{ at: 5, lane: 0, kind: "banner" as const }];
    let r = FRESH_RUN;
    for (let i = 0; i < 40; i++) r = stepRun(r, course, 0.05).run;
    expect(r.bumps).toBe(0);
  });

  it("wins at the counter, with time to spare for a clean run", () => {
    expect(runVerdict({ ...FRESH_RUN, distance: DISTANCE }, false)).toBe("won");
    expect(runVerdict(FRESH_RUN, true)).toBe("lost");
    // 6 bars of play is about 11.5 s; a clean run leaves room for three or so bumps.
    expect(cleanRunS()).toBeLessThan(11.5 - 3 * STUMBLE_S);
    expect(cleanRunS()).toBeGreaterThan(11.5 - 5 * STUMBLE_S);
  });
});
