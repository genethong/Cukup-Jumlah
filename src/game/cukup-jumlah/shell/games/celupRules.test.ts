import { describe, expect, it } from "vitest";
import {
  BAND_TOP,
  BOTTLE_X,
  FRESH_DIP,
  INK_Y,
  MOUTH_HALF,
  RIM_Y,
  SOAK_S,
  START,
  TOO_DEEP_Y,
  bumpsAllowed,
  insideMouth,
  restOnDesk,
  stepDip,
  sway,
} from "./celupRules";

describe("Celup Dakwat Kekal dip rules", () => {
  it("starts away from the bottle, and the sway is small next to the mouth", () => {
    expect(insideMouth(START.x)).toBe(false);
    for (let t = 0; t < 10; t += 0.1) expect(Math.abs(sway(t).dx)).toBeLessThan(MOUTH_HALF);
  });

  it("inks the finger once it has soaked in the band", () => {
    let d = FRESH_DIP;
    const tip = { x: BOTTLE_X, y: BAND_TOP + 1 };
    d = stepDip(d, tip, SOAK_S / 2, 1).dip;
    expect(d.outcome).toBe("dipping");
    d = stepDip(d, tip, SOAK_S / 2, 1).dip;
    expect(d.outcome).toBe("won");
  });

  it("needs dipping again after lifting out too soon, but not when only too shallow", () => {
    const half = stepDip(FRESH_DIP, { x: BOTTLE_X, y: BAND_TOP + 1 }, SOAK_S / 2, 1).dip;
    expect(stepDip(half, { x: BOTTLE_X, y: INK_Y + 1 }, 0.1, 1).dip.soak).toBe(half.soak);
    expect(stepDip(half, { x: BOTTLE_X, y: INK_Y - 1 }, 0.1, 1).dip.soak).toBe(0);
  });

  it("loses when the finger goes in too deep", () => {
    expect(stepDip(FRESH_DIP, { x: BOTTLE_X, y: TOO_DEEP_Y }, 0.1, 1).dip.outcome).toBe("deep");
  });

  it("bumps the rim outside the mouth; one too many tips the bottle over", () => {
    const rim = { x: BOTTLE_X + MOUTH_HALF, y: RIM_Y + 1 };
    const once = stepDip(FRESH_DIP, rim, 0.1, bumpsAllowed(false));
    expect(once.bumped).toBe(true);
    expect(once.dip.outcome).toBe("dipping");
    expect(stepDip(once.dip, rim, 0.1, bumpsAllowed(false)).dip.outcome).toBe("spilled");
    expect(stepDip(once.dip, rim, 0.1, bumpsAllowed(true)).dip.outcome).toBe("dipping");
  });

  it("lets the finger rest on the desk away from the bottle", () => {
    expect(restOnDesk({ x: 20, y: 90 })).toEqual({ x: 20, y: RIM_Y });
    expect(restOnDesk({ x: BOTTLE_X, y: 90 })).toEqual({ x: BOTTLE_X, y: 90 });
    expect(stepDip(FRESH_DIP, { x: 20, y: RIM_Y }, 0.1, 1).bumped).toBe(false);
  });
});
