import type {
  BrowId,
  ExpressionId,
  ExtraId,
  EyeId,
  FaceShapeId,
  FacialHairId,
  FootwearId,
  HeadwearId,
  LowerId,
  NoseId,
  OutfitId,
  PuppetConfig,
  ToneId,
} from "./loadRig";

// Every puppet option the pickers offer, shared by the puppet lab and the in-game
// backstage creator, plus the rules for random puppets and switching gender.

export type Option<T> = { id: T; label: string };

export const TONES: { id: ToneId; hex: string; label: string }[] = [
  { id: "tone_1", hex: "#F6DABA", label: "1" },
  { id: "tone_2", hex: "#ECC49A", label: "2" },
  { id: "tone_3", hex: "#D6A472", label: "3" },
  { id: "tone_4", hex: "#C48854", label: "4" },
  { id: "tone_5", hex: "#B27647", label: "5" },
  { id: "tone_6", hex: "#A0643A", label: "6" },
  { id: "tone_7", hex: "#764628", label: "7" },
  { id: "tone_8", hex: "#563420", label: "8" },
];

export const GENDERS: { id: "m" | "f"; label: string }[] = [
  { id: "m", label: "Lelaki" },
  { id: "f", label: "Perempuan" },
];

export const SHAPES_M: { id: FaceShapeId; label: string }[] = [
  { id: "oval", label: "Bujur" },
  { id: "round", label: "Bulat" },
  { id: "square", label: "Segi Empat" },
  { id: "long", label: "Panjang" },
];

export const SHAPES_F: { id: FaceShapeId; label: string }[] = [
  { id: "oval", label: "Bujur" },
  { id: "round", label: "Bulat" },
  { id: "heart", label: "Bentuk Hati" },
  { id: "long", label: "Panjang" },
];

export const EYES: { id: EyeId; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "sleepy", label: "Mengantuk" },
  { id: "round", label: "Bulat" },
];

export const BROWS: { id: BrowId; label: string }[] = [
  { id: "natural", label: "Semula Jadi" },
  { id: "thick_arched", label: "Tebal" },
  { id: "bushy", label: "Lebat" },
  { id: "thin", label: "Nipis" },
];

export const NOSES: { id: NoseId; label: string }[] = [
  { id: "soft", label: "Lembut" },
  { id: "medium", label: "Sederhana" },
  { id: "prominent", label: "Menonjol" },
];

export const EXPRESSIONS: { id: ExpressionId; label: string }[] = [
  { id: "neutral", label: "Biasa" },
  { id: "smug_grin", label: "Senyum Sinis" },
  { id: "big_laugh", label: "Gelak Besar" },
  { id: "angry_shout", label: "Jerit Marah" },
  { id: "nervous_smile", label: "Senyum Gementar" },
  { id: "shocked_o", label: "Terkejut" },
  { id: "sly_smirk", label: "Senyum Senget" },
  { id: "crying_pout", label: "Menangis" },
];

export const HAIR_M: { id: string; label: string }[] = [
  { id: "sidepart", label: "Belah Tepi" },
  { id: "crew", label: "Crew Cut" },
  { id: "curly", label: "Kerinting" },
  { id: "pompadour", label: "Pompadour" },
  { id: "long", label: "Panjang" },
  { id: "horseshoe", label: "Horseshoe" },
  { id: "bald", label: "Botak" },
];

export const HAIR_F: { id: string; label: string }[] = [
  { id: "bun", label: "Sanggul" },
  { id: "bob", label: "Bob" },
  { id: "ponytail", label: "Ekor Kuda" },
  { id: "curly", label: "Kerinting" },
  { id: "long", label: "Panjang" },
  { id: "bouffant", label: "Bouffant" },
  { id: "pixie", label: "Pixie" },
];

export const FACIAL_HAIR: { id: FacialHairId; label: string }[] = [
  { id: "none", label: "Tiada" },
  { id: "handlebar", label: "Handlebar" },
  { id: "thin", label: "Nipis" },
  { id: "full_beard", label: "Janggut Penuh" },
  { id: "stubble", label: "Renjis" },
];

