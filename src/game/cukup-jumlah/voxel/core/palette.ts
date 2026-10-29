/**
 * Master palette. Index 0 is empty. Semantic slots are stable indices so
 * recipes can paint "SKIN_1" and a remap table recolors them before meshing.
 * 6 skin ramps × 3 shades live at SKIN_RAMP_BASE and are copied into the
 * SKIN_* slots for the active tone.
 */

export const PALETTE_SIZE = 256;

export const Slot = {
  SKIN_0: 1,
  SKIN_1: 2,
  SKIN_2: 3,
  BLUSH: 4,
  LIP: 5,
  HAIR: 6,
  MOUSTACHE: 7,
  EYE: 8,
  BROW: 9,

  SONGKOK: 10,
  SONGKOK_HI: 11,

  CLOTH_A_0: 12,
  CLOTH_A_1: 13,
  CLOTH_A_2: 14,
  BUTTON: 15,

  GOLD_0: 16,
  GOLD_1: 17,
  GOLD_2: 18,
  OLIVE: 19,
  CREAM: 20,

  SHOE: 21,
  SHOE_GOLD: 22,

  STONE_0: 23,
  STONE_1: 24,
  STONE_2: 25,
  STONE_3: 26,
  MORTAR: 27,
  EARTH: 28,

  GRASS_0: 29,
  GRASS_1: 30,
  GRASS_2: 31,
  FLOWER: 32,
  FLOWER_CENTER: 33,

  WOOD_0: 34,
  WOOD_1: 35,
  WOOD_2: 36,

  LAMP_POST: 37,
  LAMP_GLOW: 38,
  LAMP_CORE: 39,

  AWNING_RED: 40,
  AWNING_WHITE: 41,
  SIGN_BOARD: 42,
  SIGN_TEXT: 43,
  MENU_BOARD: 44,
  MENU_TEXT: 45,

  FLAG_RED: 46,
  FLAG_WHITE: 47,
  FLAG_BLUE: 48,
  FLAG_YELLOW: 49,
  POLE: 50,

  POT: 51,
  LEAF: 52,
  LEAF_DARK: 53,
  BIN: 54,
  BIN_DARK: 55,

  METAL: 56,
  METAL_DARK: 57,
  HANDLE: 58,

  VEST: 59,
  BADGE: 60,
  BADGE_TEXT: 61,
  CAM: 62,
  CAM_FLASH: 63,
  JEANS: 64,

  BRICK: 65,
  BRICK_DARK: 66,
  INTERIOR: 67,
  STALL_LAMP: 68,
  SHELF: 69,
  CRATE: 70,

  HEADWEAR: 71,
  HEADWEAR_DARK: 72,
  HEADWEAR_LIGHT: 73,

  NOODLE: 74,
  SCALLION: 75,
  MEAT: 76,
  BUNTING_A: 77,
  BUNTING_B: 78,
  BUNTING_C: 79,
} as const;

export type SlotId = (typeof Slot)[keyof typeof Slot];

/** 6 tones × 3 shades (highlight, base, shadow), stored out of the semantic range. */
export const SKIN_RAMP_BASE = 80;

export const SKIN_RAMPS: readonly (readonly [string, string, string])[] = [
  ["#fde7d4", "#f0c8a4", "#e0a87c"],
  ["#f6c9a3", "#e2a56e", "#c98448"],
  ["#e8b48a", "#d09258", "#b07238"],
  ["#c68642", "#a36427", "#7c4818"],
  ["#8d5524", "#6a3a12", "#4a2408"],
  ["#5c3a21", "#3e2410", "#261406"],
];

const HEX: string[] = new Array(PALETTE_SIZE).fill("#000000");

function put(slot: number, hex: string) {
  HEX[slot] = hex;
}

put(Slot.SKIN_0, SKIN_RAMPS[2][0]);
put(Slot.SKIN_1, SKIN_RAMPS[2][1]);
put(Slot.SKIN_2, SKIN_RAMPS[2][2]);
put(Slot.BLUSH, "#e07a72");
put(Slot.LIP, "#a84858");
put(Slot.HAIR, "#1a120e");
put(Slot.MOUSTACHE, "#140e0c");
put(Slot.EYE, "#2a160f");
put(Slot.BROW, "#1c100c");

