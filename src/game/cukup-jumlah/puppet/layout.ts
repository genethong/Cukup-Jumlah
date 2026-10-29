import type { PuppetRig } from "./loadRig";

/**
 * Rest pose opens the arms about 10° so sleeves sit beside the baju
 * instead of covering the side seams. Positive means outward.
 * Rig.json does not carry this angle — it is a motion default on top of the pins.
 */
export const REST_ARM_OUT_DEG = 10;

/**
 * Rest stance opens the legs a few degrees so the feet sit apart under the hips.
 * Idle sway is added on top and stays outward — it does not cross back through centre.
 */
export const REST_HIP_OUT_DEG = 4;

/** Sarong hem sits this many pixels above the ankle / foot pin. */
export const SARONG_HEM_ABOVE_ANKLE = 14;

/** Samping hem, 0 at the hip pin and 1 at the knee pin. Near the knee, still on the thigh. */
export const SAMPING_HEM_ALONG_THIGH = 0.82;

/**
 * The stage hugs the resting puppet. A hop is allowed to spill between
 * neighbours instead of shrinking every figure to fit a raised arm.
 */
const FRAME_ARM_OUT_DEG = REST_ARM_OUT_DEG;
const FRAME_ELBOW_OUT_DEG = 8;
const FRAME_HIP_OUT_DEG = 4;

export type PuppetFrame = {
  width: number;
  height: number;
  torsoX: number;
  torsoY: number;
  /** Horizontal centre of the hip pins, in frame space. Sway pivots here. */
  hipX: number;
  hipY: number;
};

export type Side = "L" | "R";

/** CSS `rotate()` is clockwise in screen space (y grows downward). */
export function rotateClockwise(x: number, y: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
}

/**
 * Shoulder angle written into CSS `rotate()`, which is applied after
 * `scaleX(-1)` on the right arm. Positive CSS degrees swing the hand
 * toward screen-left, so the right arm uses the negated outward angle.
 */
export function visualShoulderDeg(side: Side, outwardFromRest: number): number {
  const outward = REST_ARM_OUT_DEG + outwardFromRest;
  return side === "L" ? outward : -outward;
}

/**
 * Hip angle for CSS `rotate()`, applied after `scaleX(-1)` on the right leg.
 * `outwardFromRest` is extra degrees beyond {@link REST_HIP_OUT_DEG}.
 * Positive CSS degrees swing the shin toward screen-left, so the mirrored
 * right leg uses the negated angle and a negative sway still stays outward.
 */
export function visualHipDeg(side: Side, outwardFromRest: number): number {
  const outward = REST_HIP_OUT_DEG + outwardFromRest;
  return side === "L" ? outward : -outward;
}

/** World y of the leg's knee or ankle pin, leg hanging from the hip with no rotation. */
export function legJointY(rig: PuppetRig, joint: "knee" | "ankle", torsoY: number): number {
  const hip = rig.parts["base/torso"].pins.hip_L[1];
  const leg = rig.parts["base/leg"];
  const pin = leg.pins[joint];
  return torsoY + hip + (pin[1] - leg.pins.hip[1]);
}

/**
 * Hem of a lower garment, derived from the leg pins.
 * Sarong stops just above the ankle so the foot hangs free.
 * Samping is a hip wrap that stops around the knee so the shin shows.
 */
export function lowerHemY(rig: PuppetRig, lowerId: string, torsoY: number): number {
  const hipY = torsoY + rig.parts["base/torso"].pins.hip_L[1];
  if (lowerId === "songket_samping") {
    const knee = legJointY(rig, "knee", torsoY);
    return hipY + (knee - hipY) * SAMPING_HEM_ALONG_THIGH;
  }
  return legJointY(rig, "ankle", torsoY) - SARONG_HEM_ABOVE_ANKLE;
}

/**
 * Where a point on the foot ends up. The foot bitmap's toes point to +x.
 * Each foot is flipped about its own ankle; the right leg is also flipped
 * about its hip, which cancels the foot flip so the right toes point right.
 */
export function footPointWorld(
  rig: PuppetRig,
  side: Side,
  torsoX: number,
  torsoY: number,
  outwardFromRest: number,
  localFromAnkle: [number, number],
): [number, number] {
  const hip = rig.parts["base/torso"].pins[side === "L" ? "hip_L" : "hip_R"];
  const leg = rig.parts["base/leg"];
  const ax = leg.pins.ankle[0] - leg.pins.hip[0];
  const ay = leg.pins.ankle[1] - leg.pins.hip[1];
  let x = ax - localFromAnkle[0];
  const y = ay + localFromAnkle[1];
  if (side === "R") x = -x;
  const [rx, ry] = rotateClockwise(x, y, visualHipDeg(side, outwardFromRest));
  return [torsoX + hip[0] + rx, torsoY + hip[1] + ry];
}

