import type { Vec3, VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe, type Sculpt } from "../../core/recipe";

export interface AnchoredGrid {
  grid: VoxelGrid;
  anchor: Vec3;
}

const GOLD = [Slot.GOLD_0, Slot.GOLD_1, Slot.GOLD_2, Slot.OLIVE, Slot.CREAM];
const CLOTH = [Slot.CLOTH_A_0, Slot.CLOTH_A_1, Slot.CLOTH_A_2];

export const TORSO_ANCHOR: Vec3 = [17, 7, 14];

export function buildTorso(): VoxelGrid {
  return recipe([34, 32, 30], (v) => {
    v.ellipsoid([17, 15.2, 14.2], [16.4, 14.6, 14.2], Slot.CLOTH_A_1);
    v.carveEllipsoid([17, 31, 14], [6.2, 7, 6]);

    v.paint({ min: [0, 0, 0], max: [34, 19, 30] }, Slot.GOLD_1, CLOTH);
    v.pattern("songket", { min: [0, 0, 0], max: [34, 19, 30] }, [Slot.GOLD_1, Slot.OLIVE, Slot.GOLD_2, Slot.CREAM]);

    v.box([12, 1, 24], [22, 15, 28], Slot.GOLD_1);
    v.pattern("songket", { min: [12, 1, 24], max: [22, 15, 28] }, [Slot.GOLD_1, Slot.OLIVE, Slot.GOLD_2, Slot.CREAM]);
    v.box([16, 1, 26], [18, 15, 29], Slot.GOLD_0);

    v.paint({ min: [0, 0, 0], max: [34, 2, 30] }, Slot.GOLD_0, GOLD);

    const sashA: Vec3 = [27, 26, 20];
    const sashB: Vec3 = [8, 11, 24];
    for (let z = 8; z < 30; z++) {
      for (let y = 8; y < 30; y++) {
        for (let x = 0; x < 34; x++) {
          const cur = v.get(x, y, z);
          if (cur === 0) continue;
          const px = x + 0.5;
          const py = y + 0.5;
          const pz = z + 0.5;
          const abx = sashB[0] - sashA[0];
          const aby = sashB[1] - sashA[1];
          const abz = sashB[2] - sashA[2];
          const apx = px - sashA[0];
          const apy = py - sashA[1];
          const apz = pz - sashA[2];
          const ab2 = abx * abx + aby * aby + abz * abz;
          let t = (apx * abx + apy * aby + apz * abz) / ab2;
          if (t < 0) t = 0;
          else if (t > 1) t = 1;
          const dx = apx - abx * t;
          const dy = apy - aby * t;
          const dz = apz - abz * t;
          if (dx * dx + dy * dy + dz * dz > 7.5) continue;
          const px6 = ((x % 6) + 6) % 6;
          const py6 = ((y % 6) + 6) % 6;
          const slot =
            px6 === 3 && py6 === 3 ? Slot.CREAM : px6 === 0 || py6 === 0 ? Slot.OLIVE : Slot.GOLD_2;
          v.set(x, y, z, slot);
        }
      }
    }

    for (const y of [18, 21, 24, 27]) {
      v.protrude("+z", [17, y, 18], Slot.BUTTON, 1);
    }

    v.paintSurface("+y", { min: [10, 22, 8], max: [24, 32, 24] }, Slot.GOLD_2, [...CLOTH, ...GOLD]);
    v.paint(
      { min: [14, 24, 10], max: [20, 30, 22] },
      Slot.GOLD_0,
      [Slot.GOLD_2, Slot.CLOTH_A_1, Slot.CLOTH_A_2]
    );
  });
}

export const ARM_R_ANCHOR: Vec3 = [16, 4, 7];
export const ARM_L_ANCHOR: Vec3 = [2, 24, 6];

function cuff(v: Sculpt, at: Vec3) {
  v.paint(
    { min: [at[0] - 5, at[1] - 1, at[2] - 5], max: [at[0] + 6, at[1] + 2, at[2] + 6] },
    Slot.GOLD_2,
    CLOTH
  );
}

export function buildArms(): [VoxelGrid, VoxelGrid] {
  const right = recipe([22, 38, 18], (v) => {
    v.tube(
      [
        [16, 4, 7],
        [3, 14, 5],
        [2, 26, 8],
        [1, 31, 10],
      ],
      4.15,
      Slot.CLOTH_A_1
    );
    v.sphere([1.4, 31.2, 10.2], 3.4, Slot.SKIN_1);
    cuff(v, [2, 27, 9]);
  });
  const left = recipe([16, 28, 16], (v) => {
    v.tube(
      [
        [2, 24, 6],
        [5, 14, 8],
        [8, 8, 12],
      ],
      4.05,
      Slot.CLOTH_A_1
    );
    v.sphere([9.2, 6.4, 13], 3.15, Slot.SKIN_1);
    cuff(v, [6, 10, 9]);
  });
  return [right, left];
}

export const LEG_ANCHOR: Vec3 = [6, 15, 6];

export function buildLegs(): VoxelGrid {
  return recipe([12, 16, 14], (v) => {
    v.cylinder("y", [6, 10, 6], 4.3, 5.2, Slot.CLOTH_A_1);
    v.box([1, 0, 3], [11, 4, 13], Slot.SHOE);
    v.box([2, 3, 8], [10, 5, 13], Slot.SHOE_GOLD);
    v.ellipsoid([6, 3.2, 11.5], [4.2, 1.6, 2.4], Slot.SHOE);
  });
}
