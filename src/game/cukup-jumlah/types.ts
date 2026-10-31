import type { PuppetConfig } from "./puppet/loadRig";
import { PARTIES as PARTY_LIST, type PartyId } from "./creator/candidate";

export type { PartyId };

export interface PartyInfo {
  id: PartyId;
  /** Short code, e.g. PNL. */
  name: string;
  fullName: string;
  themeColor: string; // hex
  slogan: string;
  symbolEmoji: string;
}

// The parties live in creator/candidate.ts; this is the shape the older screens read.
export const PARTIES = Object.fromEntries(
  PARTY_LIST.map((p) => [
    p.id,
    {
      id: p.id,
      name: p.name
        .split(" ")
        .map((w) => w[0])
        .join(""),
      fullName: p.name,
      themeColor: p.colour,
      slogan: p.slogan,
      symbolEmoji: p.icon,
    },
  ]),
) as Record<PartyId, PartyInfo>;

export type TalentType = "lidah_manis" | "mesra_rakyat" | "pakar_kira" | "muka_tembok";

export type QuirkType = "kaki_zzz" | "janji_manis" | "sensitif";

export const TALENT_DETAILS: Record<
  TalentType,
  { name: string; icon: string; description: string }
> = {
  lidah_manis: {
    name: "Lidah Manis",
    icon: "🍯",
    description: "+1.5s masa berfikir ekstra",
  },
  mesra_rakyat: {
    name: "Mesra Rakyat",
    icon: "🤝",
    description: "Zon toleransi & hit window lebih luas",
  },
  pakar_kira: {
    name: "Pakar Kira",
    icon: "🧮",
    description: "Bantuan baki kalkulator deposit & undi",
  },
  muka_tembok: {
    name: "Muka Tembok",
    icon: "🧱",
    description: "Mula dengan 4 bundle deposit tunai",
  },
};

export const QUIRK_DETAILS: Record<QuirkType, { name: string; icon: string; description: string }> =
  {
    kaki_zzz: {
      name: "Kaki Zzz",
      icon: "😴",
      description: "Tertidur: Perlu ketuk untuk celik",
    },
    janji_manis: {
      name: "Janji Manis",
      icon: "📢",
      description: "Pengundi menjerit minta peruntukan",
    },
    sensitif: {
      name: "Sensitif",
      icon: "🌶️",
      description: "Tekanan masa tinggi (-1.0s pada jam)",
    },
  };

export interface CandidateProfile {
  name: string;
  party: PartyId;
  puppet: PuppetConfig;
  talent: TalentType;
  quirk: QuirkType;
}

export interface ConstitutionFact {
  id: string;
  article: string;
  title: string;
  didYouKnow: string;
  fullReference: string;
}

export type GameScreen =
  | "customizer"
  | "act1_intro"
  | "microgame"
  | "microgame_result"
  | "act1_complete"
  | "act2_intro"
  | "act2_complete"
  | "act3_intro"
  | "act3_complete"
  | "endgame_victory"
  | "endgame_hung"
  | "unity_negotiation"
  | "endgame_opposition"
  | "game_over";

export type MicrogameId =
  | "semak_borang"
  | "bayar_deposit"
  | "cop_watikah"
  | "pecut_spr"
  | "rebut_kamera"
  | "goreng_kueyteow"
  | "potong_reben"
  | "payung_bos"
  | "pacak_bendera"
  | "perang_speaker"
  | "turap_jalan"
  | "baling_baju"
  | "cuci_longkang"
  | "celup_dakwat"
  | "tapis_undi_rosak"
  | "borang_14"
  | "runding_perpaduan";
