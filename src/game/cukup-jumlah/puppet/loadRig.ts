import rawRig from "./rig.json";
import rawFaceRig from "./face_rig.json";

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
    head_tone?: Record<string, string>;
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
  | "m_head_1"
  | "m_head_2"
  | "m_head_3"
  | "f_head_1"
  | "f_head_2"
  | "m_oval"
  | "m_round"
  | "m_square"
  | "m_long"
  | "f_oval"
  | "f_round"
  | "f_long"
  | "f_heart";

export type HeadwearId =
  | "songkok"
  | "ketayap"
  | "turban"
  | "baseball_cap"
  | "baseball_cap_red"
  | "baseball_cap_mustard"
  | "tudung";

export type OutfitId =
  | "baju_melayu"
  | "batik_shirt"
  | "business_suit"
  | "baju_kurung"
  | "tshirt"
  | "hoodie";

export type LowerId = "songket_samping" | "sarong" | "jeans";

export type FootwearId = "default" | "selipar" | "sneakers";

export type ToneId =
  | "tone_1"
  | "tone_2"
  | "tone_3"
  | "tone_4"
  | "tone_5"
  | "tone_6"
  | "tone_7"
  | "tone_8";

export type BasePartName = "torso" | "upper_arm" | "forearm_hand" | "leg" | "foot";

export const TONE_HEX: Record<ToneId, string> = {
  tone_1: "#F6DABA",
  tone_2: "#ECC49A",
  tone_3: "#D6A472",
  tone_4: "#C48854",
  tone_5: "#B27647",
  tone_6: "#A0643A",
  tone_7: "#764628",
  tone_8: "#563420",
};

export type FaceShapeId = "oval" | "round" | "square" | "long" | "heart";

export type EyeId = "normal" | "sleepy" | "round";

export type BrowId = "natural" | "thick_arched" | "bushy" | "thin";

export type NoseId = "soft" | "medium" | "prominent";

export type ExpressionId =
  | "neutral"
  | "smug_grin"
  | "big_laugh"
  | "angry_shout"
  | "nervous_smile"
  | "shocked_o"
  | "sly_smirk"
  | "crying_pout";

export type HairMId = "bald" | "crew" | "curly" | "horseshoe" | "long" | "pompadour" | "sidepart";

export type HairFId = "bob" | "bouffant" | "bun" | "curly" | "long" | "none" | "pixie" | "ponytail";

export type FacialHairId = "none" | "handlebar" | "thin" | "full_beard" | "stubble";

export type ExtraId = "none" | "glasses" | "sunglasses" | "blush" | "mole";

export type PuppetConfig = {
  gender?: "m" | "f";
  tone: ToneId;
  head?: string;
  faceShape?: FaceShapeId;
  eyes?: EyeId;
  brows?: BrowId;
  nose?: NoseId;
  expression?: ExpressionId;
  hair?: string;
  facialHair?: FacialHairId;
  extra?: ExtraId;
  headwear: HeadwearId | null;
  outfit: OutfitId;
  lower: LowerId | null;
  footwear?: FootwearId;
};

export type FaceRig = typeof rawFaceRig;
export const faceRig = rawFaceRig;

export type ResolvedFaceConfig = {
  gender: "m" | "f";
  shape: FaceShapeId;
  shapeKey: string;
  tone: ToneId;
  skinHex: string;
  eyes: EyeId;
  actualEyesFile: string;
  brows: BrowId | null;
  actualBrowsFile: string | null;
  nose: NoseId;
  actualNoseFile: string;
  expression: ExpressionId;
  actualMouthFile: string;
  hair: string;
  hairBackFile: string | null;
  hairFrontFile: string | null;
  facialHair: FacialHairId;
  facialHairFile: string | null;
  extra: ExtraId;
  actualExtraFile: string | null;
  sweatDropFile: string | null;
  hairTransform: { dx: number; dy: number; sx: number; sy: number; originY: number };
  slotTransforms: Record<string, { dx: number; dy: number; scale: number; origin: [number, number] }>;
};

