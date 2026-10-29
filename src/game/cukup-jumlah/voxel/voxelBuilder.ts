import * as THREE from "three";
import type { CandidateProfile } from "../types";
/**
 * @deprecated The 6-box canvas-skin builder. The true-voxel pipeline lives in
 * `voxel/core` and `voxel/avatar` (`buildVoxelYB`). Kept for the candidacy
 * passport until `?voxel=v2` becomes the default.
 */
import { createCleanSkinTextures } from "./voxelSkin";

export type VoxelStyleOption = "A" | "B" | "C";

export interface VoxelModelInstance {
  group: THREE.Group;
  update: (time: number, isHopping: boolean) => void;
  triggerHop: () => void;
}

function createBox(
  w: number,
  h: number,
  d: number,
  color: string | number,
  options?: { castShadow?: boolean; receiveShadow?: boolean }
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = options?.castShadow ?? true;
  mesh.receiveShadow = options?.receiveShadow ?? true;
  return mesh;
}

export function createPedestal(type: "road" | "grass" = "road"): THREE.Group {
  const group = new THREE.Group();

  const groundColor = type === "road" ? 0x334155 : 0x15803d;
  const base = createBox(2.8, 0.6, 2.8, groundColor);
  base.position.y = -0.3;
  group.add(base);

  const underside = createBox(2.8, 0.3, 2.8, 0x1e293b);
  underside.position.y = -0.7;
  group.add(underside);

  if (type === "road") {
    const roadStripe = createBox(0.35, 0.02, 1.0, 0xf8fafc, { castShadow: false });
    roadStripe.position.set(0, 0.01, 0);
    group.add(roadStripe);

    const curb = createBox(2.8, 0.12, 0.3, 0xfacc15);
    curb.position.set(0, 0.06, 1.25);
    group.add(curb);
  }

  const shadowGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.02, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.28,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.015;
  group.add(shadow);

  return group;
}

/**
 * Builds the Clean Voxel Model matching the Reference Image Archetype:
 * - 6 pure, cleanly-aligned core blocks (Head, Torso, 2 Arms, 2 Legs)
 * - All hair, eyes, mustache, beard, glasses, suit lapels, ties, buttons, and shoes
 *   are PRINTED directly onto the UV skin textures!
 * - True 3D attachments used ONLY where real volume exists:
 *   - Songkok / Top Hat box
 *   - Twin space buns (top-middle girl)
 *   - Asymmetrical side-swept hair slab (middle-right girl)
 *   - Baseball cap brim
 */
