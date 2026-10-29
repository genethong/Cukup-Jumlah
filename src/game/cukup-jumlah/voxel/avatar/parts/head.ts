import type { Vec3, VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";
import type { VoxelLook } from "../look";

const SKIN = [Slot.SKIN_0, Slot.SKIN_1, Slot.SKIN_2, Slot.BLUSH];

export const HEAD_ANCHOR: Vec3 = [14, 2, 11];

export function buildHead(look: VoxelLook, blink: boolean): VoxelGrid {
  return recipe([28, 22, 22], (v) => {
    // Wide, tall face. Depth is smaller so the front stays a readable disc.
    v.ellipsoid([14, 11.2, 11], [12.2, 9.4, 8.4], Slot.SKIN_1);
    v.cylinder("y", [14, 4.2, 11], 4.6, 3.4, Slot.SKIN_1);
    v.sphere([2.2, 11.5, 10], 2.2, Slot.SKIN_2);
    v.sphere([25.8, 11.5, 10], 2.2, Slot.SKIN_2);
    v.ellipsoid([14, 11.6, 18.6], [1.7, 1.8, 2.1], Slot.SKIN_0);

    const smileEye = (cx: number) => {
      const lift = [2, 1, 0, 0, 0, 1, 2];
      for (let i = -3; i <= 3; i++) {
        const y = 12 + lift[i + 3];
        v.set(cx + i, y, 18, Slot.EYE);
        v.set(cx + i, y, 19, Slot.EYE);
        if (blink) v.set(cx + i, y + 1, 19, Slot.EYE);
      }
    };
    smileEye(8);
    smileEye(19);

    v.ellipsoid([7.2, 10.2, 16.8], [2.8, 2.2, 2.2], Slot.BLUSH);
    v.ellipsoid([20.8, 10.2, 16.8], [2.8, 2.2, 2.2], Slot.BLUSH);
    v.paintSurface("+y", { min: [8, 16, 12], max: [20, 22, 20] }, Slot.SKIN_0, [Slot.SKIN_1, Slot.SKIN_2]);

    if (look.facial !== "none") {
      v.ellipsoid([14, 8.2, 19.2], [6.2, 2.15, 2.4], Slot.MOUSTACHE);
      v.ellipsoid([8.4, 7.4, 17.6], [2.2, 1.5, 1.7], Slot.MOUSTACHE);
      v.ellipsoid([19.6, 7.4, 17.6], [2.2, 1.5, 1.7], Slot.MOUSTACHE);
    }
    if (look.facial === "beard") {
      v.ellipsoid([14, 5.6, 16.5], [4.8, 2.2, 2.8], Slot.MOUSTACHE);
    }

    for (let i = -3; i <= 3; i++) {
      const y = Math.round(6.6 + (1 - (Math.abs(i) / 3) ** 2));
      v.paintSurface("+z", { min: [14 + i, y, 0], max: [15 + i, y + 1, 28] }, Slot.LIP, [...SKIN, Slot.MOUSTACHE]);
    }
  });
}

export const HAIR_ANCHOR: Vec3 = [14, 2, 11];

export function buildHair(): VoxelGrid {
  return recipe([28, 22, 22], (v) => {
    v.ellipsoid([14, 14, 10.5], [12.4, 6.5, 8.6], Slot.HAIR);
    v.carveEllipsoid([14, 10, 18], [8, 8, 7]);
    v.carveBox([0, 0, 0], [28, 8, 22]);
  });
}
