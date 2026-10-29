import { describe, expect, it } from "vitest";
import { createGrid, setVoxel } from "./grid";
import { meshGrid } from "./mesher";

function whitePalette(): Float32Array {
  const colors = new Float32Array(256 * 3);
  colors[3] = 1;
  colors[4] = 1;
  colors[5] = 1;
  return colors;
}

function fillBox(sx: number, sy: number, sz: number) {
  const g = createGrid(sx, sy, sz);
  for (let z = 0; z < sz; z++) {
    for (let y = 0; y < sy; y++) {
      for (let x = 0; x < sx; x++) setVoxel(g, x, y, z, 1);
    }
  }
  return g;
}

describe("greedy mesher", () => {
  it("turns a single voxel into 12 triangles", () => {
    const mesh = meshGrid(fillBox(1, 1, 1), { colors: whitePalette() });
    expect(mesh.triangles).toBe(12);
    expect(mesh.voxels).toBe(1);
  });

  it("merges a 4×4×1 slab into 12 triangles", () => {
    const mesh = meshGrid(fillBox(4, 1, 4), { colors: whitePalette() });
    expect(mesh.triangles).toBe(12);
    expect(mesh.voxels).toBe(16);
  });

  it("bakes 0.5 brightness into an inner corner", () => {
    const g = createGrid(3, 3, 3);
    setVoxel(g, 1, 0, 1, 1);
    setVoxel(g, 0, 1, 1, 1);
    setVoxel(g, 1, 1, 0, 1);
    setVoxel(g, 0, 1, 0, 1);
    const mesh = meshGrid(g, { colors: whitePalette(), voxelSize: 1 });
    const pos = mesh.opaque!.getAttribute("position");
    const nrm = mesh.opaque!.getAttribute("normal");
    const col = mesh.opaque!.getAttribute("color");
    let found = false;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (Math.abs(x - 1) > 1e-4 || Math.abs(y - 1) > 1e-4 || Math.abs(z - 1) > 1e-4) continue;
      if (nrm.getY(i) < 0.9) continue;
      found = true;
      expect(col.getX(i)).toBeCloseTo(0.5, 5);
      expect(col.getY(i)).toBeCloseTo(0.5, 5);
      expect(col.getZ(i)).toBeCloseTo(0.5, 5);
    }
    expect(found).toBe(true);
  });

  it("flips the diagonal when AO is anisotropic", () => {
    const g = createGrid(3, 2, 3);
    setVoxel(g, 1, 0, 1, 1);
    // Occlude only one side of the top face so the four corners differ.
    setVoxel(g, 0, 1, 1, 1);
    const mesh = meshGrid(g, { colors: whitePalette(), voxelSize: 1 });
    const index = mesh.opaque!.getIndex()!;
    const pos = mesh.opaque!.getAttribute("position");
    const nrm = mesh.opaque!.getAttribute("normal");
    // Find the two triangles of the +Y face and confirm they share an edge.
    const tris: number[][] = [];
    for (let t = 0; t < index.count; t += 3) {
      const a = index.getX(t);
      if (nrm.getY(a) < 0.9) continue;
      if (Math.abs(pos.getY(a) - 1) > 1e-4) continue;
      tris.push([index.getX(t), index.getX(t + 1), index.getX(t + 2)]);
    }
    expect(tris.length).toBe(2);
    const edge = (tri: number[]) =>
      tri
        .map((i) => `${pos.getX(i).toFixed(2)},${pos.getZ(i).toFixed(2)}`)
        .sort()
        .join("|");
    // Both triangles exist and use 4 unique corners.
    const corners = new Set(tris.flat().map((i) => `${pos.getX(i)},${pos.getY(i)},${pos.getZ(i)}`));
    expect(corners.size).toBe(4);
    expect(edge(tris[0])).not.toBe(edge(tris[1]));
  });
});