put(Slot.SONGKOK, "#161616");
put(Slot.SONGKOK_HI, "#3a3a3a");

put(Slot.CLOTH_A_0, "#8e1c24");
put(Slot.CLOTH_A_1, "#d2262c");
put(Slot.CLOTH_A_2, "#ef5a4a");
put(Slot.BUTTON, "#f2d35a");

put(Slot.GOLD_0, "#a07820");
put(Slot.GOLD_1, "#e2b340");
put(Slot.GOLD_2, "#f6e09a");
put(Slot.OLIVE, "#8e9a48");
put(Slot.CREAM, "#f3e6c0");

put(Slot.SHOE, "#141414");
put(Slot.SHOE_GOLD, "#e6c35a");

put(Slot.STONE_0, "#6a7078");
put(Slot.STONE_1, "#8b919a");
put(Slot.STONE_2, "#a8adb4");
put(Slot.STONE_3, "#5c636c");
put(Slot.MORTAR, "#4e555e");
put(Slot.EARTH, "#6a5340");

put(Slot.GRASS_0, "#2f6b30");
put(Slot.GRASS_1, "#3e8c3a");
put(Slot.GRASS_2, "#6aaa48");
put(Slot.FLOWER, "#e888b0");
put(Slot.FLOWER_CENTER, "#f2d06a");

put(Slot.WOOD_0, "#6e4424");
put(Slot.WOOD_1, "#8d5a32");
put(Slot.WOOD_2, "#c08958");

put(Slot.LAMP_POST, "#1a1a1a");
put(Slot.LAMP_GLOW, "#ffb03a");
put(Slot.LAMP_CORE, "#fff1c2");

put(Slot.AWNING_RED, "#e23b3b");
put(Slot.AWNING_WHITE, "#f6f3ee");
put(Slot.SIGN_BOARD, "#4a3018");
put(Slot.SIGN_TEXT, "#f0c84a");
put(Slot.MENU_BOARD, "#1c1a18");
put(Slot.MENU_TEXT, "#f4efe4");

put(Slot.FLAG_RED, "#c41e24");
put(Slot.FLAG_WHITE, "#f4f4f4");
put(Slot.FLAG_BLUE, "#0033a0");
put(Slot.FLAG_YELLOW, "#ffd100");
put(Slot.POLE, "#d0d4da");

put(Slot.POT, "#8b5434");
put(Slot.LEAF, "#2f8a38");
put(Slot.LEAF_DARK, "#1e5c28");
put(Slot.BIN, "#2f8a48");
put(Slot.BIN_DARK, "#1d5c30");

put(Slot.METAL, "#c5ccd4");
put(Slot.METAL_DARK, "#8e98a4");
put(Slot.HANDLE, "#7a4e2c");

put(Slot.VEST, "#1e3a6e");
put(Slot.BADGE, "#f2f4f8");
put(Slot.BADGE_TEXT, "#141820");
put(Slot.CAM, "#1a1a1a");
put(Slot.CAM_FLASH, "#fff8e8");
put(Slot.JEANS, "#2a3e66");

put(Slot.BRICK, "#8a8580");
put(Slot.BRICK_DARK, "#6a6560");
put(Slot.INTERIOR, "#5a3a28");
put(Slot.STALL_LAMP, "#ffd27a");
put(Slot.SHELF, "#a87448");
put(Slot.CRATE, "#c49a62");

put(Slot.HEADWEAR, "#1a1a1a");
put(Slot.HEADWEAR_DARK, "#0e0e0e");
put(Slot.HEADWEAR_LIGHT, "#3a3a3a");

put(Slot.NOODLE, "#f0d29a");
put(Slot.SCALLION, "#6aaa3a");
put(Slot.MEAT, "#8a4a2a");
put(Slot.BUNTING_A, "#d2262c");
put(Slot.BUNTING_B, "#f6f3ee");
put(Slot.BUNTING_C, "#0033a0");

