import {
  cloneGrid,
  countFilled,
  createGrid,
  getVoxel,
  mirrorX,
  placeGrid,
  setVoxel,
  type Vec3,
  type VoxelGrid,
} from "./grid";

export interface Region {
  min: Vec3;
  max: Vec3;
}

function regionOf(min: Vec3, max: Vec3): Region {
  return { min, max };
}

/**
 * Sculpting context. Coordinates are voxel indices. `box` / region `max`
 * corners are exclusive. Ellipsoids, spheres and cylinders test voxel centres.
 */
export interface Sculpt {
  readonly grid: VoxelGrid;
  box(min: Vec3, max: Vec3, slot: number): Sculpt;
  ellipsoid(center: Vec3, radii: Vec3, slot: number): Sculpt;
  sphere(center: Vec3, radius: number, slot: number): Sculpt;
  cylinder(axis: "x" | "y" | "z", center: Vec3, radius: number, half: number, slot: number): Sculpt;
  cone(axis: "x" | "y" | "z", center: Vec3, r0: number, r1: number, half: number, slot: number): Sculpt;
  tube(points: Vec3[], radius: number, slot: number): Sculpt;
  carveBox(min: Vec3, max: Vec3): Sculpt;
  carveEllipsoid(center: Vec3, radii: Vec3): Sculpt;
  paint(region: Region, slot: number, only?: number[]): Sculpt;
  paintSurface(dir: "+x" | "-x" | "+y" | "-y" | "+z" | "-z", region: Region, slot: number, only?: number[]): Sculpt;
  protrude(dir: "+x" | "-x" | "+y" | "-y" | "+z" | "-z", at: Vec3, slot: number, depth?: number): Sculpt;
  shadeBy(axis: "x" | "y" | "z", slots: number[]): Sculpt;
  noise(seed: number, amount: number, slots?: number[]): Sculpt;
  pattern(kind: "songket" | "checker" | "stripe", region: Region, slots: number[]): Sculpt;
  mirror(axis: "x"): Sculpt;
  place(child: VoxelGrid, at: Vec3): Sculpt;
  set(x: number, y: number, z: number, slot: number): Sculpt;
  get(x: number, y: number, z: number): number;
}

const DIR: Record<string, Vec3> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

function hash(x: number, y: number, z: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440678901) + Math.imul(seed, 1274126177)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967295;
}

function forEach(g: VoxelGrid, fn: (x: number, y: number, z: number, v: number) => void) {
  for (let z = 0; z < g.sz; z++) {
    for (let y = 0; y < g.sy; y++) {
      for (let x = 0; x < g.sx; x++) fn(x, y, z, getVoxel(g, x, y, z));
    }
  }
}

function inRegion(region: Region, x: number, y: number, z: number): boolean {
  return (
    x >= region.min[0] &&
    y >= region.min[1] &&
    z >= region.min[2] &&
    x < region.max[0] &&
    y < region.max[1] &&
    z < region.max[2]
  );
}

export function recipe(size: Vec3, build: (v: Sculpt) => void): VoxelGrid {
  const grid = createGrid(size[0], size[1], size[2]);
  const api = createSculpt(grid);
  build(api);
  return grid;
}

