import { describe, expect, it } from "vitest";
import {
  BOX_HALF,
  FRESH_DESK,
  LETTERS,
  LETTER_HALF,
  NEEDED,
  SKIPS,
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
  type Letter,
} from "./copRules";

/** The moment letter `l`'s seal box sits `off` short of the stamp line. */
function whenAt(l: Letter, off: number): number {
  let lo = 0;
  let hi = 30;
  for (let k = 0; k < 60; k += 1) {
    const mid = (lo + hi) / 2;
    if (letterX(l, mid) + l.box < STAMP_X - off) lo = mid;
    else hi = mid;
  }
  return lo;
}

const good = (at: number, box = 0): Letter => ({ kind: "good", at, box });

describe("Cop Watikah rules", () => {
  it("speeds the belt up and keeps letters in order", () => {
    expect(beltAt(4) - beltAt(3)).toBeGreaterThan(beltAt(1) - beltAt(0));
    const ls = dealLetters();
    ls.slice(1).forEach((l, i) => expect(letterX(l, 2)).toBeLessThan(letterX(ls[i]!, 2)));
  });

  it("deals letters that never overlap, with both kinds of skip, never side by side", () => {
    for (let n = 0; n < 50; n += 1) {
      const ls = dealLetters();
      expect(ls).toHaveLength(LETTERS);
      expect(ls.filter((l) => l.kind !== "good")).toHaveLength(SKIPS);
      expect(ls.some((l) => l.kind === "crossed")).toBe(true);
      expect(ls.some((l) => l.kind === "rival")).toBe(true);
      expect(ls[0]!.kind).toBe("good");
      ls.slice(1).forEach((l, i) => {
        expect(l.at - ls[i]!.at).toBeGreaterThan(LETTER_HALF * 2);
        expect(l.kind !== "good" && ls[i]!.kind !== "good").toBe(false);
      });
      for (const l of ls) expect(Math.abs(l.box) + BOX_HALF).toBeLessThanOrEqual(LETTER_HALF);
    }
  });

  it("grades a seal by how close it lands to the box, wherever the box sits", () => {
    for (const box of [-BOX_HALF, 0, BOX_HALF]) {
      const l = [good(0, box)];
      expect(stampAt(FRESH_DESK, l, whenAt(l[0]!, 0)).kind).toBe("clean");
      expect(stampAt(FRESH_DESK, l, whenAt(l[0]!, BOX_HALF - 1)).kind).toBe("ok");
    }
    // Dead on the letter's middle, but the box is off to the side.
    const side = [good(0, BOX_HALF)];
    expect(stampAt(FRESH_DESK, side, whenAt(side[0]!, -(BOX_HALF + 1))).kind).toBe("crooked");
    expect(stampAt(FRESH_DESK, side, 0).kind).toBe("empty");
  });

  it("counts sealing a crossed-out or rival letter as a mistake, and a second seal as nothing", () => {
    for (const kind of ["crossed", "rival"] as const) {
      const ls: Letter[] = [good(0), { kind, at: 30, box: 0 }];
      const s = stampAt(FRESH_DESK, ls, whenAt(ls[1]!, 0));
      expect(s.kind).toBe(kind);
      const desk = applyStamp(FRESH_DESK, s);
      expect(desk.mistakes).toBe(1);
      expect(stampAt(desk, ls, whenAt(ls[1]!, 0)).kind).toBe("again");
    }
  });

  it("counts a good letter leaving unstamped once, and lets skips go quietly", () => {
    const ls: Letter[] = [good(0), { kind: "rival", at: 30, box: 0 }];
    const t = whenAt(ls[1]!, -70);
    expect(newlyGone(FRESH_DESK, ls, t)).toEqual([0]);
    const desk = markGone(FRESH_DESK, [0]);
    expect(desk.mistakes).toBe(1);
    expect(newlyGone(desk, ls, t)).toEqual([]);
  });

  it("wins once every good letter is dealt with; loses on one mistake too many", () => {
    const ls = dealLetters();
    let desk = FRESH_DESK;
    ls.forEach((l, i) => {
      if (l.kind === "good") desk = applyStamp(desk, stampAt(desk, ls, whenAt(ls[i]!, 0)));
    });
    expect(sealedCount(desk, ls)).toBe(NEEDED);
    expect(deskVerdict(desk, ls, 1, false)).toBe("won");
    expect(deskVerdict(FRESH_DESK, ls, 1, false)).toBe("going");
    expect(deskVerdict(FRESH_DESK, ls, 1, true)).toBe("lost");
    expect(deskVerdict({ ...FRESH_DESK, mistakes: 2 }, ls, 1, false)).toBe("lost");
    expect(deskVerdict({ ...FRESH_DESK, mistakes: 2 }, ls, 2, false)).toBe("going");
  });
});
