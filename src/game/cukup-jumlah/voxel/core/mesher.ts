import { BufferAttribute, BufferGeometry } from "three";
import { getVoxel, type VoxelGrid } from "./grid";

/**
 * Greedy mesher with baked per-vertex ambient occlusion.
 * Quads merge only when the palette index and the four AO samples match.
 * Anisotropic AO flips the quad diagonal so the shared edge joins the
 * brighter pair. Optional luminance jitter is per merged quad (the merge
 * key stays colour + AO, as specified).
 */

const BRIGHTNESS = [1, 0.8, 0.65, 0.5] as const;

export interface MeshOptions {
  /** Linear RGB, 256 × 3. */
  colors: ArrayLike<number>;
  voxelSize?: number;
  emissive?: (index: number) => boolean;
  jitter?: number;
  seed?: number;
  /** Extra occupancy tested for AO only (other parts, ground). Grid-local voxels. */
  aoSample?: (x: number, y: number, z: number) => boolean;
}

export interface MeshResult {
  opaque: BufferGeometry | null;
  emissive: BufferGeometry | null;
  triangles: number;
  voxels: number;
}

interface FaceDef {
  nx: number;
  ny: number;
  nz: number;
  ux: number;
  uy: number;
  uz: number;
  vx: number;
  vy: number;
  vz: number;
  d: 0 | 1 | 2;
  uAxis: 0 | 1 | 2;
  vAxis: 0 | 1 | 2;
}

const FACES: FaceDef[] = [
  { nx: 1, ny: 0, nz: 0, ux: 0, uy: 1, uz: 0, vx: 0, vy: 0, vz: 1, d: 0, uAxis: 1, vAxis: 2 },
  { nx: -1, ny: 0, nz: 0, ux: 0, uy: 0, uz: 1, vx: 0, vy: 1, vz: 0, d: 0, uAxis: 2, vAxis: 1 },
  { nx: 0, ny: 1, nz: 0, ux: 0, uy: 0, uz: 1, vx: 1, vy: 0, vz: 0, d: 1, uAxis: 2, vAxis: 0 },
  { nx: 0, ny: -1, nz: 0, ux: 1, uy: 0, uz: 0, vx: 0, vy: 0, vz: 1, d: 1, uAxis: 0, vAxis: 2 },
  { nx: 0, ny: 0, nz: 1, ux: 1, uy: 0, uz: 0, vx: 0, vy: 1, vz: 0, d: 2, uAxis: 0, vAxis: 1 },
  { nx: 0, ny: 0, nz: -1, ux: 0, uy: 1, uz: 0, vx: 1, vy: 0, vz: 0, d: 2, uAxis: 1, vAxis: 0 },
];

function occlusion(side1: boolean, side2: boolean, corner: boolean): number {
  if (side1 && side2) return 3;
  return (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
}

function pack(color: number, ao: number[]): number {
  return (
    (ao[0] & 3) |
    ((ao[1] & 3) << 2) |
    ((ao[2] & 3) << 4) |
    ((ao[3] & 3) << 6) |
    ((color & 255) << 8)
  );
}

function unpack(packed: number): { color: number; ao: number[] } {
  return {
    color: (packed >> 8) & 255,
    ao: [packed & 3, (packed >> 2) & 3, (packed >> 4) & 3, (packed >> 6) & 3],
  };
}

function jitterOf(x: number, y: number, z: number, seed: number, amount: number): number {
  if (amount <= 0) return 1;
  let h = (Math.imul(x + seed, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440678901)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  const n = h / 4294967295;
  return 1 + (n * 2 - 1) * amount;
}

interface Bucket {
  positions: number[];
  normals: number[];
  colors: number[];
  indices: number[];
}

function emitQuad(
  bucket: Bucket,
  face: FaceDef,
  origin: [number, number, number],
  w: number,
  h: number,
  ao: number[],
  rgb: [number, number, number],
  jit: number,
  voxelSize: number
) {
  const [ox, oy, oz] = origin;
  const corners: [number, number, number][] = [
    [ox, oy, oz],
    [ox + face.ux * w, oy + face.uy * w, oz + face.uz * w],
    [ox + face.ux * w + face.vx * h, oy + face.uy * w + face.vy * h, oz + face.uz * w + face.vz * h],
    [ox + face.vx * h, oy + face.vy * h, oz + face.vz * h],
  ];
  const base = bucket.positions.length / 3;
  for (let i = 0; i < 4; i++) {
    const bright = BRIGHTNESS[ao[i]];
    const c = corners[i];
    bucket.positions.push(c[0] * voxelSize, c[1] * voxelSize, c[2] * voxelSize);
    bucket.normals.push(face.nx, face.ny, face.nz);
    bucket.colors.push(rgb[0] * bright * jit, rgb[1] * bright * jit, rgb[2] * bright * jit);
  }
  const flip = BRIGHTNESS[ao[0]] + BRIGHTNESS[ao[2]] < BRIGHTNESS[ao[1]] + BRIGHTNESS[ao[3]];
  if (!flip) {
    bucket.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  } else {
    bucket.indices.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
  }
}

function toGeometry(bucket: Bucket): BufferGeometry | null {
  if (bucket.indices.length === 0) return null;
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(bucket.positions), 3));
  geo.setAttribute("normal", new BufferAttribute(new Float32Array(bucket.normals), 3));
  geo.setAttribute("color", new BufferAttribute(new Float32Array(bucket.colors), 3));
  geo.setIndex(bucket.indices);
  geo.computeBoundingSphere();
  return geo;
}