/** Resolve complete layered face configuration, supporting defaults and legacy head names */
export function resolveFaceConfig(config: PuppetConfig): ResolvedFaceConfig {
  let gender: "m" | "f" = config.gender ?? "m";
  let shape: FaceShapeId = config.faceShape ?? "oval";
  let hair: string = config.hair ?? (gender === "m" ? "sidepart" : "bun");

  // Map legacy head IDs
  if (config.head) {
    if (config.head === "m_head_1" || config.head === "m_oval") {
      gender = "m";
      shape = "oval";
      if (!config.hair) hair = "sidepart";
    } else if (config.head === "m_head_2" || config.head === "m_round") {
      gender = "m";
      shape = "round";
      if (!config.hair) hair = "curly";
    } else if (config.head === "m_head_3" || config.head === "m_square") {
      gender = "m";
      shape = "square";
      if (!config.hair) hair = "crew";
    } else if (config.head === "m_long") {
      gender = "m";
      shape = "long";
      if (!config.hair) hair = "sidepart";
    } else if (config.head === "f_head_1" || config.head === "f_oval") {
      gender = "f";
      shape = "oval";
      if (!config.hair) hair = "bun";
    } else if (config.head === "f_head_2" || config.head === "f_round") {
      gender = "f";
      shape = "round";
      if (!config.hair) hair = "bob";
    } else if (config.head === "f_long") {
      gender = "f";
      shape = "long";
      if (!config.hair) hair = "long";
    } else if (config.head === "f_heart") {
      gender = "f";
      shape = "heart";
      if (!config.hair) hair = "ponytail";
    }
  }

  // Ensure shape is valid for gender
  if (gender === "m" && shape === "heart") shape = "oval";
  if (gender === "f" && shape === "square") shape = "oval";
  // "Tiada" is not a female hair style — it was drawing a bald head.
  if (gender === "f" && (hair === "none" || hair === "bald")) hair = "bun";

  const shapeKey = `${gender}_${shape}`;
  const refShape = gender === "m" ? "m_oval" : "f_oval";
  const tone = config.tone ?? "tone_4";
  const skinHex = TONE_HEX[tone] ?? "#C48854";

  const eyes: EyeId = config.eyes ?? "normal";
  const brows: BrowId = config.brows ?? (gender === "m" ? "thick_arched" : "natural");
  const nose: NoseId = config.nose ?? (gender === "m" ? "medium" : "soft");
  const expression: ExpressionId = config.expression ?? "neutral";
  const facialHair: FacialHairId = gender === "m" ? (config.facialHair ?? "none") : "none";
  const extra: ExtraId = config.extra ?? "none";

  // Expression overrides
  const exprRules = (faceRig.expressions as Record<string, { eyes?: string; brows?: string | null; extra?: string }>)[expression] ?? {};

  // Resolve eye file
  let actualEyesFile = `/puppet/layers/eyes/${gender}_${eyes}.webp`;
  if (exprRules.eyes) {
    actualEyesFile = `/puppet/layers/eyes/${gender}_${exprRules.eyes}.webp`;
  }

  // Resolve brow file
  let actualBrowsFile: string | null = `/puppet/layers/brows/${gender}_${brows}.webp`;
  if (exprRules.brows === null) {
    actualBrowsFile = null;
  } else if (exprRules.brows === "angry_soft") {
    actualBrowsFile = `/puppet/layers/brows/${gender}_angry.webp`;
  } else if (exprRules.brows) {
    actualBrowsFile = `/puppet/layers/brows/${gender}_${exprRules.brows}.webp`;
  }

  // Mouth file
  const actualMouthFile = `/puppet/layers/mouth/${gender}_${expression}.webp`;

  // Nose file
  const actualNoseFile = `/puppet/layers/nose/${gender}_${nose}.webp`;

  // Hair files
  let hairBackFile: string | null = null;
  let hairFrontFile: string | null = null;
  if (hair !== "bald" && hair !== "none") {
    hairBackFile = `/puppet/layers/hair_back/${gender}_${hair}.webp`;
    hairFrontFile = `/puppet/layers/hair_front/${gender}_${hair}.webp`;
  }

  // Facial hair file
  let facialHairFile: string | null = null;
  if (gender === "m" && facialHair !== "none") {
    facialHairFile = `/puppet/layers/facial_hair/m_${facialHair}.webp`;
  }

  // Extra file
  let actualExtraFile: string | null = null;
  if (extra !== "none") {
    actualExtraFile = `/puppet/layers/extras/${gender}_${extra}.webp`;
  }

  // Expression extra (sweat_drop)
  let sweatDropFile: string | null = null;
  if (exprRules.extra === "sweat_drop" || extra === ("sweat_drop" as unknown)) {
    sweatDropFile = `/puppet/layers/extras/${gender}_sweat_drop.webp`;
  }

  // Compute anchor transforms from face_rig.json
  const anchorsData = faceRig.anchors as Record<string, any>;
  const curShapeAnchors = anchorsData[shapeKey] ?? anchorsData[refShape];
  const refShapeAnchors = anchorsData[refShape];

  const curHair = curShapeAnchors.hair;
  const refHair = refShapeAnchors.hair;
  const hairTransform = {
    dx: 0,
    dy: curHair.anchor[1] - refHair.anchor[1],
    sx: curHair.sx ?? 1,
    sy: curHair.sy ?? 1,
    originY: refHair.anchor[1],
  };

  const slotTransforms: Record<string, { dx: number; dy: number; scale: number; origin: [number, number] }> = {};
  for (const [slot, slotData] of Object.entries(curShapeAnchors.slots as Record<string, any>)) {
    const refSlot = refShapeAnchors.slots[slot];
    if (refSlot) {
      slotTransforms[slot] = {
        dx: slotData.anchor[0] - refSlot.anchor[0],
        dy: slotData.anchor[1] - refSlot.anchor[1],
        scale: (slotData.scale ?? 1) / (refSlot.scale ?? 1),
        origin: [refSlot.anchor[0], refSlot.anchor[1]],
      };
    }
  }

  return {
    gender,
    shape,
    shapeKey,
    tone,
    skinHex,
    eyes,
    actualEyesFile,
    brows: actualBrowsFile ? brows : null,
    actualBrowsFile,
    nose,
    actualNoseFile,
    expression,
    actualMouthFile,
    hair,
    hairBackFile,
    hairFrontFile,
    facialHair,
    facialHairFile,
    extra,
    actualExtraFile,
    sweatDropFile,
    hairTransform,
    slotTransforms,
  };
}

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
  if (!isRecord(skin.tones)) {
    throw new Error("rig.json skin is missing tones");
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

  if (isRecord(skin.head_tone)) {
    for (const [head, tone] of Object.entries(skin.head_tone)) {
      if (typeof tone !== "string" || !isRecord(skin.tones) || !(tone in skin.tones)) {
        throw new Error(`rig.json head ${head} points at an unknown tone`);
      }
      if (!parts[`heads/${head}`]) throw new Error(`rig.json is missing heads/${head}`);
    }
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
  const tone = rig.skin.head_tone?.[head];
  return tone ?? "tone_4";
}
