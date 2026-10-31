import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  puppetRig,
  resolveFaceConfig,
  rigFileUrl,
  tonePartUrl,
  type BasePartName,
  type FootwearId,
  type LowerId,
  type OutfitId,
  type PuppetConfig,
  type ResolvedFaceConfig,
} from "./loadRig";
import {
  FOOT_SCALE,
  figureBottomY,
  footSoleY,
  headOrigin,
  headwearDraw,
  lowerDraw,
  measureFrame,
  visualHipDeg,
  visualShoulderDeg,
  type PuppetFrame,
  type Side,
} from "./layout";
import {
  createMotionState,
  PUPPET_BPM,
  sampleMotion,
  type PuppetAnim,
  type PuppetPose,
} from "./motion";
import { faceDrawKey, renderFace, type HatClip } from "./faceDraw";

const rig = puppetRig;
const frame: PuppetFrame = measureFrame(rig);

export type PuppetAvatarProps = {
  config: PuppetConfig;
  /** Added on top of the idle springs. Outward-positive degrees for the limbs. */
  pose?: PuppetPose;
  /** `idle` sways, dangles, and bobs at 125 BPM. `hop` cheers. `rod-wiggle` flicks the stick. */
  anim?: PuppetAnim;
  bpm?: number;
  className?: string;
  label?: string;
};

