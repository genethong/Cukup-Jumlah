import { BufferGeometry, Mesh } from "three";
import type { Group } from "three";
import { meshGrid } from "../../core/mesher";
import { getVoxelMaterial } from "../../core/materials";
import { buildLinearPalette, isEmissiveSlot, Slot } from "../../core/palette";
import { recipe } from "../../core/recipe";
import { VOXEL_SIZE } from "../../core/scale";
import type { Vec3 } from "../../core/grid";

export interface NoodleSpray {
  count: number;
  triangles: number;
  update: (time: number) => void;
}

function bezier(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function curve(c0: Vec3, c1: Vec3, c2: Vec3, c3: Vec3, steps: number): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curl = Math.sin(t * Math.PI * 3) * 1.4;
    pts.push([
      bezier(c0[0], c1[0], c2[0], c3[0], t) + curl,
      bezier(c0[1], c1[1], c2[1], c3[1], t),
      bezier(c0[2], c1[2], c2[2], c3[2], t) + Math.cos(t * Math.PI * 2) * 1.1,
    ]);
  }
  return pts;
}

/** Continuous voxel ribbons, anchored at the spatula tip. */
export function createNoodleSpray(parent: Group): NoodleSpray {
  const origin: Vec3 = [6, 2, 14];
  const grid = recipe([40, 52, 28], (v) => {
    const strands: Vec3[][] = [
      curve([6, 2, 14], [1, 12, 17], [14, 22, 11], [6, 34, 18], 22),
      curve([6, 2, 14], [-4, 12, 18], [-2, 24, 14], [6, 36, 12], 22),
      curve([7, 3, 14], [14, 14, 20], [6, 26, 20], [10, 36, 15], 20),
      curve([5, 2, 13], [0, 14, 8], [10, 26, 9], [2, 36, 16], 20),
    ];
    for (const pts of strands) v.tube(pts, 0.72, Slot.NOODLE);
    const bits: Array<[Vec3, number]> = [
      [[10, 22, 16], Slot.SCALLION],
      [[2, 30, 18], Slot.SCALLION],
      [[12, 36, 20], Slot.MEAT],
      [[4, 40, 12], Slot.MEAT],
      [[8, 44, 15], Slot.SCALLION],
    ];
    for (const [p, slot] of bits) v.sphere(p, 1.15, slot);
  });

  const colors = buildLinearPalette();
  const meshed = meshGrid(grid, {
    colors,
    voxelSize: VOXEL_SIZE,
    jitter: 0.03,
    seed: 3,
    emissive: isEmissiveSlot,
  });
  const geo: BufferGeometry = meshed.opaque ?? new BufferGeometry();
  geo.translate(-origin[0] * VOXEL_SIZE, -origin[1] * VOXEL_SIZE, -origin[2] * VOXEL_SIZE);
  const mesh = new Mesh(geo, getVoxelMaterial());
  mesh.name = "noodles";
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);

  return {
    count: meshed.voxels,
    triangles: meshed.triangles,
    update() {
      /* ribbons are part of the spatula, so the hop carries them */
    },
  };
}
