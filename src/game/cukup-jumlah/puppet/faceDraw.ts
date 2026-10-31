import { faceRig, type ResolvedFaceConfig } from "./loadRig";

/**
 * Face compositor ported from the approved Python reference.
 * Shade grey is centred on 128: `s = shade / 128` darkens below 1 and
 * lightens above it. A CSS `multiply` blend cannot lighten, which is why
 * the lightest tone was rendering grey and every face sat darker than the body.
 * Nose layers are the same kind of map (128 = no change), not an opaque sprite.
 */

const SIZE = 512;

type Geo = { crown: number; chin: number; w_temple: number; w_cheek: number };
type Slot = { anchor: number[]; scale?: number };
type HairAnchor = { anchor: number[]; sx: number; sy: number; sx_profile: number[][] };
type ShapeAnchors = { slots: Record<string, Slot>; hair: HairAnchor };

const anchors = faceRig.anchors as unknown as Record<string, ShapeAnchors>;
const geos = faceRig.headgeo as unknown as Record<string, Geo>;

export type HatClip = {
  src: string;
  /** Hat top-left in the 512 face canvas. */
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * `all` — drop every hair pixel the hat does not cover (serban, tudung).
   * `tuck` — hair under the hat stays; anything else must sit inside the head,
   * so close caps don't leave a flat shelf or side wisps.
   * `crown` — drop hair above `coverBottom` that sits outside the hat
   * (baseball cap) so side hair below the band can still show.
   */
  mode: "all" | "tuck" | "crown";
  coverBottom: number;
  /** Tudung: keep face pixels only inside the cloth opening. */
  maskSkinToHole?: boolean;
};

export type FaceDrawRequest = {
  face: ResolvedFaceConfig;
  hat: HatClip | null;
};

type Mat = { a: number; d: number; e: number; f: number };

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const faceCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imageCache.get(src);
  if (hit) return hit;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`puppet layer ${src}`));
    img.src = src;
  });
  imageCache.set(src, pending);
  return pending;
}

export function faceDrawKey(req: FaceDrawRequest): string {
  const f = req.face;
  const hat = req.hat
    ? `${req.hat.src}@${req.hat.x.toFixed(1)},${req.hat.y.toFixed(1)},${req.hat.w.toFixed(1)}:${req.hat.mode}:${req.hat.coverBottom.toFixed(0)}`
    : "";
  return [
    f.shapeKey,
    f.skinHex,
    f.actualEyesFile,
    f.actualBrowsFile ?? "",
    f.actualNoseFile,
    f.actualMouthFile,
    f.hairBackFile ?? "",
    f.hairFrontFile ?? "",
    f.facialHairFile ?? "",
    f.facialHair,
    f.actualExtraFile ?? "",
    f.extra,
    f.sweatDropFile ?? "",
    hat,
  ].join("|");
}

export function renderFace(req: FaceDrawRequest): Promise<HTMLCanvasElement> {
  const key = faceDrawKey(req);
  const hit = faceCache.get(key);
  if (hit) return hit;
  const pending = compose(req).catch((error: unknown) => {
    faceCache.delete(key);
    throw error;
  });
  faceCache.set(key, pending);
  return pending;
}

/** `shadeByte / 128` applied to a tone. 128 reproduces the tone. */
export function tintChannels(
  shadeByte: number,
  tone: readonly [number, number, number],
): [number, number, number] {
  const s = shadeByte / 128;
  const out = tone.map((channel) => {
    if (s <= 1) return channel * s;
    return 255 - (255 - channel) * (1 - (s - 1) * 0.6);
  }) as [number, number, number];
  return out;
}

/** Straight-alpha factor for a 128-neutral multiply layer. 128 leaves rgb unchanged. */
export function multiplyFactor(shadeByte: number, alphaByte: number): number {
  const s = shadeByte / 128;
  const a = alphaByte / 255;
  return 1 - a + a * s;
}

function refKey(gender: "m" | "f"): string {
  return gender === "m" ? "m_oval" : "f_oval";
}

