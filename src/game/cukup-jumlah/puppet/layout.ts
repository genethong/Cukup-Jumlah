import type { PuppetRig } from "./loadRig";

/**
 * Rest pose opens the arms about 10° so sleeves sit beside the baju
 * instead of covering the side seams. Positive means outward.
 * Rig.json does not carry this angle — it is a motion default on top of the pins.
 */
export const REST_ARM_OUT_DEG = 10;

/**
 * Net outward lean of the shin after cancelling the leg art's built-in slant.
 * About 1° keeps the feet under the hips instead of bowed.
 */
export const NET_HIP_OUT_DEG = 1;

/** Feet read large on the chibi body; draw them at three quarters around the ankle pin. */
export const FOOT_SCALE = 1.0;

/** How many degrees the unmirrored leg art already slants outward (ankle left of the hip). */
export function artShinOutDeg(rig: PuppetRig): number {
  const leg = rig.parts["base/leg"];
  const ax = leg.pins.ankle[0] - leg.pins.hip[0];
  const ay = leg.pins.ankle[1] - leg.pins.hip[1];
  return (Math.atan2(-ax, ay) * 180) / Math.PI;
}

/**
 * The stage hugs the resting puppet. A hop is allowed to spill between
 * neighbours instead of shrinking every figure to fit a raised arm.
 */
const FRAME_ARM_OUT_DEG = REST_ARM_OUT_DEG;
const FRAME_ELBOW_OUT_DEG = 8;
const FRAME_HIP_OUT_DEG = 0.6;

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
 * The leg art already slants outward, so the rest angle pulls most of that
 * back and leaves {@link NET_HIP_OUT_DEG}. Positive CSS degrees swing the
 * shin toward screen-left; the right leg uses the opposite sign.
 */
export function visualHipDeg(side: Side, outwardFromRest: number, rig: PuppetRig): number {
  const css = NET_HIP_OUT_DEG - artShinOutDeg(rig) + outwardFromRest;
  return side === "L" ? css : -css;
}

/** World y of the leg's knee or ankle pin, leg hanging from the hip with no rotation. */
export function legJointY(rig: PuppetRig, joint: "knee" | "ankle", torsoY: number): number {
  const hip = rig.parts["base/torso"].pins.hip_L[1];
  const leg = rig.parts["base/leg"];
  const pin = leg.pins[joint];
  return torsoY + hip + (pin[1] - leg.pins.hip[1]);
}

/** Opaque body of the sarong bitmap (it is inset inside the PNG). */
const SARONG_CONTENT = { left: 54, right: 404 };

/** The sarong stays this wide until this fraction of its height, then tapers to a point. */
const SARONG_WIDE_FRAC = 0.94;

/**
 * Hem of a lower garment, derived from the leg pins.
 * The sarong's wide body (not the pointed tip) lands on the top of the shoe.
 * Samping stops at the knee pin.
 */
export function lowerHemY(rig: PuppetRig, lowerId: string, torsoY: number): number {
  if (lowerId === "songket_samping") return legJointY(rig, "knee", torsoY) + 14;
  const ankle = legJointY(rig, "ankle", torsoY);
  const foot = rig.parts["base/foot"];
  // The foot sprite is bare skin from the top down to about y=45; the
  // shoe starts there. The hem has to cover that instep, not stop at the pin.
  const shoeLeatherY = 45;
  const shoeTop = ankle + (shoeLeatherY - foot.pins.ankle[1]) * FOOT_SCALE;
  const hipY = torsoY + rig.parts["base/torso"].pins.hip_L[1];
  const waistY = hipY + (rig.placement.lower_waist_dy_from_hips.sarong ?? 0);
  // The wide body of the kain (before the centre tail) meets the leather.
  return waistY + (shoeTop - waistY + 48) / SARONG_WIDE_FRAC;
}

/** Horizontal scale that lets the sarong cover both legs, outer edge to outer edge. */
export function sarongScaleX(rig: PuppetRig): number {
  const leg = rig.parts["base/leg"];
  const hipL = rig.parts["base/torso"].pins.hip_L[0];
  const hipR = rig.parts["base/torso"].pins.hip_R[0];
  const left = hipL - leg.pins.hip[0] - 22;
  const right = hipR + (leg.size[0] - leg.pins.hip[0]) + 22;
  const contentW = SARONG_CONTENT.right - SARONG_CONTENT.left;
  return Math.max(1, (right - left) / contentW);
}

export type LowerDraw = { x: number; y: number; w: number; h: number };

/**
 * Draw the garment at its authored width, scaled only on Y about the waist
 * pin, so the artwork's own hem lands on {@link lowerHemY}.
 */
