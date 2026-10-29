import { BufferGeometry, Group, Mesh } from "three";
import type { CandidateProfile } from "../../types";
import type { VoxelModelInstance } from "../voxelBuilder";
import { createAnimator } from "./anim";
import { HERO_LOOK, lookFromProfile, type VoxelLook } from "./look";
import {
  ARM_L_ANCHOR,
  ARM_R_ANCHOR,
  LEG_ANCHOR,
  TORSO_ANCHOR,
  buildArms,
  buildLegs,
  buildTorso,
} from "./parts/body";
import { HAIR_ANCHOR, HEAD_ANCHOR, buildHair, buildHead } from "./parts/head";
import { CAP_ANCHOR, SONGKOK_ANCHOR, TUDUNG_ANCHOR, buildCap, buildSongkok, buildTudung } from "./parts/headwear";
import { SPATULA_ANCHOR, buildSpatula } from "./parts/props";
import { createSkeleton, type YbSkeleton } from "./skeleton";
import { getVoxel, type Vec3, type VoxelGrid } from "../core/grid";
import { meshGrid } from "../core/mesher";
import { getVoxelMaterial } from "../core/materials";
import {
  buildLinearPalette,
  clothOverride,
  hairOverride,
  headwearOverride,
  isEmissiveSlot,
  skinOverride,
} from "../core/palette";
import { VOXEL_SIZE } from "../core/scale";
import { createNoodleSpray, type NoodleSpray } from "../scenes/props/noodles";

const VS = VOXEL_SIZE;
const HIP_Y = 15;

export interface VoxelYb extends VoxelModelInstance {
  playBow: () => void;
  playWave: () => void;
  setLook: (look: VoxelLook) => void;
  setProfile: (profile: CandidateProfile) => void;
  skeleton: YbSkeleton;
  stats: { voxels: number; triangles: number };
}

interface PartRef {
  origin: Vec3;
  grid: VoxelGrid;
}

function originOf(anchorShared: Vec3, anchorVoxel: Vec3): Vec3 {
  return [
    anchorShared[0] - anchorVoxel[0],
    anchorShared[1] - anchorVoxel[1],
    anchorShared[2] - anchorVoxel[2],
  ];
}

function voxelShared(anchorShared: Vec3, anchorVoxel: Vec3, voxel: Vec3): Vec3 {
  return [
    anchorShared[0] + (voxel[0] - anchorVoxel[0]),
    anchorShared[1] + (voxel[1] - anchorVoxel[1]),
    anchorShared[2] + (voxel[2] - anchorVoxel[2]),
  ];
}

function paletteFor(look: VoxelLook): Float32Array {
  return buildLinearPalette({
    ...skinOverride(look.skin),
    ...clothOverride(look.cloth, look.clothShadow, look.clothLight),
    ...headwearOverride(look.headwearColor, look.headwearShadow, look.headwearLight),
    ...hairOverride(look.hair),
  });
}

function makeGeometry(grid: VoxelGrid, anchor: Vec3, colors: Float32Array, ao: (x: number, y: number, z: number) => boolean) {
  const meshed = meshGrid(grid, {
    colors,
    voxelSize: VS,
    jitter: 0.04,
    seed: 11,
    emissive: isEmissiveSlot,
    aoSample: ao,
  });
  const geo = meshed.opaque ?? new BufferGeometry();
  geo.translate(-anchor[0] * VS, -anchor[1] * VS, -anchor[2] * VS);
  return { geo, triangles: meshed.triangles, voxels: meshed.voxels };
}

function aoSampler(self: Vec3, parts: PartRef[]) {
  return (x: number, y: number, z: number) => {
    const sx = self[0] + x;
    const sy = self[1] + y;
    const sz = self[2] + z;
    if (sy < 0) return true;
    for (const part of parts) {
      if (getVoxel(part.grid, sx - part.origin[0], sy - part.origin[1], sz - part.origin[2]) !== 0) return true;
    }
    return false;
  };
}

