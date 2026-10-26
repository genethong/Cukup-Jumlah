export type PartyId = "PNL" | "BD" | "GTT" | "PBB";

export interface PartyInfo {
  id: PartyId;
  name: string;
  fullName: string;
  colorName: string;
  themeColor: string; // hex
  badgeBg: string;
  badgeBorder: string;
  slogan: string;
  vibe: string;
  symbolEmoji: string;
}

export const PARTIES: Record<PartyId, PartyInfo> = {
  PNL: {
    id: "PNL",
    name: "PNL",
    fullName: "Parti Nasi Lemak",
    colorName: "Merah (Red)",
    themeColor: "#DC2626", // Red-600
    badgeBg: "bg-red-500",
    badgeBorder: "border-red-600",
    slogan: "Sambal Pedas, Suara Tegas",
    vibe: "Aktivis Reformis Berapi: Suka guna megafon, jerit Tarik Balik!",
    symbolEmoji: "🌶️",
  },
  BD: {
    id: "BD",
    name: "BD",
    fullName: "Barisan Durian",
    colorName: "Kuning (Yellow)",
    themeColor: "#EAB308", // Yellow-500
    badgeBg: "bg-yellow-500",
    badgeBorder: "border-yellow-600",
    slogan: "Raja Segala Parti, Berisi & Berduri",
    vibe: "Golongan Elit Veteran: Naik Vellfire, jam emas, cincin permata.",
    symbolEmoji: "👑",
  },
  GTT: {
    id: "GTT",
    name: "GTT",
    fullName: "Gabungan Teh Tarik",
    colorName: "Biru (Blue)",
    themeColor: "#2563EB", // Blue-600
    badgeBg: "bg-blue-600",
    badgeBorder: "border-blue-700",
    slogan: "Buih Lebih, Janji Buih",
    vibe: "Teknokrat Mamak Sentris: Settle semua rundingan jam 2 pagi di mamak.",
    symbolEmoji: "☕",
  },
  PBB: {
    id: "PBB",
    name: "PBB",
    fullName: "Parti Boba Bersatu",
    colorName: "Putih (White)",
    themeColor: "#F8FAFC", // Slate-50
    badgeBg: "bg-slate-100 text-slate-900",
    badgeBorder: "border-slate-300",
    slogan: "Manis 100%, Ais 0%",
    vibe: "Generasi Belia TikTok: Buat video viral 15 saat untuk bentang bajet.",
    symbolEmoji: "🧋",
  },
};

export type HeadwearType =
  | "songkok"
  | "songkok_senget"
  | "tudung"
  | "kopiah"
  | "pomade"
  | "topi_jerami";

export type OutfitType =
  | "baju_melayu"
  | "batik"
  | "baju_kurung"
  | "kot_formal"
  | "jaket_banjir";

export type PropType =
  | "briefcase"
  | "pen_emas"
  | "payung_vip"
  | "tuala_goodmorning";

export type TalentType =
  | "lidah_manis"
  | "mesra_rakyat"
  | "pakar_kira"
  | "muka_tembok";

export type QuirkType =
  | "kaki_zzz"
  | "janji_manis"
  | "sensitif";

export interface CandidateProfile {
  name: string;
  gender: "male" | "female";
  party: PartyId;
  headwear: HeadwearType;
  outfit: OutfitType;
  prop: PropType;
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
  | "game_over";

export type MicrogameId =
  | "semak_borang"
  | "bayar_deposit"
  | "cop_watikah"
  | "goreng_kueyteow"
  | "potong_reben"
  | "payung_bos"
  | "pacak_bendera";
