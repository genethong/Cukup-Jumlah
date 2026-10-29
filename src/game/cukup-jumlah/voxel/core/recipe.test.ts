import { describe, expect, it } from "vitest";
import { countFilled, getVoxel, hashGrid } from "./grid";
import { recipe } from "./recipe";
import { buildHead } from "../avatar/parts/head";
import { buildTorso } from "../avatar/parts/body";
import { buildSongkok } from "../avatar/parts/headwear";
import { HERO_LOOK } from "../avatar/look";

describe("voxel recipes", () => {
  it("fills an exclusive box and mirrors it", () => {
    const g = recipe([6, 2, 2], (v) => {
      v.box([0, 0, 0], [2, 2, 2], 3);
      v.mirror("x");
    });
    expect(countFilled(g)).toBe(16);
    expect(getVoxel(g, 0, 0, 0)).toBe(3);
    expect(getVoxel(g, 5, 0, 0)).toBe(3);
    expect(getVoxel(g, 2, 0, 0)).toBe(0);
  });

  it("shades a column across the given slots", () => {
    const g = recipe([1, 6, 1], (v) => {
      v.box([0, 0, 0], [1, 6, 1], 4);
      v.shadeBy("y", [4, 5, 6]);
    });
    expect(getVoxel(g, 0, 0, 0)).toBe(4);
    expect(getVoxel(g, 0, 5, 0)).toBe(6);
    expect(hashGrid(g)).toBe(hashGrid(g));
  });

  it("is deterministic for the hero parts", () => {
    const a = buildTorso();
    const b = buildTorso();
    expect(countFilled(a)).toBe(countFilled(b));
    expect(hashGrid(a)).toBe(hashGrid(b));
    expect(countFilled(a)).toBeGreaterThan(2000);

    const head = buildHead(HERO_LOOK, false);
    expect(countFilled(head)).toBe(countFilled(buildHead(HERO_LOOK, false)));
    expect(countFilled(head)).toBeGreaterThan(800);
    expect(countFilled(buildSongkok())).toBeGreaterThan(200);
  });
});
