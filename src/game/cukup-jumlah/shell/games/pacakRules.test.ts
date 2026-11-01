import { describe, expect, it } from "vitest";
import {
  CENTRES,
  CLOCK_FROM_MIN,
  FRESH_NIGHT,
  MIN_GAP,
  SNEAK_S,
  clockMinutes,
  inRing,
  midnightAt,
  nightVerdict,
  offencesAllowed,
  pullDown,
  sneakIn,
  tap,
} from "./pacakRules";

const spot = { x: 50, y: 88 };

describe("Pacak Bendera rules", () => {
  it("strikes midnight late in the round, with a clock that races at the end", () => {
    const m = midnightAt(10, () => 0.5);
    expect(m).toBeGreaterThan(8);
    expect(m).toBeLessThan(10);
    expect(clockMinutes(0, m)).toBe(CLOCK_FROM_MIN);
    expect(clockMinutes(m, m)).toBe(60);
    expect(clockMinutes(m / 2, m) - CLOCK_FROM_MIN).toBeLessThan((60 - CLOCK_FROM_MIN) / 2);
  });

  it("plants a flag with one tap, with room between flags", () => {
    const one = tap(FRESH_NIGHT, spot);
    expect(one.result).toBe("planted");
    expect(one.night.flags).toHaveLength(1);
    expect(tap(one.night, { x: spot.x + 1, y: spot.y }).result).toBe("taken");
    expect(tap(one.night, { x: spot.x + MIN_GAP + 1, y: spot.y }).night.flags).toHaveLength(2);
  });

  it("counts a tap inside either polling centre's ring as an offence", () => {
    for (const c of CENTRES) {
      expect(inRing(c)).toBe(true);
      expect(tap(FRESH_NIGHT, c).result).toBe("ring");
    }
    const r = tap(FRESH_NIGHT, CENTRES[0]);
    expect(nightVerdict(r.night, 8, offencesAllowed(false), false)).toBe("lost");
    expect(nightVerdict(r.night, 8, offencesAllowed(true), false)).toBe("going");
  });

  it("lets the rival's people pull a flag down unless they're chased off in time", () => {
    const planted = tap(FRESH_NIGHT, spot).night;
    const sneaking = sneakIn(planted, 1);
    expect(sneaking.sneaks).toHaveLength(1);
    expect(pullDown(sneaking, 1 + SNEAK_S / 2).fell).toBe(0);
    const fallen = pullDown(sneaking, 1 + SNEAK_S);
    expect(fallen.fell).toBe(1);
    expect(fallen.night.flags).toHaveLength(0);

    const chased = tap(sneaking, { x: spot.x + 2, y: spot.y });
    expect(chased.result).toBe("chased");
    expect(pullDown(chased.night, 5).night.flags).toHaveLength(1);
  });

  it("is decided at midnight by the flags still standing", () => {
    const flags = Array.from({ length: 8 }, (_, i) => ({ id: i, x: i * 10, y: 90 }));
    const full = { ...FRESH_NIGHT, flags };
    expect(nightVerdict(full, 8, 0, false)).toBe("going");
    expect(nightVerdict(full, 8, 0, true)).toBe("won");
    expect(nightVerdict({ ...full, flags: flags.slice(1) }, 8, 0, true)).toBe("lost");
  });
});
