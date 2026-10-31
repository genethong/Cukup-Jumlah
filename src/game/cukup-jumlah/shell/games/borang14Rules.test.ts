import { describe, expect, it } from "vitest";
import {
  EMPTY_TALLY,
  MISTAKES_ALLOWED,
  ballotAt,
  ballotSequence,
  ballotShownAt,
  ballotTarget,
  verdict,
} from "./borang14Rules";

describe("Borang 14 rules", () => {
  it("starts with the player's own ballot and always includes a rival's", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      let x = seed;
      const random = () => (x = (x * 9301 + 49297) % 233280) / 233280;
      const seq = ballotSequence(3, random);
      expect(seq[0]).toBe("yours");
      expect(seq).toContain("rival");
      expect(seq).toHaveLength(3);
    }
  });

  it("shows each ballot on beat 1 of its bar and asks for the tap on beat 4", () => {
    expect(ballotShownAt(0)).toBe(4); // after the one-bar lead-in
    expect(ballotTarget(0)).toBe(7);
    expect(ballotTarget(2)).toBe(15);
    expect(ballotAt(3.9, 3)).toBe(-1);
    expect(ballotAt(4, 3)).toBe(0);
    expect(ballotAt(15.9, 3)).toBe(2);
    expect(ballotAt(16, 3)).toBe(-1);
  });

  it(`wins with up to ${MISTAKES_ALLOWED} mistake and loses past it`, () => {
    expect(verdict({ ...EMPTY_TALLY, judged: 2 }, 3)).toBe("counting");
    expect(verdict({ ...EMPTY_TALLY, judged: 3, mistakes: 1 }, 3)).toBe("won");
    expect(verdict({ ...EMPTY_TALLY, judged: 2, mistakes: 2 }, 3)).toBe("lost");
  });
});
