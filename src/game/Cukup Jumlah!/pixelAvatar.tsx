import React, { useEffect, useRef } from "react";
import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";

export interface SkinTone {
  base: string;
  shadow: string;
  deep: string;
  name: string;
}

export const SKIN_PALETTE: SkinTone[] = [
  { base: '#fde7d4', shadow: '#e8b896', deep: '#d49b73', name: 'Cerah 1' },
  { base: '#f6c9a3', shadow: '#d9925f', deep: '#ba6e3a', name: 'Cerah 2' },
  { base: '#e0aa7e', shadow: '#c58a52', deep: '#a46831', name: 'Sederhana 1' },
  { base: '#c68642', shadow: '#a36427', deep: '#804815', name: 'Sederhana 2' },
  { base: '#8d5524', shadow: '#6a3a12', deep: '#4d2406', name: 'Gelap 1' },
  { base: '#5c3a21', shadow: '#422510', deep: '#2c1405', name: 'Gelap 2' }
];

export interface ColorSwatch {
  col: string;
  shd: string;
  lit: string;
  name: string;
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { col: '#1e293b', shd: '#0f172a', lit: '#334155', name: 'Biru Gelap' },
  { col: '#dc2626', shd: '#991b1b', lit: '#ef4444', name: 'Merah' },
  { col: '#2563eb', shd: '#1d4ed8', lit: '#3b82f6', name: 'Biru' },
  { col: '#059669', shd: '#047857', lit: '#10b981', name: 'Hijau' },
  { col: '#d97706', shd: '#b45309', lit: '#f59e0b', name: 'Emas' },
  { col: '#f8fafc', shd: '#94a3b8', lit: '#ffffff', name: 'Putih' },
  { col: '#7c3aed', shd: '#6d28d9', lit: '#8b5cf6', name: 'Ungu' },
  { col: '#db2777', shd: '#be185d', lit: '#ec4899', name: 'Merah Jambu' }
];

export const BG_SWATCHES = [
  '#f59e0b', '#ef4444', '#2563eb', '#059669', '#7c3aed', '#0891b2', '#db2777', '#334155'
];

export interface AvatarDrawState {
  gender: 'male' | 'female';
  skinIndex: number;
  skin: string;
  skinShadow: string;
  skinDeep: string;
  hairColor: 'black' | 'brown' | 'grey';
  hair: string;
  headwear: string;
  headwearColor: string;
  headwearShadow: string;
  headwearLight: string;
  mouth: string;
  faceMark: string;
  outfit: string;
  clothesColor: string;
  clothesShadow: string;
  clothesLight: string;
  accessory: string;
  bg: string;
}

export function resolveAvatarState(profile?: Partial<CandidateProfile>): AvatarDrawState {
  const gender = profile?.gender === 'female' ? 'female' : 'male';
  const isFem = gender === 'female';

  const skinIdx = (profile?.skinIndex !== undefined && profile.skinIndex >= 0 && profile.skinIndex < SKIN_PALETTE.length)
    ? profile.skinIndex
    : 1;
  const skin = SKIN_PALETTE[skinIdx];

  const partyColor = profile?.party && PARTIES[profile.party]
    ? PARTIES[profile.party].themeColor === '#F8FAFC' ? '#64748B' : PARTIES[profile.party].themeColor
    : (isFem ? '#db2777' : '#1e293b');

  // Map legacy headwear & outfit to 96x96 pixel engine equivalents
  let headwear = profile?.headwear || (isFem ? 'none' : 'songkok');
  if (headwear === 'tudung') headwear = 'tudung_bawal';
  if (headwear === 'pomade') headwear = 'none';
  if (headwear === 'topi_jerami') headwear = 'cap';

  let outfit = profile?.outfit || (isFem ? 'baju_kurung' : 'suit');
  if (outfit === 'kot_formal') outfit = 'suit';
  if (outfit === 'jaket_banjir') outfit = 'polo';
  if (outfit === 'batik') outfit = 'baju_tang';

  return {
    gender,
    skinIndex: skinIdx,
    skin: skin.base,
    skinShadow: skin.shadow,
    skinDeep: skin.deep,
    hairColor: profile?.hairColor || 'black',
    hair: profile?.hair || (isFem ? 'wavy_long' : 'side_part'),
    headwear,
    headwearColor: profile?.headwearColor || (isFem ? '#059669' : '#1e293b'),
    headwearShadow: profile?.headwearShadow || '#0f172a',
    headwearLight: profile?.headwearLight || '#334155',
    mouth: profile?.mouth || (isFem ? 'red_lips' : 'clean'),
    faceMark: profile?.faceMark || (isFem ? 'mole' : 'none'),
    outfit,
    clothesColor: profile?.clothesColor || partyColor,
    clothesShadow: profile?.clothesShadow || '#0f172a',
    clothesLight: profile?.clothesLight || '#334155',
    accessory: profile?.accessory || 'none',
    bg: profile?.bg || '#f59e0b'
  };
}

