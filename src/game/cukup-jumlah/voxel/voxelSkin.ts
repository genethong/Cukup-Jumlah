import * as THREE from "three";
import type { CandidateProfile } from "../types";
import { PARTIES } from "../types";
import { SKIN_PALETTE } from "../pixelAvatar";

export interface CleanBlockTextures {
  headMaterials: THREE.Material[];
  torsoMaterials: THREE.Material[];
  armMaterials: THREE.Material[];
  legMaterials: THREE.Material[];
}

/**
 * Creates clean, pixel-perfect 6-sided textures for the 6 core blocks
 * matching the user's reference image:
 * - Hair, eyes, mustache, beard, glasses PRINTED on the head block
 * - Suit lapels, white shirt V, necktie, buttons, belts PRINTED on the torso block
 * - Sleeves, cuffs, hands PRINTED on the arm blocks
 * - Pants, sneaker shoes, soles PRINTED on the leg blocks
 */
export function createCleanSkinTextures(profile: CandidateProfile): CleanBlockTextures {
  const skinIdx = typeof profile.skinIndex === "number" ? profile.skinIndex : 1;
  const skinInfo = SKIN_PALETTE[skinIdx] || SKIN_PALETTE[1];
  const party = PARTIES[profile.party] || PARTIES.PNL;
  const outfitColor = profile.clothesColor || party.themeColor || "#1e293b";
  const isFemale = profile.gender === "female";

  const hairColorHex =
    profile.hairColor === "grey"
      ? "#94a3b8"
      : profile.hairColor === "brown"
        ? "#78350f"
        : "#0f172a";

  const hairStyle = profile.hair || (isFemale ? "wavy_long" : "side_part");
  const mouthType = profile.mouth || (isFemale ? "red_lips" : "clean");
  const accessory = profile.accessory || "none";
  const isBald = hairStyle === "bald";

  // Helper to make a sharp pixel canvas texture
  const makeTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    draw(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  };

  // =========================================================================
  // 1. HEAD BLOCK TEXTURES (Front, Back, Left, Right, Top, Bottom)
  // =========================================================================
  // Front Face (Eyes, hair bangs, mustache/beard, glasses PRINTED directly!)
  const headFront = makeTexture(32, 40, (ctx) => {
    // Skin Base
    ctx.fillStyle = skinInfo.base;
    ctx.fillRect(0, 0, 32, 40);

    // Hair Printed Fringe / Bangs (like reference top-left, middle-right, bottom-right)
    if (!isBald) {
      ctx.fillStyle = hairColorHex;
      if (hairStyle === "side_part") {
        // Sharp side-swept bangs like top-left & bottom-right
        ctx.fillRect(0, 0, 32, 10);
        ctx.fillRect(0, 10, 12, 6); // left parted fringe
        ctx.fillRect(0, 16, 4, 12); // left sideburn
        ctx.fillRect(28, 10, 4, 18); // right sideburn
      } else if (hairStyle === "jambul") {
        // Quiff bangs
        ctx.fillRect(0, 0, 32, 8);
        ctx.fillRect(10, 8, 12, 6);
        ctx.fillRect(0, 8, 4, 18);
        ctx.fillRect(28, 8, 4, 18);
      } else if (hairStyle === "bob_cut" || hairStyle === "wavy_long") {
        // Asymmetrical drape like middle-right character
        ctx.fillRect(0, 0, 32, 12);
        ctx.fillRect(0, 12, 10, 28); // side panel
        ctx.fillRect(26, 12, 6, 22);
      } else {
        ctx.fillRect(0, 0, 32, 10);
        ctx.fillRect(0, 10, 4, 16);
        ctx.fillRect(28, 10, 4, 16);
      }
    } else {
      // Bald fringe (like reference bottom-left)
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(0, 0, 32, 4);
      ctx.fillRect(0, 4, 4, 22);
      ctx.fillRect(28, 4, 4, 22);
    }

    // Eyes: Minimalist wide-spaced dots (exactly like reference image)
    if (accessory !== "shades") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(7, 20, 3, 3); // Left eye dot
      ctx.fillRect(22, 20, 3, 3); // Right eye dot
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(7, 20, 1, 1);
      ctx.fillRect(22, 20, 1, 1);

      if (isFemale) {
        // Eyelash line
        ctx.fillStyle = hairColorHex;
        ctx.fillRect(6, 19, 5, 1);
        ctx.fillRect(21, 19, 5, 1);
      }
    } else {
      // Dark shades (like middle-left / bottom-right)
      ctx.fillStyle = "#09090b";
      ctx.fillRect(5, 17, 22, 8);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(7, 18, 8, 6);
      ctx.fillRect(17, 18, 8, 6);
    }

    // Glasses (like reference bottom-left with emerald frames)
    if (accessory === "glasses") {
      ctx.strokeStyle = "#047857";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(5, 17, 8, 8);
      ctx.strokeRect(19, 17, 8, 8);
      ctx.fillStyle = "#047857";
      ctx.fillRect(13, 20, 6, 1.5);
    }

    // Mouth / Mustache / Beard (PRINTED)
    if (mouthType === "misai" || mouthType === "mustache") {
      // Pixel mustache (like top-left & bottom-left)
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(11, 29, 10, 4);
    } else if (mouthType === "beard" || mouthType === "goatee_full") {
      // White/grey/dark beard (like bottom-middle & top-right)
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(8, 29, 16, 4);
      ctx.fillRect(10, 33, 12, 6);
    } else if (mouthType === "red_lips" || isFemale) {
      // Clean red/coral lips (like top-middle girl)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(12, 29, 8, 3);
    } else {
      ctx.fillStyle = skinInfo.shadow;
      ctx.fillRect(13, 30, 6, 2);
    }
  });

  // Head Sides & Back (Hair wrapped around)
  const headSides = makeTexture(32, 40, (ctx) => {
    ctx.fillStyle = skinInfo.base;
    ctx.fillRect(0, 0, 32, 40);
    if (!isBald) {
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(0, 0, 32, 14);
      ctx.fillRect(0, 14, 18, 16); // side hair block
    } else {
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(0, 0, 32, 4);
      ctx.fillRect(0, 4, 16, 18);
    }
    // Ear
    ctx.fillStyle = skinInfo.shadow;
    ctx.fillRect(18, 20, 6, 8);
  });

  const headBack = makeTexture(32, 40, (ctx) => {
    ctx.fillStyle = isBald ? skinInfo.base : hairColorHex;
    ctx.fillRect(0, 0, 32, 40);
    if (isBald) {
      ctx.fillStyle = hairColorHex;
      ctx.fillRect(0, 18, 32, 22);
    }
  });

  const headTop = makeTexture(32, 32, (ctx) => {
    ctx.fillStyle = isBald ? skinInfo.base : hairColorHex;
    ctx.fillRect(0, 0, 32, 32);
  });

  const headMaterials = [
    new THREE.MeshLambertMaterial({ map: headSides }), // Right (+X)
    new THREE.MeshLambertMaterial({ map: headSides }), // Left (-X)
    new THREE.MeshLambertMaterial({ map: headTop }), // Top (+Y)
    new THREE.MeshLambertMaterial({ color: skinInfo.shadow }), // Bottom (-Y)
    new THREE.MeshLambertMaterial({ map: headFront }), // Front (+Z) FACE!
    new THREE.MeshLambertMaterial({ map: headBack }), // Back (-Z)
  ];

  // =========================================================================
  // 2. TORSO BLOCK TEXTURES (Suit, Baju Melayu, Tunic, Necktie PRINTED!)
  // =========================================================================
  const torsoFront = makeTexture(32, 48, (ctx) => {
    // Outfit Base
    ctx.fillStyle = outfitColor;
    ctx.fillRect(0, 0, 32, 48);

    if (isFemale) {
      // Female Tunic (like top-middle & middle-right):
      // Neckline opening
      ctx.fillStyle = skinInfo.base;
      ctx.fillRect(11, 0, 10, 6);

      // Belt / hem accent line
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 34, 32, 3);
    } else if (profile.outfit === "baju_melayu") {
      // Baju Melayu:
      // Standing collar cutout
      ctx.fillStyle = skinInfo.base;
      ctx.fillRect(12, 0, 8, 4);

      // 3 Gold Button Dots down the center (like top-left jacket!)
      ctx.fillStyle = "#facc15";
      ctx.fillRect(14, 8, 4, 3);
      ctx.fillRect(14, 16, 4, 3);
      ctx.fillRect(14, 24, 4, 3);

      // Samping (Gold Songket belt printed across waist!)
      ctx.fillStyle = "#eab308";
      ctx.fillRect(0, 32, 32, 16);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, 36, 32, 3);
      ctx.fillRect(0, 42, 32, 3);
    } else {
      // Formal Suit Jacket (like reference bottom-right & bottom-middle):
      // White shirt collar V-triangle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(22, 0);
      ctx.lineTo(16, 16);
      ctx.closePath();
      ctx.fill();

      // Silk Necktie (party color!)
      ctx.fillStyle = party.themeColor;
      ctx.fillRect(14, 6, 4, 20);

      // Suit Lapel shadows
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(6, 0, 4, 24);
      ctx.fillRect(22, 0, 4, 24);

      // Pocket Handkerchief / Parker Pen (left breast pocket)
      ctx.fillStyle = "#facc15";
      ctx.fillRect(6, 16, 3, 2);
    }
  });

  const torsoPlain = makeTexture(32, 48, (ctx) => {
    ctx.fillStyle = outfitColor;
    ctx.fillRect(0, 0, 32, 48);
    if (!isFemale && profile.outfit === "baju_melayu") {
      // Samping band wrapped around back
      ctx.fillStyle = "#eab308";
      ctx.fillRect(0, 32, 32, 16);
    }
  });

  const torsoTop = makeTexture(32, 24, (ctx) => {
    ctx.fillStyle = outfitColor;
    ctx.fillRect(0, 0, 32, 24);
    // Neck skin spot
    ctx.fillStyle = skinInfo.base;
    ctx.fillRect(11, 6, 10, 12);
  });

  const torsoMaterials = [
    new THREE.MeshLambertMaterial({ map: torsoPlain }), // Right
    new THREE.MeshLambertMaterial({ map: torsoPlain }), // Left
    new THREE.MeshLambertMaterial({ map: torsoTop }), // Top
    new THREE.MeshLambertMaterial({ color: outfitColor }), // Bottom
    new THREE.MeshLambertMaterial({ map: torsoFront }), // Front (CHEST)
    new THREE.MeshLambertMaterial({ map: torsoPlain }), // Back
  ];

  // =========================================================================
  // 3. ARM BLOCK TEXTURES (Sleeves, cuffs, hands, watch PRINTED!)
  // =========================================================================
  const armTexture = makeTexture(16, 48, (ctx) => {
    // Sleeve (top 45%)
    ctx.fillStyle = outfitColor;
    ctx.fillRect(0, 0, 16, 22);

    // Cuff accent
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(0, 20, 16, 2);

    // Forearm & Hand (skin tone)
    ctx.fillStyle = skinInfo.base;
    ctx.fillRect(0, 22, 16, 26);

    // Gold Watch / Bracelet on wrist (like reference top-middle red band!)
    ctx.fillStyle = isFemale ? "#dc2626" : "#facc15";
    ctx.fillRect(0, 34, 16, 3);
  });

  const armMaterials = [
    new THREE.MeshLambertMaterial({ map: armTexture }),
    new THREE.MeshLambertMaterial({ map: armTexture }),
    new THREE.MeshLambertMaterial({ color: outfitColor }),
    new THREE.MeshLambertMaterial({ color: skinInfo.base }),
    new THREE.MeshLambertMaterial({ map: armTexture }),
    new THREE.MeshLambertMaterial({ map: armTexture }),
  ];

  // =========================================================================
  // 4. LEG BLOCK TEXTURES (Pants & shoes PRINTED!)
  // =========================================================================
  const pantsColor = isFemale ? "#0284c7" : "#1e293b";
  const shoeColor = isFemale ? "#dc2626" : "#0f172a";

  const legTexture = makeTexture(16, 48, (ctx) => {
    // Trousers (top 75%)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(0, 0, 16, 36);

    // Shoe (bottom 25%)
    ctx.fillStyle = shoeColor;
    ctx.fillRect(0, 36, 16, 12);

    // White sneaker sole (like reference image sneakers!)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 44, 16, 4);
  });

  const legMaterials = [
    new THREE.MeshLambertMaterial({ map: legTexture }),
    new THREE.MeshLambertMaterial({ map: legTexture }),
    new THREE.MeshLambertMaterial({ color: pantsColor }),
    new THREE.MeshLambertMaterial({ color: "#ffffff" }), // Sole
    new THREE.MeshLambertMaterial({ map: legTexture }),
    new THREE.MeshLambertMaterial({ map: legTexture }),
  ];

  return { headMaterials, torsoMaterials, armMaterials, legMaterials };
}
