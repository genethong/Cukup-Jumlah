import type { VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";
import { stampText, stampTiny } from "../text";

export function buildLampPost(): VoxelGrid {
  return recipe([8, 28, 8], (v) => {
    v.box([3, 0, 3], [5, 18, 5], Slot.LAMP_POST);
    v.box([2, 17, 2], [6, 19, 6], Slot.LAMP_POST);
    v.box([1, 19, 1], [7, 21, 7], Slot.LAMP_POST);
    v.box([1, 25, 1], [7, 27, 7], Slot.LAMP_POST);
    for (const x of [1, 5]) {
      for (const z of [1, 5]) v.box([x, 21, z], [x + 2, 25, z + 2], Slot.LAMP_POST);
    }
    v.box([2, 21, 2], [6, 25, 6], Slot.LAMP_GLOW);
    v.box([3, 22, 3], [5, 24, 5], Slot.LAMP_CORE);
  });
}

export function buildPlant(flower = false): VoxelGrid {
  return recipe([8, 10, 8], (v) => {
    v.cone("y", [4, 2.2, 4], 3.2, 2.4, 2.2, Slot.POT);
    v.ellipsoid([4, 6.2, 4], [3.2, 2.6, 3.2], Slot.LEAF);
    v.ellipsoid([2.4, 7.2, 3], [1.8, 1.8, 1.8], Slot.LEAF_DARK);
    v.ellipsoid([5.6, 7.4, 5], [1.6, 1.7, 1.6], Slot.LEAF);
    if (flower) {
      v.sphere([4, 8.6, 4.5], 1.3, Slot.FLOWER);
      v.set(4, 9, 5, Slot.FLOWER_CENTER);
    }
  });
}

export function buildGrassTuft(flower = false): VoxelGrid {
  return recipe([8, 6, 8], (v) => {
    v.ellipsoid([4, 1.2, 4], [3.4, 1.4, 3.2], Slot.GRASS_0);
    v.ellipsoid([3, 3, 3], [1.6, 2.2, 1.5], Slot.GRASS_1);
    v.ellipsoid([5.2, 3.2, 5], [1.4, 2.4, 1.4], Slot.GRASS_2);
    v.ellipsoid([4, 2.4, 5.5], [1.2, 1.8, 1.2], Slot.GRASS_1);
    if (flower) {
      v.sphere([4, 4.6, 4], 1.15, Slot.FLOWER);
      v.set(4, 5, 4, Slot.FLOWER_CENTER);
    }
  });
}

/** Generic red-and-cream striped pennant, facing the camera. Not a national flag. */
export function buildFlag(): VoxelGrid {
  return recipe([16, 28, 2], (v) => {
    v.box([12, 0, 0], [14, 22, 2], Slot.POLE);
    v.sphere([13, 22.4, 1], 1.1, Slot.POLE);
    for (let y = 0; y < 8; y++) {
      const span = 11 - y;
      const slot = y % 2 === 0 ? Slot.BUNTING_A : Slot.BUNTING_B;
      for (let x = 0; x < span; x++) v.set(12 - span + x, 15 + y, 0, slot);
    }
  });
}

export function buildBunting(): VoxelGrid {
  return recipe([28, 8, 2], (v) => {
    v.box([0, 6, 0], [28, 7, 1], Slot.POLE);
    const colors = [Slot.BUNTING_A, Slot.BUNTING_B, Slot.BUNTING_C];
    for (let i = 0; i < 6; i++) {
      const x0 = 2 + i * 4;
      const slot = colors[i % 3];
      for (let row = 0; row < 5; row++) {
        const inset = Math.floor(row / 2);
        v.box([x0 + inset, 1 + (4 - row), 0], [x0 + 4 - inset, 2 + (4 - row), 1], slot);
      }
    }
  });
}

export function buildStool(): VoxelGrid {
  return recipe([6, 7, 6], (v) => {
    v.cylinder("y", [3, 5.2, 3], 2.6, 1.1, Slot.WOOD_1);
    v.box([1, 0, 1], [2, 5, 2], Slot.WOOD_0);
    v.box([4, 0, 1], [5, 5, 2], Slot.WOOD_0);
    v.box([1, 0, 4], [2, 5, 5], Slot.WOOD_0);
    v.box([4, 0, 4], [5, 5, 5], Slot.WOOD_0);
  });
}

export function buildBin(): VoxelGrid {
  return recipe([8, 9, 8], (v) => {
    v.box([1, 0, 1], [7, 7, 7], Slot.BIN);
    v.carveBox([2, 3, 2], [6, 7, 6]);
    v.box([0, 6, 0], [8, 8, 8], Slot.BIN_DARK);
    v.carveBox([2, 6, 2], [6, 8, 6]);
  });
}

export function buildPhotographer(): VoxelGrid {
  return recipe([22, 22, 12], (v) => {
    v.box([7, 0, 3], [10, 3, 7], Slot.SHOE);
    v.box([12, 0, 3], [15, 3, 7], Slot.SHOE);
    v.box([7, 3, 3], [10, 8, 7], Slot.JEANS);
    v.box([12, 3, 3], [15, 8, 7], Slot.JEANS);
    v.box([5, 7, 2], [17, 14, 8], Slot.VEST);
    v.box([2, 9, 3], [5, 13, 6], Slot.VEST);
    v.box([17, 9, 3], [20, 13, 6], Slot.VEST);
    v.box([3, 8, 8], [19, 12, 9], Slot.BADGE);
    stampTiny(v, "MEDIA", 2, 9, 9, Slot.BADGE_TEXT);
    v.ellipsoid([11, 16, 5], [2.7, 2.5, 2.5], Slot.SKIN_1);
    v.cone("y", [11, 18.8, 5], 3.0, 2.7, 1.6, Slot.CAM);
    v.box([8, 13, 7], [14, 16, 10], Slot.CAM);
    v.cylinder("z", [11, 14.4, 9.4], 1.25, 1.1, Slot.METAL_DARK);
    v.box([9, 14, 10], [13, 16, 11], Slot.CAM_FLASH);
  });
}

export function buildMenuBoard(): VoxelGrid {
  return recipe([28, 20, 2], (v) => {
    v.box([0, 0, 0], [28, 20, 2], Slot.MENU_BOARD);
    stampText(v, "ROTI", 6, 14, 1, Slot.MENU_TEXT);
    stampText(v, "CANAI", 4, 8, 1, Slot.MENU_TEXT);
    stampText(v, "RM 1.50", 1, 2, 1, Slot.SIGN_TEXT);
  });
}
