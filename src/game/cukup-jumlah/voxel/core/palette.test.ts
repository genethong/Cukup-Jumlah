import { describe, expect, it } from "vitest";
import { buildArms, buildLegs, buildTorso } from "../avatar/parts/body";
import { buildHead } from "../avatar/parts/head";
import { buildCap, buildSongkok, buildTudung } from "../avatar/parts/headwear";
import { HERO_LOOK } from "../avatar/look";
import { AUTHORED_SLOTS, PALETTE_SIZE, SKIN_RAMPS, Slot, isAuthoredSlot, isEmissiveSlot } from "./palette";
import { countFilled } from "./grid";

function assertPalette(grids: { data: Uint8Array }[]) {
  for (const g of grids) {
    for (let i = 0; i < g.data.length; i++) {
      const v = g.data[i];
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(PALETTE_SIZE);
      expect(isAuthoredSlot(v)).toBe(true);
    }
  }
}

describe("palette", () => {
  it("stores 6 skin ramps of 3 shades", () => {
    expect(SKIN_RAMPS).toHaveLength(6);
    for (const ramp of SKIN_RAMPS) expect(ramp).toHaveLength(3);
    expect(new Set(AUTHORED_SLOTS).size).toBe(AUTHORED_SLOTS.length);
  });

  it("flags lamp voxels as emissive and keeps hero grids on-palette", () => {
    expect(isEmissiveSlot(Slot.LAMP_GLOW)).toBe(true);
    expect(isEmissiveSlot(Slot.CLOTH_A_1)).toBe(false);
    assertPalette([
      buildTorso(),
      buildHead(HERO_LOOK, false),
      buildHead(HERO_LOOK, true),
      ...buildArms(),
      buildLegs(),
      buildSongkok(),
      buildTudung(),
      buildCap(),
    ]);
    expect(countFilled(buildTorso())).toBeGreaterThan(0);
  });
});