function slotMatrix(shapeKey: string, ref: string, slot: string): Mat {
  const src = anchors[ref].slots[slot];
  const dst = anchors[shapeKey].slots[slot];
  const k = dst?.scale ?? 1;
  const a0x = src.anchor[0];
  const a0y = src.anchor[1];
  const a1x = dst?.anchor[0] ?? a0x;
  const a1y = dst?.anchor[1] ?? a0y;
  return { a: k, d: k, e: a1x - a0x * k, f: a1y - a0y * k };
}

function beardMatrix(shapeKey: string, ref: string): Mat {
  const geo = geos[shapeKey];
  const geo0 = geos[ref];
  const kx = geo.w_cheek / geo0.w_cheek;
  const ky = (geo.chin - geo.crown) / (geo0.chin - geo0.crown);
  const a0 = anchors[ref].slots.beard.anchor;
  const a1 = anchors[shapeKey].slots.beard.anchor;
  return { a: kx, d: ky, e: a1[0] - a0[0] * kx, f: a1[1] - a0[1] * ky };
}

function canvas2d(): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d canvas is unavailable");
  return ctx;
}

async function layerData(src: string): Promise<ImageData> {
  const img = await loadImage(src);
  const ctx = canvas2d();
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

function drawMat(img: HTMLImageElement, mat: Mat): ImageData {
  const ctx = canvas2d();
  ctx.setTransform(mat.a, 0, 0, mat.d, mat.e, mat.f);
  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

function sampleBilinear(src: Uint8ClampedArray, x: number, y: number): [number, number, number, number] {
  if (x < 0 || y < 0 || x > SIZE - 1 || y > SIZE - 1) return [0, 0, 0, 0];
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(SIZE - 1, x0 + 1);
  const y1 = Math.min(SIZE - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const i00 = (y0 * SIZE + x0) * 4;
  const i10 = (y0 * SIZE + x1) * 4;
  const i01 = (y1 * SIZE + x0) * 4;
  const i11 = (y1 * SIZE + x1) * 4;
  const mix = (k: number) => {
    const a = src[i00 + k] * (1 - tx) + src[i10 + k] * tx;
    const b = src[i01 + k] * (1 - tx) + src[i11 + k] * tx;
    return a * (1 - ty) + b * ty;
  };
  return [mix(0), mix(1), mix(2), mix(3)];
}

function interp(f: number, fs: number[], sxs: number[]): number {
  if (f <= fs[0]) return sxs[0];
  const last = fs.length - 1;
  if (f >= fs[last]) return sxs[last];
  for (let i = 1; i < fs.length; i += 1) {
    if (f <= fs[i]) {
      const span = fs[i] - fs[i - 1] || 1;
      const t = (f - fs[i - 1]) / span;
      return sxs[i - 1] * (1 - t) + sxs[i] * t;
    }
  }
  return sxs[last];
}

/** Per-row hair scale from the reference crown, matching `hairwarp` in the compositor. */
function warpHair(src: ImageData, gender: "m" | "f", shape: string): ImageData {
  const ref = refKey(gender);
  const shapeKey = `${gender}_${shape}`;
  const hair = anchors[shapeKey].hair;
  const cr0 = anchors[ref].hair.anchor[1];
  const cr = hair.anchor[1];
  const sy = hair.sy || 1;
  const h0 = geos[ref].chin - cr0 || 1;
  const fs = hair.sx_profile.map((pair) => pair[0]);
  const sxs = hair.sx_profile.map((pair) => pair[1]);
  const raw = new Float64Array(SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    const ys = cr0 + (y - cr) / sy;
    raw[y] = interp((ys - cr0) / h0, fs, sxs);
  }
  const padded = new Float64Array(SIZE + 16);
  for (let i = 0; i < 8; i += 1) padded[i] = raw[0];
  for (let i = 0; i < SIZE; i += 1) padded[i + 8] = raw[i];
  for (let i = 0; i < 8; i += 1) padded[SIZE + 8 + i] = raw[SIZE - 1];
  const sxRow = new Float64Array(SIZE);
  for (let i = 0; i < SIZE; i += 1) {
    let sum = 0;
    for (let k = 0; k < 17; k += 1) sum += padded[i + k];
    sxRow[i] = sum / 17;
  }
  const out = new ImageData(SIZE, SIZE);
  const srcPx = src.data;
  const dst = out.data;
  for (let y = 0; y < SIZE; y += 1) {
    const ys = cr0 + (y - cr) / sy;
    const sx = sxRow[y] || 1;
    for (let x = 0; x < SIZE; x += 1) {
      const xs = 256 + (x - 256) / sx;
      const [r, g, b, a] = sampleBilinear(srcPx, xs, ys);
      const i = (y * SIZE + x) * 4;
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = a;
    }
  }
  return out;
}

function clipHairRules(
  img: ImageData,
  gender: "m" | "f",
  shape: string,
  hair: string,
  front: boolean,
): void {
  const px = img.data;
  const shapeKey = `${gender}_${shape}`;
  const chin = geos[shapeKey].chin;
  const browY = anchors[shapeKey].slots.brows.anchor[1];
  for (let y = 0; y < SIZE; y += 1) {
    const belowJaw = gender === "m" && hair !== "long" && y >= chin - 30;
    const bottom = y >= 490;
    for (let x = 0; x < SIZE; x += 1) {
      const i = (y * SIZE + x) * 4 + 3;
      if (px[i] === 0) continue;
      if (belowJaw || bottom) {
        px[i] = 0;
        continue;
      }
      if (!front || hair !== "crew") continue;
      const curve = browY - 46 + (shape === "square" ? 0.009 : 0.0065) * (x - 256) ** 2;
      if (y > curve) {
        px[i] = 0;
        continue;
      }
      const crown = geos[shapeKey].crown;
      const rx = geos[shapeKey].w_temple * (shape === "square" ? 0.47 : 0.53);
      const ry = (browY - crown) * (shape === "square" ? 1.15 : 1.25);
      const cy = crown + ry * 0.92;
      if ((x - 256) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 > 1) px[i] = 0;
    }
  }
}

function hideSkinAboveHairline(skin: ImageData, hairFront: ImageData, crew: boolean): void {
  const hair = hairFront.data;
  let top = -1;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (hair[(y * SIZE + x) * 4 + 3] > 127) {
        top = y;
        break;
      }
    }
    if (top >= 0) break;
  }
  if (top < 0) return;
  const limit = top + (crew ? 80 : 45);
  const px = skin.data;
  for (let y = 0; y < limit && y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = (y * SIZE + x) * 4;
      if (hair[i + 3] < 128) px[i + 3] = 0;
    }
  }
}

