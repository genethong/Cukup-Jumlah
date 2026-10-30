import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  puppetRig,
  rigFileUrl,
  toneForHead,
  tonePartUrl,
  type BasePartName,
  type FootwearId,
  type LowerId,
  type OutfitId,
  type PuppetConfig,
} from "./loadRig";
import {
  FOOT_SCALE,
  figureBottomY,
  footSoleY,
  headOrigin,
  headwearOrigin,
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

function headUrl(headId: string, tone: string): string {
  return `/puppet/heads/${tone}/${headId}.webp`;
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
  const trousers = trouserUrl(outfit, lower);
  return (
    <div
      style={{
        position: "absolute",
        left: torsoX + hip[0],
        top: torsoY + hip[1],
        transformOrigin: "0 0",
        transform: `rotate(var(--hip-${side.toLowerCase()}))${mirror ? " scaleX(-1)" : ""}`,
        zIndex: side === "L" ? 2 : 3,
        willChange: "transform",
      }}
    >
      <PinnedImage partKey="base/leg" pin="hip" src={tonePartUrl(tone, "leg")} />
      {trousers && (
        <img
          src={trousers}
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
            zIndex: 2,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: leg.pins.ankle[0] - leg.pins.hip[0],
          top: leg.pins.ankle[1] - leg.pins.hip[1],
          transformOrigin: "0 0",
          // Flip about the ankle so the toes point outward, then shrink.
          // The right leg is already mirrored about the hip; this second flip
          // cancels that for the foot only, so right toes stay to the right.
          transform: `rotate(var(--foot-${side.toLowerCase()})) scaleX(-1) scale(${FOOT_SCALE})`,
          zIndex: 1,
          willChange: "transform",
        }}
      >
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
      </div>
    </div>
  );
}

function useScale(frameWidth: number, frameHeight: number) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.min(rect.width / frameWidth, rect.height / frameHeight);
      if (next > 0) setScale(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [frameWidth, frameHeight]);
  return { boxRef, scale };
}

function usePuppetMotion(
  ref: RefObject<HTMLDivElement | null>,
  anim: PuppetAnim,
  pose: PuppetPose | undefined,
  bpm: number,
) {
  const live = useRef({ anim, pose, bpm });
  live.current = { anim, pose, bpm };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof requestAnimationFrame !== "function") return;
    const state = createMotionState();
    let raf = 0;
    let last = performance.now();

    const paint = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const current = live.current;
      const sample = sampleMotion(
        state,
        now / 1000,
        dt,
        current.anim,
        current.pose,
        current.bpm,
        reduced,
      );
      el.style.setProperty("--bob", `${sample.bob.toFixed(2)}px`);
      el.style.setProperty("--sway", `${sample.sway.toFixed(3)}deg`);
      el.style.setProperty("--head", `${sample.head.toFixed(3)}deg`);
      el.style.setProperty("--rod", `${sample.rod.toFixed(3)}deg`);
      el.style.setProperty("--sx", sample.squashX.toFixed(4));
      el.style.setProperty("--sy", sample.squashY.toFixed(4));
      el.style.setProperty("--shadow", sample.shadow.toFixed(3));
      el.style.setProperty(
        "--shoulder-l",
        `${visualShoulderDeg("L", sample.shoulder).toFixed(3)}deg`,
      );
      el.style.setProperty(
        "--shoulder-r",
        `${visualShoulderDeg("R", sample.shoulder).toFixed(3)}deg`,
      );
      el.style.setProperty("--elbow-l", `${sample.elbow.toFixed(3)}deg`);
      el.style.setProperty("--elbow-r", `${sample.elbow.toFixed(3)}deg`);
      el.style.setProperty("--hip-l", `${visualHipDeg("L", sample.hip, rig).toFixed(3)}deg`);
      el.style.setProperty("--hip-r", `${visualHipDeg("R", sample.hip, rig).toFixed(3)}deg`);
      el.style.setProperty("--foot-l", `${sample.foot.toFixed(3)}deg`);
      el.style.setProperty("--foot-r", `${sample.foot.toFixed(3)}deg`);
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [ref]);
}

const restVars = {
  "--bob": "0px",
  "--sway": "0deg",
  "--head": "0deg",
  "--rod": "0deg",
  "--sx": "1",
  "--sy": "1",
  "--shadow": "1",
  "--shoulder-l": `${visualShoulderDeg("L", 0)}deg`,
  "--shoulder-r": `${visualShoulderDeg("R", 0)}deg`,
  "--elbow-l": "0deg",
  "--elbow-r": "0deg",
  "--hip-l": `${visualHipDeg("L", 0, rig)}deg`,
  "--hip-r": `${visualHipDeg("R", 0, rig)}deg`,
  "--foot-l": "0deg",
  "--foot-r": "0deg",
} as CSSProperties;

/**
 * Jointed paper puppet. Parts rotate about the brass pins in rig.json.
 * Right arm and right leg mirror about their shoulder and hip pins.
 * Each foot also flips about its ankle so the toes point outward.
 * Draw order follows rig.draw_order: legs, sarong, torso, outfit, samping, head, headwear, arms.
 */
export function PuppetAvatar({
  config,
  pose,
  anim = "idle",
  bpm = PUPPET_BPM,
  className,
  label,
}: PuppetAvatarProps) {
  const { boxRef, scale } = useScale(frame.width, frame.height);
  const motionRef = useRef<HTMLDivElement>(null);
  usePuppetMotion(motionRef, anim, pose, bpm);

  const tone = config.tone ?? toneForHead(rig, config.head);
  const { torsoX, torsoY, hipX, hipY } = frame;
  const neck = rig.parts["base/torso"].pins.neck;
  const neckX = torsoX + neck[0];
  const neckY = torsoY + neck[1];
  const [headX, headY] = headOrigin(rig, config.head, torsoX, torsoY);
  const head = rig.parts[`heads/${config.head}`];
  const outfit = rig.parts[`outfits/${config.outfit}`];
  const torso = rig.parts["base/torso"];
  const hat = config.headwear ? rig.parts[`headwear/${config.headwear}`] : null;
  const hatOrigin = config.headwear
    ? headwearOrigin(rig, config.head, config.headwear, torsoX, torsoY)
    : null;
  const lower = config.lower ? rig.parts[`lower/${config.lower}`] : null;
  const figureBottom = figureBottomY(rig, torsoY);
  const rodTop = figureBottom - 6;
  const rodHeight = Math.max(28, Math.min(78, frame.height - rodTop - 10));

  return (
    <div
      ref={boxRef}
      className={className ? `relative h-full w-full ${className}` : "relative h-full w-full"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: frame.width,
          height: frame.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <div ref={motionRef} className="absolute inset-0" style={restVars}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: hipX,
              top: footSoleY(rig, torsoY) - 10,
              width: 300,
              height: 42,
              transform: "translate(-50%, 0) scaleX(var(--shadow))",
              borderRadius: "50%",
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
                boxShadow:
                  "inset 0 0 0 1px rgba(40, 22, 10, 0.28), 0 10px 0 0 #6b4424",
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
              <img
                src={headUrl(config.head, tone)}
                alt=""
                draggable={false}
                width={head.size[0]}
                height={head.size[1]}
                style={sheetStyle(headX - neckX, headY - neckY, head.size, 1)}
              />
              {hat && hatOrigin && config.headwear && (
                <img
                  src={rigFileUrl(hat.file)}
                  alt=""
                  draggable={false}
                  width={hat.size[0]}
                  height={hat.size[1]}
                  style={sheetStyle(hatOrigin[0] - neckX, hatOrigin[1] - neckY, hat.size, 2)}
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
