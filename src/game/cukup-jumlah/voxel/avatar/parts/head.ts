import type { Vec3, VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";
import type { VoxelLook } from "../look";

const SKIN = [Slot.SKIN_0, Slot.SKIN_1, Slot.SKIN_2, Slot.BLUSH];

export const HEAD_ANCHOR: Vec3 = [13, 2, 12];

export function buildHead(look: VoxelLook, blink: boolean): VoxelGrid {
  const thick = blink ? 3 : 2;
  return recipe([26, 24, 24], (v) => {
    v.ellipsoid([13, 12.2, 12], [11.4, 10.5, 10.5], Slot.SKIN_1);
    v.cylinder("y", [13, 5.2, 12], 5.1, 4.6, Slot.SKIN_1);
    v.sphere([1.6, 12.2, 12], 2.5, Slot.SKIN_2);
    v.sphere([24.4, 12.2, 12], 2.5, Slot.SKIN_2);
    v.ellipsoid([13, 11.4, 21.6], [1.8, 1.6, 2.3], Slot.SKIN_0);
    v.paintSurface("+z", { min: [11, 9, 0], max: [15, 11, 26] }, Slot.SKIN_2, SKIN);

    const eye = (cx: number) => {
      for (let i = -4; i <= 4; i++) {
        const arch = 1 - (Math.abs(i) / 4) ** 2;
        const y = Math.round(13.2 + arch * 2.1);
        v.paintSurface("+z", { min: [cx + i, y, 0], max: [cx + i + 1, y + thick + 1, 30] }, Slot.EYE, SKIN);
        v.protrude("+z", [cx + i, y + 1, 18], Slot.EYE, 1);
      }
    };
    eye(8);
    eye(17);

    v.paintSurface("+z", { min: [5, 9, 0], max: [10, 14, 30] }, Slot.BLUSH, SKIN);
    v.paintSurface("+z", { min: [16, 9, 0], max: [21, 14, 30] }, Slot.BLUSH, SKIN);
    v.paintSurface("+y", { min: [8, 16, 14], max: [18, 24, 24] }, Slot.SKIN_0, [Slot.SKIN_1, Slot.SKIN_2]);

    if (look.facial !== "none") {
      v.ellipsoid([13, 9.6, 21.4], [6.4, 1.8, 2.6], Slot.MOUSTACHE);
      v.ellipsoid([7.6, 8.6, 19.8], [2.3, 1.6, 1.8], Slot.MOUSTACHE);
      v.ellipsoid([18.4, 8.6, 19.8], [2.3, 1.6, 1.8], Slot.MOUSTACHE);
    }
    if (look.facial === "beard") {
      v.ellipsoid([13, 6.4, 18.5], [5.5, 2.4, 3.2], Slot.MOUSTACHE);
    }

    for (let i = -2; i <= 2; i++) {
      const y = Math.round(7.4 + (1 - (i / 2) ** 2) * 0.6);
      v.paintSurface("+z", { min: [13 + i, y, 0], max: [14 + i, y + 1, 30] }, Slot.LIP, [
        ...SKIN,
        Slot.MOUSTACHE,
      ]);
    }
  });
}

export const HAIR_ANCHOR: Vec3 = [13, 2, 12];

export function buildHair(): VoxelGrid {
  return recipe([26, 24, 24], (v) => {
    v.ellipsoid([13, 14.5, 11.5], [11.8, 8.2, 11], Slot.HAIR);
    v.carveEllipsoid([13, 11, 22], [8.5, 9, 8]);
    v.carveBox([0, 0, 0], [26, 8, 24]);
    v.sphere([1.2, 13, 12], 2.2, Slot.HAIR);
    v.sphere([24.8, 13, 12], 2.2, Slot.HAIR);
  });
}