function tintSkin(
  base: ImageData,
  shade: ImageData,
  hex: string,
  shapeKey: string,
  toneId: string,
  gender: "m" | "f",
): ImageData {
  const tone: [number, number, number] = [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const chin = geos[shapeKey]?.chin ?? 420;
  const lightMale = gender === "m" && (toneId === "tone_1" || toneId === "tone_2" || toneId === "tone_3");
  const softenLong = shapeKey === "f_long";
  const out = new ImageData(SIZE, SIZE);
  const b = base.data;
  const s = shade.data;
  const d = out.data;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = (y * SIZE + x) * 4;
      const alpha = b[i + 3];
      if (alpha === 0) continue;
      let shadeByte = s[i + 3] < 8 ? 128 : s[i];
      // The neck tab's shade sits around 108, which reads darker than the cheek on light skin.
      if (lightMale && y > chin + 6) {
        const t = Math.min(1, (y - (chin + 6)) / 16);
        shadeByte += (128 - shadeByte) * 0.9 * t;
      }
      // f_long's cheek folds are much darker than the other female shapes.
      if (softenLong && y > 248 && y < chin - 4 && shadeByte < 124) {
        shadeByte = shadeByte * 0.22 + 124 * 0.78;
      }
      const [r, g, bl] = tintChannels(shadeByte, tone);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = bl;
      d[i + 3] = alpha;
    }
  }
  return out;
}