export function createSculpt(grid: VoxelGrid): Sculpt {
  const api: Sculpt = {
    grid,
    box(min, max, slot) {
      const x0 = Math.max(0, Math.floor(min[0]));
      const y0 = Math.max(0, Math.floor(min[1]));
      const z0 = Math.max(0, Math.floor(min[2]));
      const x1 = Math.min(grid.sx, Math.ceil(max[0]));
      const y1 = Math.min(grid.sy, Math.ceil(max[1]));
      const z1 = Math.min(grid.sz, Math.ceil(max[2]));
      for (let z = z0; z < z1; z++) {
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) setVoxel(grid, x, y, z, slot);
        }
      }
      return api;
    },
    ellipsoid(center, radii, slot) {
      const [cx, cy, cz] = center;
      const [rx, ry, rz] = radii;
      const x0 = Math.max(0, Math.floor(cx - rx - 1));
      const y0 = Math.max(0, Math.floor(cy - ry - 1));
      const z0 = Math.max(0, Math.floor(cz - rz - 1));
      const x1 = Math.min(grid.sx, Math.ceil(cx + rx + 1));
      const y1 = Math.min(grid.sy, Math.ceil(cy + ry + 1));
      const z1 = Math.min(grid.sz, Math.ceil(cz + rz + 1));
      for (let z = z0; z < z1; z++) {
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const nx = (x + 0.5 - cx) / rx;
            const ny = (y + 0.5 - cy) / ry;
            const nz = (z + 0.5 - cz) / rz;
            if (nx * nx + ny * ny + nz * nz <= 1) setVoxel(grid, x, y, z, slot);
          }
        }
      }
      return api;
    },
    sphere(center, radius, slot) {
      return api.ellipsoid(center, [radius, radius, radius], slot);
    },
    cylinder(axis, center, radius, half, slot) {
      return api.cone(axis, center, radius, radius, half, slot);
    },
    cone(axis, center, r0, r1, half, slot) {
      const [cx, cy, cz] = center;
      const rad = Math.max(r0, r1);
      const x0 = Math.max(0, Math.floor(cx - (axis === "x" ? half : rad) - 1));
      const y0 = Math.max(0, Math.floor(cy - (axis === "y" ? half : rad) - 1));
      const z0 = Math.max(0, Math.floor(cz - (axis === "z" ? half : rad) - 1));
      const x1 = Math.min(grid.sx, Math.ceil(cx + (axis === "x" ? half : rad) + 1));
      const y1 = Math.min(grid.sy, Math.ceil(cy + (axis === "y" ? half : rad) + 1));
      const z1 = Math.min(grid.sz, Math.ceil(cz + (axis === "z" ? half : rad) + 1));
      for (let z = z0; z < z1; z++) {
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const px = x + 0.5;
            const py = y + 0.5;
            const pz = z + 0.5;
            let along = 0;
            let d2 = 0;
            if (axis === "y") {
              along = py - cy;
              d2 = (px - cx) ** 2 + (pz - cz) ** 2;
            } else if (axis === "x") {
              along = px - cx;
              d2 = (py - cy) ** 2 + (pz - cz) ** 2;
            } else {
              along = pz - cz;
              d2 = (px - cx) ** 2 + (py - cy) ** 2;
            }
            if (Math.abs(along) > half) continue;
            const t = half === 0 ? 0 : (along + half) / (half * 2);
            const r = r0 + (r1 - r0) * t;
            if (d2 <= r * r) setVoxel(grid, x, y, z, slot);
          }
        }
      }
      return api;
    },
    tube(points, radius, slot) {
      if (points.length === 0) return api;
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (const p of points) {
        minX = Math.min(minX, p[0]);
        minY = Math.min(minY, p[1]);
        minZ = Math.min(minZ, p[2]);
        maxX = Math.max(maxX, p[0]);
        maxY = Math.max(maxY, p[1]);
        maxZ = Math.max(maxZ, p[2]);
      }
      const pad = radius + 1;
      const x0 = Math.max(0, Math.floor(minX - pad));
      const y0 = Math.max(0, Math.floor(minY - pad));
      const z0 = Math.max(0, Math.floor(minZ - pad));
      const x1 = Math.min(grid.sx, Math.ceil(maxX + pad));
      const y1 = Math.min(grid.sy, Math.ceil(maxY + pad));
      const z1 = Math.min(grid.sz, Math.ceil(maxZ + pad));
      const r2 = radius * radius;
      for (let z = z0; z < z1; z++) {
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const px = x + 0.5;
            const py = y + 0.5;
            const pz = z + 0.5;
            let best = Infinity;
            for (let i = 0; i < points.length - 1; i++) {
              const a = points[i];
              const b = points[i + 1];
              const abx = b[0] - a[0];
              const aby = b[1] - a[1];
              const abz = b[2] - a[2];
              const apx = px - a[0];
              const apy = py - a[1];
              const apz = pz - a[2];
              const ab2 = abx * abx + aby * aby + abz * abz || 1;
              let t = (apx * abx + apy * aby + apz * abz) / ab2;
              if (t < 0) t = 0;
              else if (t > 1) t = 1;
              const dx = apx - abx * t;
              const dy = apy - aby * t;
              const dz = apz - abz * t;
              const d = dx * dx + dy * dy + dz * dz;
              if (d < best) best = d;
            }
            if (points.length === 1) {
              const a = points[0];
              const dx = px - a[0];
              const dy = py - a[1];
              const dz = pz - a[2];
              best = dx * dx + dy * dy + dz * dz;
            }
            if (best <= r2) setVoxel(grid, x, y, z, slot);
          }
        }
      }
      return api;
    },
    carveBox(min, max) {
      return api.box(min, max, 0);
    },
    carveEllipsoid(center, radii) {
      return api.ellipsoid(center, radii, 0);
    },
    paint(region, slot, only) {
      const allow = only ? new Set(only) : null;
      forEach(grid, (x, y, z, v) => {
        if (v === 0 || !inRegion(region, x, y, z)) return;
        if (allow && !allow.has(v)) return;
        setVoxel(grid, x, y, z, slot);
      });
      return api;
    },
    paintSurface(dir, region, slot, only) {
      const d = DIR[dir];
      const allow = only ? new Set(only) : null;
      forEach(grid, (x, y, z, v) => {
        if (v === 0 || !inRegion(region, x, y, z)) return;
        if (allow && !allow.has(v)) return;
        if (getVoxel(grid, x + d[0], y + d[1], z + d[2]) === 0) setVoxel(grid, x, y, z, slot);
      });
      return api;
    },
    protrude(dir, at, slot, depth = 1) {
      const d = DIR[dir];
      let x = Math.floor(at[0]);
      let y = Math.floor(at[1]);
      let z = Math.floor(at[2]);
      if (getVoxel(grid, x, y, z) === 0) {
        for (let i = 0; i < 24; i++) {
          x -= d[0];
          y -= d[1];
          z -= d[2];
          if (getVoxel(grid, x, y, z) !== 0) {
            x += d[0];
            y += d[1];
            z += d[2];
            break;
          }
        }
      } else {
        for (let i = 0; i < 24 && getVoxel(grid, x + d[0], y + d[1], z + d[2]) !== 0; i++) {
          x += d[0];
          y += d[1];
          z += d[2];
        }
        x += d[0];
        y += d[1];
        z += d[2];
      }
      for (let i = 0; i < depth; i++) {
        setVoxel(grid, x + d[0] * i, y + d[1] * i, z + d[2] * i, slot);
      }
      return api;
    },
    shadeBy(axis, slots) {
      if (slots.length === 0) return api;
      const family = new Set(slots);
      let min = Infinity;
      let max = -Infinity;
      forEach(grid, (x, y, z, v) => {
        if (!family.has(v)) return;
        const c = axis === "x" ? x : axis === "y" ? y : z;
        if (c < min) min = c;
        if (c > max) max = c;
      });
      if (!Number.isFinite(min)) return api;
      const span = Math.max(1, max - min);
      forEach(grid, (x, y, z, v) => {
        if (!family.has(v)) return;
        const c = axis === "x" ? x : axis === "y" ? y : z;
        const t = (c - min) / span;
        const idx = Math.min(slots.length - 1, Math.floor(t * slots.length));
        setVoxel(grid, x, y, z, slots[idx]);
      });
      return api;
    },
    noise(seed, amount, slots) {
      const family = slots ? new Set(slots) : null;
      forEach(grid, (x, y, z, v) => {
        if (v === 0) return;
        if (family && !family.has(v)) return;
        const h = hash(x, y, z, seed);
        if (h > amount) return;
        const dir = hash(x, y, z, seed + 19) > 0.5 ? 1 : -1;
        const next = v + dir;
        if (next > 0 && next < 256) setVoxel(grid, x, y, z, next);
      });
      return api;
    },
    pattern(kind, region, slots) {
      if (slots.length === 0) return api;
      const family = new Set(slots);
      forEach(grid, (x, y, z, v) => {
        if (!family.has(v) || !inRegion(region, x, y, z)) return;
        let slot = slots[0];
        if (kind === "checker") {
          slot = slots[(x + y + z) & 1] ?? slots[0];
        } else if (kind === "stripe") {
          slot = slots[Math.abs(y) % slots.length];
        } else {
          const px = ((x % 6) + 6) % 6;
          const py = ((y % 6) + 6) % 6;
          const diamond = (px === 3 && py === 3) || (px === 0 && py === 0);
          const thread = px === 0 || py === 0 || (x + y) % 5 === 0;
          if (diamond) slot = slots[Math.min(2, slots.length - 1)];
          else if (thread) slot = slots[Math.min(1, slots.length - 1)];
          else slot = slots[0];
          if ((px === 2 && py === 4) || (px === 4 && py === 2)) {
            slot = slots[slots.length - 1];
          }
        }
        setVoxel(grid, x, y, z, slot);
      });
      return api;
    },
    mirror() {
      mirrorX(grid);
      return api;
    },
    place(child, at) {
      placeGrid(grid, child, at);
      return api;
    },
    set(x, y, z, slot) {
      setVoxel(grid, x, y, z, slot);
      return api;
    },
    get(x, y, z) {
      return getVoxel(grid, x, y, z);
    },
  };
  return api;
}

export function filledCount(g: VoxelGrid): number {
  return countFilled(g);
}

export function cloneSculptGrid(g: VoxelGrid): VoxelGrid {
  return cloneGrid(g);
}

export { regionOf };
