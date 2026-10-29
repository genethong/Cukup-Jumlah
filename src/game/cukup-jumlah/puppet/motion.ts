export const PUPPET_BPM = 125;

export type PuppetAnim = "idle" | "hop" | "rod-wiggle" | "still";

/**
 * Offsets added on top of the idle springs.
 * Shoulder, elbow, and hip values are outward-positive degrees.
 */
export type PuppetPose = {
  sway?: number;
  bob?: number;
  head?: number;
  shoulder?: number;
  elbow?: number;
  hip?: number;
  foot?: number;
  rod?: number;
};

export type Spring = { v: number; vel: number };

export function stepSpring(
  spring: Spring,
  target: number,
  dt: number,
  stiffness: number,
  damping: number,
) {
  const acc = (target - spring.v) * stiffness - spring.vel * damping;
  spring.vel += acc * dt;
  spring.v += spring.vel * dt;
}

/** 0 at the downbeat, rising to 1. Shared by every puppet via `performance.now()`. */
export function beatPhase(tSeconds: number, bpm: number): { phase: number; index: number } {
  const beats = tSeconds * (bpm / 60);
  const index = Math.floor(beats);
  return { phase: beats - index, index };
}

export type MotionSample = {
  bob: number;
  sway: number;
  head: number;
  shoulder: number;
  elbow: number;
  hip: number;
  foot: number;
  rod: number;
  shadow: number;
  squashX: number;
  squashY: number;
};

export type MotionState = {
  bob: Spring;
  shoulder: Spring;
  elbow: Spring;
  hip: Spring;
  foot: Spring;
  head: Spring;
  rod: Spring;
  prevAnim: PuppetAnim;
};

export function createMotionState(): MotionState {
  const z = (): Spring => ({ v: 0, vel: 0 });
  return {
    bob: z(),
    shoulder: z(),
    elbow: z(),
    hip: z(),
    foot: z(),
    head: z(),
    rod: z(),
    prevAnim: "idle",
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Advance the stick-puppet springs by `dt` seconds and return the pose to paint. */
export function sampleMotion(
  state: MotionState,
  tSeconds: number,
  dt: number,
  anim: PuppetAnim,
  pose: PuppetPose | undefined,
  bpm: number,
  reduced: boolean,
): MotionSample {
  const poseSway = pose?.sway ?? 0;
  const poseBob = pose?.bob ?? 0;
  const poseHead = pose?.head ?? 0;
  const poseShoulder = pose?.shoulder ?? 0;
  const poseElbow = pose?.elbow ?? 0;
  const poseHip = pose?.hip ?? 0;
  const poseFoot = pose?.foot ?? 0;
  const poseRod = pose?.rod ?? 0;

  if (reduced || anim === "still") {
    state.prevAnim = anim;
    return {
      bob: poseBob,
      sway: poseSway,
      head: poseHead,
      shoulder: poseShoulder,
      elbow: poseElbow,
      hip: poseHip,
      foot: poseFoot,
      rod: poseRod,
      shadow: 1,
      squashX: 1,
      squashY: 1,
    };
  }

  const { phase, index } = beatPhase(tSeconds, bpm);
  const accent = index % 4 === 0 ? 1.45 : index % 2 === 0 ? 1.05 : 0.82;
  const pulse = Math.exp(-phase * 6.8) * accent;
  const idle = Math.sin(tSeconds * 1.05);

  if (anim === "hop" && state.prevAnim !== "hop") {
    state.bob.vel = -260;
    state.shoulder.vel = 70;
    state.elbow.vel = 48;
    state.head.vel = -30;
  }
  state.prevAnim = anim;

  const cheering = anim === "hop";
  const bobTarget = (cheering ? -36 : -8.5 * pulse) + poseBob;
  const shoulderTarget = (cheering ? 26 : Math.sin(tSeconds * 1.05 - 0.45) * 3.4) + poseShoulder;
  const elbowTarget = (cheering ? 16 : Math.sin(tSeconds * 1.05 - 0.85) * 6) + poseElbow;
  // Extra beyond the outward rest stance. Amplitude stays inside that stance
  // so the shins never swing back through centre.
  const hipTarget = (cheering ? 6 : Math.sin(tSeconds * 1.05 - 0.3) * 1.2) + poseHip;
  const footTarget = (cheering ? 6 : 0) + poseFoot;
  const headTarget = (cheering ? -8 : -idle * 1.3) + poseHead;

  stepSpring(state.bob, bobTarget, dt, cheering ? 90 : 140, cheering ? 9 : 12);
  stepSpring(state.shoulder, shoulderTarget, dt, 78, 8.5);
  stepSpring(state.elbow, elbowTarget, dt, 64, 7.2);
  stepSpring(state.hip, hipTarget, dt, 90, 11);
  stepSpring(state.foot, footTarget, dt, 70, 8);
  stepSpring(state.head, headTarget, dt, 80, 9);

  if (anim === "rod-wiggle") {
    const speed = 17;
    state.rod.v = Math.sin(tSeconds * speed) * 9;
    state.rod.vel = Math.cos(tSeconds * speed) * 9 * speed;
  } else {
    stepSpring(state.rod, poseRod, dt, 130, 7);
  }

  const sway = idle * 2.55 + state.rod.v * 0.85 + poseSway;
  const stretch = clamp(-state.bob.vel / 1100, -0.028, 0.04);
  const lift = Math.max(0, -state.bob.v);

  return {
    bob: state.bob.v,
    sway,
    head: state.head.v,
    shoulder: state.shoulder.v,
    elbow: state.elbow.v,
    hip: state.hip.v,
    foot: state.foot.v,
    rod: state.rod.v * 0.4 + poseRod,
    shadow: clamp(1 - lift / 90, 0.82, 1.04),
    squashX: 1 - stretch * 0.65,
    squashY: 1 + stretch,
  };
}