export function lowerDraw(
  rig: PuppetRig,
  lowerId: string,
  torsoX: number,
  torsoY: number,
): LowerDraw {
  const part = rig.parts[`lower/${lowerId}`];
  const [left, top] = lowerOrigin(rig, lowerId, torsoX, torsoY);
  const waistX = left + part.pins.waist[0];
  const waistY = top + part.pins.waist[1];
  const naturalDrop = Math.max(1, part.size[1] - part.pins.waist[1]);
  const scaleY = Math.max(0.05, (lowerHemY(rig, lowerId, torsoY) - waistY) / naturalDrop);
  const scaleX = lowerId === "sarong" ? sarongScaleX(rig) : 1;
  return {
    x: waistX - part.pins.waist[0] * scaleX,
    y: waistY - part.pins.waist[1] * scaleY,
    w: part.size[0] * scaleX,
    h: part.size[1] * scaleY,
  };
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
  const [rx, ry] = rotateClockwise(x, y, visualHipDeg(side, outwardFromRest, rig));
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

export type HeadwearDraw = { x: number; y: number; w: number; h: number; scale: number };

/**
 * Extra shift and scale on top of `placement.headwear_brim_dy`.
 * The brim pin on a baseball cap sits inside the visor, ~66px above the
 * visor's lowest pixel, so the authored pin lands the brim over the eyes.
 * Ketayap's +15 dy drops the dome below a bun. A serban needs to be wider
 * than a round head or side hair escapes the wrap.
 */
export function headwearAdjust(
  headwearId: string,
  headId: string,
): { dy: number; scale: number } {
  const round = headId.endsWith("round") || headId.endsWith("head_2");
  if (headwearId.startsWith("baseball_cap")) return { dy: -70, scale: 1 };
  if (headwearId === "ketayap") return { dy: -30, scale: 1 };
  if (headwearId === "turban") return { dy: 0, scale: round ? 1.28 : 1.14 };
  return { dy: 0, scale: 1 };
}

/** Placed headwear rectangle. Brim hats use `placement.headwear_brim_dy` plus {@link headwearAdjust}. Tudung uses the face hole. */
export function headwearDraw(
  rig: PuppetRig,
  headId: string,
  headwearId: string,
  torsoX: number,
  torsoY: number,
): HeadwearDraw {
  const [hx, hy] = headOrigin(rig, headId, torsoX, torsoY);
  const head = rig.parts[`heads/${headId}`];
  const hat = rig.parts[`headwear/${headwearId}`];
  const adjust = headwearAdjust(headwearId, headId);
  const scale = adjust.scale;
  if (headwearId === "tudung") {
    const ax = hx + head.pins.face_center[0];
    const ay = hy + head.pins.face_center[1];
    return {
      x: ax - hat.pins.face_hole_center[0] * scale,
      y: ay - hat.pins.face_hole_center[1] * scale,
      w: hat.size[0] * scale,
      h: hat.size[1] * scale,
      scale,
    };
  }
  const dy = (rig.placement.headwear_brim_dy[headwearId] ?? 0) + adjust.dy;
  const ax = hx + head.pins.hat_brim[0];
  const ay = hy + head.pins.hat_brim[1] + dy;
  return {
    x: ax - hat.pins.brim[0] * scale,
    y: ay - hat.pins.brim[1] * scale,
    w: hat.size[0] * scale,
    h: hat.size[1] * scale,
    scale,
  };
}

/** Top-left of a headwear image. */
export function headwearOrigin(
  rig: PuppetRig,
  headId: string,
  headwearId: string,
  torsoX: number,
  torsoY: number,
): [number, number] {
  const draw = headwearDraw(rig, headId, headwearId, torsoX, torsoY);
  return [draw.x, draw.y];
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
    (foot.size[1] - foot.pins.ankle[1]) * FOOT_SCALE
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

  const headIds = Object.keys(rig.parts)
    .filter((k) => k.startsWith("heads/"))
    .map((k) => k.replace(/^heads\//, ""));

  for (const headId of headIds) {
    const head = rig.parts[`heads/${headId}`];
    const [hx, hy] = headOrigin(rig, headId, 0, 0);
    addBox(hx, hy, head.size[0], head.size[1]);
    for (const hw of Object.keys(rig.placement.headwear_brim_dy)) {
      const draw = headwearDraw(rig, headId, hw, 0, 0);
      addBox(draw.x, draw.y, draw.w, draw.h);
    }
    const tudung = headwearDraw(rig, headId, "tudung", 0, 0);
    addBox(tudung.x, tudung.y, tudung.w, tudung.h);
  }

  for (const lowerId of Object.keys(rig.placement.lower_waist_dy_from_hips)) {
    const draw = lowerDraw(rig, lowerId, 0, 0);
    addBox(draw.x, draw.y, draw.w, draw.h);
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
    const deg = visualHipDeg(side, outwardFromRest, rig);
    addPivotChain(add, hip, [0, 0], deg, 0, mirror, leg.size, leg.pins.hip);
    const ankleOffset: [number, number] = [
      leg.pins.ankle[0] - leg.pins.hip[0],
      leg.pins.ankle[1] - leg.pins.hip[1],
    ];
    // Local foot mirror points the toes out. On the right leg the hip mirror
    // cancels it, so the right toes still point right. Feet are drawn smaller.
    addPivotChain(
      add,
      hip,
      ankleOffset,
      deg,
      0,
      mirror,
      [foot.size[0] * FOOT_SCALE, foot.size[1] * FOOT_SCALE],
      [foot.pins.ankle[0] * FOOT_SCALE, foot.pins.ankle[1] * FOOT_SCALE],
      true,
    );
  };

  for (const side of ["L", "R"] as const) {
    addArm(side, 0, 0);
    addArm(side, REST_ARM_OUT_DEG, 0);
    addArm(side, FRAME_ARM_OUT_DEG, FRAME_ELBOW_OUT_DEG);
    addLeg(side, -0.4);
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
