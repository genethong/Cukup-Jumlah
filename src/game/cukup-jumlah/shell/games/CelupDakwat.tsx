import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { gendangHit, gendangMiss, paperSlap, shutter, tick } from "../../beat/wayangSounds";
import { TONES } from "../../puppet/options";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  FINGERS,
  FRESH_OFFER,
  INK_FINGER_INDEX,
  celupVerdict,
  offerFinger,
  wrongAllowed,
  type FingerName,
  type Offer,
} from "./celupRules";

const T = GAME_TEXT.celup;
const TICK_FROM_S = 2;
const INK = "#5b2a86";

// Hands geometry in the SVG's own units (viewBox 0 0 320 170). The YB's right hand is on
// screen-left (centre x 82), the left hand on screen-right (centre x 238), palms down.
const VIEW_W = 320;
const VIEW_H = 170;
const PALM_TOP = 6;
const PALM_H = 66;
const FINGER_TOP = 60;
const LENGTH: Record<FingerName, number> = {
  thumb: 46,
  index: 58,
  middle: 64,
  ring: 60,
  pinky: 48,
};

/** Screen x of each finger's centre, in screen order (matches FINGERS). */
const FINGER_X = [49, 71, 93, 115, 128, 192, 205, 227, 249, 271];

// Where the hands sit on the stage, in % of the kelir.
const HANDS_LEFT = 4;
const HANDS_WIDTH = 92;
const HANDS_TOP = 55;
const HANDS_HEIGHT = 27.5;