export function buildVoxelCandidate(
  _style: VoxelStyleOption,
  profile: CandidateProfile
): VoxelModelInstance {
  const root = new THREE.Group();

  const isFemale = profile.gender === "female";
  const skinTextures = createCleanSkinTextures(profile);

  const hairColorHex =
    profile.hairColor === "grey"
      ? 0x94a3b8
      : profile.hairColor === "brown"
        ? 0x78350f
        : 0x0f172a;

  // Root body group for physics/hop bounce
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  let hopTime = 0;
  let isHopping = false;
  let manualHop = false;

  const triggerHop = () => {
    isHopping = true;
    hopTime = 0;
    manualHop = true;
  };

  // -------------------------------------------------------------
  // 1. LEGS & L-SHAPED FORWARD FEET (Clean 2-block structure)
  // -------------------------------------------------------------
  const legGroup = new THREE.Group();
  bodyGroup.add(legGroup);

  // Left Leg: Shin + Foot
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.2), skinTextures.legMaterials);
  legL.position.set(-0.11, 0.44, 0);
  legL.castShadow = true;
  legL.receiveShadow = true;
  legGroup.add(legL);

  // Left Shoe Toe: Projects forward 1 block (L-shape from reference image!)
  const shoeColor = isFemale ? 0xdc2626 : 0x0f172a;
  const toeL = createBox(0.16, 0.16, 0.12, shoeColor);
  toeL.position.set(-0.11, 0.21, 0.16); // projecting forward in front of shin
  legGroup.add(toeL);

  // Right Leg: Shin + Foot
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.2), skinTextures.legMaterials);
  legR.position.set(0.11, 0.44, 0);
  legR.castShadow = true;
  legR.receiveShadow = true;
  legGroup.add(legR);

  // Right Shoe Toe
  const toeR = createBox(0.16, 0.16, 0.12, shoeColor);
  toeR.position.set(0.11, 0.21, 0.16);
  legGroup.add(toeR);

  // -------------------------------------------------------------
  // 2. TORSO: 1 Clean Core Box (with Printed Wardrobe)
  // -------------------------------------------------------------
  // For female, the tunic extends down slightly lower (like top-middle & middle-right)
  const torsoHeight = isFemale ? 0.78 : 0.70;
  const torsoY = isFemale ? 1.05 : 1.05;

  const torsoGeo = new THREE.BoxGeometry(0.44, torsoHeight, 0.28);
  const torsoMesh = new THREE.Mesh(torsoGeo, skinTextures.torsoMaterials);
  torsoMesh.position.y = torsoY;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyGroup.add(torsoMesh);

  // -------------------------------------------------------------
  // 3. ARMS: 2 Clean Vertical Blocks (with Printed Sleeves & Hands)
  // -------------------------------------------------------------
  const armGeo = new THREE.BoxGeometry(0.12, 0.66, 0.18);

  const armL = new THREE.Mesh(armGeo, skinTextures.armMaterials);
  armL.position.set(-0.28, 1.08, 0);
  armL.castShadow = true;
  armL.receiveShadow = true;
  bodyGroup.add(armL);

  const armR = new THREE.Mesh(armGeo, skinTextures.armMaterials);
  armR.position.set(0.28, 1.08, 0);
  armR.castShadow = true;
  armR.receiveShadow = true;
  bodyGroup.add(armR);

  // Parliament briefcase in right hand (if equipped)
  if (profile.prop === "briefcase") {
    const briefcase = createBox(0.1, 0.32, 0.4, 0x78350f);
    briefcase.position.set(0.36, 0.78, 0.1);
    bodyGroup.add(briefcase);
  }

  // -------------------------------------------------------------
  // 4. HEAD: 1 Clean Rectangular Cuboid (with Printed Skin & Hair)
  // -------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.76;
  bodyGroup.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.5, 0.58, 0.5);
  const headMesh = new THREE.Mesh(headGeo, skinTextures.headMaterials);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // -------------------------------------------------------------
  // 5. 3D ATTACHMENTS (ONLY when actual 3D volume exists in reference)
  // -------------------------------------------------------------
  const headwear = profile.headwear || "none";
  const hairStyle = profile.hair || (isFemale ? "wavy_long" : "side_part");

  if (headwear === "songkok" || headwear === "songkok_senget") {
    // Clean Malaysian Songkok box on top (like top-hat in reference bottom-middle!)
    const isTilted = headwear === "songkok_senget";
    const songkokGroup = new THREE.Group();
    songkokGroup.position.set(isTilted ? 0.03 : 0, 0.42, 0);
    if (isTilted) songkokGroup.rotation.z = -0.12;

    const songkok = createBox(0.52, 0.28, 0.52, 0x09090b);
    songkokGroup.add(songkok);

    // Gold trim band
    const goldTrim = createBox(0.53, 0.04, 0.53, 0xfacc15, { castShadow: false });
    goldTrim.position.y = -0.12;
    songkokGroup.add(goldTrim);

    headGroup.add(songkokGroup);
  } else if (headwear === "cap") {
    // Backwards Cap Visor (like reference middle-left)
    const visor = createBox(0.38, 0.04, 0.22, 0xfacc15);
    visor.position.set(0, 0.26, -0.34);
    headGroup.add(visor);
  } else if (isFemale) {
    if (hairStyle === "high_bun") {
      // TWIN SPACE BUNS (like reference top-middle girl!)
      const bunL = createBox(0.18, 0.18, 0.18, hairColorHex);
      bunL.position.set(-0.2, 0.38, 0);
      headGroup.add(bunL);

      const bunR = createBox(0.18, 0.18, 0.18, hairColorHex);
      bunR.position.set(0.2, 0.38, 0);
      headGroup.add(bunR);
    } else if (hairStyle === "wavy_long" || hairStyle === "bob_cut") {
      // ASYMMETRICAL SIDE-SWEPT HAIR SLAB (like reference middle-right girl!)
      const drapeL = createBox(0.1, 0.85, 0.28, hairColorHex);
      drapeL.position.set(-0.28, -0.15, 0.1);
      headGroup.add(drapeL);
    }
  }

  // -------------------------------------------------------------
  // ANIMATION: Crisp Springy Crossy Road Jump
  // -------------------------------------------------------------
  const update = (time: number) => {
    const idleBreath = Math.sin(time * 3) * 0.01;
    const cycle = (time * 2.2) % (Math.PI * 2);
    const isHopPhase = cycle > Math.PI * 1.2;

    if (isHopPhase || manualHop) {
      const jumpNorm = Math.sin(((cycle - Math.PI * 1.2) / 0.8) * Math.PI);
      const yOffset = Math.max(0, jumpNorm) * 0.32;
      bodyGroup.position.y = yOffset;

      if (jumpNorm > 0.3) {
        bodyGroup.scale.set(0.95, 1.1, 0.95);
      } else {
        bodyGroup.scale.set(1.08, 0.9, 1.08);
      }

      legL.rotation.x = Math.sin(cycle * 4) * 0.35;
      legR.rotation.x = -Math.sin(cycle * 4) * 0.35;
      armL.rotation.x = -Math.sin(cycle * 4) * 0.35;
      armR.rotation.x = Math.sin(cycle * 4) * 0.35;
    } else {
      bodyGroup.position.y = idleBreath;
      bodyGroup.scale.set(1, 1, 1);
      legL.rotation.x = 0;
      legR.rotation.x = 0;
      armL.rotation.x = 0;
      armR.rotation.x = 0;
      manualHop = false;
    }
  };

  return { group: root, update, triggerHop };
}