export function meshGrid(grid: VoxelGrid, opts: MeshOptions): MeshResult {
  const voxelSize = opts.voxelSize ?? 1;
  const dims = [grid.sx, grid.sy, grid.sz];
  const occupied =
    opts.aoSample ??
    ((x: number, y: number, z: number) => getVoxel(grid, x, y, z) !== 0);

  const opaque: Bucket = { positions: [], normals: [], colors: [], indices: [] };
  const emissive: Bucket = { positions: [], normals: [], colors: [], indices: [] };

  let voxels = 0;
  const data = grid.data;
  for (let i = 0; i < data.length; i++) if (data[i] !== 0) voxels++;

  for (const face of FACES) {
    const dimsU = dims[face.uAxis];
    const dimsV = dims[face.vAxis];
    const dimsD = dims[face.d];

    for (let slice = 0; slice < dimsD; slice++) {
      const mask = new Int32Array(dimsU * dimsV);

      for (let iv = 0; iv < dimsV; iv++) {
        for (let iu = 0; iu < dimsU; iu++) {
          const p: [number, number, number] = [0, 0, 0];
          p[face.d] = slice;
          p[face.uAxis] = iu;
          p[face.vAxis] = iv;
          const [x, y, z] = p;
          const color = getVoxel(grid, x, y, z);
          if (color === 0) continue;
          if (getVoxel(grid, x + face.nx, y + face.ny, z + face.nz) !== 0) continue;

          const ao = [0, 0, 0, 0];
          for (let corner = 0; corner < 4; corner++) {
            const su = corner === 1 || corner === 2 ? 1 : 0;
            const sv = corner === 2 || corner === 3 ? 1 : 0;
            const uSign = su === 0 ? -1 : 1;
            const vSign = sv === 0 ? -1 : 1;
            const s1 = occupied(
              x + face.nx + face.ux * uSign,
              y + face.ny + face.uy * uSign,
              z + face.nz + face.uz * uSign
            );
            const s2 = occupied(
              x + face.nx + face.vx * vSign,
              y + face.ny + face.vy * vSign,
              z + face.nz + face.vz * vSign
            );
            const sc = occupied(
              x + face.nx + face.ux * uSign + face.vx * vSign,
              y + face.ny + face.uy * uSign + face.vy * vSign,
              z + face.nz + face.uz * uSign + face.vz * vSign
            );
            ao[corner] = occlusion(s1, s2, sc);
          }
          mask[iu + iv * dimsU] = pack(color, ao);
        }
      }

      for (let iv = 0; iv < dimsV; iv++) {
        for (let iu = 0; iu < dimsU; ) {
          const packed = mask[iu + iv * dimsU];
          if (packed === 0) {
            iu++;
            continue;
          }
          let w = 1;
          while (iu + w < dimsU && mask[iu + w + iv * dimsU] === packed) w++;
          let h = 1;
          outer: while (iv + h < dimsV) {
            for (let k = 0; k < w; k++) {
              if (mask[iu + k + (iv + h) * dimsU] !== packed) break outer;
            }
            h++;
          }
          for (let j = 0; j < h; j++) {
            for (let k = 0; k < w; k++) mask[iu + k + (iv + j) * dimsU] = 0;
          }

          const { color, ao } = unpack(packed);
          const p: [number, number, number] = [0, 0, 0];
          p[face.d] = slice;
          p[face.uAxis] = iu;
          p[face.vAxis] = iv;
          let ox = p[0];
          let oy = p[1];
          let oz = p[2];
          if (face.nx > 0) ox += 1;
          if (face.ny > 0) oy += 1;
          if (face.nz > 0) oz += 1;

          const rgb: [number, number, number] = [
            opts.colors[color * 3] ?? 1,
            opts.colors[color * 3 + 1] ?? 1,
            opts.colors[color * 3 + 2] ?? 1,
          ];
          const jit = jitterOf(p[0], p[1], p[2], opts.seed ?? 1, opts.jitter ?? 0);
          const bucket = opts.emissive?.(color) ? emissive : opaque;
          emitQuad(bucket, face, [ox, oy, oz], w, h, ao, rgb, jit, voxelSize);
          iu += w;
        }
      }
    }
  }

  const opaqueGeo = toGeometry(opaque);
  const emissiveGeo = toGeometry(emissive);
  const triangles =
    (opaqueGeo ? opaqueGeo.index!.count / 3 : 0) + (emissiveGeo ? emissiveGeo.index!.count / 3 : 0);

  return { opaque: opaqueGeo, emissive: emissiveGeo, triangles, voxels };
}

export function triangleCount(result: MeshResult): number {
  return result.triangles;
}