export function headOrigin(
  rig: PuppetRig,
  headId: string,
  torsoX: number,
  torsoY: number,
): [number, number] {
  const neck = rig.parts["base/torso"].pins.neck;
  const head = rig.parts[`heads/${headId}`];
  return [torsoX + neck[0] - head.pins.neck[0], torsoY + neck[1] - head.pins.neck[1]];
}

/** Top-left of a headwear image. Brim hats use `placement.headwear_brim_dy`. Tudung uses the face hole. */
export function headwearOrigin(
  rig: PuppetRig,
  headId: string,
  headwearId: string,
  torsoX: number,
  torsoY: number,
): [number, number] {
  const [hx, hy] = headOrigin(rig, headId, torsoX, torsoY);
  const head = rig.parts[`heads/${headId}`];
  const hat = rig.parts[`headwear/${headwearId}`];
  if (headwearId === "tudung") {
    const ax = hx + head.pins.face_center[0];
    const ay = hy + head.pins.face_center[1];
    return [ax - hat.pins.face_hole_center[0], ay - hat.pins.face_hole_center[1]];
  }
  const dy = rig.placement.headwear_brim_dy[headwearId] ?? 0;
  const ax = hx + head.pins.hat_brim[0];
  const ay = hy + head.pins.hat_brim[1] + dy;
  return [ax - hat.pins.brim[0], ay - hat.pins.brim[1]];
}

/**
 * Top-left of a lower garment.
 * Waist x is the torso centre (neck pin). Waist y is the hip pin plus `lower_waist_dy_from_hips`.
 */
export function lowerOrigin(
  rig: PuppetRig,
  lowerId: string,
  torsoX: number,
  torsoY: number,
): [number, number] {
  const neck = rig.parts["base/torso"].pins.neck;
  const hip = rig.parts["base/torso"].pins.hip_L;
  const part = rig.parts[`lower/${lowerId}`];
  const dy = rig.placement.lower_waist_dy_from_hips[lowerId] ?? 0;
  const waistX = torsoX + neck[0];
  const waistY = torsoY + hip[1] + dy;
  return [waistX - part.pins.waist[0], waistY - part.pins.waist[1]];
}

/** Sole of the foot in frame space, with the leg hanging straight. */
export function footSoleY(rig: PuppetRig, torsoY: number): number {
  const hip = rig.parts["base/torso"].pins.hip_L[1];
  const leg = rig.parts["base/leg"];
  const foot = rig.parts["base/foot"];
  return (
    torsoY +
    hip +
    (leg.pins.ankle[1] - leg.pins.hip[1]) +
    (foot.size[1] - foot.pins.ankle[1])
  );
}

/** Lowest point of the figure. Hems stop above the feet, so the sole is the bottom. */
export function figureBottomY(rig: PuppetRig, torsoY: number): number {
  return footSoleY(rig, torsoY);
}

/** Elbow joint in torso space after the rest (or extra) outward shoulder angle. */
export function elbowWorld(
  rig: PuppetRig,
  side: Side,
  torsoX: number,
  torsoY: number,
  outwardFromRest: number,
): [number, number] {
  const name = side === "L" ? "shoulder_L" : "shoulder_R";
  const shoulder = rig.parts["base/torso"].pins[name];
  const upper = rig.parts["base/upper_arm"];
  const y = upper.pins.elbow[1] - upper.pins.shoulder[1];
  let x = upper.pins.elbow[0] - upper.pins.shoulder[0];
  if (side === "R") x = -x;
  const [rx, ry] = rotateClockwise(x, y, visualShoulderDeg(side, outwardFromRest));
  return [torsoX + shoulder[0] + rx, torsoY + shoulder[1] + ry];
}

function addPivotChain(
  add: (x: number, y: number) => void,
  worldPivot: [number, number],
  localOffset: [number, number],
  parentDeg: number,
  localDeg: number,
  mirror: boolean,
  size: [number, number],
  pin: [number, number],
  localMirror = false,
) {
  const corners: [number, number][] = [
    [-pin[0], -pin[1]],
    [size[0] - pin[0], -pin[1]],
    [-pin[0], size[1] - pin[1]],
    [size[0] - pin[0], size[1] - pin[1]],
  ];
  for (const corner of corners) {
    let x = corner[0];
    let y = corner[1];
    if (localMirror) x = -x;
    [x, y] = rotateClockwise(x, y, localDeg);
    x += localOffset[0];
    y += localOffset[1];
    if (mirror) x = -x;
    [x, y] = rotateClockwise(x, y, parentDeg);
    add(worldPivot[0] + x, worldPivot[1] + y);
  }
}