function over(dst: Uint8ClampedArray, src: Uint8ClampedArray): void {
  for (let i = 0; i < dst.length; i += 4) {
    const a = src[i + 3] / 255;
    if (a <= 0) continue;
    const inv = 1 - a;
    dst[i] = src[i] * a + dst[i] * inv;
    dst[i + 1] = src[i + 1] * a + dst[i + 1] * inv;
    dst[i + 2] = src[i + 2] * a + dst[i + 2] * inv;
    dst[i + 3] = src[i + 3] + dst[i + 3] * inv;
  }
}

function multiply128(dst: Uint8ClampedArray, src: Uint8ClampedArray): void {
  for (let i = 0; i < dst.length; i += 4) {
    if (src[i + 3] === 0) continue;
    const factor = multiplyFactor(src[i], src[i + 3]);
    dst[i] *= factor;
    dst[i + 1] *= factor;
    dst[i + 2] *= factor;
  }
}

/** Pull frosted lens pixels back so the eye reads through. Frames and highlights stay. */
function fadeLenses(layer: ImageData): void {
  const px = layer.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    const r = px[i];
    if (a > 0 && a < 210 && r > 165 && r < 226 && px[i + 1] > 165 && px[i + 2] > 165) {
      px[i + 3] = Math.round(a * 0.28);
    }
  }
}

/**
 * A dark mole painted with source-over disappears into tone 7–8.
 * Keep the art colour on light skin; on dark skin push it darker than the skin under it.
 */
function overMole(dst: Uint8ClampedArray, src: Uint8ClampedArray): void {
  for (let i = 0; i < dst.length; i += 4) {
    const aByte = src[i + 3];
    if (aByte === 0) continue;
    const skin = (dst[i] + dst[i + 1] + dst[i + 2]) / 3;
    const mole = (src[i] + src[i + 1] + src[i + 2]) / 3;
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];
    let a = aByte;
    if (mole > skin * 0.62) {
      const k = (skin * 0.42) / Math.max(1, mole);
      r *= k;
      g *= k;
      b *= k;
      a = Math.min(255, a * 1.4);
    }
    const af = a / 255;
    const inv = 1 - af;
    dst[i] = r * af + dst[i] * inv;
    dst[i + 1] = g * af + dst[i + 1] * inv;
    dst[i + 2] = b * af + dst[i + 2] * inv;
    dst[i + 3] = a + dst[i + 3] * inv;
  }
}

function dilateMask(src: Uint8ClampedArray, radius: number, threshold: number): Uint8Array {
  const out = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= SIZE) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || xx >= SIZE) continue;
          if (src[(yy * SIZE + xx) * 4 + 3] > threshold) {
            on = 1;
            break;
          }
        }
      }
      out[y * SIZE + x] = on;
    }
  }
  return out;
}

function dilateBinary(mask: Uint8Array, radius: number): Uint8Array {
  const out = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!mask[y * SIZE + x]) continue;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(SIZE - 1, y + radius);
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(SIZE - 1, x + radius);
      for (let yy = y0; yy <= y1; yy += 1) {
        out.fill(1, yy * SIZE + x0, yy * SIZE + x1 + 1);
      }
    }
  }
  return out;
}

/**
 * Hair-back layers leave a dark line hugging the jaw on heart faces.
 * Clear hair that sits just outside the skin. A ponytail hangs farther out, so it stays.
 */
function trimStrayStrands(hair: ImageData, onSkin: Uint8Array, halo: Uint8Array): void {
  const px = hair.data;
  for (let y = 310; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const p = y * SIZE + x;
      if (px[p * 4 + 3] < 16) continue;
      if (onSkin[p]) continue;
      if (halo[p]) px[p * 4 + 3] = 0;
    }
  }
}

function hatCovers(hat: Uint8ClampedArray, x: number, y: number): boolean {
  for (let dy = -2; dy <= 2; dy += 1) {
    const yy = y + dy;
    if (yy < 0 || yy >= SIZE) return false;
    for (let dx = -2; dx <= 2; dx += 1) {
      const xx = x + dx;
      if (xx < 0 || xx >= SIZE) return false;
      if (hat[(yy * SIZE + xx) * 4 + 3] < 48) return false;
    }
  }
  return true;
}

