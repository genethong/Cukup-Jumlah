import { describe, expect, it } from "vitest";
import {
  DANCE_LENGTHS,
  FRESH_FLOOR,
  REST_BEATS,
  advanceShow,
  floorVerdict,
  makeDances,
  shownMove,
  shownSoFar,
  strike,
  type Floor,
  type Move,
} from "./jogetRules";

const SPB = 0.48;
const DANCES: Move[][] = [
  ["up", "left", "down"],
  ["right", "up", "left", "down"],
  ["left", "right", "left", "up"],
];

/** Watch the dance through to the YB's turn. */
function toCopy(f: Floor): Floor {
  if (f.stage.kind !== "show") return f;
  const end = f.stage.from + (REST_BEATS + DANCES[f.stage.dance]!.length) * SPB;
  return advanceShow(DANCES, f, end + 0.01, SPB);
}

describe("Joget Trend rules", () => {
  it("makes dances of the agreed lengths with no pose twice in a row", () => {
    for (let n = 0; n < 40; n += 1) {
      const dances = makeDances();
      expect(dances.map((d) => d.length)).toEqual(DANCE_LENGTHS);
      for (const d of dances) d.slice(1).forEach((m, i) => expect(m).not.toBe(d[i]));
    }
  });

  it("shows one pose a beat after a beat of rest, then hands over", () => {
    expect(shownMove(DANCES, FRESH_FLOOR, 0.1, SPB)).toBeNull();
    expect(shownMove(DANCES, FRESH_FLOOR, SPB * 1.2, SPB)).toBe("up");
    expect(shownMove(DANCES, FRESH_FLOOR, SPB * 2.2, SPB)).toBe("left");
    expect(advanceShow(DANCES, FRESH_FLOOR, SPB * 3.5, SPB).stage.kind).toBe("show");
    expect(toCopy(FRESH_FLOOR).stage).toEqual({ kind: "copy", dance: 0, step: 0 });
    expect(shownSoFar(DANCES, FRESH_FLOOR, 0.1, SPB)).toEqual([]);
    expect(shownSoFar(DANCES, FRESH_FLOOR, SPB * 2.2, SPB)).toEqual(["up", "left"]);
    expect(shownSoFar(DANCES, FRESH_FLOOR, SPB * 9, SPB)).toEqual(DANCES[0]);
  });

  it("ignores poses while the dance is being shown", () => {
    expect(strike(DANCES, FRESH_FLOOR, "up", 1).result).toBe("ignored");
  });

  it("replays the dance after a wrong pose and counts the mistake", () => {
    let f = toCopy(FRESH_FLOOR);
    f = strike(DANCES, f, "up", 3).floor;
    const s = strike(DANCES, f, "right", 3.2);
    expect(s.result).toBe("wrong");
    expect(s.floor.mistakes).toBe(1);
    expect(s.floor.stage).toEqual({ kind: "show", dance: 0, from: 3.2 });
  });

  it("moves to the next dance, and wins after the last", () => {
    let f = FRESH_FLOOR;
    let t = 0;
    for (const dance of DANCES) {
      f = toCopy(f);
      for (const m of dance) {
        t += 0.3;
        const s = strike(DANCES, f, m, 10 + t);
        f = s.floor;
      }
    }
    expect(f.stage.kind).toBe("done");
    expect(floorVerdict(f, 1, false)).toBe("won");
  });

  it("loses on one mistake too many, or when the trend dies", () => {
    expect(floorVerdict({ ...FRESH_FLOOR, mistakes: 2 }, 1, false)).toBe("lost");
    expect(floorVerdict({ ...FRESH_FLOOR, mistakes: 2 }, 2, false)).toBe("going");
    expect(floorVerdict(FRESH_FLOOR, 1, true)).toBe("lost");
  });
});
