import { describe, expect, it } from "vitest";
import {
  BALLOTS,
  EMPTY_COUNT,
  PENALTY_S,
  ballotSequence,
  penaltySeconds,
  pileForSwipe,
  sortBallot,
  verdict,
} from "./borang14Rules";

describe("Borang 14 rules", () => {
  it("starts with the player's own ballot and gives both piles at least one", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      let x = seed;
      const random = () => (x = (x * 9301 + 49297) % 233280) / 233280;
      const seq = ballotSequence(BALLOTS, random);
      expect(seq).toHaveLength(BALLOTS);
      expect(seq[0]).toBe("yours");
      expect(seq).toContain("rival");
    }
  });

  it("throws left to your pile, right to the rival's, and snaps back on a short drag", () => {
    expect(pileForSwipe(-120, 200)).toBe("yours");
    expect(pileForSwipe(120, 200)).toBe("rival");
    expect(pileForSwipe(30, 200)).toBeNull();
  });

  it("builds a streak on right piles and breaks it on a wrong one", () => {
    const ballots = ["yours", "rival", "yours"] as const;
    let s = sortBallot(EMPTY_COUNT, ballots, 0, "yours");
    s = sortBallot(s.count, ballots, 1, "rival");
    expect(s.count).toEqual({ yours: 1, rival: 1, mistakes: 0, streak: 2 });
    const wrong = sortBallot(s.count, ballots, 2, "rival");
    expect(wrong.correct).toBe(false);
    expect(wrong.count).toEqual({ yours: 1, rival: 1, mistakes: 1, streak: 0 });
  });

  it("burns time for mistakes, with Mesra Rakyat's first one free", () => {
    expect(penaltySeconds(2)).toBe(2 * PENALTY_S);
    expect(penaltySeconds(2, 1)).toBe(PENALTY_S);
    expect(penaltySeconds(1, 1)).toBe(0);
  });

  it("wins once every ballot is sorted and loses only when the fuse burns out", () => {
    expect(verdict({ ...EMPTY_COUNT, yours: 5, rival: 5, mistakes: 4 }, 10, false)).toBe("won");
    expect(verdict({ ...EMPTY_COUNT, yours: 3 }, 10, false)).toBe("sorting");
    expect(verdict({ ...EMPTY_COUNT, yours: 3 }, 10, true)).toBe("lost");
  });
});
