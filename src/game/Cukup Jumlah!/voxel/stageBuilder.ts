import * as THREE from "three";
import type { CandidateProfile } from "../types";
import { PARTIES } from "../types";
import { buildVoxelCandidate } from "./voxelBuilder";

export type StageStyleOption = "1" | "2" | "3";

export interface StageModelInstance {
  group: THREE.Group;
  cameraConfig: {
    frustumSize: number;
    position: [number, number, number];
    lookAt: [number, number, number];
  };
  update: (time: number) => void;
  triggerAction: () => void;
}

function createBlock(
  w: number,
  h: number,
  d: number,
  color: string | number,
  castShadow = true,
  receiveShadow = true
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

/**
 * Builds Stage Option 1: "Floating Malaysian Voxel Chunk"
 * Floating isometric slab with road, curb, sidewalk, longkang, flag pole, mamak stall canopy, and YB.
 */
export function buildFloatingChunkStage(profile: CandidateProfile): StageModelInstance {
  const root = new THREE.Group();

  // 1. Floating Terrain Slab (Crossy Road Style Cutaway)
  const slabWidth = 7.0;
  const slabDepth = 6.0;

  // Road tarmac
  const road = createBlock(slabWidth, 0.8, 3.2, 0x334155);
  road.position.set(0, -0.4, 1.4);
  root.add(road);

  // White road dashed line
  const dash1 = createBlock(1.0, 0.02, 0.35, 0xf8fafc, false);
  dash1.position.set(-1.8, 0.01, 1.4);
  root.add(dash1);

  const dash2 = createBlock(1.0, 0.02, 0.35, 0xf8fafc, false);
  dash2.position.set(1.8, 0.01, 1.4);
  root.add(dash2);

  // Yellow/Black Malaysian road curb
  for (let x = -3.2; x <= 3.2; x += 0.8) {
    const isYellow = Math.round(x * 10) % 2 === 0;
    const curbSegment = createBlock(0.78, 0.22, 0.35, isYellow ? 0xfacc15 : 0x0f172a);
    curbSegment.position.set(x, 0.11, -0.15);
    root.add(curbSegment);
  }

  // Sidewalk / Pedestrian Walkway
  const sidewalk = createBlock(slabWidth, 0.9, 2.4, 0x94a3b8);
  sidewalk.position.set(0, -0.35, -1.5);
  root.add(sidewalk);

  // Longkang (Malaysian Street Drain with concrete grate voxels)
  const drainTrench = createBlock(slabWidth, 0.4, 0.6, 0x1e293b);
  drainTrench.position.set(0, -0.1, -0.6);
  root.add(drainTrench);

  for (let x = -3.0; x <= 3.0; x += 0.6) {
    const grate = createBlock(0.12, 0.04, 0.58, 0x475569);
    grate.position.set(x, 0.1, -0.6);
    root.add(grate);
  }

  // Sliced Underground Earth (Dirt cutaway underneath slab)
  const dirtSlab = createBlock(slabWidth, 0.9, slabDepth, 0x5a3825);
  dirtSlab.position.set(0, -1.25, 0);
  root.add(dirtSlab);

  // 2. Props on the sidewalk
  // Party Campaign Flag on bamboo pole
  const party = PARTIES[profile.party] || PARTIES.PNL;
  const pole = createBlock(0.1, 3.2, 0.1, 0xca8a04);
  pole.position.set(-2.5, 1.6, -1.8);
  root.add(pole);

  const flag = createBlock(1.1, 0.7, 0.05, party.themeColor);
  flag.position.set(-1.9, 2.7, -1.8);
  root.add(flag);

  // Mamak Stall Canopy (Red/White striped awning)
  const canopyGroup = new THREE.Group();
  canopyGroup.position.set(1.8, 2.2, -2.0);

  const awningPoleL = createBlock(0.08, 2.2, 0.08, 0x94a3b8);
  awningPoleL.position.set(-1.1, -1.1, 0);
  canopyGroup.add(awningPoleL);

  const awningPoleR = createBlock(0.08, 2.2, 0.08, 0x94a3b8);
  awningPoleR.position.set(1.1, -1.1, 0);
  canopyGroup.add(awningPoleR);

  // Striped awning voxels
  for (let i = -1.0; i <= 1.0; i += 0.4) {
    const isRed = Math.round(i * 10) % 2 === 0;
    const stripe = createBlock(0.38, 0.15, 1.2, isRed ? 0xdc2626 : 0xf8fafc);
    stripe.position.set(i, 0, 0);
    stripe.rotation.x = 0.25; // angled awning
    canopyGroup.add(stripe);
  }
  root.add(canopyGroup);

  // Stainless Steel Mamak Table & Mugs
  const table = createBlock(1.2, 0.75, 0.8, 0x64748b);
  table.position.set(1.8, 0.45, -1.6);
  root.add(table);

  const tehTarik = createBlock(0.18, 0.25, 0.18, 0xd97706);
  tehTarik.position.set(1.6, 0.95, -1.6);
  root.add(tehTarik);

  // 3. Option A YB Candidate Hopping on Sidewalk
  const yb = buildVoxelCandidate("A", profile);
  yb.group.position.set(-0.3, 0.1, -1.5);
  root.add(yb.group);

  // Passing Miniature Voxel Car (Vellfire VIP convoy)
  const carGroup = new THREE.Group();
  carGroup.position.set(4.0, 0.45, 1.4);

  const carBody = createBlock(2.2, 0.9, 1.2, 0x0f172a);
  carBody.position.y = 0.35;
  carGroup.add(carBody);

  const carRoof = createBlock(1.4, 0.6, 1.15, 0x1e293b);
  carRoof.position.set(-0.1, 0.9, 0);
  carGroup.add(carRoof);

  // Windshield & windows
  const windshield = createBlock(0.05, 0.45, 1.05, 0x38bdf8);
  windshield.position.set(0.62, 0.85, 0);
  carGroup.add(windshield);

  // Headlights
  const lightL = createBlock(0.05, 0.15, 0.25, 0xfef08a);
  lightL.position.set(1.12, 0.35, 0.35);
  carGroup.add(lightL);
  const lightR = createBlock(0.05, 0.15, 0.25, 0xfef08a);
  lightR.position.set(1.12, 0.35, -0.35);
  carGroup.add(lightR);

  // Wheels
  const wheelFL = createBlock(0.4, 0.4, 0.15, 0x475569);
  wheelFL.position.set(0.65, 0, 0.62);
  carGroup.add(wheelFL);
  const wheelFR = createBlock(0.4, 0.4, 0.15, 0x475569);
  wheelFR.position.set(0.65, 0, -0.62);
  carGroup.add(wheelFR);
  const wheelBL = createBlock(0.4, 0.4, 0.15, 0x475569);
  wheelBL.position.set(-0.65, 0, 0.62);
  carGroup.add(wheelBL);
  const wheelBR = createBlock(0.4, 0.4, 0.15, 0x475569);
  wheelBR.position.set(-0.65, 0, -0.62);
  carGroup.add(wheelBR);

  root.add(carGroup);

  const update = (time: number) => {
    yb.update(time, true);

    // Car drives continuously across road (Crossy Road hazard!)
    carGroup.position.x = ((time * 2.8) % 14) - 7.0;

    // Flag wave
    flag.rotation.y = Math.sin(time * 6) * 0.12;
  };

  const triggerAction = () => {
    yb.triggerHop();
  };

  return {
    group: root,
    cameraConfig: {
      frustumSize: 7.2,
      position: [14, 15, 14],
      lookAt: [0, 0.8, 0],
    },
    update,
    triggerAction,
  };
}

/**
 * Builds Stage Option 2: "Zoomed-In Voxel Workbench"
 * Macro 3D perspective onto a wooden SK classroom desk with giant 3D RM10k cash bundles,
 * 3D rubber stamp with wooden handle, and Form 4 document.
 */
export function buildVoxelWorkbenchStage(profile: CandidateProfile): StageModelInstance {
  const root = new THREE.Group();

  // 1. Wooden Desk Slab (Sekolah Kebangsaan Timber Grain)
  const desk = createBlock(6.5, 0.6, 5.5, 0xb45309);
  desk.position.set(0, -0.3, 0);
  root.add(desk);

  // Timber edge molding
  const molding = createBlock(6.7, 0.2, 5.7, 0x78350f);
  molding.position.set(0, -0.1, 0);
  root.add(molding);

  // 2. Official SPR Document (Borang 4 Penamaan Calon)
  const docGroup = new THREE.Group();
  docGroup.position.set(-0.6, 0.05, 0.2);
  docGroup.rotation.y = 0.08;

  const paper = createBlock(2.8, 0.04, 3.6, 0xfef9c3);
  docGroup.add(paper);

  // Document text block lines
  for (let z = -1.2; z <= 1.2; z += 0.35) {
    const isHeader = z === -1.2;
    const textLine = createBlock(isHeader ? 2.2 : 1.8, 0.02, 0.1, isHeader ? 0xdc2626 : 0x475569);
    textLine.position.set(0, 0.03, z);
    docGroup.add(textLine);
  }

  // SPR Official Crest Box
  const sprBox = createBlock(0.6, 0.03, 0.6, 0xeab308);
  sprBox.position.set(0.85, 0.03, -1.3);
  docGroup.add(sprBox);

  root.add(docGroup);

  // 3. Stacks of RM10,000 Cash Deposit Bundles (Wang Deposit Calon)
  const cashStack = new THREE.Group();
  cashStack.position.set(2.0, 0.05, -0.8);
  cashStack.rotation.y = -0.15;

  for (let layer = 0; layer < 4; layer++) {
    const bundle = createBlock(1.6, 0.22, 0.9, 0x15803d); // Malaysian RM100 green notes
    bundle.position.y = 0.11 + layer * 0.24;
    cashStack.add(bundle);

    // Bank paper band strap
    const strap = createBlock(0.35, 0.23, 0.92, 0xf8fafc);
    strap.position.y = 0.11 + layer * 0.24;
    cashStack.add(strap);
  }
  root.add(cashStack);

  // 4. Heavy SPR Official Rubber Stamp (Interactive Slam Action!)
  const stampGroup = new THREE.Group();
  stampGroup.position.set(-0.4, 1.4, 0.2);

  // Wooden grip knob
  const handleKnob = createBlock(0.5, 0.6, 0.5, 0x78350f);
  handleKnob.position.y = 0.9;
  stampGroup.add(handleKnob);

  const handleStem = createBlock(0.3, 0.6, 0.3, 0x9a3412);
  handleStem.position.y = 0.45;
  stampGroup.add(handleStem);

  // Heavy metal stamp base
  const stampBase = createBlock(1.4, 0.3, 0.9, 0xdc2626);
  stampBase.position.y = 0.15;
  stampGroup.add(stampBase);

  // Red rubber ink pad face
  const rubberFace = createBlock(1.3, 0.08, 0.8, 0x991b1b);
  rubberFace.position.y = -0.04;
  stampGroup.add(rubberFace);

  root.add(stampGroup);

  // Red Stamp Ink Mark on Paper (Appears on stamp!)
  const inkMark = createBlock(1.2, 0.02, 0.75, 0xdc2626, false);
  inkMark.position.set(-0.4, 0.07, 0.2);
  inkMark.visible = false;
  root.add(inkMark);

  let stampAnimProgress = 0;
  let isStamping = false;

  const triggerAction = () => {
    if (!isStamping) {
      isStamping = true;
      stampAnimProgress = 0;
    }
  };

  const update = (time: number) => {
    // Hovering idle float or slamming down
    if (isStamping) {
      stampAnimProgress += 0.08;
      if (stampAnimProgress < 0.4) {
        // Slam down fast!
        stampGroup.position.y = 1.4 - (stampAnimProgress / 0.4) * 1.35;
      } else if (stampAnimProgress < 0.6) {
        // Hit surface!
        stampGroup.position.y = 0.05;
        inkMark.visible = true;
      } else if (stampAnimProgress < 1.0) {
        // Recoil back up
        const recoil = (stampAnimProgress - 0.6) / 0.4;
        stampGroup.position.y = 0.05 + recoil * 1.35;
      } else {
        isStamping = false;
        stampGroup.position.y = 1.4;
      }
    } else {
      // Gentle idle hover
      stampGroup.position.y = 1.35 + Math.sin(time * 3) * 0.08;
    }
  };

  return {
    group: root,
    cameraConfig: {
      frustumSize: 4.8,
      position: [8, 12, 10],
      lookAt: [0, 0.4, 0],
    },
    update,
    triggerAction,
  };
}

/**
 * Builds Stage Option 3: "Hybrid Stage (Dual Dynamic Camera / Mode)"
 * Demonstrates the seamless transition between the Street Diorama and the Desk Macro.
 */
export function buildHybridStage(profile: CandidateProfile): StageModelInstance {
  const root = new THREE.Group();

  // Combine both worlds on one stage: left is street, right transitions into indoor SPR desk
  const chunkStage = buildFloatingChunkStage(profile);
  chunkStage.group.position.x = -2.2;
  chunkStage.group.scale.set(0.75, 0.75, 0.75);
  root.add(chunkStage.group);

  const deskStage = buildVoxelWorkbenchStage(profile);
  deskStage.group.position.x = 2.4;
  deskStage.group.position.y = 0.3;
  deskStage.group.scale.set(0.65, 0.65, 0.65);
  root.add(deskStage.group);

  const update = (time: number) => {
    chunkStage.update(time);
    deskStage.update(time);
  };

  const triggerAction = () => {
    chunkStage.triggerAction();
    deskStage.triggerAction();
  };

  return {
    group: root,
    cameraConfig: {
      frustumSize: 6.8,
      position: [12, 14, 12],
      lookAt: [0, 0.6, 0],
    },
    update,
    triggerAction,
  };
}