/** Stage rectangle that fits every head, hat, sleeve, and the long sarong, including a hop. */
export function measureFrame(rig: PuppetRig): PuppetFrame {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  const addBox = (x: number, y: number, w: number, h: number) => {
    add(x, y);
    add(x + w, y + h);
  };

  const torso = rig.parts["base/torso"];
  addBox(0, 0, torso.size[0], torso.size[1]);
  for (const id of Object.keys(rig.sleeves)) {
    const outfit = rig.parts[`outfits/${id}`];
    addBox(0, 0, outfit.size[0], outfit.size[1]);
  }

  for (const headId of Object.keys(rig.skin.head_tone)) {
    const head = rig.parts[`heads/${headId}`];
    const [hx, hy] = headOrigin(rig, headId, 0, 0);
    addBox(hx, hy, head.size[0], head.size[1]);
    for (const hw of Object.keys(rig.placement.headwear_brim_dy)) {
      const hat = rig.parts[`headwear/${hw}`];
      const [x, y] = headwearOrigin(rig, headId, hw, 0, 0);
      addBox(x, y, hat.size[0], hat.size[1]);
    }
    const tudung = rig.parts["headwear/tudung"];
    const [tx, ty] = headwearOrigin(rig, headId, "tudung", 0, 0);
    addBox(tx, ty, tudung.size[0], tudung.size[1]);
  }

  for (const lowerId of Object.keys(rig.placement.lower_waist_dy_from_hips)) {
    const part = rig.parts[`lower/${lowerId}`];
    const [x, y] = lowerOrigin(rig, lowerId, 0, 0);
    const hem = lowerHemY(rig, lowerId, 0);
    const clipped = Math.min(part.size[1], Math.max(0, hem - y));
    addBox(x, y, part.size[0], clipped);
  }

  const upper = rig.parts["base/upper_arm"];
  const fore = rig.parts["base/forearm_hand"];
  const leg = rig.parts["base/leg"];
  const foot = rig.parts["base/foot"];

  const addArm = (side: Side, outward: number, elbowOut: number) => {
    const mirror = side === "R";
    const shoulder = torso.pins[side === "L" ? "shoulder_L" : "shoulder_R"];
    const deg = visualShoulderDeg(side, outward - REST_ARM_OUT_DEG);
    addPivotChain(add, shoulder, [0, 0], deg, 0, mirror, upper.size, upper.pins.shoulder);
    const elbowOffset: [number, number] = [
      upper.pins.elbow[0] - upper.pins.shoulder[0],
      upper.pins.elbow[1] - upper.pins.shoulder[1],
    ];
    addPivotChain(add, shoulder, elbowOffset, deg, elbowOut, mirror, fore.size, fore.pins.elbow);
    for (const [outfit, kinds] of Object.entries(rig.sleeves)) {
      if (kinds.includes("upper")) {
        const sleeve = rig.parts[`sleeves/${outfit}_upper`];
        addPivotChain(add, shoulder, [0, 0], deg, 0, mirror, sleeve.size, sleeve.pins.shoulder);
      }
      if (kinds.includes("forearm")) {
        const sleeve = rig.parts[`sleeves/${outfit}_forearm`];
        addPivotChain(
          add,
          shoulder,
          elbowOffset,
          deg,
          elbowOut,
          mirror,
          sleeve.size,
          sleeve.pins.elbow,
        );
      }
    }
  };

  const addLeg = (side: Side, outwardFromRest: number) => {
    const mirror = side === "R";
    const hip = torso.pins[side === "L" ? "hip_L" : "hip_R"];
    const deg = visualHipDeg(side, outwardFromRest);
    addPivotChain(add, hip, [0, 0], deg, 0, mirror, leg.size, leg.pins.hip);
    const ankleOffset: [number, number] = [
      leg.pins.ankle[0] - leg.pins.hip[0],
      leg.pins.ankle[1] - leg.pins.hip[1],
    ];
    // Local foot mirror points the toes out. On the right leg the hip mirror
    // cancels it, so the right toes still point right.
    addPivotChain(add, hip, ankleOffset, deg, 0, mirror, foot.size, foot.pins.ankle, true);
  };

  for (const side of ["L", "R"] as const) {
    addArm(side, 0, 0);
    addArm(side, REST_ARM_OUT_DEG, 0);
    addArm(side, FRAME_ARM_OUT_DEG, FRAME_ELBOW_OUT_DEG);
    addLeg(side, -REST_HIP_OUT_DEG);
    addLeg(side, 0);
    addLeg(side, FRAME_HIP_OUT_DEG);
  }

  const padX = 56;
  const padTop = 28;
  const padBottom = 36;
  const torsoX = padX - minX;
  const torsoY = padTop - minY;
  const hipL = torso.pins.hip_L;
  const hipR = torso.pins.hip_R;
  return {
    width: Math.ceil(maxX - minX + padX * 2),
    height: Math.ceil(maxY - minY + padTop + padBottom),
    torsoX,
    torsoY,
    hipX: torsoX + (hipL[0] + hipR[0]) / 2,
    hipY: torsoY + (hipL[1] + hipR[1]) / 2,
  };
}