function faceHoleMask(hat: ImageData): Uint8Array {
  const mask = new Uint8Array(SIZE * SIZE);
  const a = hat.data;
  for (let y = 0; y < SIZE; y += 1) {
    let bestL = -1;
    let bestR = -1;
    let bestGap = 0;
    let prev = -1;
    for (let x = 0; x < SIZE; x += 1) {
      if (a[(y * SIZE + x) * 4 + 3] < 180) continue;
      if (prev >= 0) {
        const gap = x - prev;
        if (gap > bestGap) {
          bestGap = gap;
          bestL = prev;
          bestR = x;
        }
      }
      prev = x;
    }
    if (bestGap < 28 || bestL < 0) continue;
    for (let x = bestL + 1; x < bestR; x += 1) mask[y * SIZE + x] = 1;
  }
  return mask;
}

function maskSkinToHole(skin: ImageData, hole: Uint8Array, chin: number): void {
  const px = skin.data;
  for (let y = 0; y < SIZE; y += 1) {
    // The tudung covers the neck, so the neck tab below the chin goes too.
    const neckFade = y <= chin ? 1 : Math.max(0, 1 - (y - chin) / 4);
    for (let x = 0; x < SIZE; x += 1) {
      const p = y * SIZE + x;
      if (!hole[p]) px[p * 4 + 3] = 0;
      else if (neckFade < 1) px[p * 4 + 3] *= neckFade;
    }
  }
}

function rowWidth(px: Uint8ClampedArray, y: number): number {
  let left = -1;
  let right = -1;
  for (let x = 0; x < SIZE; x += 1) {
    if (px[(y * SIZE + x) * 4 + 3] <= 40) continue;
    if (left < 0) left = x;
    right = x;
  }
  return left < 0 ? 0 : right - left;
}

/**
 * First row where the skin base narrows to the neck tab. `headgeo.chin` sits
 * above the real jaw on some shapes (f_long), and cutting there flattens the chin.
 */
function chinFromBase(base: ImageData): number {
  const neck = rowWidth(base.data, 450);
  for (let y = 340; y < 450; y += 1) {
    if (rowWidth(base.data, y) <= neck + 4) return y;
  }
  return 420;
}

/**
 * Skin edge on one side with the ear removed, as an x per row (NaN = keep).
 * The ear is a bump between the temple and a sharp step back in at the jaw;
 * the edge there is replaced by a straight line from temple to jaw.
 */
function earlessEdge(base: ImageData, chin: number, side: -1 | 1): Float32Array {
  const a = base.data;
  const edge = new Float32Array(SIZE).fill(Number.NaN);
  const out = new Float32Array(SIZE).fill(Number.NaN);
  // Distance from the outside of the canvas to the first skin pixel.
  for (let y = 180; y < chin; y += 1) {
    for (let i = 0; i < SIZE / 2; i += 1) {
      const x = side < 0 ? i : SIZE - 1 - i;
      if (a[(y * SIZE + x) * 4 + 3] > 40) {
        edge[y] = i;
        break;
      }
    }
  }
  let widest = -1;
  for (let y = 200; y < chin - 20; y += 1) {
    if (!Number.isNaN(edge[y]) && (widest < 0 || edge[y] < edge[widest])) widest = y;
  }
  if (widest < 0) return out;
  let top = -1;
  for (let y = 200; y <= widest; y += 1) {
    if (!Number.isNaN(edge[y]) && (top < 0 || edge[y] >= edge[top])) top = y;
  }
  let bottom = -1;
  let step = 3;
  for (let y = widest + 2; y < chin - 10; y += 1) {
    const jump = edge[y] - edge[y - 2];
    if (jump > step) {
      step = jump;
      bottom = y;
    }
  }
  if (top < 0 || bottom < 0) return out;
  for (let y = top; y <= bottom; y += 1) {
    const t = (y - top) / Math.max(1, bottom - top);
    out[y] = edge[top] + (edge[bottom] - edge[top]) * t;
  }
  return out;
}

