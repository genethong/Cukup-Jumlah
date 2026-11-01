import { describe, expect, it } from "vitest";
import {
  BOX_HALF,
  CROSSED,
  FRESH_DESK,
  LETTERS,
  STAMP_X,
  applyStamp,
  beltAt,
  dealLetters,
  deskVerdict,
  letterX,
  markGone,
  newlyGone,
  sealedCount,
  stampAt,
} from "./copRules";

/** The moment letter `i` sits `off` short of the stamp line. */
function whenAt(i: number, off: number): number {
  let lo = 0;
  let hi = 30;
  for (let k = 0; k < 60; k += 1) {
    const mid = (lo + hi) / 2;
    if (letterX(i, mid) < STAMP_X - off) lo = mid;
    else hi = mid;
  }
  return lo;
}

const ALL_GOOD = Array.from({ length: LETTERS }, () => false);

describe("Cop Watikah rules", () => {
  it("speeds the belt up and keeps letters in order", () => {
    expect(beltAt(4) - beltAt(3)).toBeGreaterThan(beltAt(1) - beltAt(0));
    expect(letterX(0, 2)).toBeGreaterThan(letterX(1, 2));
  });

  it("deals two crossed-out letters, never first and never side by side", () => {
    for (let n = 0; n < 50; n += 1) {
      const c = dealLetters();
      expect(c).toHaveLength(LETTERS);
      expect(c.filter(Boolean)).toHaveLength(CROSSED);
      expect(c[0]).toBe(false);
      expect(c.some((x, i) => x && c[i + 1])).toBe(false);
    }
  });

  it("grades a seal by how close it lands to the box", () => {
    expect(stampAt(FRESH_DESK, ALL_GOOD, whenAt(0, 0)).kind).toBe("clean");
    expect(stampAt(FRESH_DESK, ALL_GOOD, whenAt(0, BOX_HALF - 1)).kind).toBe("ok");
    expect(stampAt(FRESH_DESK, ALL_GOOD, whenAt(0, BOX_HALF + 3)).kind).toBe("crooked");
    expect(stampAt(FRESH_DESK, ALL_GOOD, 0).kind).toBe("empty");
  });

  it("counts sealing a crossed-out letter as a mistake, and a second seal as nothing", () => {
    const crossed = [false, true, ...ALL_GOOD.slice(2)];
    const s = stampAt(FRESH_DESK, crossed, whenAt(1, 0));
    expect(s.kind).toBe("crossed");
    const desk = applyStamp(FRESH_DESK, s);
    expect(desk.mistakes).toBe(1);
    expect(stampAt(desk, crossed, whenAt(1, 0)).kind).toBe("again");
  });

  it("counts a good letter leaving unstamped once", () => {
    const t = whenAt(0, -70);
    expect(newlyGone(FRESH_DESK, ALL_GOOD, t)).toEqual([0]);
    const desk = markGone(FRESH_DESK, [0]);
    expect(desk.mistakes).toBe(1);
    expect(newlyGone(desk, ALL_GOOD, t)).toEqual([]);
  });

  it("wins once every good letter is dealt with; loses on one mistake too many", () => {
    const crossed = dealLetters();
    let desk = FRESH_DESK;
    crossed.forEach((c, i) => {
      if (!c) desk = applyStamp(desk, stampAt(desk, crossed, whenAt(i, 0)));
    });
    expect(sealedCount(desk, crossed)).toBe(LETTERS - CROSSED);
    expect(deskVerdict(desk, crossed, 1, false)).toBe("won");
    expect(deskVerdict(FRESH_DESK, crossed, 1, false)).toBe("going");
    expect(deskVerdict(FRESH_DESK, crossed, 1, true)).toBe("lost");
    expect(deskVerdict({ ...FRESH_DESK, mistakes: 2 }, crossed, 1, false)).toBe("lost");
    expect(deskVerdict({ ...FRESH_DESK, mistakes: 2 }, crossed, 2, false)).toBe("going");
  });
});