export const EXTRAS: { id: ExtraId; label: string }[] = [
  { id: "none", label: "Tiada" },
  { id: "glasses", label: "Cermin Mata" },
  { id: "sunglasses", label: "Cermin Gelap" },
  { id: "blush", label: "Pipi Merah" },
  { id: "mole", label: "Tahi Lalat" },
];

export const HATS: { id: HeadwearId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "songkok", label: "Songkok" },
  { id: "tudung", label: "Tudung" },
  { id: "ketayap", label: "Ketayap" },
  { id: "turban", label: "Serban" },
  { id: "baseball_cap", label: "Topi Biru" },
  { id: "baseball_cap_red", label: "Topi Merah" },
  { id: "baseball_cap_mustard", label: "Topi Mustard" },
];

export const OUTFITS: { id: OutfitId; label: string }[] = [
  { id: "baju_melayu", label: "Baju Melayu" },
  { id: "batik_shirt", label: "Batik" },
  { id: "business_suit", label: "Suit" },
  { id: "baju_kurung", label: "Baju Kurung" },
  { id: "tshirt", label: "T-shirt" },
  { id: "hoodie", label: "Hoodie" },
];

export const LOWERS: { id: LowerId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "jeans", label: "Jeans" },
  { id: "songket_samping", label: "Samping" },
  { id: "sarong", label: "Kain" },
];

export const FOOTWEAR: { id: FootwearId; label: string }[] = [
  { id: "default", label: "Kaki Ayam" },
  { id: "selipar", label: "Selipar" },
  { id: "sneakers", label: "Sneakers" },
];

export function shapesFor(gender: "m" | "f") {
  return gender === "m" ? SHAPES_M : SHAPES_F;
}

export function hairFor(gender: "m" | "f") {
  return gender === "m" ? HAIR_M : HAIR_F;
}

/** The tudung is only offered for female puppets. */
export function hatsFor(gender: "m" | "f") {
  return gender === "f" ? HATS : HATS.filter((hat) => hat.id !== "tudung");
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function randomConfig(): PuppetConfig {
  const gender: "m" | "f" = Math.random() > 0.5 ? "m" : "f";
  return {
    gender,
    tone: pick(TONES).id,
    faceShape: pick(shapesFor(gender)).id,
    eyes: pick(EYES).id,
    brows: pick(BROWS).id,
    nose: pick(NOSES).id,
    expression: pick(EXPRESSIONS).id,
    hair: pick(hairFor(gender)).id,
    facialHair: gender === "m" ? pick(FACIAL_HAIR).id : "none",
    extra: pick(EXTRAS).id,
    headwear: pick(hatsFor(gender)).id,
    outfit: pick(OUTFITS).id,
    lower: pick(LOWERS).id,
    footwear: pick(FOOTWEAR).id,
  };
}

const MENS_HEADWEAR: readonly HeadwearId[] = ["songkok", "ketayap", "turban"];

/** Applies a change; switching gender also swaps the parts and clothes that only fit the other one. */
export function withPatch(cfg: PuppetConfig, patch: Partial<PuppetConfig>): PuppetConfig {
  const next = { ...cfg, ...patch };
  if (patch.gender && patch.gender !== cfg.gender) {
    if (patch.gender === "m") {
      if (next.faceShape === "heart") next.faceShape = "oval";
      next.hair = "sidepart";
      next.brows = "thick_arched";
      next.nose = "medium";
      if (next.headwear === "tudung") next.headwear = null;
      if (next.outfit === "baju_kurung") next.outfit = "baju_melayu";
    } else {
      if (next.faceShape === "square") next.faceShape = "oval";
      next.hair = "bun";
      next.brows = "natural";
      next.nose = "soft";
      next.facialHair = "none";
      if (next.headwear && MENS_HEADWEAR.includes(next.headwear)) next.headwear = null;
      if (next.outfit === "baju_melayu") next.outfit = "baju_kurung";
    }
  }
  return next;
}