/** A tudung covers the ears, so cut them off the skin. */
function hideEars(skin: ImageData, base: ImageData, chin: number): void {
  const px = skin.data;
  for (const side of [-1, 1] as const) {
    const edge = earlessEdge(base, chin, side);
    for (let y = 0; y < SIZE; y += 1) {
      if (Number.isNaN(edge[y])) continue;
      for (let i = 0; i < SIZE / 2; i += 1) {
        const x = side < 0 ? i : SIZE - 1 - i;
        // 2px feather so the cut edge is not jagged.
        const keep = Math.min(1, Math.max(0, (i - edge[y]) / 2));
        if (keep >= 1) break;
        px[(y * SIZE + x) * 4 + 3] *= keep;
      }
    }
  }
}

/** Mean colour of solid cloth in a thin band just outside the opening. */
function clothColour(hat: ImageData, hole: Uint8Array): [number, number, number] {
  const ring = dilateBinary(hole, 14);
  const a = hat.data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let p = 0; p < SIZE * SIZE; p += 1) {
    if (!ring[p] || hole[p] || a[p * 4 + 3] < 220) continue;
    r += a[p * 4];
    g += a[p * 4 + 1];
    b += a[p * 4 + 2];
    n += 1;
  }
  return n ? [r / n, g / n, b / n] : [150, 90, 80];
}

/**
 * Underscarf (anak tudung) behind the face. The opening is wider than the
 * cheeks and chin, so without it the stage and the top show through.
 * Same hue as the tudung, darker, with a soft shadow under the rim.
 */
function underscarf(hat: ImageData, hole: Uint8Array): ImageData {
  const fill = dilateBinary(hole, 3);
  const [cr, cg, cb] = clothColour(hat, hole);
  const out = new ImageData(SIZE, SIZE);
  const d = out.data;
  for (let y = 0; y < SIZE; y += 1) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < SIZE; x += 1) {
      if (!fill[y * SIZE + x]) continue;
      if (left < 0) left = x;
      right = x;
    }
    if (left < 0) continue;
    for (let x = left; x <= right; x += 1) {
      const p = y * SIZE + x;
      if (!fill[p]) continue;
      const edge = Math.min(x - left, right - x);
      const k = 0.62 + 0.1 * Math.min(1, edge / 18);
      d[p * 4] = cr * k;
      d[p * 4 + 1] = cg * k;
      d[p * 4 + 2] = cb * k;
      d[p * 4 + 3] = 255;
    }
  }
  return out;
}

function clipToHat(hair: ImageData, hat: ImageData, clip: HatClip): void {
  const h = hair.data;
  const a = hat.data;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const p = y * SIZE + x;
      const i = p * 4;
      if (h[i + 3] === 0) continue;
      if (clip.mode === "crown" && y >= clip.coverBottom) continue;
      if (clip.mode === "tuck") {
        // Close caps hide the hair. Anything outside the cloth is a wisp or a flat shelf.
        if (!hatCovers(a, x, y)) h[i + 3] = 0;
        continue;
      }
      if (a[i + 3] < 36) h[i + 3] = 0;
    }
  }
}

