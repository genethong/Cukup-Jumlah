import type { YbSkeleton } from "./skeleton";

export interface YbAnimator {
  update: (time: number, isHopping: boolean) => void;
  triggerHop: () => void;
  playBow: () => void;
  playWave: () => void;
}

/**
 * Transform-only motion: hop squash, torso breath, bow, and a wrist-led wave.
 * The raised spatula arm is the rest pose; the wave adds a quick shake.
 */
export function createAnimator(skel: YbSkeleton): YbAnimator {
  let hopStart = -1;
  let bowStart = -1;
  let waveStart = -1;
  let lastTime = 0;

  const triggerHop = () => {
    hopStart = lastTime;
  };
  const playBow = () => {
    bowStart = lastTime;
  };
  const playWave = () => {
    waveStart = lastTime;
  };

  const update = (time: number, isHopping: boolean) => {
    if (hopStart < 0 && isHopping) hopStart = time;
    lastTime = time;

    const hopT = hopStart >= 0 ? time - hopStart : 99;
    const hopping = hopT >= 0 && hopT < 0.48;
    if (hopping) {
      const p = hopT / 0.48;
      const arc = Math.sin(p * Math.PI);
      skel.hop.position.y = arc * 0.34;
      const squash = p < 0.18 ? 0.08 : p > 0.78 ? 0.06 : -0.06;
      skel.hop.scale.set(1 + squash, 1 - squash, 1 + squash);
      const swing = Math.sin(p * Math.PI * 2) * 0.35;
      skel.legL.rotation.x = swing;
      skel.legR.rotation.x = -swing;
    } else {
      skel.hop.position.y = Math.sin(time * 1.7) * 0.012;
      skel.hop.scale.set(1, 1, 1);
      skel.legL.rotation.x = 0;
      skel.legR.rotation.x = 0;
      if (hopT >= 0.48) hopStart = -1;
    }

    const breath = 1 + Math.sin(time * 2.1) * 0.02;
    skel.torso.scale.set(1, breath, 1);

    const bowT = bowStart >= 0 ? time - bowStart : 99;
    if (bowT >= 0 && bowT < 1.4) {
      const p = bowT / 1.4;
      const bend = Math.sin(p * Math.PI) * 0.61;
      skel.torso.rotation.x = bend;
    } else {
      skel.torso.rotation.x = 0;
      if (bowT >= 1.4) bowStart = -1;
    }

    const auto = time % 4 < 1.05 ? (time % 4) / 1.05 : -1;
    const kicked = waveStart >= 0 ? time - waveStart : 99;
    const waveP = kicked >= 0 && kicked < 1.05 ? kicked / 1.05 : auto;
    if (waveP >= 0) {
      const envelope = Math.sin(waveP * Math.PI);
      skel.armR.rotation.z = Math.sin(waveP * Math.PI * 6) * 0.28 * envelope;
      skel.handR.rotation.z = Math.sin(waveP * Math.PI * 8) * 0.4 * envelope;
    } else {
      skel.armR.rotation.z = 0;
      skel.handR.rotation.z = 0;
      if (kicked >= 1.05) waveStart = -1;
    }

    const blink = time % 3.6 < 0.14;
    skel.face.visible = blink;
    const headMesh = skel.head.getObjectByName("head-mesh");
    if (headMesh) headMesh.visible = !blink;
  };

  return { update, triggerHop, playBow, playWave };
}
