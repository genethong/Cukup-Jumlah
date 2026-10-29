import { BufferGeometry, Group, Mesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec3, VoxelGrid } from "../../core/grid";
import { meshGrid } from "../../core/mesher";
import { getEmissiveMaterial, getVoxelMaterial } from "../../core/materials";
import { buildLinearPalette, isEmissiveSlot, Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";
import { VOXEL_SIZE } from "../../core/scale";
import {
  buildBin,
  buildBunting,
  buildFlag,
  buildGrassTuft,
  buildLampPost,
  buildMenuBoard,
  buildPhotographer,
  buildPlant,
  buildStool,
} from "../props/dressing";
import { buildStall } from "../props/stall";

const VS = VOXEL_SIZE;
export const TILE_TOP = 9;

function hash(x: number, y: number, z: number): number {
  let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function insideIsland(x: number, z: number, sx: number, sz: number): boolean {
  const nx = ((x + 0.5) / sx) * 2 - 1;
  const nz = ((z + 0.5) / sz) * 2 - 1;
  const e = nx * nx * 0.86 + nz * nz * 1.05;
  return e < 0.8 + (hash(x, 3, z) - 0.5) * 0.1;
}

function buildPlatform(): VoxelGrid {
  const sx = 136;
  const sy = 14;
  const sz = 108;
  return recipe([sx, sy, sz], (v) => {
    for (let z = 0; z < sz; z++) {
      for (let x = 0; x < sx; x++) {
        if (!insideIsland(x, z, sx, sz)) continue;
        const edge =
          !insideIsland(x - 1, z, sx, sz) ||
          !insideIsland(x + 1, z, sx, sz) ||
          !insideIsland(x, z - 1, sx, sz) ||
          !insideIsland(x, z + 1, sx, sz);
        const flat = x > 24 && x < 56 && z > 48 && z < 78;
        const stone = hash(Math.floor(x / 4), 0, Math.floor(z / 4));
        const mortar = x % 4 === 0 || z % 4 === 0;
        const top = flat ? TILE_TOP : TILE_TOP - 1 + (stone > 0.84 ? 1 : 0);
        const cap = mortar ? Slot.MORTAR : stone < 0.34 ? Slot.STONE_0 : stone < 0.67 ? Slot.STONE_1 : Slot.STONE_2;
        for (let y = 0; y <= top; y++) {
          const shell = y <= 2 || y >= top - 1 || edge;
          if (!shell) continue;
          let slot: number = cap;
          if (y <= 1) slot = Slot.STONE_3;
          else if (y <= 3) slot = Slot.EARTH;
          else if (y < top) slot = Slot.STONE_0;
          v.set(x, y, z, slot);
        }
        if (edge && hash(x, 8, z) > 0.62 && top < sy - 2) {
          v.set(x, top + 1, z, hash(x, 1, z) > 0.5 ? Slot.GRASS_1 : Slot.GRASS_2);
          if (hash(x, 4, z) > 0.75) v.set(x, top + 2, z, Slot.GRASS_0);
        }
      }
    }
  });
}

export interface MamakCorner {
  group: Group;
  voxels: number;
  triangles: number;
  /** World-space anchors, in metres. */
  feet: Vec3;
  lamp: Vec3;
  stallLight: Vec3;
  flash: Vec3;
}

export function buildMamakCorner(): MamakCorner {
  const colors = buildLinearPalette();
  const opaque: BufferGeometry[] = [];
  const emissive: BufferGeometry[] = [];
  let voxels = 0;
  let triangles = 0;

  const add = (grid: VoxelGrid, at: Vec3) => {
    const meshed = meshGrid(grid, {
      colors,
      voxelSize: VS,
      jitter: 0.035,
      seed: 5,
      emissive: isEmissiveSlot,
    });
    voxels += meshed.voxels;
    triangles += meshed.triangles;
    const shift = (geo: BufferGeometry | null) => {
      if (!geo) return;
      geo.translate(at[0] * VS, at[1] * VS, at[2] * VS);
    };
    if (meshed.opaque) {
      shift(meshed.opaque);
      opaque.push(meshed.opaque);
    }
    if (meshed.emissive) {
      shift(meshed.emissive);
      emissive.push(meshed.emissive);
    }
  };

  add(buildPlatform(), [0, 0, 0]);
  const stallAt: Vec3 = [66, TILE_TOP, 8];
  add(buildStall(), stallAt);
  add(buildLampPost(), [6, TILE_TOP, 46]);
  add(buildFlag(), [50, TILE_TOP, 50]);
  add(buildBunting(), [70, TILE_TOP + 28, 18]);
  add(buildPlant(false), [14, TILE_TOP, 58]);
  add(buildPlant(true), [118, TILE_TOP, 40]);
  add(buildPlant(false), [60, TILE_TOP, 24]);
  add(buildGrassTuft(true), [62, TILE_TOP, 96]);
  add(buildGrassTuft(false), [18, TILE_TOP, 70]);
  add(buildStool(), [82, TILE_TOP, 46]);
  add(buildStool(), [94, TILE_TOP, 48]);
  add(buildStool(), [106, TILE_TOP, 46]);
  add(buildBin(), [112, TILE_TOP, 36]);
  add(buildMenuBoard(), [100, TILE_TOP + 8, 40]);
  const photoAt: Vec3 = [84, TILE_TOP, 72];
  add(buildPhotographer(), photoAt);

  const group = new Group();
  group.name = "mamak-corner";
  if (opaque.length) {
    const geo = mergeGeometries(opaque, false);
    if (geo) {
      const mesh = new Mesh(geo, getVoxelMaterial());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = "diorama-opaque";
      group.add(mesh);
    }
  }
  if (emissive.length) {
    const geo = mergeGeometries(emissive, false);
    if (geo) {
      const mesh = new Mesh(geo, getEmissiveMaterial());
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.name = "diorama-glow";
      group.add(mesh);
    }
  }

  const w = (v: Vec3): Vec3 => [v[0] * VS, v[1] * VS, v[2] * VS];
  return {
    group,
    voxels,
    triangles,
    feet: w([32, TILE_TOP, 64]),
    lamp: w([10, TILE_TOP + 23, 50]),
    stallLight: w([stallAt[0] + 32, TILE_TOP + 18, stallAt[2] + 22]),
    flash: w([photoAt[0] + 11, TILE_TOP + 17, photoAt[2] + 13]),
  };
}
