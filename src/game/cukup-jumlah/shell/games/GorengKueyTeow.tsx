import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { gendangHit, gendangMiss, shutter, sizzle, tick, wokClang } from "../../beat/wayangSounds";
import type { PuppetConfig } from "../../puppet/loadRig";
import { PuppetAvatar } from "../../puppet/PuppetAvatar";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT, type Lang } from "../strings";
import {
  AIM_SECONDS,
  FRESH_SHOOT,
  flashTimes,
  judgeFlash,
  photosNeeded,
  shootVerdict,
  stepCook,
  type Shoot,
} from "./gorengRules";

const T = GAME_TEXT.goreng;
/** Two bars more than the shell's default, for four camera flashes. */
const EXTRA_BARS = 2;
const TICK_FROM_S = 2.5;

/** The stall's real cook, cast as a shadow on the kelir. */
const HAWKER: PuppetConfig = {
  gender: "m",
  tone: "tone_5",
  faceShape: "round",
  hair: "crew",
  headwear: "baseball_cap_red",
  outfit: "tshirt",
  lower: "jeans",
  footwear: "selipar",
};

/** Cameras pop up facing the YB: from the left wing, or from the middle of the crowd. */
type Camera = { index: number; side: "left" | "middle"; count: number };
type Shot = { good: boolean; n: number };

