import type { VoxelGrid } from "../../core/grid";
import { Slot } from "../../core/palette";
import { recipe, type Sculpt } from "../../core/recipe";
import { stampText, textWidth } from "../text";

function cup(v: Sculpt, x: number, y: number, z: number) {
  v.box([x, y, z], [x + 6, y + 1, z + 1], Slot.SIGN_TEXT);
  v.box([x, y + 1, z], [x + 1, y + 5, z + 1], Slot.SIGN_TEXT);
  v.box([x + 4, y + 1, z], [x + 5, y + 5, z + 1], Slot.SIGN_TEXT);
  v.box([x, y + 4, z], [x + 5, y + 5, z + 1], Slot.SIGN_TEXT);
  v.box([x + 5, y + 2, z], [x + 7, y + 4, z + 1], Slot.SIGN_TEXT);
  v.set(x + 2, y + 6, z, Slot.SIGN_TEXT);
  v.set(x + 3, y + 7, z, Slot.SIGN_TEXT);
}

/** Hawker stall: brick shell, striped awning, "MAMAK STALL" sign, warm interior. */
export function buildStall(): VoxelGrid {
  return recipe([62, 44, 36], (v) => {
    v.box([4, 0, 2], [56, 3, 30], Slot.BRICK);
    v.box([4, 3, 2], [8, 30, 28], Slot.BRICK);
    v.box([52, 3, 2], [56, 30, 28], Slot.BRICK);
    v.box([4, 3, 2], [56, 30, 6], Slot.BRICK_DARK);
    for (let y = 3; y < 30; y++) {
      for (let x = 8; x < 52; x++) {
        if ((x + y) % 5 === 0) v.set(x, y, 5, Slot.BRICK);
      }
    }

    v.box([8, 8, 16], [52, 13, 28], Slot.WOOD_1);
    v.box([8, 12, 22], [52, 14, 30], Slot.WOOD_2);
    v.box([10, 14, 8], [24, 18, 14], Slot.SHELF);
    v.box([28, 14, 8], [40, 17, 13], Slot.CRATE);
    v.box([12, 18, 7], [20, 21, 12], Slot.CRATE);
    v.box([36, 15, 18], [46, 19, 24], Slot.CRATE);

    v.box([18, 16, 20], [22, 20, 22], Slot.STALL_LAMP);
    v.box([30, 16, 20], [34, 20, 22], Slot.STALL_LAMP);
    v.box([42, 16, 20], [46, 20, 22], Slot.STALL_LAMP);

    for (let x = 2; x < 60; x++) {
      const stripe = Math.floor((x - 2) / 4) % 2 === 0 ? Slot.AWNING_RED : Slot.AWNING_WHITE;
      for (let z = 14; z < 34; z++) {
        const slope = Math.floor(((z - 14) / 20) * 3);
        const y = 30 - slope;
        v.set(x, y, z, stripe);
        v.set(x, y + 1, z, stripe);
      }
    }
    v.box([2, 27, 32], [60, 29, 35], Slot.AWNING_RED);

    v.box([0, 32, 24], [62, 42, 35], Slot.SIGN_BOARD);
    v.box([1, 33, 33], [61, 41, 35], Slot.WOOD_0);
    const label = "MAMAK STALL";
    const tw = textWidth(label);
    stampText(v, label, Math.max(2, Math.floor((48 - tw) / 2)), 35, 34, Slot.SIGN_TEXT);
    cup(v, 50, 34, 34);
  });
}
