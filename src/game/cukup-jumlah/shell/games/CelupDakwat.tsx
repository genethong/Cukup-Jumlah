import { useEffect, useId, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import {
  canang,
  gendangHit,
  gendangMiss,
  gendangTak,
  paperSlap,
  shutter,
  tick,
} from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import { TONES } from "../../puppet/options";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  BAND_BOTTOM,
  BAND_TOP,
  BOTTLE_X,
  FRESH_DIP,
  INK_Y,
  MOUTH_HALF,
  RIM_Y,
  SOAK_S,
  START,
  TOO_DEEP_Y,
  bumpsAllowed,
  restOnDesk,
  stepDip,
  sway,
  type Dip,
  type Tip,
} from "./celupRules";

const T = GAME_TEXT.celup;
const TICK_FROM_S = 2;
const INK = "#5b2a86";
const KEY_STEP = 1.5;

// The YB's left hand, seen from behind, index finger pointing down. Its SVG is 100 × 200
// with the fingertip at the bottom centre, drawn HAND_H % of the stage tall.
const HAND_H = 26;
const UNITS_PER_Y = 200 / HAND_H;
// The bottle, in % of the stage.
const NECK_BOTTOM = RIM_Y + 2.5;
const BODY_HALF = MOUTH_HALF + 5;
const BOTTLE_BOTTOM = 91;

type View = { tip: Tip; dip: Dip };

function clampTarget(t: Tip): Tip {
  return { x: Math.min(96, Math.max(6, t.x)), y: Math.min(96, Math.max(42, t.y)) };
}

