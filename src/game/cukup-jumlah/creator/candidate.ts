import type { PuppetConfig } from "../puppet/loadRig";
import {
  BROWS_F,
  CREATOR_EXPRESSIONS,
  EXTRAS,
  EYES,
  FACIAL_HAIR,
  FOOTWEAR,
  LOWERS,
  MALE_BROWS,
  NOSES,
  TONES,
  hairFor,
  hatsFor,
  outfitsFor,
  shapesFor,
} from "../puppet/options";

// The player's candidate: their puppet, name, party and talent, saved on this device.
// Parties are fictional food parties with neutral words (docs/GAME_PLAN.md §4): no names
// that echo real coalitions, no crown, no gold/yellow.

export type PartyId = "nasi_lemak" | "durian" | "teh_tarik" | "boba";

export type Party = { id: PartyId; name: string; slogan: string; colour: string; icon: string };

export const PARTIES: readonly Party[] = [
  {
    id: "nasi_lemak",
    name: "Parti Nasi Lemak",
    slogan: "Pedas Sikit, Kenyang Lama",
    colour: "#a8321f",
    icon: "🌶️",
  },
  {
    id: "durian",
    name: "Parti Durian",
    slogan: "Berduri Luar, Lembut Dalam",
    colour: "#5f7330",
    icon: "🌰",
  },
  {
    id: "teh_tarik",
    name: "Parti Teh Tarik",
    slogan: "Tarik Panjang, Rasa Seimbang",
    colour: "#8a5a2b",
    icon: "☕",
  },
  {
    id: "boba",
    name: "Parti Boba",
    slogan: "Manis Kurang, Ais Penuh",
    colour: "#6a4c93",
    icon: "🧋",
  },
];

export type TalentId = "lidah_manis" | "mesra_rakyat" | "pakar_kira" | "muka_tembok";

export type Talent = { id: TalentId; name: string; icon: string; effect: string };

export const TALENTS: readonly Talent[] = [
  {
    id: "lidah_manis",
    name: "Lidah Manis",
    icon: "🍯",
    effect: "Satu bar rentak tambahan (≈2 saat) setiap cabaran",
  },
  {
    id: "mesra_rakyat",
    name: "Mesra Rakyat",
    icon: "🤝",
    effect: "Satu kesilapan tambahan setiap cabaran",
  },
  { id: "pakar_kira", name: "Pakar Kira", icon: "🧮", effect: "Bantuan kira deposit dan undi" },
  {
    id: "muka_tembok",
    name: "Muka Tembok",
    icon: "🧱",
    effect: "Mula dengan satu deposit tambahan",
  },
];

export const NAME_MAX = 20;
export const DEFAULT_NAME = "YB Anda";

export type Candidate = {
  name: string;
  party: PartyId;
  talent: TalentId;
  puppet: PuppetConfig;
};

export const DEFAULT_PUPPET: PuppetConfig = {
  gender: "m",
  tone: "tone_5",
  faceShape: "oval",
  eyes: "normal",
  brows: MALE_BROWS,
  nose: "soft",
  expression: "neutral",
  hair: "sidepart",
  facialHair: "none",
  extra: "none",
  headwear: "songkok",
  outfit: "baju_melayu",
  lower: "songket_samping",
  footwear: "default",
};

export const DEFAULT_CANDIDATE: Candidate = {
  name: DEFAULT_NAME,
  party: "nasi_lemak",
  talent: "mesra_rakyat",
  puppet: DEFAULT_PUPPET,
};

export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
}

function oneOf<T>(value: unknown, options: readonly { id: T }[], fallback: T): T {
  return options.some((o) => o.id === value) ? (value as T) : fallback;
}

/** Rebuilds a puppet from untrusted saved data, replacing anything unknown with a default. */
export function sanitizePuppet(raw: unknown): PuppetConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const gender: "m" | "f" = r.gender === "f" ? "f" : "m";
  return {
    gender,
    tone: oneOf(r.tone, TONES, DEFAULT_PUPPET.tone),
    faceShape: oneOf(r.faceShape, shapesFor(gender), "oval"),
    eyes: oneOf(r.eyes, EYES, "normal"),
    brows: gender === "f" ? oneOf(r.brows, BROWS_F, "natural") : MALE_BROWS,
    nose: oneOf(r.nose, NOSES, "soft"),
    expression: oneOf(r.expression, CREATOR_EXPRESSIONS, "neutral"),
    hair: oneOf(r.hair, hairFor(gender), gender === "m" ? "sidepart" : "bun"),
    facialHair: gender === "m" ? oneOf(r.facialHair, FACIAL_HAIR, "none") : "none",
    extra: oneOf(r.extra, EXTRAS, "none"),
    headwear: oneOf(r.headwear, hatsFor(gender), null),
    outfit: oneOf(r.outfit, outfitsFor(gender), gender === "m" ? "baju_melayu" : "baju_kurung"),
    lower: oneOf(r.lower, LOWERS, null),
    footwear: oneOf(r.footwear, FOOTWEAR, "default"),
  };
}

export function sanitizeCandidate(raw: unknown): Candidate {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = typeof r.name === "string" ? cleanName(r.name) : "";
  return {
    name: name || DEFAULT_NAME,
    party: oneOf(r.party, PARTIES, DEFAULT_CANDIDATE.party),
    talent: oneOf(r.talent, TALENTS, DEFAULT_CANDIDATE.talent),
    puppet: sanitizePuppet(r.puppet),
  };
}

const KEY = "cukup-jumlah.candidate.v1";

/** The saved candidate, or null if this device has none yet. */
export function loadCandidate(): Candidate | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitizeCandidate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveCandidate(candidate: Candidate): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sanitizeCandidate(candidate)));
  } catch {
    // Private mode or blocked storage: the candidate just lasts this session.
  }
}