async function rasterHat(clip: HatClip): Promise<ImageData> {
  const img = await loadImage(clip.src);
  const ctx = canvas2d();
  ctx.drawImage(img, clip.x, clip.y, clip.w, clip.h);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

async function compose(req: FaceDrawRequest): Promise<HTMLCanvasElement> {
  const face = req.face;
  const ref = refKey(face.gender);
  const shapeKey = face.shapeKey;
  const out = new ImageData(SIZE, SIZE);

  let hairBack: ImageData | null = null;
  let hairFront: ImageData | null = null;
  if (face.hairBackFile) {
    hairBack = warpHair(await layerData(face.hairBackFile), face.gender, face.shape);
    clipHairRules(hairBack, face.gender, face.shape, face.hair, false);
  }
  if (face.hairFrontFile) {
    hairFront = warpHair(await layerData(face.hairFrontFile), face.gender, face.shape);
    clipHairRules(hairFront, face.gender, face.shape, face.hair, true);
  }

  const base = await layerData(`/puppet/layers/skin_base/${shapeKey}.webp`);
  const onSkin = dilateMask(base.data, 0, 40);
  const halo = dilateBinary(onSkin, 12);
  if (hairBack) trimStrayStrands(hairBack, onSkin, halo);
  if (hairFront) trimStrayStrands(hairFront, onSkin, halo);
  const skin = tintSkin(
    base,
    await layerData(`/puppet/layers/skin_shade/${shapeKey}.webp`),
    face.skinHex,
    shapeKey,
    face.tone,
    face.gender,
  );
  if (hairFront && face.hair !== "bald" && face.hair !== "horseshoe" && face.hair !== "none") {
    hideSkinAboveHairline(skin, hairFront, face.hair === "crew");
  }
  if (req.hat && (hairBack || hairFront || req.hat.maskSkinToHole)) {
    const hat = await rasterHat(req.hat);
    if (req.hat.maskSkinToHole) {
      const hole = faceHoleMask(hat);
      over(out.data, underscarf(hat, hole).data);
      const chin = chinFromBase(base);
      maskSkinToHole(skin, hole, chin);
      hideEars(skin, base, chin);
    }
    if (hairBack) clipToHat(hairBack, hat, req.hat);
    if (hairFront) clipToHat(hairFront, hat, req.hat);
  }

  if (hairBack) over(out.data, hairBack.data);
  over(out.data, skin.data);

  const nose = drawMat(await loadImage(face.actualNoseFile), slotMatrix(shapeKey, ref, "nose"));
  multiply128(out.data, nose.data);

  const blit = async (src: string | null, slot: string, mat?: Mat) => {
    if (!src) return null;
    return drawMat(await loadImage(src), mat ?? slotMatrix(shapeKey, ref, slot));
  };

  if (face.extra === "blush" && face.actualExtraFile) {
    const blush = await blit(face.actualExtraFile, "blush");
    if (blush) over(out.data, blush.data);
  }
  const eyes = await blit(face.actualEyesFile, "eyes");
  if (eyes) over(out.data, eyes.data);
  if (face.actualBrowsFile) {
    const brows = await blit(face.actualBrowsFile, "brows");
    if (brows) over(out.data, brows.data);
  }

  const beardMat = beardMatrix(shapeKey, ref);
  if (face.facialHair === "full_beard" || face.facialHair === "stubble") {
    const beard = await blit(face.facialHairFile, "beard", beardMat);
    if (beard) over(out.data, beard.data);
  }
  const mouth = await blit(face.actualMouthFile, "mouth");
  if (mouth) over(out.data, mouth.data);
  if (face.facialHair === "full_beard") {
    const moustache = await blit(
      "/puppet/layers/facial_hair/m_full_beard_moustache.webp",
      "moustache",
      beardMat,
    );
    if (moustache) over(out.data, moustache.data);
  } else if (face.facialHair === "handlebar" || face.facialHair === "thin") {
    const moustache = await blit(face.facialHairFile, "moustache");
    if (moustache) over(out.data, moustache.data);
  }
  if (face.extra === "mole" && face.actualExtraFile) {
    const mole = await blit(face.actualExtraFile, "mole");
    if (mole) overMole(out.data, mole.data);
  }
  if (hairFront) over(out.data, hairFront.data);
  if ((face.extra === "glasses" || face.extra === "sunglasses") && face.actualExtraFile) {
    const glasses = await blit(face.actualExtraFile, "glasses");
    if (glasses) {
      if (face.extra === "glasses") fadeLenses(glasses);
      over(out.data, glasses.data);
    }
  }
  if (face.sweatDropFile) {
    const sweat = await blit(face.sweatDropFile, "sweat");
    if (sweat) over(out.data, sweat.data);
  }

  const ctx = canvas2d();
  ctx.putImageData(out, 0, 0);
  return ctx.canvas;
}
