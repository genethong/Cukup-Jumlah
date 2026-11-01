import { describe, expect, it } from "vitest";
import {
  CATCH,
  LEAFLETS_NEEDED,
  TRAY,
  catcher,
  dealItems,
  flickTarget,
  isGift,
  leafletsNeeded,
  spawnVillager,
  stallVerdict,
  villagerX,
} from "./balingRules";

describe("Baling Risalah rules", () => {
  it("deals a leaflet first, some gifts, and never three gifts in a row", () => {
    const items = dealItems(200, () => 0.1);
    expect(items[0]).toBe("leaflet");
    expect(items.some(isGift)).toBe(true);
    for (let i = 2; i < items.length; i++) {
      expect(isGift(items[i]!) && isGift(items[i - 1]!) && isGift(items[i - 2]!)).toBe(false);
    }
    expect(dealItems(50, () => 0.9).every((i) => i === "leaflet")).toBe(true);
  });

  it("aims a flick by the swipe's direction", () => {
    expect(flickTarget(0, -30)).toBe(TRAY.x);
    expect(flickTarget(-10, -30)).toBeLessThan(TRAY.x);
    expect(flickTarget(10, -30)).toBeGreaterThan(TRAY.x);
    expect(flickTarget(500, -1)).toBe(98);
  });

  it("walks villagers across and lets the nearest unserved one catch", () => {
    const v = { ...spawnVillager(1, 0, () => 0.2), x0: 40, speed: 10 };
    expect(villagerX(v, 1)).toBe(50);
    expect(catcher([v], 50 + CATCH - 1, 1)).toBe(v);
    expect(catcher([v], 50 + CATCH + 1, 1)).toBe(null);
    expect(catcher([{ ...v, served: true }], 50, 1)).toBe(null);
  });

  it("wins on enough leaflets, loses on any gift handed out", () => {
    expect(leafletsNeeded(true)).toBe(LEAFLETS_NEEDED - 1);
    expect(stallVerdict({ delivered: 6, bribed: false }, 6, false)).toBe("won");
    expect(stallVerdict({ delivered: 6, bribed: true }, 6, false)).toBe("lost");
    expect(stallVerdict({ delivered: 2, bribed: false }, 6, true)).toBe("lost");
    expect(stallVerdict({ delivered: 2, bribed: false }, 6, false)).toBe("going");
  });
});