export function CelupDakwat({
  clock,
  candidate,
  lang,
  talent,
  bars,
  onLeadIn,
  onTimeLeft,
  onJudge,
  onPuppet,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish });
  callbacks.current = { onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish };
  const allowed = bumpsAllowed(talent === "mesra_rakyat");
  const skin = TONES.find((t) => t.id === candidate.puppet.tone)?.hex ?? "#B27647";
  const sleeve = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#3a3f6b";

  const [view, setView] = useState<View>({ tip: START, dip: FRESH_DIP });
  const [bump, setBump] = useState(0);
  const [again, setAgain] = useState(0);
  const [voted, setVoted] = useState(false);

  const target = useRef<Tip>(START);
  const dipRef = useRef<Dip>(FRESH_DIP);
  const liveRef = useRef(false);
  const done = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; w: number; h: number } | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const finish = (success: boolean) => {
    if (done.current) return;
    done.current = true;
    clock.halt();
    callbacks.current.onFinish(success);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const limitS = bars * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    let last = clock.ctx.currentTime;
    const frame = () => {
      if (done.current || dipRef.current.outcome !== "dipping") return;
      raf = requestAnimationFrame(frame);
      const t = clock.ctx.currentTime;
      const dt = Math.min(0.25, t - last);
      last = t;
      const s = sway(t);
      const aim = clampTarget(target.current);
      const tip = restOnDesk({ x: aim.x + s.dx, y: aim.y + s.dy });
      if (!clock.running) {
        setView((v) => ({ ...v, tip }));
        return;
      }
      const heardBeats = (clock.heardTime() - clock.start) / clock.spb;
      const nextStep = leadInStep(heardBeats);
      if (nextStep !== step) {
        step = nextStep;
        callbacks.current.onLeadIn?.(step);
      }
      const playS = (heardBeats - LEAD_IN_BEATS) * clock.spb;
      if (playS >= 0) liveRef.current = true;
      const leftS = limitS - Math.max(0, playS);
      callbacks.current.onTimeLeft?.(leftS / limitS, Math.max(0, leftS));
      if (!liveRef.current) {
        setView((v) => ({ ...v, tip }));
        return;
      }
      if (leftS <= TICK_FROM_S && t >= nextTick) {
        tick(clock.ctx, clock.out, t);
        nextTick = t + clock.spb / 2;
      }

      const before = dipRef.current;
      const { dip, bumped } = stepDip(before, tip, dt, allowed);
      dipRef.current = dip;
      setView({ tip, dip });
      if (before.stain <= 0 && dip.stain > 0) gendangTak(clock.ctx, clock.out, t);
      if (before.soak > 0 && dip.soak === 0 && !bumped) setAgain((n) => n + 1);

      if (bumped) {
        canang(clock.ctx, clock.out, t);
        target.current = { ...target.current, y: RIM_Y - 8 };
        setBump((n) => n + 1);
        callbacks.current.onJudge("miss");
        callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "shocked_o" });
        later(() => callbacks.current.onPuppet?.(null), 600);
      }
      if (dip.outcome === "spilled" || dip.outcome === "deep") {
        gendangMiss(clock.ctx, clock.out, t);
        if (dip.outcome === "spilled") paperSlap(clock.ctx, clock.out, t + 0.05);
        callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "shocked_o" });
        finishRef.current(false);
        return;
      }
      if (dip.outcome === "won") {
        // A clean dip. The finger goes up for the cameras, and the ballot is next.
        clock.halt();
        gendangHit(clock.ctx, clock.out, t, true);
        callbacks.current.onJudge("perfect");
        later(() => {
          setVoted(true);
          shutter(clock.ctx, clock.out, clock.ctx.currentTime);
          callbacks.current.onPuppet?.({ anim: "hop", face: "big_laugh" });
        }, 350);
        later(() => finishRef.current(true), 1500);
        return;
      }
      if (leftS <= 0) finishRef.current(false);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, allowed]);

  // Dragging anywhere steers the hand by the same amount, like a trackpad, so the
  // player's own thumb never covers the bottle.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (liveRef.current && !done.current) {
      target.current = clampTarget({
        x: target.current.x + ((e.clientX - d.x) / d.w) * 100,
        y: target.current.y + ((e.clientY - d.y) / d.h) * 100,
      });
    }
    drag.current = { ...d, x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const move: Record<string, [number, number]> = {
        ArrowLeft: [-KEY_STEP, 0],
        ArrowRight: [KEY_STEP, 0],
        ArrowUp: [0, -KEY_STEP],
        ArrowDown: [0, KEY_STEP],
      };
      const m = move[e.key];
      if (!m) return;
      e.preventDefault();
      if (!liveRef.current || done.current) return;
      target.current = clampTarget({ x: target.current.x + m[0], y: target.current.y + m[1] });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { tip, dip } = view;
  const spilled = dip.outcome === "spilled";
  const raised = voted ? { x: tip.x, y: 46 } : tip;
  const shake = spilled ? "bottle-tip" : bump ? "bottle-wobble" : "";

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* The clerk's desk, with a pale cloth; the YB stands at its end, on the left. */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-[44%] rounded-tl-[2cqw] bg-[linear-gradient(180deg,#e3ebf1,#c9d6e0)] shadow-[0_-3px_0_#f4f8fb,0_-6px_10px_rgba(40,14,6,0.25)]"
        style={{ top: `${RIM_Y}%` }}
      />

      <div
        key={`bottle-${bump}`}
        className={`pointer-events-none absolute inset-0 ${shake}`}
        style={{ transformOrigin: `${BOTTLE_X}% ${BOTTLE_BOTTOM}%` }}
      >
        <BottleBack />
      </div>

      <Hand tip={raised} stain={dip.stain} skin={skin} sleeve={sleeve} lifted={voted} />

      <div
        key={`glass-${bump}`}
        className={`pointer-events-none absolute inset-0 ${shake}`}
        style={{ transformOrigin: `${BOTTLE_X}% ${BOTTLE_BOTTOM}%` }}
      >
        <BottleFront />
      </div>

      {spilled && (
        <div
          className="combo-pop pointer-events-none absolute h-[5%] w-[40%] rounded-[50%] bg-[#5b2a86]/85"
          style={{ left: `${BOTTLE_X - 6}%`, top: `${BOTTLE_BOTTOM - 4}%` }}
        />
      )}

      {/* The label under the bottle, or while the ink takes: hold it there. */}
      {!(dip.outcome === "dipping" && dip.soak > 0) && (
        <span
          className="pointer-events-none absolute -translate-x-1/2 rounded-sm bg-[#fbf3e4] px-[1.2cqw] py-[0.2cqw] font-tally text-[2.6cqw] whitespace-nowrap text-[var(--ink)] uppercase"
          style={{ left: `${BOTTLE_X}%`, top: `${BOTTLE_BOTTOM + 1.5}%` }}
        >
          {T.ink[lang]}
        </span>
      )}
      {dip.outcome === "dipping" && dip.soak > 0 && (
        <div
          className="pointer-events-none absolute z-20 flex -translate-x-1/2 items-center gap-[1.2cqw]"
          style={{ left: `${BOTTLE_X}%`, top: `${BOTTLE_BOTTOM + 1.5}%` }}
        >
          <span className="font-tally text-[3.4cqw] tracking-[0.08em] text-[var(--ink)] uppercase">
            {T.hold[lang]}
          </span>
          <div className="h-[1.8cqw] w-[18cqw] overflow-hidden rounded-full bg-[#2b2522]/30">
            <div
              className="h-full rounded-full bg-[#3f8f4f]"
              style={{ width: `${Math.min(100, (dip.soak / SOAK_S) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {bump > 0 && dip.outcome === "dipping" && dip.soak === 0 && (
        <Callout key={`b-${bump}`} tone="bad" text={T.rim[lang]} />
      )}
      {again > 0 && bump === 0 && dip.outcome === "dipping" && dip.soak === 0 && (
        <Callout key={`a-${again}`} tone="bad" text={T.again[lang]} />
      )}
      {spilled && <Callout tone="bad" text={T.spilled[lang]} />}
      {dip.outcome === "deep" && <Callout tone="paper" text={T.deep[lang]} />}

      {voted && (
        <>
          <div className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white" />
          <Callout tone="paper" text={`☝️ ${T.voted[lang]}`} />
        </>
      )}
    </div>
  );
}

function Callout({ text, tone }: { text: string; tone: "bad" | "paper" }) {
  return (
    <p
      className={`combo-pop pointer-events-none absolute top-[44%] left-[40%] z-30 -translate-x-1/2 rounded-sm px-[2.6cqw] py-[0.8cqw] text-center font-display text-[5cqw] leading-[1.05] font-bold italic shadow-[0_4px_8px_rgba(40,14,6,0.3)] ${
        tone === "bad"
          ? "bg-[var(--sambal)] whitespace-nowrap text-[var(--cream)]"
          : "w-[56%] bg-[#efe1c3] text-[var(--ink)]"
      }`}
    >
      {text}
    </p>
  );
}

/** The inside of the bottle, behind the finger. */
function BottleBack() {
  return (
    <div
      className="absolute rounded-b-[3cqw] bg-[#c9c1d6]/60"
      style={{
        left: `${BOTTLE_X - BODY_HALF}%`,
        width: `${BODY_HALF * 2}%`,
        top: `${NECK_BOTTOM}%`,
        height: `${BOTTLE_BOTTOM - NECK_BOTTOM}%`,
      }}
    />
  );
}

/**
 * The glass and the ink in front of the finger, with the nail line marked: tip between the
 * green lines is a clean dip; past the red one is too deep.
 */
function BottleFront() {
  const body = { left: `${BOTTLE_X - BODY_HALF}%`, width: `${BODY_HALF * 2}%` };
  const line = (y: number, colour: string) => (
    <div
      className="absolute border-t-[0.5cqw] border-dashed"
      style={{ ...body, top: `${y}%`, borderColor: colour }}
    />
  );
  return (
    <>
      {/* Neck and rim. */}
      <div
        className="absolute rounded-t-[1cqw] border-x-[0.7cqw] border-t-[0.7cqw] border-[#8e86a3] bg-white/20"
        style={{
          left: `${BOTTLE_X - MOUTH_HALF - 0.7}%`,
          width: `${(MOUTH_HALF + 0.7) * 2}%`,
          top: `${RIM_Y}%`,
          height: `${NECK_BOTTOM - RIM_Y + 0.4}%`,
        }}
      />
      {/* Ink. */}
      <div
        className="absolute rounded-b-[3cqw] bg-[#5b2a86]/85"
        style={{ ...body, top: `${INK_Y}%`, height: `${BOTTLE_BOTTOM - INK_Y}%` }}
      />
      <div className="absolute h-[0.6%] bg-[#9c6fd0]" style={{ ...body, top: `${INK_Y}%` }} />
      <div
        className="absolute bg-[#7fe09a]/20"
        style={{ ...body, top: `${BAND_TOP}%`, height: `${BAND_BOTTOM - BAND_TOP}%` }}
      />
      {line(BAND_TOP, "#7fe09a")}
      {line(BAND_BOTTOM, "#7fe09a")}
      {line(TOO_DEEP_Y, "#ff8a6a")}
      {/* Glass. */}
      <div
        className="absolute rounded-t-[1.6cqw] rounded-b-[3cqw] border-[0.7cqw] border-[#8e86a3] bg-white/10 shadow-[inset_1.4cqw_0_0_rgba(255,255,255,0.35)]"
        style={{ ...body, top: `${NECK_BOTTOM}%`, height: `${BOTTLE_BOTTOM - NECK_BOTTOM}%` }}
      />
    </>
  );
}

/** The YB's left hand from behind, on its puppet rod, index finger down, nail showing. */
function Hand({
  tip,
  stain,
  skin,
  sleeve,
  lifted,
}: {
  tip: Tip;
  stain: number;
  skin: string;
  sleeve: string;
  lifted: boolean;
}) {
  const clip = useId();
  const outline = { stroke: "#3a2414", strokeOpacity: 0.45, strokeWidth: 2 };
  const stained = Math.max(0, stain) * UNITS_PER_Y;
  return (
    <div
      className={`pointer-events-none absolute ${lifted ? "transition-[top] duration-300" : ""}`}
      style={{
        left: `${tip.x}%`,
        top: `${tip.y}%`,
        height: `${HAND_H}%`,
        aspectRatio: "1 / 2",
        transform: "translate(-50%, -100%)",
      }}
    >
      <svg viewBox="0 0 100 200" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id={clip}>
            <rect x="42" y="108" width="16" height="92" rx="8" />
          </clipPath>
        </defs>
        <line x1="50" y1="10" x2="50" y2="-260" stroke="#2b2522" strokeWidth="2.5" />
        <rect x="20" y="-14" width="60" height="44" rx="6" fill={sleeve} />
        <rect x="20" y="22" width="60" height="8" fill="#000" opacity="0.18" />
        <rect x="28" y="28" width="44" height="34" fill={skin} />
        <rect x="16" y="52" width="60" height="72" rx="22" fill={skin} {...outline} />
        {[12, 23, 34].map((x) => (
          <rect key={x} x={x} y="108" width="12" height="24" rx="6" fill={skin} {...outline} />
        ))}
        <rect
          x="62"
          y="70"
          width="15"
          height="46"
          rx="7.5"
          fill={skin}
          transform="rotate(22 69 70)"
          {...outline}
        />
        <rect x="42" y="108" width="16" height="92" rx="8" fill={skin} {...outline} />
        <path d="M45 150 h10 M45 172 h10" stroke="#3a2414" strokeOpacity="0.35" strokeWidth="1.5" />
        <rect x="45" y="181" width="10" height="15" rx="4" fill="#f3d9c4" opacity="0.8" />
        {stained > 0 && (
          <rect
            x="40"
            y={200 - stained}
            width="20"
            height={stained}
            fill={INK}
            clipPath={`url(#${clip})`}
          />
        )}
      </svg>
    </div>
  );
}
