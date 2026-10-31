import { describe, expect, it } from "vitest";
import { mistakesAllowed } from "../microgame";
import {
  BALLOTS,
  EMPTY_COUNT,
  ballotSequence,
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

  it("counts a right pile, and keeps a wrong-pile ballot to be sorted again", () => {
    const ballots = ["yours", "rival"] as const;
    const right = sortBallot(EMPTY_COUNT, ballots, 0, "yours");
    expect(right).toEqual({ correct: true, count: { yours: 1, rival: 0, mistakes: 0 } });
    const wrong = sortBallot(right.count, ballots, 1, "yours");
    expect(wrong.correct).toBe(false);
    expect(wrong.count).toEqual({ yours: 1, rival: 0, mistakes: 1 });
  });

  it("wins once all are sorted, loses past the mistakes allowed or when time runs out", () => {
    const allowed = mistakesAllowed("lidah_manis");
    expect(verdict({ yours: 3, rival: 3, mistakes: 1 }, 6, allowed, false)).toBe("won");
    expect(verdict({ yours: 2, rival: 1, mistakes: 0 }, 6, allowed, false)).toBe("sorting");
    expect(verdict({ yours: 2, rival: 1, mistakes: 0 }, 6, allowed, true)).toBe("lost");
    expect(verdict({ yours: 1, rival: 0, mistakes: 2 }, 6, allowed, false)).toBe("lost");
    expect(
      verdict({ yours: 1, rival: 0, mistakes: 2 }, 6, mistakesAllowed("mesra_rakyat"), false),
    ).toBe("sorting");
  });
});
