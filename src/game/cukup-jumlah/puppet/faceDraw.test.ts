import { describe, expect, it } from "vitest";
import { clearLooseFlecks } from "./faceDraw";

const SIZE = 512;

function fill(px: Uint8ClampedArray, x0: number, y0: number, w: number, h: number, alpha: number) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) px[(y * SIZE + x) * 4 + 3] = alpha;
  }
}

const alphaAt = (px: Uint8ClampedArray, x: number, y: number) => px[(y * SIZE + x) * 4 + 3];

describe("clearLooseFlecks", () => {
  it("removes small dark flecks, even when a faint haze joins them to the head", () => {
    const px = new Uint8ClampedArray(SIZE * SIZE * 4);
    fill(px, 100, 100, 200, 200, 255); // head
    fill(px, 300, 200, 10, 2, 12); // faint haze bridge
    fill(px, 310, 195, 20, 20, 255); // 400 px fleck
    clearLooseFlecks(px);
    expect(alphaAt(px, 200, 200)).toBe(255);
    expect(alphaAt(px, 320, 205)).toBe(0);
    expect(alphaAt(px, 308, 200)).toBe(0);
  });

  it("keeps loose locks of hair that are big enough to be real", () => {
    const px = new Uint8ClampedArray(SIZE * SIZE * 4);
    fill(px, 100, 100, 200, 200, 255);
    fill(px, 350, 250, 30, 40, 255); // 1200 px lock
    clearLooseFlecks(px);
    expect(alphaAt(px, 360, 260)).toBe(255);
  });
});
