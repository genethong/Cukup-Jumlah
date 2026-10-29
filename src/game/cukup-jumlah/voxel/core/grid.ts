/** Dense voxel volume. Index 0 is empty. */

export type Vec3 = [number, number, number];

export interface VoxelGrid {
  sx: number;
  sy: number;
  sz: number;
  data: Uint8Array;
}

export function createGrid(sx: number, sy: number, sz: number): VoxelGrid {
  if (sx < 1 || sy < 1 || sz < 1) {
    throw new Error(`Invalid grid size ${sx}x${sy}x${sz}`);
  }
  return { sx, sy, sz, data: new Uint8Array(sx * sy * sz) };
}

export function inBounds(g: VoxelGrid, x: number, y: number, z: number): boolean {
  return x >= 0 && y >= 0 && z >= 0 && x < g.sx && y < g.sy && z < g.sz;
}

export function indexOf(g: VoxelGrid, x: number, y: number, z: number): number {
  return x + g.sx * (y + g.sy * z);
}

export function getVoxel(g: VoxelGrid, x: number, y: number, z: number): number {
  if (!inBounds(g, x, y, z)) return 0;
  return g.data[indexOf(g, x, y, z)];
}

export function setVoxel(g: VoxelGrid, x: number, y: number, z: number, value: number): void {
  if (!inBounds(g, x, y, z)) return;
  g.data[indexOf(g, x, y, z)] = value;
}

export function countFilled(g: VoxelGrid): number {
  let n = 0;
  const data = g.data;
  for (let i = 0; i < data.length; i++) if (data[i] !== 0) n++;
  return n;
}

/** Copy the low-x half onto the high-x half, reflecting across the grid centre. */
export function mirrorX(g: VoxelGrid): void {
  const mid = Math.floor(g.sx / 2);
  for (let z = 0; z < g.sz; z++) {
    for (let y = 0; y < g.sy; y++) {
      for (let x = 0; x < mid; x++) {
        const src = getVoxel(g, x, y, z);
        setVoxel(g, g.sx - 1 - x, y, z, src);
      }
    }
  }
}

export function cloneGrid(g: VoxelGrid): VoxelGrid {
  return { sx: g.sx, sy: g.sy, sz: g.sz, data: new Uint8Array(g.data) };
}

export function hashGrid(g: VoxelGrid): number {
  let h = 2166136261;
  const data = g.data;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Blit non-empty voxels of `child` so its min corner sits at `at`. */
export function placeGrid(dest: VoxelGrid, child: VoxelGrid, at: Vec3): void {
  for (let z = 0; z < child.sz; z++) {
    for (let y = 0; y < child.sy; y++) {
      for (let x = 0; x < child.sx; x++) {
        const v = getVoxel(child, x, y, z);
        if (v !== 0) setVoxel(dest, at[0] + x, at[1] + y, at[2] + z, v);
      }
    }
  }
}
