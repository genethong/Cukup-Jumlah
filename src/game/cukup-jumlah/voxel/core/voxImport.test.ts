import { describe, expect, it } from "vitest";
import { countFilled, getVoxel } from "./grid";
import { Slot } from "./palette";
import { parseVox } from "./voxImport";

/** Minimal MagicaVoxel file: one red voxel at the origin. */
function encodeSampleVox(): ArrayBuffer {
  const chunks: Uint8Array[] = [];

  const size = new ArrayBuffer(12);
  const sizeView = new DataView(size);
  sizeView.setUint32(0, 1, true);
  sizeView.setUint32(4, 1, true);
  sizeView.setUint32(8, 1, true);
  chunks.push(wrapChunk("SIZE", new Uint8Array(size)));

  const xyzi = new Uint8Array(4 + 4);
  const xyziView = new DataView(xyzi.buffer);
  xyziView.setUint32(0, 1, true);
  xyzi[4] = 0;
  xyzi[5] = 0;
  xyzi[6] = 0;
  xyzi[7] = 1;
  chunks.push(wrapChunk("XYZI", xyzi));

  const rgba = new Uint8Array(256 * 4);
  // Index 1 in the file is the first RGBA entry (loader stores it at palette[1]).
  rgba[0] = 210;
  rgba[1] = 38;
  rgba[2] = 44;
  rgba[3] = 255;
  chunks.push(wrapChunk("RGBA", rgba));

  let children = 0;
  for (const c of chunks) children += c.length;
  const main = wrapChunk("MAIN", new Uint8Array(0), children);

  const body = new Uint8Array(8 + main.length + children);
  body[0] = 86;
  body[1] = 79;
  body[2] = 88;
  body[3] = 32;
  const view = new DataView(body.buffer);
  view.setUint32(4, 150, true);
  body.set(main, 8);
  let offset = 8 + main.length;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.length;
  }
  return body.buffer;
}

function wrapChunk(id: string, content: Uint8Array, childrenSize = 0): Uint8Array {
  const out = new Uint8Array(12 + content.length);
  out[0] = id.charCodeAt(0);
  out[1] = id.charCodeAt(1);
  out[2] = id.charCodeAt(2);
  out[3] = id.charCodeAt(3);
  const view = new DataView(out.buffer);
  view.setUint32(4, content.length, true);
  view.setUint32(8, childrenSize, true);
  out.set(content, 12);
  return out;
}

describe("vox import", () => {
  it("snaps a VOXLoader chunk onto the master palette", () => {
    const grids = parseVox(encodeSampleVox());
    expect(grids).toHaveLength(1);
    expect(grids[0].sx).toBe(1);
    expect(countFilled(grids[0])).toBe(1);
    const slot = getVoxel(grids[0], 0, 0, 0);
    expect(slot).toBe(Slot.CLOTH_A_1);
  });
});