function ensureMesh(parent: { add: (m: Mesh) => void; children: { name: string }[] }, name: string): Mesh {
  const found = parent.children.find((c) => c.name === name);
  if (found && found instanceof Mesh) return found;
  const mesh = new Mesh(new BufferGeometry(), getVoxelMaterial());
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function applyGeo(mesh: Mesh, geo: BufferGeometry) {
  mesh.geometry.dispose();
  mesh.geometry = geo;
}

export function buildVoxelYB(profile: CandidateProfile = heroFallback()): VoxelYb {
  const skel = createSkeleton();
  const animator = createAnimator(skel);

  const torsoAnchor: Vec3 = [0, HIP_Y, 0];
  const shoulderR = voxelShared(torsoAnchor, TORSO_ANCHOR, [12, 21, 17]);
  const shoulderL = voxelShared(torsoAnchor, TORSO_ANCHOR, [28, 21, 17]);
  const neckAt = voxelShared(torsoAnchor, TORSO_ANCHOR, [20, 24, 16]);
  const hipL = voxelShared(torsoAnchor, TORSO_ANCHOR, [28, 10, 16]);
  const hipR = voxelShared(torsoAnchor, TORSO_ANCHOR, [12, 10, 16]);

  skel.hips.position.set(0, HIP_Y * VS, 0);
  skel.torso.position.set(0, 0, 0);
  skel.armR.position.set((shoulderR[0] - torsoAnchor[0]) * VS, (shoulderR[1] - HIP_Y) * VS, shoulderR[2] * VS);
  skel.armL.position.set((shoulderL[0] - torsoAnchor[0]) * VS, (shoulderL[1] - HIP_Y) * VS, shoulderL[2] * VS);
  skel.neck.position.set(0, (neckAt[1] - HIP_Y) * VS, (neckAt[2] - 0) * VS);
  skel.legL.position.set((hipL[0] - 0) * VS, 0, hipL[2] * VS);
  skel.legR.position.set((hipR[0] - 0) * VS, 0, hipR[2] * VS);
  skel.handR.position.set((1.4 - ARM_R_ANCHOR[0]) * VS, (31.2 - ARM_R_ANCHOR[1]) * VS, (10.2 - ARM_R_ANCHOR[2]) * VS);
  skel.handL.position.set((9.2 - ARM_L_ANCHOR[0]) * VS, (6.4 - ARM_L_ANCHOR[1]) * VS, (13 - ARM_L_ANCHOR[2]) * VS);

  const hatRest = { songkok: 16, cap: 15, tudung: 9, none: 16 } as const;
  skel.hat.position.set(0, hatRest.songkok * VS, 0);

  const spatulaPivot = new Group();
  spatulaPivot.position.set(0.02, -0.02, 0.02);
  spatulaPivot.rotation.set(-0.2, 0.15, 0.7);
  skel.handR.add(spatulaPivot);
  const spatula = ensureMesh(spatulaPivot, "spatula");
  const spat = makeGeometry(buildSpatula(), SPATULA_ANCHOR, paletteFor(HERO_LOOK), () => false);
  applyGeo(spatula, spat.geo);
  const bladeTip = new Group();
  bladeTip.position.set(0.02, 0.66, 0.02);
  spatula.add(bladeTip);
  const noodles = createNoodleSpray(bladeTip);

  let look = lookFromProfile(profile);
  const stats = { voxels: 0, triangles: spat.triangles };

  const rebuild = (next: VoxelLook, force = false) => {
    const skinChanged = force || next.skin !== look.skin || next.facial !== look.facial;
    const clothChanged =
      force || next.cloth !== look.cloth || next.clothShadow !== look.clothShadow || next.clothLight !== look.clothLight;
    const hatChanged =
      force ||
      next.headwear !== look.headwear ||
      next.headwearColor !== look.headwearColor ||
      next.headwearShadow !== look.headwearShadow ||
      next.headwearLight !== look.headwearLight;
    const hairChanged = force || next.hair !== look.hair;
    if (!force && !skinChanged && !clothChanged && !hatChanged && !hairChanged) return;
    look = next;
    const colors = paletteFor(look);

    const torso = buildTorso();
    const [armR, armL] = buildArms();
    const leg = buildLegs();
    const head = buildHead(look, false);
    const blink = buildHead(look, true);
    const hair = buildHair();
    const hatGrid =
      look.headwear === "tudung" ? buildTudung() : look.headwear === "cap" ? buildCap() : buildSongkok();
    const hatAnchor = look.headwear === "tudung" ? TUDUNG_ANCHOR : look.headwear === "cap" ? CAP_ANCHOR : SONGKOK_ANCHOR;

    const torsoO = originOf(torsoAnchor, TORSO_ANCHOR);
    const armRO = originOf(shoulderR, ARM_R_ANCHOR);
    const armLO = originOf(shoulderL, ARM_L_ANCHOR);
    const legLO = originOf(hipL, LEG_ANCHOR);
    const legRO = originOf(hipR, LEG_ANCHOR);
    const headO = originOf(neckAt, HEAD_ANCHOR);
    const hatShared = voxelShared(neckAt, HEAD_ANCHOR, [
      HEAD_ANCHOR[0],
      HEAD_ANCHOR[1] + (look.headwear === "tudung" ? 10 : look.headwear === "cap" ? 13 : 14),
      HEAD_ANCHOR[2],
    ]);
    const hatO = originOf(hatShared, hatAnchor);
    const hairO = originOf(neckAt, HAIR_ANCHOR);

    const refs: PartRef[] = [
      { origin: torsoO, grid: torso },
      { origin: armRO, grid: armR },
      { origin: armLO, grid: armL },
      { origin: legLO, grid: leg },
      { origin: legRO, grid: leg },
      { origin: headO, grid: head },
      { origin: hairO, grid: hair },
      { origin: hatO, grid: hatGrid },
    ];

    const bake = (grid: VoxelGrid, anchor: Vec3, o: Vec3) => makeGeometry(grid, anchor, colors, aoSampler(o, refs));

    const parts = {
      torso: bake(torso, TORSO_ANCHOR, torsoO),
      armR: bake(armR, ARM_R_ANCHOR, armRO),
      armL: bake(armL, ARM_L_ANCHOR, armLO),
      leg: bake(leg, LEG_ANCHOR, legLO),
      head: bake(head, HEAD_ANCHOR, headO),
      blink: bake(blink, HEAD_ANCHOR, headO),
      hair: bake(hair, HAIR_ANCHOR, hairO),
      hat: bake(hatGrid, hatAnchor, hatO),
    };

    applyGeo(ensureMesh(skel.torso, "torso-mesh"), parts.torso.geo);
    applyGeo(ensureMesh(skel.armR, "armR-mesh"), parts.armR.geo);
    applyGeo(ensureMesh(skel.armL, "armL-mesh"), parts.armL.geo);
    applyGeo(ensureMesh(skel.legL, "legL-mesh"), parts.leg.geo);
    const legRMesh = ensureMesh(skel.legR, "legR-mesh");
    legRMesh.geometry.dispose();
    legRMesh.geometry = parts.leg.geo.clone();
    applyGeo(ensureMesh(skel.head, "head-mesh"), parts.head.geo);
    applyGeo(ensureMesh(skel.face, "blink-mesh"), parts.blink.geo);
    applyGeo(ensureMesh(skel.hair, "hair-mesh"), parts.hair.geo);
    applyGeo(ensureMesh(skel.hat, "hat-mesh"), parts.hat.geo);

    const showHair = look.headwear === "none";
    skel.hair.visible = showHair;
    skel.hat.visible = look.headwear !== "none";
    const lift = look.headwear === "tudung" ? 9 : look.headwear === "cap" ? 15 : 16;
    skel.hat.position.set(0, lift * VS, look.headwear === "tudung" ? -1 * VS : 0);

    skel.face.visible = false;
    stats.voxels =
        parts.torso.voxels +
        parts.armR.voxels +
        parts.armL.voxels +
        parts.leg.voxels * 2 +
        parts.head.voxels +
        (showHair ? parts.hair.voxels : 0) +
        (look.headwear !== "none" ? parts.hat.voxels : 0) +
        spat.voxels +
        noodles.count;
    stats.triangles =
        parts.torso.triangles +
        parts.armR.triangles +
        parts.armL.triangles +
        parts.leg.triangles * 2 +
        parts.head.triangles +
        (showHair ? parts.hair.triangles : 0) +
        (look.headwear !== "none" ? parts.hat.triangles : 0) +
        spat.triangles +
        noodles.triangles;
  };

  rebuild(look, true);

  const setLook = (next: VoxelLook) => rebuild(next, false);
  const setProfile = (next: CandidateProfile) => setLook(lookFromProfile(next));

  const update = (time: number, isHopping: boolean) => {
    animator.update(time, isHopping);
    noodles.update(time);
  };

  return {
    group: skel.root,
    update,
    triggerHop: animator.triggerHop,
    playBow: animator.playBow,
    playWave: animator.playWave,
    setLook,
    setProfile,
    skeleton: skel,
    stats,
  };
}

function heroFallback(): CandidateProfile {
  return {
    name: "YB Mamak",
    gender: "male",
    party: "PNL",
    headwear: "songkok",
    outfit: "baju_melayu",
    clothesColor: HERO_LOOK.cloth,
    clothesShadow: HERO_LOOK.clothShadow,
    clothesLight: HERO_LOOK.clothLight,
    skinIndex: HERO_LOOK.skin,
    hairColor: "black",
    mouth: "misai",
    prop: "briefcase",
    talent: "lidah_manis",
    quirk: "janji_manis",
  };
}

export { heroFallback };