export function GorengKueyTeow({
  clock,
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
  const forgiving = talent === "mesra_rakyat";
  const limitS = (bars + EXTRA_BARS) * BEATS_PER_BAR * clock.spb;
  const [flashes] = useState(() => flashTimes(limitS));
  const needed = photosNeeded(forgiving, flashes.length);

  const [live, setLive] = useState(false);
  const [holding, setHolding] = useState(false);
  const [shoot, setShoot] = useState<Shoot>(FRESH_SHOOT);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [hogging, setHogging] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const shootRef = useRef<Shoot>(FRESH_SHOOT);
  const liveRef = useRef(false);
  const done = useRef(false);
  /** When the YB grabbed the senduk (performance.now ms), or null when not holding. */
  const holdSince = useRef<number | null>(null);

  const finish = (success: boolean) => {
    if (done.current) return;
    done.current = true;
    clock.halt();
    setOutcome(success ? "won" : "lost");
    callbacks.current.onPuppet?.(null);
    callbacks.current.onFinish(success);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const grab = () => {
    if (!liveRef.current || done.current || holdSince.current !== null) return;
    holdSince.current = performance.now();
    setHolding(true);
    wokClang(clock.ctx, clock.out, clock.ctx.currentTime);
    callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "big_laugh" });
  };
  const release = () => {
    if (holdSince.current === null) return;
    holdSince.current = null;
    setHolding(false);
    callbacks.current.onPuppet?.(null);
  };

  useEffect(() => {
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let last = performance.now() / 1000;
    let nextTick = 0;
    let nextSizzle = 0;
    let fired = 0;
    let lastCount = -1;
    const frame = () => {
      if (done.current) return;
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const now = performance.now() / 1000;
      const dt = Math.min(0.1, now - last);
      last = now;
      const heardBeats = (clock.heardTime() - clock.start) / clock.spb;
      const nextStep = leadInStep(heardBeats);
      if (nextStep !== step) {
        step = nextStep;
        callbacks.current.onLeadIn?.(step);
      }
      const playS = (heardBeats - LEAD_IN_BEATS) * clock.spb;
      if (playS >= 0 && !liveRef.current) {
        liveRef.current = true;
        setLive(true);
      }
      const leftS = limitS - Math.max(0, playS);
      callbacks.current.onTimeLeft?.(leftS / limitS, Math.max(0, leftS));

      if (liveRef.current) {
        const isHolding = holdSince.current !== null;
        const t = clock.ctx.currentTime;
        let s = stepCook(shootRef.current, dt, isHolding);
        if (!isHolding && s.cooked < 1 && t >= nextSizzle) {
          sizzle(clock.ctx, clock.out, t, 0.8);
          nextSizzle = t + 0.45;
        }

        // The next camera: up and counting down for AIM_SECONDS, then the flash.
        const flashAt = flashes[fired];
        if (flashAt !== undefined) {
          const until = flashAt - playS;
          const side = fired % 2 ? "middle" : "left";
          if (until <= AIM_SECONDS && until > 0) {
            const count = Math.min(3, Math.ceil((until / AIM_SECONDS) * 3));
            if (count !== lastCount) {
              lastCount = count;
              tick(clock.ctx, clock.out, t);
              setCamera({ index: fired, side, count });
            }
          } else if (until <= 0) {
            const posingFor =
              holdSince.current === null ? null : (performance.now() - holdSince.current) / 1000;
            const result = judgeFlash(s, posingFor);
            s = result.shoot;
            shutter(clock.ctx, clock.out, t);
            if (result.good) gendangHit(clock.ctx, clock.out, t + 0.06, true);
            else gendangMiss(clock.ctx, clock.out, t + 0.06);
            callbacks.current.onJudge(result.good ? "perfect" : "miss");
            setShot((p) => ({ good: result.good, n: (p?.n ?? 0) + 1 }));
            setCamera({ index: fired, side, count: 0 });
            fired += 1;
            lastCount = -1;
          }
        }

        // Hogging: holding the senduk with no camera coming up.
        const nextFlash = flashes[fired];
        setHogging(
          isHolding &&
            (performance.now() - (holdSince.current ?? 0)) / 1000 > 0.8 &&
            (nextFlash === undefined || nextFlash - playS > AIM_SECONDS),
        );

        shootRef.current = s;
        setShoot(s);
        if (leftS <= TICK_FROM_S && t >= nextTick) {
          tick(clock.ctx, clock.out, t);
          nextTick = t + clock.spb / 2;
        }
        const v = shootVerdict(s, flashes.length, needed, leftS <= 0);
        if (v !== "shooting") {
          finishRef.current(v === "won");
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, limitS, flashes, needed]);

  // Keyboard: hold Space to pose.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      grab();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") release();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers can't be captured; holding still works.
    }
    grab();
  };

  const cooking = live && !holding && !outcome && shoot.cooked < 1;

  return (
    <div
      className="absolute inset-0 z-10 touch-none select-none"
      onPointerDown={onDown}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {/* Scoreboard: the hawker's cooking and the photos so far. */}
      <div className="absolute top-[39%] left-1/2 flex w-[86%] -translate-x-1/2 items-center gap-[2cqw] rounded-full bg-[#fbf3e4]/90 text-[var(--ink)] px-[2.6cqw] py-[1cqw] shadow-[0_3px_6px_rgba(40,14,6,0.25)]">
        <span className="font-tally text-[3cqw] tracking-[0.08em] uppercase">{T.cook[lang]}</span>
        <div className="relative h-[2.8cqw] flex-1 overflow-hidden rounded-full bg-[#5a3a1c]/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#d9a441,#b06e2e)]"
            style={{ width: `${shoot.cooked * 100}%` }}
          />
        </div>
        <span className="font-tally text-[3cqw] tracking-[0.08em] uppercase">{T.photos[lang]}</span>
        <span className="flex gap-[0.6cqw] text-[4cqw]" aria-label={`${shoot.photos}/${needed}`}>
          {Array.from({ length: needed }, (_, i) => (
            <span key={i} className={i < shoot.photos ? "" : "opacity-25 grayscale"}>
              📸
            </span>
          ))}
        </span>
      </div>

      {/* The camera that's about to go off, with its countdown. */}
      {camera && !outcome && (
        <PressCamera key={camera.index} side={camera.side} count={camera.count} lang={lang} />
      )}

      {/* The real cook, in shadow: stirs whenever the YB lets go of the wok. */}
      <div className="pointer-events-none absolute right-0 bottom-[3%] h-[36%] w-[40%]">
        <div className="bayang relative h-full w-full">
          <PuppetAvatar config={HAWKER} anim={cooking ? "rod-wiggle" : "idle"} />
        </div>
        <span className="absolute -top-[1cqw] right-[10%] rounded-sm bg-[#2b2522]/80 px-[1.4cqw] py-[0.3cqw] font-tally text-[2.6cqw] text-[var(--cream)] uppercase">
          {T.hawker[lang]}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-[2%] left-[22%] aspect-[3/2] w-[56%]">
        <Wok holding={holding} cooking={cooking} cooked={shoot.cooked} />
      </div>

      {hogging && !outcome && (
        <span className="combo-pop absolute top-[56%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] font-display text-[4.8cqw] font-bold whitespace-nowrap text-[var(--cream)] italic">
          {T.hogging[lang]}
        </span>
      )}

      {shot && !outcome && (
        <div
          key={`shot-${shot.n}`}
          className="stamp-pop absolute top-[53%] left-1/2 z-20 w-[46%] rounded-[2px] bg-white p-[1.6cqw] pb-[3cqw] text-center shadow-[0_8px_14px_rgba(40,14,6,0.45)]"
        >
          <div
            className={`flex aspect-[4/3] items-center justify-center text-[12cqw] ${
              shot.good ? "bg-[#f6e3b4]" : "bg-[#cfc6b8]"
            }`}
          >
            {shot.good ? "😁🥢" : "🥱📱"}
          </div>
          <p className="mt-[1cqw] font-display text-[3.6cqw] font-bold text-[var(--ink)] italic">
            {shot.good ? T.good[lang] : T.bad[lang]}
          </p>
        </div>
      )}

      {outcome === "won" && (
        <>
          <div className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white" />
          <p className="absolute top-[56%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.2cqw] text-center font-display text-[4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
            📸 {T.done[lang]}
          </p>
        </>
      )}
    </div>
  );
}

/** A reporter in the wings with a camera up, counting down to the flash. */
function PressCamera({ side, count, lang }: { side: Camera["side"]; count: number; lang: Lang }) {
  return (
    <div
      className={`pointer-events-none absolute top-[45%] h-[21%] w-[25%] ${
        side === "left" ? "left-[1%]" : "left-[34%]"
      }`}
    >
      <svg viewBox="0 0 60 100" className="bayang h-full w-full -scale-x-100" aria-hidden="true">
        <circle cx="22" cy="18" r="11" fill="#000" />
        <path d="M8 34 Q22 26 36 34 L40 96 L4 96 Z" fill="#000" />
        <path d="M32 40 L48 30" stroke="#000" strokeWidth="7" strokeLinecap="round" />
        <rect x="42" y="18" width="17" height="14" rx="2" fill="#000" />
      </svg>
      {count > 0 ? (
        <span
          key={count}
          className="count-pop absolute top-[18%] left-1/2 flex h-[13cqw] w-[13cqw] items-center justify-center rounded-full border-[0.8cqw] border-[var(--sambal)] bg-[#fbf3e4] font-display text-[8cqw] font-bold text-[var(--sambal)]"
        >
          {count}
        </span>
      ) : (
        <span className="camera-flash absolute top-[5%] left-[20%] h-[50%] w-[80%] rounded-full bg-[radial-gradient(circle,#ffffff,#fff6cf_35%,transparent_70%)]" />
      )}
      <span
        className={`absolute -bottom-[2cqw] left-1/2 -translate-x-1/2 font-display text-[4cqw] font-bold whitespace-nowrap text-[var(--sambal)] italic ${
          count > 0 ? "" : "opacity-0"
        }`}
      >
        {T.pose[lang]}
      </span>
    </div>
  );
}

/** The wok, with the senduk on whichever side is stirring it. */
function Wok({ holding, cooking, cooked }: { holding: boolean; cooking: boolean; cooked: number }) {
  const noodle = `rgb(${Math.round(232 - cooked * 70)},${Math.round(214 - cooked * 100)},${Math.round(170 - cooked * 120)})`;
  return (
    <svg viewBox="0 0 300 200" className="h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <radialGradient id="pose-iron" cx="50%" cy="20%" r="80%">
          <stop offset="0" stopColor="#4b413a" />
          <stop offset="1" stopColor="#161210" />
        </radialGradient>
        <radialGradient id="pose-flame" cx="50%" cy="100%" r="70%">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="0.45" stopColor="#ffb347" />
          <stop offset="1" stopColor="#e4572e" stopOpacity="0" />
        </radialGradient>
        <clipPath id="pose-inside">
          <ellipse cx="150" cy="92" rx="122" ry="40" />
        </clipPath>
      </defs>
      <ellipse className="pelita-flame" cx="150" cy="170" rx="80" ry="34" fill="url(#pose-flame)" />
      <path d="M24 90 Q150 220 276 90 Z" fill="url(#pose-iron)" stroke="#0e0b09" strokeWidth="3" />
      <ellipse cx="150" cy="92" rx="126" ry="42" fill="#231c18" stroke="#6b5d52" strokeWidth="3" />
      <g clipPath="url(#pose-inside)">
        {Array.from({ length: 11 }, (_, i) => {
          const x = 55 + i * 19;
          const y = 78 + ((i * 7) % 26);
          return (
            <path
              key={i}
              d={`M${x - 22} ${y} Q${x} ${y - 10} ${x + 22} ${y + 4}`}
              fill="none"
              stroke={noodle}
              strokeWidth="9"
              strokeLinecap="round"
            />
          );
        })}
        {[
          [90, 88],
          [160, 100],
          [200, 80],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x! - 8} ${y} q8 -10 16 0 q-6 6 -12 4`}
            fill="#f08a4b"
            stroke="#c4552a"
            strokeWidth="1.5"
          />
        ))}
      </g>
      {/* The senduk: on the YB's side while posing, the cook's side otherwise. */}
      <g
        className={holding || cooking ? "senduk-stir" : undefined}
        style={{ transformOrigin: holding ? "70px 90px" : "230px 90px" }}
      >
        {holding ? (
          <path d="M70 92 L22 20" stroke="#8a6a3a" strokeWidth="7" strokeLinecap="round" />
        ) : (
          <path d="M230 92 L278 20" stroke="#8a6a3a" strokeWidth="7" strokeLinecap="round" />
        )}
        <ellipse
          cx={holding ? 74 : 226}
          cy="94"
          rx="14"
          ry="7"
          fill="#9aa0a6"
          stroke="#5f656b"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
