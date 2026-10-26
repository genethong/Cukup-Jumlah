import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";

export function drawPixelCandidate(
  ctx: CanvasRenderingContext2D,
  profile: CandidateProfile,
  centerX: number,
  baselineY: number,
  scale: number = 4
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const party = PARTIES[profile.party];
  const partyColor = party.themeColor === "#F8FAFC" ? "#E2E8F0" : party.themeColor;

  // Helper function to draw pixel blocks
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(centerX + x * scale),
      Math.round(baselineY + y * scale),
      Math.round(w * scale),
      Math.round(h * scale)
    );
  };

  // Shadow under feet
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(centerX, baselineY, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1. SHOES / FEET
  px(-6, -4, 5, 4, "#1E293B"); // Left shoe
  px(1, -4, 5, 4, "#1E293B");  // Right shoe
  px(-5, -2, 3, 2, "#0F172A");
  px(2, -2, 3, 2, "#0F172A");

  // 2. PANTS / SKIRT (Lower Body)
  if (profile.outfit === "baju_kurung") {
    // Long skirt
    px(-7, -18, 14, 15, partyColor);
    px(-6, -6, 12, 3, "#CBD5E1"); // Hem border
  } else {
    // Formal pants
    px(-6, -18, 5, 15, "#1E293B"); // Left leg
    px(1, -18, 5, 15, "#1E293B");  // Right leg
    if (profile.outfit === "baju_melayu") {
      // Samping wrapped over pants
      px(-7, -22, 14, 9, "#B45309"); // Songket gold/bronze
      px(-6, -20, 12, 2, "#F59E0B"); // Gold stripe pattern
    }
  }

  // 3. TORSO / OUTFIT
  let outfitColor = "#334155";
  if (profile.outfit === "baju_melayu") outfitColor = partyColor;
  else if (profile.outfit === "batik") outfitColor = "#9333EA";
  else if (profile.outfit === "baju_kurung") outfitColor = partyColor;
  else if (profile.outfit === "kot_formal") outfitColor = "#0F172A";
  else if (profile.outfit === "jaket_banjir") outfitColor = partyColor;

  px(-8, -34, 16, 16, outfitColor);

  // Outfit specific details
  if (profile.outfit === "batik") {
    // Batik swirly motifs
    px(-6, -30, 4, 3, "#F59E0B");
    px(2, -26, 4, 3, "#EC4899");
    px(-4, -22, 5, 3, "#38BDF8");
  } else if (profile.outfit === "kot_formal") {
    // White shirt + red tie inside
    px(-2, -34, 4, 10, "#FFFFFF");
    px(-1, -32, 2, 8, "#DC2626"); // Tie
  } else if (profile.outfit === "jaket_banjir") {
    // Reflective safety stripes
    px(-8, -26, 16, 2, "#EAB308");
    px(-3, -34, 6, 16, "#1E293B"); // Zipper
  }

  // Party Badge Pin on chest!
  px(3, -31, 3, 3, partyColor);
  px(4, -30, 1, 1, "#FFFFFF");

  // 4. ARMS & HANDS
  const skinTone = "#FBBF24"; // Warm golden skin tone
  // Left arm
  px(-10, -32, 3, 10, outfitColor);
  px(-10, -22, 3, 3, skinTone); // Left hand
  // Right arm
  px(7, -32, 3, 10, outfitColor);
  px(7, -22, 3, 3, skinTone);  // Right hand

  // 5. PROPS
  if (profile.prop === "briefcase") {
    // Black leather briefcase in right hand
    px(8, -20, 7, 9, "#451A03");
    px(9, -21, 5, 2, "#78350F"); // handle
    px(11, -16, 2, 2, "#F59E0B"); // gold buckle
  } else if (profile.prop === "pen_emas") {
    // Parker gold pen in left hand
    px(-12, -25, 2, 7, "#F59E0B");
    px(-12, -26, 2, 2, "#FEF08A");
  } else if (profile.prop === "payung_vip") {
    // VIP Umbrella angled behind
    px(9, -42, 2, 24, "#475569"); // shaft
    px(6, -46, 12, 5, "#EAB308"); // canopy
    px(8, -48, 8, 3, "#CA8A04");
  } else if (profile.prop === "tuala_goodmorning") {
    // Good morning towel draped over shoulder
    px(-8, -34, 4, 8, "#F8FAFC");
    px(-8, -28, 4, 1, "#EF4444"); // Red line
  }

  // 6. HEAD & NECK
  px(-2, -37, 4, 4, skinTone); // Neck

  // Head base
  px(-7, -50, 14, 14, skinTone);

  // Facial Features (Expressive comic eyes & confident smile)
  px(-5, -45, 3, 3, "#1E293B"); // Left eye
  px(-4, -46, 1, 1, "#FFFFFF"); // glint
  px(2, -45, 3, 3, "#1E293B");  // Right eye
  px(3, -46, 1, 1, "#FFFFFF");  // glint

  // Eyebrows
  px(-6, -47, 4, 1, "#0F172A");
  px(2, -47, 4, 1, "#0F172A");

  // Rosy cheeks
  px(-6, -42, 2, 1, "#F87171");
  px(4, -42, 2, 1, "#F87171");

  // Wide confident political smile
  px(-3, -41, 6, 2, "#B91C1C");
  px(-2, -41, 4, 1, "#FFFFFF"); // White teeth

  // 7. HEADWEAR / HAIR
  if (profile.headwear === "songkok") {
    // Classic tall black songkok
    px(-8, -58, 16, 10, "#0F172A"); // Black velvet
    px(-9, -49, 18, 2, "#0F172A");  // Rim
    px(-7, -50, 14, 1, "#F59E0B");  // Gold brim line
  } else if (profile.headwear === "songkok_senget") {
    // Cheeky tilted songkok
    px(-7, -59, 16, 10, "#0F172A");
    px(-8, -50, 18, 2, "#0F172A");
    px(7, -57, 3, 2, "#F59E0B"); // Pin
  } else if (profile.headwear === "kopiah") {
    // White kopiah
    px(-8, -55, 16, 7, "#F8FAFC");
    px(-7, -54, 14, 2, "#E2E8F0"); // Texture
    px(-8, -49, 16, 1, "#CBD5E1");
  } else if (profile.headwear === "tudung") {
    // Elegant tudung draped around head & shoulders
    px(-9, -54, 18, 9, partyColor);
    px(-9, -46, 3, 14, partyColor); // Left drape
    px(6, -46, 3, 14, partyColor);  // Right drape
    px(-6, -34, 12, 4, partyColor); // Chest drape
  } else if (profile.headwear === "pomade") {
    // Slick black pomade hair
    px(-8, -54, 16, 6, "#0F172A");
    px(-7, -53, 6, 2, "#334155"); // Shine highlight
    px(-8, -48, 2, 4, "#0F172A"); // Sideburns
    px(6, -48, 2, 4, "#0F172A");
  } else if (profile.headwear === "topi_jerami") {
    // Grassroots straw hat
    px(-11, -50, 22, 3, "#D97706"); // Wide brim
    px(-7, -57, 14, 8, "#F59E0B");  // Crown
    px(-7, -52, 14, 2, partyColor); // Party ribbon around hat
  }

  ctx.restore();
}