export function getHairPalette(hairColor: string) {
  if (hairColor === 'grey') {
    return { base: '#94a3b8', mid: '#cbd5e1', shine: '#f1f5f9', brow: '#64748b' };
  } else if (hairColor === 'brown') {
    return { base: '#451a03', mid: '#78350f', shine: '#92400e', brow: '#451a03' };
  }
  // B19 fix: neutral slate mid tone
  return { base: '#0f172a', mid: '#1e293b', shine: '#334155', brow: '#0f172a' };
}

/* =========================================================================
   13-STAGE STRICT ORDERED LAYER PIPELINE
   ========================================================================= */

const layers = {
  // 1. Background
  bg(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void) {
    p(0, 0, 96, 96, s.bg);
  },

  // 2. Back Hair
  backHair(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (s.headwear === 'tudung_bawal' || s.headwear === 'turban') return;

    if (isFem) {
      if (s.hair === 'wavy_long') {
        // Tapered long hair: hugs head, falls past shoulders, narrows at tips
        p(24, 24, 48, 12, hp.base);
        p(22, 36, 52, 30, hp.base);
        p(24, 66, 48, 14, hp.base);
        p(28, 80, 40, 6,  hp.base);
        p(26, 30, 44, 50, hp.mid);
        p(24, 40, 3, 20, hp.shine);
        p(69, 40, 3, 20, hp.shine);
        p(30, 82, 4, 4, hp.base);
        p(62, 82, 4, 4, hp.base);
      } else if (s.hair === 'bob_cut') {
        p(24, 24, 48, 32, hp.base);
        p(26, 48, 44, 8, hp.base);
      } else if (s.hair === 'ponytail') {
        // B03: tapered ponytail on side, scrunchie outside face
        p(64, 28, 10, 10, hp.base);
        p(66, 38, 8, 14, hp.base);
        p(68, 52, 5, 10, hp.base);
      }
    }
  },

  // 3. Body / Torso Base
  body(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (!isFem) {
      p(36, 66, 24, 6, '#0f172a');
      p(28, 68, 40, 6, '#0f172a');
      p(22, 71, 52, 6, '#0f172a');
      p(16, 74, 64, 6, '#0f172a');
      p(10, 77, 76, 6, '#0f172a');
      p(6, 80, 84, 16, '#0f172a');
    } else {
      p(38, 68, 20, 5, '#0f172a');
      p(32, 70, 32, 5, '#0f172a');
      p(26, 73, 44, 5, '#0f172a');
      p(20, 76, 56, 5, '#0f172a');
      p(15, 80, 66, 6, '#0f172a');
      p(12, 84, 72, 12, '#0f172a');
    }
  },

  // 4. Neck & Head Anatomy
  neckHead(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (!isFem) {
      p(42, 58, 12, 12, '#0f172a');
      p(43, 60, 10, 10, s.skinShadow);

      p(28, 22, 40, 30, '#0f172a');
      p(30, 20, 36, 34, '#0f172a');
      p(30, 48, 36, 6, '#0f172a');
      p(34, 54, 28, 5, '#0f172a');
      p(38, 58, 20, 4, '#0f172a');
      p(42, 61, 12, 2, '#0f172a');

      p(30, 22, 36, 28, s.skin);
      p(32, 48, 32, 6, s.skin);
      p(36, 54, 24, 4, s.skin);
      p(40, 58, 16, 3, s.skin);

      p(26, 36, 4, 10, '#0f172a');
      p(27, 37, 3, 8, s.skin);
      p(66, 36, 4, 10, '#0f172a');
      p(66, 37, 3, 8, s.skin);
    } else {
      p(44, 58, 8, 12, '#0f172a');
      p(45, 60, 6, 10, s.skinShadow);

      p(30, 22, 36, 26, '#0f172a');
      p(32, 20, 32, 30, '#0f172a');
      p(32, 48, 32, 5, '#0f172a');
      p(36, 53, 24, 4, '#0f172a');
      p(40, 57, 16, 3, '#0f172a');
      p(43, 60, 10, 2, '#0f172a');

      p(32, 22, 32, 28, s.skin);
      p(34, 48, 28, 5, s.skin);
      p(38, 53, 20, 4, s.skin);
      p(42, 57, 12, 3, s.skin);

      p(28, 37, 3, 8, '#0f172a');
      p(29, 38, 2, 6, s.skin);
      p(65, 37, 3, 8, '#0f172a');
      p(65, 38, 2, 6, s.skin);
    }
  },

  // 5. Front Hair (when headwear === 'none')
  frontHair(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (s.headwear !== 'none') return;

    if (!isFem) {
      if (s.hair === 'side_part') {
        p(32, 10, 32, 6, hp.base);
        p(28, 14, 40, 10, hp.base);
        p(26, 20, 6, 12, hp.base);
        p(64, 20, 6, 12, hp.base);
        p(32, 22, 28, 4, hp.base);
        p(36, 26, 18, 2, hp.base);
        p(36, 12, 2, 8, hp.shine);
        p(40, 13, 20, 3, hp.mid);
      } else if (s.hair === 'jambul') {
        p(36, 4, 24, 6, hp.base);
        p(32, 8, 32, 8, hp.base);
        p(28, 14, 40, 10, hp.base);
        p(26, 20, 6, 12, hp.base);
        p(64, 20, 6, 12, hp.base);
        p(40, 6, 16, 4, hp.shine);
      } else if (s.hair === 'short_crop') {
        p(32, 12, 32, 6, hp.base);
        p(28, 16, 40, 8, hp.base);
        p(28, 22, 4, 8, hp.base);
        p(64, 22, 4, 8, hp.base);
        p(32, 22, 32, 2, hp.mid);
      } else if (s.hair === 'bald') {
        // B01 fix: scalp shine inside head
        p(36, 22, 24, 2, s.skinShadow);
        p(40, 23, 6, 1, '#ffffff');
        p(30, 26, 3, 8, hp.base);
        p(63, 26, 3, 8, hp.base);
      }
    } else {
      if (s.hair === 'wavy_long') {
        p(30, 8, 36, 8, hp.base);
        p(26, 14, 44, 10, hp.base);
        p(30, 20, 36, 6, hp.base);
        p(32, 24, 26, 4, hp.base);
        p(36, 27, 16, 3, hp.base);
        p(34, 12, 28, 3, hp.shine);
        p(38, 22, 16, 2, hp.shine);
        p(22, 22, 8, 36, hp.base);
        p(24, 52, 6, 16, hp.base);
        p(66, 22, 8, 36, hp.base);
        p(66, 52, 6, 16, hp.base);
      } else if (s.hair === 'bob_cut') {
        p(30, 8, 36, 8, hp.base);
        p(26, 14, 44, 10, hp.base);
        p(30, 20, 36, 5, hp.base);
        p(34, 24, 20, 3, hp.base);
        p(32, 12, 30, 3, hp.shine);
        p(24, 22, 6, 26, hp.base);
        p(26, 46, 5, 6, hp.base);
        p(66, 22, 6, 26, hp.base);
        p(65, 46, 5, 6, hp.base);
      } else if (s.hair === 'high_bun') {
        // B15 fix: lower bun at y=4, hairpin on right
        p(38, 4, 20, 10, hp.base);
        p(56, 4, 8, 2, '#facc15');
        p(63, 3, 2, 2, '#dc2626');
        p(30, 10, 36, 8, hp.base);
        p(26, 16, 44, 8, hp.base);
        p(30, 20, 36, 4, hp.base);
        p(34, 23, 14, 2, hp.base);
        p(26, 22, 5, 12, hp.base);
        p(65, 22, 5, 12, hp.base);
      } else if (s.hair === 'ponytail') {
        p(30, 10, 36, 8, hp.base);
        p(26, 16, 44, 8, hp.base);
        p(30, 20, 36, 4, hp.base);
        p(32, 12, 28, 3, hp.shine);
        p(26, 22, 5, 14, hp.base);
        p(65, 22, 5, 14, hp.base);
        // B03 fix: scrunchie outside face
        p(66, 24, 6, 5, '#f43f5e');
        p(67, 25, 4, 3, '#fb7185');
      }
    }
  },

  // 6. Eyes & Eyebrows
  eyes(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (!isFem) {
      p(36, 38, 7, 7, '#0f172a');
      p(53, 38, 7, 7, '#0f172a');
      p(37, 39, 2, 2, '#ffffff');
      p(54, 39, 2, 2, '#ffffff');

      // B14: dark skin rim contrast
      if (s.skinIndex >= 4) {
        p(36, 37, 7, 1, '#fde68a33');
        p(53, 37, 7, 1, '#fde68a33');
      }

      p(34, 33, 11, 3, hp.brow);
      p(51, 33, 11, 3, hp.brow);
    } else {
      p(33, 37, 11, 8, '#0f172a');
      p(34, 38, 4, 5, '#ffffff');
      p(38, 39, 5, 5, '#1e293b');
      p(39, 40, 2, 2, '#ffffff');

      // B07 fix: lash flick at x=32
      p(32, 35, 2, 2, '#0f172a');

      p(52, 37, 11, 8, '#0f172a');
      p(53, 38, 4, 5, '#ffffff');
      p(57, 39, 5, 5, '#1e293b');
      p(58, 40, 2, 2, '#ffffff');

      // B07 fix: lash flick at x=62
      p(62, 35, 2, 2, '#0f172a');

      if (s.skinIndex >= 4) {
        p(33, 36, 11, 1, '#fde68a33');
        p(52, 36, 11, 1, '#fde68a33');
      }

      p(33, 33, 11, 2, hp.brow);
      p(52, 33, 11, 2, hp.brow);

      // B07 fix: blush confined inside cheek
      p(33, 45, 5, 3, '#fca5a5');
      p(58, 45, 5, 3, '#fca5a5');
    }
  },

  // 7. Nose
  nose(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    // B13 fix: skinShadow base + skinDeep nostrils
    if (!isFem) {
      p(45, 46, 6, 2, s.skinShadow);
      p(45, 47, 1, 1, s.skinDeep);
      p(50, 47, 1, 1, s.skinDeep);
    } else {
      p(46, 46, 4, 2, s.skinShadow);
      p(46, 47, 1, 1, s.skinDeep);
      p(49, 47, 1, 1, s.skinDeep);
    }
  },

  // 8. Mouth & Facial Hair
  mouth(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (!isFem) {
      // B11 fix: facial hair stays inside jaw boundaries (y<=61)
      if (s.mouth === 'clean') {
        p(43, 52, 10, 2, '#0f172a');
        p(44, 52, 8, 1, '#ffffff');
      } else if (s.mouth === 'misai') {
        p(38, 49, 20, 3, hp.base);
        p(36, 50, 4, 3, hp.base);
        p(56, 50, 4, 3, hp.base);
        p(43, 52, 10, 2, '#0f172a');
      } else if (s.mouth === 'beard') {
        p(42, 52, 12, 2, '#0f172a');
        p(44, 52, 8, 1, '#ffffff');
        p(42, 56, 12, 4, hp.base);
        p(44, 60, 8, 2, hp.base);
      } else if (s.mouth === 'goatee_full') {
        p(38, 49, 20, 3, hp.base);
        p(43, 52, 10, 2, '#0f172a');
        p(34, 52, 3, 6, hp.base);
        p(59, 52, 3, 6, hp.base);
        p(36, 56, 24, 4, hp.base);
        p(40, 60, 16, 2, hp.base);
      }
    } else {
      if (s.mouth === 'natural') {
        p(43, 52, 10, 2, '#f43f5e');
        p(44, 52, 8, 1, '#fb7185');
      } else if (s.mouth === 'red_lips') {
        p(42, 51, 12, 3, '#e11d48');
        p(44, 51, 8, 1, '#fda4af');
      } else if (s.mouth === 'coral_lips') {
        p(42, 51, 12, 3, '#f97316');
        p(44, 51, 8, 1, '#fed7aa');
      } else if (s.mouth === 'smile') {
        p(42, 51, 12, 3, '#e11d48');
        p(43, 52, 10, 1, '#ffffff');
      }
    }
  },

  // 9. Face Marks
  faceMark(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void) {
    if (s.faceMark === 'mole') {
      p(58, 49, 2, 2, '#020617');
    } else if (s.faceMark === 'bindi') {
      p(46, 32, 4, 4, '#dc2626');
      p(47, 33, 2, 2, '#fef08a');
    } else if (s.faceMark === 'veteran') {
      // B13 fix: soft wrinkles with reduced alpha
      ctx.save();
      ctx.globalAlpha = 0.55;
      p(36, 28, 24, 1, s.skinDeep);
      p(33, 40, 3, 1, s.skinDeep);
      p(60, 40, 3, 1, s.skinDeep);
      p(40, 49, 2, 3, s.skinDeep);
      p(54, 49, 2, 3, s.skinDeep);
      ctx.restore();
    }
  },

  // 10. Outfits
  outfit(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    const col = s.clothesColor;
    const shd = s.clothesShadow;
    const lit = s.clothesLight;

    if (!isFem) {
      if (s.outfit === 'suit') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(42, 67, 12, 14, '#ffffff');
        p(46, 70, 4, 16, '#dc2626');
        p(45, 68, 6, 3, '#b91c1c');
        p(34, 71, 10, 16, shd);
        p(52, 71, 10, 16, shd);
      } else if (s.outfit === 'baju_melayu') {
        // B18 fix: Cekak Musang stand collar + 3 uniform studs
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(42, 64, 12, 3, shd);
        p(44, 62, 8, 2, shd);
        p(47, 70, 2, 2, '#facc15');
        p(47, 76, 2, 2, '#facc15');
        p(47, 82, 2, 2, '#facc15');
        p(47, 65, 2, 22, shd);
      } else if (s.outfit === 'baju_tang' || s.outfit === 'samfoo') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(44, 64, 8, 4, shd);
        p(46, 68, 4, 28, shd);
        for (let y = 72; y <= 86; y += 7) {
          p(42, y, 12, 2, '#facc15');
          p(46, y - 1, 4, 4, '#eab308');
        }
      } else if (s.outfit === 'kurta') {
        p(14, 78, 68, 18, '#f8fafc');
        p(22, 73, 52, 6, '#f8fafc');
        p(32, 69, 32, 4, '#f8fafc');
        p(43, 64, 10, 3, '#e2e8f0');
        p(20, 75, 14, 21, col);
        p(62, 75, 14, 21, col);
        p(34, 76, 8, 20, shd);
        p(54, 76, 8, 20, shd);
        p(46, 70, 4, 16, '#d97706');
      } else if (s.outfit === 'polo') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(40, 66, 16, 4, shd);
        p(45, 70, 6, 14, shd);
        p(47, 73, 2, 2, '#ffffff');
        p(47, 78, 2, 2, '#ffffff');
      }
    } else {
      if (s.outfit === 'baju_kurung') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(42, 67, 12, 2, shd);
        p(44, 69, 8, 2, shd);
        p(46, 72, 4, 2, shd);
        p(47, 71, 2, 2, '#facc15');
      } else if (s.outfit === 'saree') {
        // B16 fix: responds to palette swatches
        p(14, 78, 68, 18, lit);
        p(22, 73, 52, 6, lit);
        p(32, 69, 32, 4, lit);
        p(36, 68, 24, 7, shd);
        p(42, 67, 12, 6, s.skin);
        p(16, 74, 26, 22, col);
        p(22, 70, 20, 10, col);
        p(32, 80, 14, 16, col);
        p(16, 74, 2, 22, '#facc15');
        p(22, 70, 2, 10, '#facc15');
      } else if (s.outfit === 'cheongsam') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(43, 64, 10, 4, shd);
        p(47, 68, 14, 2, '#facc15');
        p(58, 70, 2, 6, '#facc15');
        p(56, 76, 4, 2, '#facc15');
        p(49, 68, 3, 3, '#eab308');
        p(57, 75, 3, 3, '#eab308');
      } else if (s.outfit === 'blazer') {
        p(14, 78, 68, 18, col);
        p(22, 73, 52, 6, col);
        p(32, 69, 32, 4, col);
        p(43, 67, 10, 12, '#ffffff');
        p(34, 71, 10, 16, shd);
        p(52, 71, 10, 16, shd);
        p(46, 75, 4, 4, '#facc15');
      } else if (s.outfit === 'kemeja_kempen' || s.outfit === 'kemeja') {
        p(14, 78, 68, 18, '#f8fafc');
        p(22, 73, 52, 6, '#f8fafc');
        p(32, 69, 32, 4, '#f8fafc');
        p(41, 67, 14, 3, '#cbd5e1');
        p(46, 70, 4, 20, '#cbd5e1');
        p(47, 73, 2, 2, '#0f172a');
        p(47, 80, 2, 2, '#0f172a');
        // B20 fix: grounded base pocket with rosette
        p(26, 78, 9, 7, '#e2e8f0');
        p(27, 79, 7, 1, '#facc15');
        p(29, 81, 3, 3, '#facc15');
      }
    }
  },

  // 11. Headwear
  headwear(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void) {
    if (s.headwear === 'none') return;

    const hwCol = s.headwearColor;
    const hwShd = s.headwearShadow;

    if (s.headwear === 'songkok' || s.headwear === 'songkok_senget') {
      // B10 fix: plain velvet songkok, top oval highlight
      p(26, 8, 44, 16, '#0f172a');
      p(28, 6, 40, 20, '#0f172a');
      p(30, 9, 36, 1, '#475569');
      p(26, 12, 2, 12, '#020617');
      p(68, 12, 2, 12, '#020617');
      p(26, 23, 44, 1, '#1e293b');
    } else if (s.headwear === 'kopiah') {
      // B08 fix: low rounded dome kopiah with knit dots
      p(29, 13, 38, 13, '#0f172a');
      p(30, 14, 36, 11, '#ffffff');
      p(32, 12, 32, 2, '#0f172a');
      p(33, 13, 30, 1, '#ffffff');
      for (let x = 32; x < 64; x += 4) {
        p(x, 17, 2, 2, '#cbd5e1');
      }
      p(30, 23, 36, 2, '#e2e8f0');
    } else if (s.headwear === 'turban') {
      p(22, 6, 52, 22, hwCol);
      p(26, 2, 44, 26, hwCol);
      p(32, 8, 18, 16, hwShd);
      p(46, 8, 18, 16, hwCol);
      p(45, 12, 6, 8, '#f59e0b');
      p(46, 14, 4, 4, '#dc2626');
      p(47, 10, 2, 4, '#fef08a');
      p(22, 22, 52, 4, hwShd);
    } else if (s.headwear === 'tudung_bawal' || s.headwear === 'tudung') {
      // B05 & B06 fix: Continuous face frame & short bawal drape
      p(26, 6, 44, 14, hwCol);
      p(24, 12, 48, 12, hwCol);
      p(22, 18, 10, 44, hwCol);
      p(64, 18, 10, 44, hwCol);
      p(31, 20, 1, 35, hwShd);
      p(64, 20, 1, 35, hwShd);
      p(30, 55, 36, 9, hwCol);
      p(46, 57, 4, 4, '#facc15');
      p(47, 58, 2, 2, '#ffffff');
      p(26, 62, 44, 6, hwCol);
      p(30, 62, 36, 1, hwShd);
      p(34, 68, 28, 4, hwCol);
      p(40, 72, 16, 3, hwCol);
      p(45, 75, 6, 2, hwCol);
    } else if (s.headwear === 'cap') {
      // B09 fix: lower natural crown, projecting brim
      p(30, 8, 36, 4, hwCol);
      p(27, 12, 42, 10, hwCol);
      p(46, 6, 4, 3, hwShd);
      p(44, 11, 8, 7, '#ffffff');
      p(46, 12, 4, 5, '#dc2626');
      p(47, 13, 2, 3, '#facc15');
      p(24, 22, 48, 3, hwShd);
      p(26, 25, 44, 1, '#0f172a');
      p(32, 26, 32, 1, s.skinShadow);
    }
  },

  // 12. Front Hair Peek (under Songkok, Kopiah, Cap)
  frontHairPeek(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void, hp: ReturnType<typeof getHairPalette>, isFem: boolean) {
    if (!isFem) {
      if (s.headwear === 'songkok' || s.headwear === 'kopiah') {
        if (s.hair === 'side_part' || s.hair === 'jambul') {
          p(28, 24, 4, 8, hp.base);
          p(64, 24, 4, 8, hp.base);
        } else if (s.hair === 'short_crop') {
          p(29, 24, 3, 5, hp.base);
          p(64, 24, 3, 5, hp.base);
        }
      } else if (s.headwear === 'cap') {
        if (s.hair !== 'bald') {
          p(28, 25, 4, 7, hp.base);
          p(64, 25, 4, 7, hp.base);
        }
      }
    } else {
      if (s.headwear === 'cap') {
        p(24, 24, 6, 24, hp.base);
        p(66, 24, 6, 24, hp.base);
        if (s.hair === 'high_bun') {
          p(60, 22, 10, 8, hp.base);
        }
      }
    }
  },

  // 13. Accessories
  accessory(ctx: CanvasRenderingContext2D, s: AvatarDrawState, p: (x: number, y: number, w: number, h: number, col: string) => void) {
    // B04, B12 fix: frame-only glasses, shades at y=37
    if (s.accessory === 'glasses') {
      const F = '#b45309';
      const lens = 'rgba(255, 255, 255, 0.18)';
      [[31, 35], [50, 35]].forEach(([x, y]) => {
        p(x, y, 15, 1, F);
        p(x, y + 9, 15, 1, F);
        p(x, y, 1, 10, F);
        p(x + 14, y, 1, 10, F);
        ctx.fillStyle = lens;
        ctx.fillRect(x + 1, y + 1, 13, 8);
      });
      p(46, 38, 4, 1, F);
      p(29, 37, 2, 1, F);
      p(65, 37, 2, 1, F);
    } else if (s.accessory === 'shades') {
      p(32, 37, 13, 7, '#0f172a');
      p(51, 37, 13, 7, '#0f172a');
      p(45, 38, 6, 2, '#0f172a');
      p(34, 38, 4, 2, '#64748b');
      p(53, 38, 4, 2, '#64748b');
    } else if (s.accessory === 'garland') {
      // B21 fix: continuous parametric U-curve
      for (let t = 0; t <= 1.0001; t += 1 / 12) {
        const x = Math.round(26 + 44 * t);
        const y = Math.round(66 + 22 * Math.sin(Math.PI * t));
        p(x - 2, y - 2, 4, 4, (t * 12) % 2 < 1 ? '#f59e0b' : '#facc15');
        p(x - 1, y - 1, 2, 2, '#ea580c');
      }
      p(46, 88, 4, 6, '#ea580c');
    } else if (s.accessory === 'earrings') {
      // B16: Jhumka earrings
      p(27, 44, 3, 5, '#facc15');
      p(26, 48, 5, 4, '#f59e0b');
      p(27, 51, 3, 2, '#facc15');
      p(66, 44, 3, 5, '#facc15');
      p(65, 48, 5, 4, '#f59e0b');
      p(66, 51, 3, 2, '#facc15');
    }
  }
};

