import type { Vec3, VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";

export const SONGKOK_ANCHOR: Vec3 = [11, 0, 9];

export function buildSongkok(): VoxelGrid {
  return recipe([22, 8, 18], (v) => {
    v.cone("y", [11, 3.5, 9], 8.6, 7.8, 3.2, Slot.SONGKOK);
    v.paintSurface("+y", { min: [7, 4, 8], max: [15, 8, 14] }, Slot.SONGKOK_HI);
  });
}

export const TUDUNG_ANCHOR: Vec3 = [15, 12, 14];

export function buildTudung(): VoxelGrid {
  return recipe([30, 30, 28], (v) => {
    v.ellipsoid([15, 18, 14], [12.6, 10.5, 12.2], Slot.HEADWEAR);
    v.carveEllipsoid([15, 16, 24], [7.2, 7.4, 7]);
    v.ellipsoid([15, 8, 13], [14.2, 6.5, 11.5], Slot.HEADWEAR);
    v.box([4, 2, 6], [26, 10, 14], Slot.HEADWEAR);
    v.paintSurface("+y", { min: [6, 20, 8], max: [24, 30, 22] }, Slot.HEADWEAR_LIGHT);
    v.paintSurface("+z", { min: [8, 12, 0], max: [22, 22, 28] }, Slot.HEADWEAR_DARK, [Slot.HEADWEAR, Slot.HEADWEAR_LIGHT]);
  });
}

export const CAP_ANCHOR: Vec3 = [12, 3, 11];

export function buildCap(): VoxelGrid {
  return recipe([24, 14, 26], (v) => {
    v.ellipsoid([12, 8.5, 11], [10.2, 5.2, 10], Slot.HEADWEAR);
    v.ellipsoid([12, 6.2, 19.5], [9.4, 1.35, 6.2], Slot.HEADWEAR_DARK);
    v.paintSurface("+y", { min: [6, 8, 8], max: [18, 14, 18] }, Slot.HEADWEAR_LIGHT);
  });
}
