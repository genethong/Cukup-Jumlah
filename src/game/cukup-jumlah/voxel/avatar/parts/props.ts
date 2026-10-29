import type { Vec3, VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";

export const SPATULA_ANCHOR: Vec3 = [3, 1, 1];

export function buildSpatula(): VoxelGrid {
  return recipe([8, 24, 4], (v) => {
    v.cylinder("y", [3.5, 6, 1.6], 1.15, 6, Slot.HANDLE);
    v.box([0, 11, 0], [8, 23, 2], Slot.METAL);
    v.box([1, 13, 0], [3, 15, 2], 0);
    v.box([5, 13, 0], [7, 15, 2], 0);
    v.box([1, 17, 0], [3, 19, 2], 0);
    v.box([5, 17, 0], [7, 19, 2], 0);
    v.paintSurface("+z", { min: [0, 11, 0], max: [8, 23, 4] }, Slot.METAL_DARK, [Slot.METAL]);
  });
}