for (let tone = 0; tone < SKIN_RAMPS.length; tone++) {
  const ramp = SKIN_RAMPS[tone];
  for (let shade = 0; shade < 3; shade++) {
    put(SKIN_RAMP_BASE + tone * 3 + shade, ramp[shade]);
  }
}

export const PALETTE_HEX: readonly string[] = HEX;

/** Slots that are real authored swatches (palette-lint + .vox snapping). */
export const AUTHORED_SLOTS: readonly number[] = [
  ...(Object.values(Slot) as number[]),
  ...Array.from({ length: SKIN_RAMPS.length * 3 }, (_, i) => SKIN_RAMP_BASE + i),
];

const AUTHORED = new Set(AUTHORED_SLOTS);

export function isAuthoredSlot(index: number): boolean {
  return index === 0 || AUTHORED.has(index);
}

export const EMISSIVE_SLOTS: ReadonlySet<number> = new Set([
  Slot.LAMP_GLOW,
  Slot.LAMP_CORE,
  Slot.CAM_FLASH,
  Slot.STALL_LAMP,
]);

export function isEmissiveSlot(index: number): boolean {
  return EMISSIVE_SLOTS.has(index);
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function srgbChannel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToLinear(hex: string): Rgb {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const n = parseInt(h, 16);
  const r = srgbChannel(((n >> 16) & 255) / 255);
  const g = srgbChannel(((n >> 8) & 255) / 255);
  const b = srgbChannel((n & 255) / 255);
  return { r, g, b };
}

export function hexToSrgb8(hex: string): Rgb {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Linear RGB triples, length 256. Slot 0 is black. */
export function buildLinearPalette(overrides?: Map<number, string> | Record<number, string>): Float32Array {
  const out = new Float32Array(PALETTE_SIZE * 3);
  for (let i = 1; i < PALETTE_SIZE; i++) {
    let hex = HEX[i];
    if (overrides) {
      const custom = overrides instanceof Map ? overrides.get(i) : overrides[i];
      if (custom) hex = custom;
    }
    const c = hexToLinear(hex);
    out[i * 3] = c.r;
    out[i * 3 + 1] = c.g;
    out[i * 3 + 2] = c.b;
  }
  return out;
}

export function skinOverride(tone: number): Record<number, string> {
  const ramp = SKIN_RAMPS[Math.max(0, Math.min(SKIN_RAMPS.length - 1, tone))];
  return {
    [Slot.SKIN_0]: ramp[0],
    [Slot.SKIN_1]: ramp[1],
    [Slot.SKIN_2]: ramp[2],
  };
}

function shadeHex(hex: string, dl: number): string {
  const c = hexToSrgb8(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + dl * 255)));
  const r = f(c.r);
  const g = f(c.g);
  const b = f(c.b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function clothOverride(base: string, shadow?: string, light?: string): Record<number, string> {
  return {
    [Slot.CLOTH_A_0]: shadow ?? shadeHex(base, -0.14),
    [Slot.CLOTH_A_1]: base,
    [Slot.CLOTH_A_2]: light ?? shadeHex(base, 0.12),
  };
}

export function headwearOverride(base: string, shadow?: string, light?: string): Record<number, string> {
  return {
    [Slot.HEADWEAR]: base,
    [Slot.HEADWEAR_DARK]: shadow ?? shadeHex(base, -0.16),
    [Slot.HEADWEAR_LIGHT]: light ?? shadeHex(base, 0.14),
  };
}

export function hairOverride(color: "black" | "brown" | "grey"): Record<number, string> {
  const hex = color === "grey" ? "#8a929c" : color === "brown" ? "#6a3a18" : "#1a120e";
  return { [Slot.HAIR]: hex, [Slot.MOUSTACHE]: color === "grey" ? "#5c646c" : "#140e0c" };
}

/** Nearest authored swatch for a .vox palette colour (sRGB 0-255). */
export function snapToPalette(r: number, g: number, b: number): number {
  let best: number = Slot.STONE_1;
  let bestD = Infinity;
  for (const slot of AUTHORED_SLOTS) {
    const c = hexToSrgb8(HEX[slot]);
    const dr = r - c.r;
    const dg = g - c.g;
    const db = b - c.b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = slot;
    }
  }
  return best;
}
