import { VOXLoader } from "three/examples/jsm/loaders/VOXLoader.js";
import { createGrid, setVoxel, type VoxelGrid } from "./grid";
import { snapToPalette } from "./palette";

export interface VoxChunk {
  size: { x: number; y: number; z: number };
  /** Packed XYZI bytes (x,y,z,colorIndex) as produced by three's VOXLoader. */
  data: Uint8Array;
  /** Palette entries as little-endian RGBA uint32s. Index 0 is empty. */
  palette: ArrayLike<number>;
}

function rgbaOf(packed: number): { r: number; g: number; b: number; a: number } {
  return {
    r: packed & 255,
    g: (packed >> 8) & 255,
    b: (packed >> 16) & 255,
    a: (packed >> 24) & 255,
  };
}

/** Expand one VOXLoader chunk into a grid, snapping colours onto the master palette. */
export function chunkToGrid(chunk: VoxChunk): VoxelGrid {
  const sx = chunk.size.x;
  const sy = chunk.size.y;
  const sz = chunk.size.z;
  const grid = createGrid(Math.max(1, sx), Math.max(1, sy), Math.max(1, sz));
  const data = chunk.data;
  if (!data) return grid;
  for (let i = 0; i < data.length; i += 4) {
    const x = data[i];
    const y = data[i + 1];
    const z = data[i + 2];
    const colorIndex = data[i + 3];
    if (colorIndex === 0) continue;
    const packed = chunk.palette[colorIndex] ?? 0;
    const { r, g, b, a } = rgbaOf(packed);
    if (a === 0 && r === 0 && g === 0 && b === 0) continue;
    const slot = snapToPalette(r, g, b);
    setVoxel(grid, x, y, z, slot);
  }
  return grid;
}

export function parseVox(buffer: ArrayBuffer): VoxelGrid[] {
  const loader = new VOXLoader();
  const parsed = loader.parse(buffer) as { chunks?: VoxChunk[] } | VoxChunk[] | undefined;
  if (!parsed) return [];
  const chunks: VoxChunk[] = Array.isArray(parsed) ? parsed : (parsed.chunks ?? []);
  return chunks.filter((c) => c && c.size && c.data).map((c) => chunkToGrid(c));
}