function tipOnStage(i: number): { left: string; top: string } {
  const f = FINGERS[i]!;
  const y = f.name === "thumb" ? 34 + 40 : FINGER_TOP + LENGTH[f.name] - 6;
  return {
    left: `${HANDS_LEFT + (HANDS_WIDTH * FINGER_X[i]!) / VIEW_W}%`,
    top: `${HANDS_TOP + (HANDS_HEIGHT * y) / VIEW_H}%`,
  };
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
  const allowed = wrongAllowed(talent === "mesra_rakyat");
  const skin = TONES.find((t) => t.id === candidate.puppet.tone)?.hex ?? "#B27647";

  const [offer, setOffer] = useState<Offer>(FRESH_OFFER);
  const [wrongAt, setWrongAt] = useState<{ i: number; n: number } | null>(null);
  const [finale, setFinale] = useState(0);

  const offerRef = useRef<Offer>(FRESH_OFFER);
  const liveRef = useRef(false);
  const done = useRef(false);
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
    const frame = () => {
      if (done.current || offerRef.current.inked) return;
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const heardBeats = (clock.heardTime() - clock.start) / clock.spb;
      const nextStep = leadInStep(heardBeats);
      if (nextStep !== step) {
        step = nextStep;
        callbacks.current.onLeadIn?.(step);
      }
      const playS = (heardBeats - LEAD_IN_BEATS) * clock.spb;
      if (playS >= 0 && !liveRef.current) {
        liveRef.current = true;
      }
      const leftS = limitS - Math.max(0, playS);
      callbacks.current.onTimeLeft?.(leftS / limitS, Math.max(0, leftS));
      const t = clock.ctx.currentTime;
      if (liveRef.current && leftS <= TICK_FROM_S && t >= nextTick) {
        tick(clock.ctx, clock.out, t);
        nextTick = t + clock.spb / 2;
      }
      if (liveRef.current && celupVerdict(offerRef.current, allowed, leftS <= 0) === "lost") {
        finishRef.current(false);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, allowed]);

  const tap = (i: number) => {
    if (!liveRef.current || done.current || offerRef.current.inked) return;
    const { offer: next, right } = offerFinger(offerRef.current, i);
    offerRef.current = next;
    setOffer(next);
    const t = clock.ctx.currentTime;
    if (!right) {
      gendangMiss(clock.ctx, clock.out, t);
      setWrongAt((w) => ({ i, n: (w?.n ?? 0) + 1 }));
      callbacks.current.onJudge("miss");
      callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "shocked_o" });
      later(() => callbacks.current.onPuppet?.(null), 600);
      if (celupVerdict(next, allowed, false) === "lost") finish(false);
      return;
    }
    // Inked. Then the ballot goes in the box, and the finger goes up for the cameras.
    clock.halt();
    paperSlap(clock.ctx, clock.out, t);
    callbacks.current.onJudge("perfect");
    setFinale(1);
    later(() => {
      setFinale(2);
      paperSlap(clock.ctx, clock.out, clock.ctx.currentTime);
    }, 450);
    later(() => {
      setFinale(3);
      shutter(clock.ctx, clock.out, clock.ctx.currentTime);
      gendangHit(clock.ctx, clock.out, clock.ctx.currentTime + 0.05, true);
      callbacks.current.onPuppet?.({ anim: "hop", face: "big_laugh" });
    }, 900);
    later(() => finish(true), 1500);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key === "0" ? 10 : Number(e.key);
      if (!Number.isInteger(k) || k < 1 || k > 10) return;
      e.preventDefault();
      tap(k - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="absolute inset-0 z-10 select-none">
      {/* The polling desk. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,#b88a5a,#8a5a34)] shadow-[0_-3px_0_#d9b78a]" />

      {/* The YB's hands, held out across the desk, palms down. */}
      <div
        className="absolute"
        style={{
          left: `${HANDS_LEFT}%`,
          top: `${HANDS_TOP}%`,
          width: `${HANDS_WIDTH}%`,
          aspectRatio: `${VIEW_W} / ${VIEW_H}`,
        }}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-full w-full overflow-visible">
          {[82, 238].map((cx) => (
            <g key={cx} aria-hidden="true">
              <rect x={cx - 30} y={-30} width="60" height="44" fill={skin} />
              <rect
                x={cx - 46}
                y={PALM_TOP}
                width="92"
                height={PALM_H}
                rx="26"
                fill={skin}
                stroke="#3a2414"
                strokeOpacity="0.35"
                strokeWidth="2"
              />
            </g>
          ))}
          {FINGERS.map((f, i) => {
            const x = FINGER_X[i]!;
            const len = LENGTH[f.name];
            const isWrong = wrongAt?.i === i;
            const inked = offer.inked && i === INK_FINGER_INDEX;
            const shape =
              f.name === "thumb" ? (
                <g transform={`translate(${x} 34) rotate(${f.hand === "right" ? -32 : 32})`}>
                  <rect x="-10" y="0" width="20" height={len} rx="10" fill={skin} />
                  <rect
                    x="-6"
                    y={len - 15}
                    width="12"
                    height="10"
                    rx="5"
                    fill="#f3d9c4"
                    opacity="0.7"
                  />
                </g>
              ) : (
                <g>
                  <rect x={x - 9.5} y={FINGER_TOP} width="19" height={len} rx="9.5" fill={skin} />
                  <rect
                    x={x - 6}
                    y={FINGER_TOP + len - 16}
                    width="12"
                    height="11"
                    rx="5"
                    fill={inked ? INK : "#f3d9c4"}
                    opacity={inked ? 1 : 0.7}
                  />
                  {inked && (
                    <rect
                      x={x - 9.5}
                      y={FINGER_TOP + len - 22}
                      width="19"
                      height="6"
                      fill={INK}
                      opacity="0.55"
                    />
                  )}
                </g>
              );
            return (
              <g
                key={`${f.hand}-${f.name}`}
                role="button"
                tabIndex={-1}
                aria-label={`${f.hand} ${f.name}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  tap(i);
                }}
                className={`cursor-pointer ${isWrong ? "finger-wrong" : ""}`}
                style={{ transformOrigin: `${x}px ${FINGER_TOP}px`, touchAction: "none" }}
              >
                {/* A wider invisible hit area, so a fingertip is easy to hit on a phone. */}
                <rect
                  x={x - 11}
                  y={FINGER_TOP - 10}
                  width="22"
                  height={len + 16}
                  fill="transparent"
                />
                {shape}
                {isWrong && (
                  <rect
                    key={wrongAt!.n}
                    className="camera-flash"
                    x={x - 11}
                    y={FINGER_TOP - 4}
                    width="22"
                    height={len + 8}
                    rx="10"
                    fill="#e4572e"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* The clerk's hand with the ink bottle, bottom right. */}
      <div className="pointer-events-none absolute right-[3%] bottom-[2%] flex flex-col items-center">
        <svg viewBox="0 0 60 60" className="h-[16cqw] w-[16cqw]" aria-hidden="true">
          <rect
            x="16"
            y="22"
            width="28"
            height="32"
            rx="5"
            fill={INK}
            stroke="#2a0f3f"
            strokeWidth="2"
          />
          <rect x="22" y="12" width="16" height="12" rx="2" fill="#2a0f3f" />
          <rect x="20" y="32" width="20" height="10" fill="#fbf3e4" opacity="0.85" />
        </svg>
        <span className="rounded-sm bg-[#2b2522]/80 px-[1.4cqw] py-[0.3cqw] font-tally text-[2.8cqw] text-[var(--cream)] uppercase">
          {T.clerk[lang]}
        </span>
      </div>

      {/* A see-through ballot box, bottom left. */}
      <div className="pointer-events-none absolute bottom-[2%] left-[4%] h-[13%] w-[22%]">
        <div className="absolute inset-x-0 bottom-0 h-[78%] rounded-sm border-[0.6cqw] border-[#9fb3c2] bg-[#dfeaf2]/60" />
        <div className="absolute top-[18%] left-1/2 h-[0.8cqw] w-[50%] -translate-x-1/2 rounded-full bg-[#2b2522]" />
        {finale >= 2 && (
          <span className="ballot-drop absolute top-[-40%] left-[30%] h-[40%] w-[40%] bg-[#fdfaf2] shadow" />
        )}
      </div>

      {/* The brush dabbing ink onto the left index finger. */}
      {finale >= 1 && (
        <span
          className="brush-dab pointer-events-none absolute z-20 text-[9cqw]"
          style={tipOnStage(INK_FINGER_INDEX)}
          aria-hidden="true"
        >
          🖌️
        </span>
      )}

      {offer.wrong > 0 && !offer.inked && (
        <div className="absolute top-[47%] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-[1cqw]">
          <span
            key={`w-${offer.wrong}`}
            className="combo-pop rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] font-display text-[5cqw] font-bold whitespace-nowrap text-[var(--cream)] italic"
          >
            {T.wrong[lang]}
          </span>
          <span className="rounded-sm bg-[#fbf3e4]/90 px-[2cqw] py-[0.4cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--ink)] uppercase">
            👉 {T.tip[lang]}
          </span>
        </div>
      )}

      {finale >= 3 && (
        <>
          <div className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white" />
          <p className="combo-pop absolute top-[47%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.2cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
            ☝️ {T.voted[lang]}
          </p>
        </>
      )}
    </div>
  );
}
