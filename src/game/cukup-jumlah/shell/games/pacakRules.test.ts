import { describe, expect, it } from "vitest";
import {
  CENTRE,
  CLOCK_FROM_MIN,
  FRESH_NIGHT,
  HITS_PER_FLAG,
  MIN_GAP,
  RING,
  clockMinutes,
  hammer,
  inRing,
  midnightAt,
  nightVerdict,
  offencesAllowed,
  planted,
} from "./pacakRules";

const spot = { x: 20, y: 50 };

describe("Pacak Bendera rules", () => {
  it("strikes midnight late in the round, with a clock that races at the end", () => {
    const m = midnightAt(6, () => 0.5);
    expect(m).toBeGreaterThan(6 * 0.7);
    expect(m).toBeLessThan(6);
    expect(clockMinutes(0, m)).toBe(CLOCK_FROM_MIN);
    expect(clockMinutes(m, m)).toBe(60);
    // The first half of the time shows less than half the minutes.
    expect(clockMinutes(m / 2, m) - CLOCK_FROM_MIN).toBeLessThan((60 - CLOCK_FROM_MIN) / 2);
  });

  it("takes a few hammer taps to plant a flag", () => {
    let n = FRESH_NIGHT;
    for (let i = 1; i < HITS_PER_FLAG; i++) {
      const r = hammer(n, spot, false);
      expect(r.result).toBe("hit");
      n = r.night;
    }
    const last = hammer(n, { x: spot.x + 1, y: spot.y }, false);
    expect(last.result).toBe("planted");
    expect(planted(last.night)).toBe(1);
    expect(hammer(last.night, spot, false).result).toBe("taken");
    expect(
      hammer(last.night, { x: spot.x + MIN_GAP + 1, y: spot.y }, false).night.flags,
    ).toHaveLength(2);
  });

  it("counts a tap inside the polling centre's ring as an offence", () => {
    expect(inRing(CENTRE)).toBe(true);
    expect(inRing({ x: CENTRE.x + RING + 1, y: CENTRE.y })).toBe(false);
    const r = hammer(FRESH_NIGHT, CENTRE, false);
    expect(r.result).toBe("ring");
    expect(nightVerdict(r.night, 6, offencesAllowed(false), false)).toBe("lost");
    expect(nightVerdict(r.night, 6, offencesAllowed(true), false)).toBe("going");
  });

  it("loses for hammering after midnight, or for too few flags by midnight", () => {
    const late = hammer(FRESH_NIGHT, spot, true);
    expect(late.result).toBe("late");
    expect(nightVerdict(late.night, 6, 1, true)).toBe("lost");
    expect(nightVerdict(FRESH_NIGHT, 6, 0, true)).toBe("lost");
  });

  it("wins once enough flags are planted", () => {
    const flags = Array.from({ length: 6 }, (_, i) => ({ x: i * 10, y: 40, hits: HITS_PER_FLAG }));
    expect(nightVerdict({ ...FRESH_NIGHT, flags }, 6, 0, false)).toBe("won");
  });
});
