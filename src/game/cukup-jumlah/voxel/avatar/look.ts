import type { CandidateProfile } from "../../types";

export type HeadwearKind = "songkok" | "tudung" | "cap" | "none";
export type FacialHair = "none" | "moustache" | "beard";

export interface VoxelLook {
  skin: number;
  cloth: string;
  clothShadow?: string;
  clothLight?: string;
  headwear: HeadwearKind;
  headwearColor: string;
  headwearShadow?: string;
  headwearLight?: string;
  hair: "black" | "brown" | "grey";
  facial: FacialHair;
}

export const HERO_LOOK: VoxelLook = {
  skin: 2,
  cloth: "#d2262c",
  clothShadow: "#8e1c24",
  clothLight: "#ef5a4a",
  headwear: "songkok",
  headwearColor: "#161616",
  headwearShadow: "#0c0c0c",
  headwearLight: "#3a3a3a",
  hair: "black",
  facial: "moustache",
};

export function normalizeHeadwear(headwear: string | undefined): HeadwearKind {
  switch (headwear) {
    case "songkok":
    case "songkok_senget":
    case "kopiah":
      return "songkok";
    case "tudung":
    case "tudung_bawal":
    case "turban":
      return "tudung";
    case "cap":
    case "topi_jerami":
      return "cap";
    default:
      return "none";
  }
}

export function lookFromProfile(profile: CandidateProfile): VoxelLook {
  const mouth = profile.mouth ?? "clean";
  const facial: FacialHair =
    mouth === "beard" || mouth === "goatee_full" ? "beard" : mouth === "misai" ? "moustache" : "none";
  return {
    skin: profile.skinIndex ?? 2,
    cloth: profile.clothesColor || HERO_LOOK.cloth,
    clothShadow: profile.clothesShadow,
    clothLight: profile.clothesLight,
    headwear: normalizeHeadwear(profile.headwear),
    headwearColor: profile.headwearColor || "#161616",
    headwearShadow: profile.headwearShadow,
    headwearLight: profile.headwearLight,
    hair: profile.hairColor ?? "black",
    facial,
  };
}

export function heroProfile(): CandidateProfile {
  return {
    name: "YB Mamak",
    gender: "male",
    party: "PNL",
    headwear: "songkok",
    headwearColor: "#161616",
    headwearShadow: "#0c0c0c",
    headwearLight: "#3a3a3a",
    outfit: "baju_melayu",
    clothesColor: HERO_LOOK.cloth,
    clothesShadow: HERO_LOOK.clothShadow,
    clothesLight: HERO_LOOK.clothLight,
    skinIndex: HERO_LOOK.skin,
    hair: "side_part",
    hairColor: "black",
    mouth: "misai",
    prop: "briefcase",
    talent: "lidah_manis",
    quirk: "janji_manis",
  };
}