function PinnedImage({ partKey, pin, src }: { partKey: string; pin: string; src: string }) {
  const part = rig.parts[partKey];
  const pivot = part?.pins[pin];
  if (!part || !pivot) return null;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      width={part.size[0]}
      height={part.size[1]}
      style={{
        position: "absolute",
        left: -pivot[0],
        top: -pivot[1],
        width: part.size[0],
        height: part.size[1],
        maxWidth: "none",
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

function Arm({
  side,
  outfit,
  tone,
  torsoX,
  torsoY,
}: {
  side: Side;
  outfit: PuppetConfig["outfit"];
  tone: string;
  torsoX: number;
  torsoY: number;
}) {
  const upper = rig.parts["base/upper_arm"];
  const shoulder = rig.parts["base/torso"].pins[side === "L" ? "shoulder_L" : "shoulder_R"];
  const sleeves = rig.sleeves[outfit] ?? [];
  const mirror = side === "R";
  const limb = (name: BasePartName) => tonePartUrl(tone, name);
  return (
    <div
      style={{
        position: "absolute",
        left: torsoX + shoulder[0],
        top: torsoY + shoulder[1],
        transformOrigin: "0 0",
        transform: `rotate(var(--shoulder-${side.toLowerCase()}))${mirror ? " scaleX(-1)" : ""}`,
        zIndex: side === "L" ? 9 : 10,
        willChange: "transform",
      }}
    >
      <PinnedImage partKey="base/upper_arm" pin="shoulder" src={limb("upper_arm")} />
      {sleeves.includes("upper") && (
        <PinnedImage
          partKey={`sleeves/${outfit}_upper`}
          pin="shoulder"
          src={rigFileUrl(rig.parts[`sleeves/${outfit}_upper`].file)}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: upper.pins.elbow[0] - upper.pins.shoulder[0],
          top: upper.pins.elbow[1] - upper.pins.shoulder[1],
          transformOrigin: "0 0",
          transform: `rotate(var(--elbow-${side.toLowerCase()}))`,
          willChange: "transform",
        }}
      >
        <PinnedImage partKey="base/forearm_hand" pin="elbow" src={limb("forearm_hand")} />
        {sleeves.includes("forearm") && (
          <PinnedImage
            partKey={`sleeves/${outfit}_forearm`}
            pin="elbow"
            src={rigFileUrl(rig.parts[`sleeves/${outfit}_forearm`].file)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Cloth legs on the leg pins. Kurung with a sarong still wears the teal
 * overlay so a gap beside the kain cannot show bare skin.
 */
function trouserUrl(outfit: OutfitId, lower: LowerId | null): string {
  if (lower === "jeans") return "/puppet/trousers/jeans.webp";
  if (outfit === "tshirt") return "/puppet/trousers/tshirt.webp";
  if (outfit === "hoodie") return "/puppet/trousers/hoodie.webp";
  return `/puppet/trousers/${outfit}.webp`;
}

function Leg({
  side,
  tone,
  outfit,
  lower,
  footwear,
  torsoX,
  torsoY,
}: {
  side: Side;
  tone: string;
  outfit: OutfitId;
  lower: LowerId | null;
  footwear?: FootwearId;
  torsoX: number;
  torsoY: number;
}) {
  const leg = rig.parts["base/leg"];
  const foot =
    footwear === "sneakers" && rig.parts["footwear/sneakers"]
      ? rig.parts["footwear/sneakers"]
      : footwear === "selipar" && rig.parts["footwear/selipar"]
        ? rig.parts["footwear/selipar"]
        : rig.parts["base/foot"];
  const footSrc =
    footwear === "sneakers"
      ? "/puppet/footwear/sneakers.webp"
      : footwear === "selipar"
        ? "/puppet/footwear/selipar.webp"
        : tonePartUrl(tone, "foot");
  const hip = rig.parts["base/torso"].pins[side === "L" ? "hip_L" : "hip_R"];
  const mirror = side === "R";
  return (
    <div
      style={{
        position: "absolute",
        left: torsoX + hip[0],
        top: torsoY + hip[1],
        transformOrigin: "0 0",
        transform: `rotate(var(--hip-${side.toLowerCase()}))${mirror ? " scaleX(-1)" : ""}`,
        zIndex: 2,
        willChange: "transform",
      }}
    >
      <PinnedImage partKey="base/leg" pin="hip" src={tonePartUrl(tone, "leg")} />
      <div
        style={{
          position: "absolute",
          left: leg.pins.ankle[0] - leg.pins.hip[0],
          top: leg.pins.ankle[1] - leg.pins.hip[1],
          transformOrigin: "0 0",
          transform: `rotate(var(--foot-${side.toLowerCase()})) scaleX(-1) scale(${FOOT_SCALE})`,
        }}
      >
        {footwear === "selipar" ? (
          <>
            <img
              src={tonePartUrl(tone, "foot")}
              alt=""
              draggable={false}
              width={foot.size[0]}
              height={foot.size[1]}
              style={{
                position: "absolute",
                left: -foot.pins.ankle[0],
                top: -foot.pins.ankle[1],
                width: foot.size[0],
                height: foot.size[1],
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
            <img
              src="/puppet/footwear/selipar.webp"
              alt=""
              draggable={false}
              width={foot.size[0]}
              height={foot.size[1]}
              style={{
                position: "absolute",
                left: -foot.pins.ankle[0],
                top: -foot.pins.ankle[1],
                width: foot.size[0],
                height: foot.size[1],
                maxWidth: "none",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          </>
        ) : (
          <img
            src={footSrc}
            alt=""
            draggable={false}
            width={foot.size[0]}
            height={foot.size[1]}
            style={{
              position: "absolute",
              left: -foot.pins.ankle[0],
              top: -foot.pins.ankle[1],
              width: foot.size[0],
              height: foot.size[1],
              maxWidth: "none",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
      </div>
      {/* Cloth paints over the ankle so the hem sits on the shoe instead of ending in a hard cut under the foot. */}
      <img
        src={trouserUrl(outfit, lower)}
        alt=""
        draggable={false}
        width={leg.size[0]}
        height={leg.size[1]}
        style={{
          position: "absolute",
          left: -leg.pins.hip[0],
          top: -leg.pins.hip[1],
          width: leg.size[0],
          height: leg.size[1],
          maxWidth: "none",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </div>
  );
}

function hatClipFor(
  headwear: PuppetConfig["headwear"],
  shapeKey: string,
  torsoX: number,
  torsoY: number,
): HatClip | null {
  if (!headwear) return null;
  const hat = rig.parts[`headwear/${headwear}`];
  if (!hat) return null;
  const draw = headwearDraw(rig, shapeKey, headwear, torsoX, torsoY);
  const [hx, hy] = headOrigin(rig, shapeKey, torsoX, torsoY);
  const x = draw.x - hx;
  const y = draw.y - hy;
  const brimPinY = hat.pins.brim ? y + hat.pins.brim[1] * draw.scale : y + draw.h;
  const closeCap = headwear === "ketayap";
  const coversAll = headwear === "turban" || headwear === "tudung";
  return {
    src: rigFileUrl(hat.file),
    x,
    y,
    w: draw.w,
    h: draw.h,
    mode: coversAll ? "all" : closeCap ? "tuck" : "crown",
    coverBottom: headwear.startsWith("baseball_cap") ? brimPinY - 48 : y + draw.h,
    maskSkinToHole: headwear === "tudung",
  };
}

/**
 * The puppet's head with its headwear on a 512 canvas (neck pin at 256, 456), for places
 * that draw onto a canvas themselves, such as the share card.
 */
export async function renderPortrait(config: PuppetConfig): Promise<HTMLCanvasElement> {
  const face = resolveFaceConfig(config);
  const headwear = config.headwear === "tudung" && face.gender === "m" ? null : config.headwear;
  const hat = hatClipFor(headwear, face.shapeKey, frame.torsoX, frame.torsoY);
  const painted = await renderFace({ face, hat });
  const out = document.createElement("canvas");
  out.width = 512;
  out.height = 512;
  const ctx = out.getContext("2d");
  if (!ctx) return out;
  ctx.drawImage(painted, 0, 0);
  if (hat) {
    const img = new Image();
    img.src = hat.src;
    await img.decode();
    ctx.drawImage(img, hat.x, hat.y, hat.w, hat.h);
  }
  return out;
}

/** Layered face: 512 canvas, neck pin at (256, 456). Composited to match the approved shade math. */
export function PuppetFace({ face, hat }: { face: ResolvedFaceConfig; hat: HatClip | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef({ face, hat });
  requestRef.current = { face, hat };
  const key = faceDrawKey({ face, hat });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancel = false;
    const request = requestRef.current;
    renderFace(request)
      .then((painted) => {
        if (cancel) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(painted, 0, 0);
      })
      .catch(() => {
        // Missing a layer should not blank the rest of the lab.
      });
    return () => {
      cancel = true;
    };
  }, [key]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={512}
      data-skin={face.skinHex}
      data-shape={face.shapeKey}
      data-shade={`/puppet/layers/skin_shade/${face.shapeKey}.webp`}
      data-nose={face.actualNoseFile}
      aria-hidden
      style={{
        position: "absolute",
        left: -256,
        top: -456,
        width: 512,
        height: 512,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

export function PuppetAvatar({
  config,
  pose,
  anim = "idle",
  bpm = PUPPET_BPM,
  className = "",
  label,
}: PuppetAvatarProps) {
  const fitRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(createMotionState());
  const [, setFrameTick] = useState(0);
  const [fitScale, setFitScale] = useState<number | null>(null);

  const resolvedFace = resolveFaceConfig(config);
  const tone = resolvedFace.tone;
  const torso = rig.parts["base/torso"];
  const outfit = rig.parts[`outfits/${config.outfit}`];
  const lower = config.lower ? rig.parts[`lower/${config.lower}`] : null;

  const resolvedHead = resolvedFace.shapeKey;
  const headwear =
    config.headwear === "tudung" && resolvedFace.gender === "m" ? null : config.headwear;
  const hat = headwear ? rig.parts[`headwear/${headwear}`] : null;
  const hatDraw =
    headwear && hat ? headwearDraw(rig, resolvedHead, headwear, frame.torsoX, frame.torsoY) : null;
  const hatClip = hatClipFor(headwear, resolvedHead, frame.torsoX, frame.torsoY);

  const neck = torso.pins.neck;
  const torsoX = frame.torsoX;
  const torsoY = frame.torsoY;
  const neckX = torsoX + neck[0];
  const neckY = torsoY + neck[1];
  const hipX = frame.hipX;
  const hipY = frame.hipY;

  const soleY = footSoleY(rig, torsoY);
  const bottomY = figureBottomY(rig, torsoY);
  const shadowY = Math.max(soleY, bottomY) + 6;
  const shadowSpread = config.lower === "sarong" ? 170 : 130;

  const rodTop = hipY + 12;
  const rodHeight = Math.max(80, frame.height - rodTop - 8);

  useMotionLoop(rootRef, motionRef, anim, pose, bpm, rig, setFrameTick);

  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      setFitScale(1);
      return;
    }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const next = Math.min(rect.width / frame.width, rect.height / frame.height);
      setFitScale(next > 0 ? next : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={fitRef}
      role="img"
      aria-label={label ?? `Wayang kulit boneka: ${config.outfit}`}
      className={`relative select-none overflow-hidden ${className}`}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div
        ref={rootRef}
        style={{
          width: frame.width,
          height: frame.height,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${fitScale ?? 1})`,
          transformOrigin: "center center",
          pointerEvents: "none",
          visibility: fitScale == null ? "hidden" : "visible",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: hipX - shadowSpread,
              top: shadowY - 14,
              width: shadowSpread * 2,
              height: 28,
              background:
                "radial-gradient(ellipse, rgba(72, 40, 16, 0.38), rgba(72, 40, 16, 0) 70%)",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: `${hipX}px ${hipY}px`,
              transform: "translateY(var(--bob)) rotate(var(--sway)) scale(var(--sx), var(--sy))",
              filter: "drop-shadow(0 18px 12px rgba(62, 34, 14, 0.32))",
              willChange: "transform",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: hipX - 9,
                top: rodTop,
                width: 18,
                height: rodHeight,
                transformOrigin: `9px 8px`,
                transform: "rotate(var(--rod))",
                zIndex: 1,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #4a301c 0%, #a56b3c 38%, #e6c79a 50%, #8a5a32 62%, #3d2618 100%)",
                boxShadow: "inset 0 0 0 1px rgba(40, 22, 10, 0.28), 0 10px 0 0 #6b4424",
              }}
            />
            <Leg
              side="L"
              tone={tone}
              outfit={config.outfit}
              lower={config.lower}
              footwear={config.footwear}
              torsoX={torsoX}
              torsoY={torsoY}
            />
            <Leg
              side="R"
              tone={tone}
              outfit={config.outfit}
              lower={config.lower}
              footwear={config.footwear}
              torsoX={torsoX}
              torsoY={torsoY}
            />
            {config.lower === "sarong" && lower && (
              <ScaledLower lowerId="sarong" torsoX={torsoX} torsoY={torsoY} z={4} />
            )}
            <img
              src={tonePartUrl(tone, "torso")}
              alt=""
              draggable={false}
              width={torso.size[0]}
              height={torso.size[1]}
              style={sheetStyle(torsoX, torsoY, torso.size, 5)}
            />
            <img
              src={rigFileUrl(outfit.file)}
              alt=""
              draggable={false}
              width={outfit.size[0]}
              height={outfit.size[1]}
              style={sheetStyle(torsoX, torsoY, outfit.size, 6)}
            />
            {config.lower === "songket_samping" && lower && (
              <ScaledLower lowerId="songket_samping" torsoX={torsoX} torsoY={torsoY} z={7} />
            )}
            <div
              style={{
                position: "absolute",
                left: neckX,
                top: neckY,
                transformOrigin: "0 0",
                transform: "rotate(var(--head))",
                zIndex: 8,
                willChange: "transform",
              }}
            >
              <PuppetFace face={resolvedFace} hat={hatClip} />
              {hat && hatDraw && headwear && (
                <img
                  src={rigFileUrl(hat.file)}
                  alt=""
                  draggable={false}
                  width={hat.size[0]}
                  height={hat.size[1]}
                  style={sheetStyle(
                    hatDraw.x - neckX,
                    hatDraw.y - neckY,
                    [hatDraw.w, hatDraw.h],
                    25,
                  )}
                />
              )}
            </div>
            <Arm side="L" outfit={config.outfit} tone={tone} torsoX={torsoX} torsoY={torsoY} />
            <Arm side="R" outfit={config.outfit} tone={tone} torsoX={torsoX} torsoY={torsoY} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaledLower({
  lowerId,
  torsoX,
  torsoY,
  z,
}: {
  lowerId: "sarong" | "songket_samping";
  torsoX: number;
  torsoY: number;
  z: number;
}) {
  const part = rig.parts[`lower/${lowerId}`];
  const draw = lowerDraw(rig, lowerId, torsoX, torsoY);
  return (
    <img
      src={rigFileUrl(part.file)}
      alt=""
      draggable={false}
      width={part.size[0]}
      height={part.size[1]}
      style={{
        position: "absolute",
        left: draw.x,
        top: draw.y,
        width: draw.w,
        height: draw.h,
        maxWidth: "none",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: z,
      }}
    />
  );
}

function sheetStyle(x: number, y: number, size: [number, number], z: number): CSSProperties {
  return {
    position: "absolute",
    left: x,
    top: y,
    width: size[0],
    height: size[1],
    maxWidth: "none",
    pointerEvents: "none",
    userSelect: "none",
    zIndex: z,
  };
}

function useMotionLoop(
  rootRef: RefObject<HTMLDivElement | null>,
  motionRef: RefObject<ReturnType<typeof createMotionState>>,
  anim: PuppetAnim,
  pose: PuppetPose | undefined,
  bpm: number,
  rig: typeof puppetRig,
  setFrameTick: (updater: (n: number) => number) => void,
) {
  useEffect(() => {
    let handle: number;
    let prev = performance.now();

    const applyVars = (s: ReturnType<typeof sampleMotion>) => {
      const el = rootRef.current;
      if (!el) return;
      el.style.setProperty("--bob", `${s.bob.toFixed(2)}px`);
      el.style.setProperty("--sway", `${s.sway.toFixed(3)}deg`);
      el.style.setProperty("--head", `${s.head.toFixed(3)}deg`);
      el.style.setProperty("--rod", `${s.rod.toFixed(3)}deg`);
      el.style.setProperty("--sx", (s.squashX ?? 1).toFixed(4));
      el.style.setProperty("--sy", (s.squashY ?? 1).toFixed(4));
      el.style.setProperty("--shoulder-l", `${visualShoulderDeg("L", s.shoulder).toFixed(3)}deg`);
      el.style.setProperty("--shoulder-r", `${visualShoulderDeg("R", s.shoulder).toFixed(3)}deg`);
      el.style.setProperty("--elbow-l", `${s.elbow.toFixed(3)}deg`);
      el.style.setProperty("--elbow-r", `${s.elbow.toFixed(3)}deg`);
      el.style.setProperty("--hip-l", `${visualHipDeg("L", s.hip, rig).toFixed(3)}deg`);
      el.style.setProperty("--hip-r", `${visualHipDeg("R", s.hip, rig).toFixed(3)}deg`);
      el.style.setProperty("--foot-l", `${s.foot.toFixed(3)}deg`);
      el.style.setProperty("--foot-r", `${s.foot.toFixed(3)}deg`);
    };

    if (anim === "still") {
      const s = sampleMotion(motionRef.current, 0, 0, "still", pose, bpm, true);
      applyVars(s);
      setFrameTick((n) => n + 1);
      return;
    }

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const s = sampleMotion(motionRef.current, now / 1000, dt, anim, pose, bpm, false);
      applyVars(s);
      handle = requestAnimationFrame(frame);
    };

    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [anim, pose, bpm, rig, rootRef, motionRef, setFrameTick]);
}
