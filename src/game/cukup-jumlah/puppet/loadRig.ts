import rawRig from "./rig.json";

/**
 * Typed view of puppet-kit rig.json.
 * Offsets, sleeve maps, and head→tone live in the JSON. Callers read them
 * from the loaded rig instead of copying the numbers.
 */
export type RigPart = {
  file: string;
  size: [number, number];
  pins: Record<string, [number, number]>;
};

export type PuppetRig = {
  parts: Record<string, RigPart>;
  draw_order: string[];
  joints: Record<string, string>;
  notes: string;
  skin: {
    method: string;
    tones: Record<string, [number, number, number]>;
    head_tone: Record<string, string>;
    base_tones_dir: string;
  };
  placement: {
    headwear_brim_dy: Record<string, number>;
    headwear_note: string;
    tudung: string;
    lower_waist_dy_from_hips: Record<string, number>;
    lower_note: string;
    sleeve_upper: string;
    sleeve_forearm: string;
    mirror: string;
  };
  sleeves: Record<string, string[]>;
};

export type HeadId =
  | "malay_man"
  | "malay_woman"
  | "chinese_man"
  | "indian_woman"
  | "kadazan_man";

export type HeadwearId = "songkok" | "ketayap" | "turban" | "baseball_cap" | "tudung";

export type OutfitId = "baju_melayu" | "batik_shirt" | "business_suit" | "baju_kurung";

export type LowerId = "songket_samping" | "sarong";

export type ToneId = "light" | "tan" | "golden" | "medium_brown" | "dark";

export type BasePartName = "torso" | "upper_arm" | "forearm_hand" | "leg" | "foot";

export type PuppetConfig = {
  head: HeadId;
  headwear: HeadwearId | null;
  outfit: OutfitId;
  lower: LowerId | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pinPair(value: unknown, label: string): [number, number] {
  if (!Array.isArray(value) || value.length !== 2 || value.some((n) => typeof n !== "number")) {
    throw new Error(`rig.json pin ${label} must be [x, y]`);
  }
  return [value[0] as number, value[1] as number];
}

/** Validate an unknown payload and return the puppet rig. */
export function loadRig(data: unknown): PuppetRig {
  if (!isRecord(data)) throw new Error("rig.json must be an object");
  const partsIn = data.parts;
  const placement = data.placement;
  const skin = data.skin;
  const sleeves = data.sleeves;
  if (!isRecord(partsIn) || !isRecord(placement) || !isRecord(skin) || !isRecord(sleeves)) {
    throw new Error("rig.json is missing parts, placement, skin, or sleeves");
  }
  if (!isRecord(placement.headwear_brim_dy) || !isRecord(placement.lower_waist_dy_from_hips)) {
    throw new Error("rig.json placement is missing headwear or lower offsets");
  }
  if (!isRecord(skin.head_tone) || !isRecord(skin.tones)) {
    throw new Error("rig.json skin is missing head_tone or tones");
  }
  if (typeof placement.mirror !== "string" || !/right/i.test(placement.mirror)) {
    throw new Error("rig.json placement.mirror must describe the right-side mirror");
  }

  const parts: Record<string, RigPart> = {};
  for (const [id, raw] of Object.entries(partsIn)) {
    if (!isRecord(raw) || typeof raw.file !== "string" || !isRecord(raw.pins)) {
      throw new Error(`rig.json part ${id} is incomplete`);
    }
    const size = pinPair(raw.size, `${id}.size`);
    const pins: Record<string, [number, number]> = {};
    for (const [pin, coords] of Object.entries(raw.pins)) {
      const pair = pinPair(coords, `${id}.${pin}`);
      if (pair[0] < 0 || pair[1] < 0 || pair[0] >= size[0] || pair[1] >= size[1]) {
        throw new Error(`rig.json pin ${id}.${pin} sits outside the part (${pair.join(", ")})`);
      }
      pins[pin] = pair;
    }
    parts[id] = { file: raw.file, size, pins };
  }

  for (const [head, tone] of Object.entries(skin.head_tone)) {
    if (typeof tone !== "string" || !isRecord(skin.tones) || !(tone in skin.tones)) {
      throw new Error(`rig.json head ${head} points at an unknown tone`);
    }
    if (!parts[`heads/${head}`]) throw new Error(`rig.json is missing heads/${head}`);
  }
  for (const id of Object.keys(placement.headwear_brim_dy)) {
    if (!parts[`headwear/${id}`]) throw new Error(`rig.json offset for missing headwear/${id}`);
  }
  if (!parts["headwear/tudung"]?.pins.face_hole_center) {
    throw new Error("rig.json tudung is missing face_hole_center");
  }
  for (const id of Object.keys(placement.lower_waist_dy_from_hips)) {
    if (!parts[`lower/${id}`]?.pins.waist) throw new Error(`rig.json lower/${id} has no waist pin`);
  }
  for (const [outfit, kinds] of Object.entries(sleeves)) {
    if (!Array.isArray(kinds) || !parts[`outfits/${outfit}`]) {
      throw new Error(`rig.json sleeves for ${outfit} do not match an outfit`);
    }
    for (const kind of kinds) {
      if (kind !== "upper" && kind !== "forearm") {
        throw new Error(`rig.json sleeve kind ${String(kind)} is not upper or forearm`);
      }
      if (!parts[`sleeves/${outfit}_${kind}`]) {
        throw new Error(`rig.json is missing sleeves/${outfit}_${kind}`);
      }
    }
  }

  return data as PuppetRig;
}

export const puppetRig = loadRig(rawRig);

const PUBLIC_ROOT = "/puppet";

/** Public URL for a rig file path (`parts/...webp`). */
export function rigFileUrl(file: string): string {
  const rel = file.replace(/^parts\//, "").replace(/\.png$/, ".webp");
  return `${PUBLIC_ROOT}/${rel}`;
}

/** Pre-tinted limb. Tone follows the head via `skin.head_tone`. */
export function tonePartUrl(tone: string, part: BasePartName): string {
  return `${PUBLIC_ROOT}/base_tones/${tone}/${part}.webp`;
}

export function toneForHead(rig: PuppetRig, head: string): string {
  const tone = rig.skin.head_tone[head];
  if (!tone) throw new Error(`No body tone for head ${head}`);
  return tone;
}