export function render96Avatar(
  ctx: CanvasRenderingContext2D,
  profile?: Partial<CandidateProfile>
) {
  const s = resolveAvatarState(profile);
  const isFem = s.gender === 'female';
  const hp = getHairPalette(s.hairColor);

  const p = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  ctx.imageSmoothingEnabled = false;

  // Strict 13-stage order
  layers.bg(ctx, s, p);
  layers.backHair(ctx, s, p, hp, isFem);
  layers.body(ctx, s, p, hp, isFem);
  layers.neckHead(ctx, s, p, hp, isFem);
  layers.frontHair(ctx, s, p, hp, isFem);
  layers.eyes(ctx, s, p, hp, isFem);
  layers.nose(ctx, s, p, hp, isFem);
  layers.mouth(ctx, s, p, hp, isFem);
  layers.faceMark(ctx, s, p);
  layers.outfit(ctx, s, p, hp, isFem);
  layers.headwear(ctx, s, p);
  layers.frontHairPeek(ctx, s, p, hp, isFem);
  layers.accessory(ctx, s, p);
}

// Draw pixel candidate onto any canvas at specified center & baseline
export function drawPixelCandidate(
  ctx: CanvasRenderingContext2D,
  profile: CandidateProfile,
  centerX: number,
  baselineY: number,
  scale: number = 4
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const off = document.createElement("canvas");
  off.width = 96;
  off.height = 96;
  const offCtx = off.getContext("2d");
  if (offCtx) {
    render96Avatar(offCtx, profile);

    const renderW = Math.round(96 * (scale / 2.3));
    const renderH = renderW;
    const startX = Math.round(centerX - renderW / 2);
    const startY = Math.round(baselineY - renderH);

    ctx.drawImage(off, startX, startY, renderW, renderH);
  }
  ctx.restore();
}

// React PixelAvatar Component
export function PixelAvatar({
  profile,
  size = 192,
  isBouncing = false,
  className = ""
}: {
  profile: Partial<CandidateProfile>;
  size?: number;
  isBouncing?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    render96Avatar(ctx, profile);
  }, [
    profile.gender,
    profile.skinIndex,
    profile.hair,
    profile.hairColor,
    profile.headwear,
    profile.headwearColor,
    profile.outfit,
    profile.clothesColor,
    profile.mouth,
    profile.faceMark,
    profile.accessory,
    profile.bg,
    profile.party
  ]);

  return (
    <div
      className={`inline-block select-none transition-transform duration-200 ${
        isBouncing ? "scale-[1.03] -translate-y-1" : "scale-100"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={96}
        height={96}
        className="w-full h-full rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
