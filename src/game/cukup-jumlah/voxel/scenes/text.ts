import type { Sculpt } from "../core/recipe";

/** 5-row glyphs. First row is the top. M is wider so the stall sign stays readable. */
const FONT: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  I: ["1", "1", "1", "1", "1"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["101", "111", "111", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "5": ["111", "100", "111", "001", "110"],
  ".": ["0", "0", "0", "0", "1"],
  " ": ["00", "00", "00", "00", "00"],
};

export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    const g = FONT[ch] ?? FONT[" "];
    w += g[0].length + 1;
  }
  return Math.max(0, w - 1);
}

/** Stamp a 3-row label. Fits a vest badge. */
export function stampTiny(v: Sculpt, text: string, x: number, y: number, z: number, slot: number): number {
  const tiny: Record<string, string[]> = {
    M: ["1001", "1111", "1001"],
    E: ["111", "110", "111"],
    D: ["110", "101", "110"],
    I: ["1", "1", "1"],
    A: ["111", "101", "111"],
  };
  let cursor = x;
  for (const ch of text) {
    const rows = tiny[ch];
    if (!rows) {
      cursor += 2;
      continue;
    }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "1") v.set(cursor + c, y + (rows.length - 1 - r), z, slot);
      }
    }
    cursor += rows[0].length + 1;
  }
  return cursor - x;
}
export function stampText(v: Sculpt, text: string, x: number, y: number, z: number, slot: number): number {
  let cursor = x;
  for (const ch of text) {
    const rows = FONT[ch] ?? FONT[" "];
    const h = rows.length;
    for (let r = 0; r < h; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === "1") v.set(cursor + c, y + (h - 1 - r), z, slot);
      }
    }
    cursor += rows[0].length + 1;
  }
  return Math.max(0, cursor - x - 1);
}
