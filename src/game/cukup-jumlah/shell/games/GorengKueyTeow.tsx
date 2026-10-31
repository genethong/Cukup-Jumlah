import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { gendangHit, gendangMiss, shutter, sizzle, tick, wokClang } from "../../beat/wayangSounds";
import type { Candidate } from "../../creator/candidate";
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

/** The stall's real cook: red cap, T-shirt, selipar. */
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

/** Press photographers push in from the front corners of the stall. */
type Camera = { index: number; side: "left" | "right"; count: number };
type Shot = { good: boolean; n: number };

export function GorengKueyTeow({
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

        // The next camera: raised and counting down for AIM_SECONDS, then the flash.
        const flashAt = flashes[fired];
        if (flashAt !== undefined) {
          const until = flashAt - playS;
          const side = fired % 2 ? "right" : "left";
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

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers can't be captured; holding still works.
    }
    grab();
  };

  const cooking = live && !holding && !outcome && shoot.cooked < 1;
  const cameraReady = camera !== null && camera.count > 0 && !outcome;

  return (
    <div className="absolute inset-0 z-10 select-none">
      {/* Scoreboard: the hawker's cooking and the photos so far. */}
      <div className="absolute top-[39%] left-1/2 flex w-[86%] -translate-x-1/2 items-center gap-[2cqw] rounded-full bg-[#fbf3e4]/90 px-[2.6cqw] py-[1cqw] text-[var(--ink)] shadow-[0_3px_6px_rgba(40,14,6,0.25)]">
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

      <StallBack lang={lang} />

      {/* The real cook, working the wok whenever the YB lets go of it. */}
      <div className="pointer-events-none absolute right-[1%] bottom-[9%] h-[36%] w-[38%]">
        <PuppetAvatar
          config={HAWKER}
          anim={cooking ? "rod-wiggle" : "idle"}
          label={T.hawker[lang]}
        />
      </div>

      <div className="pointer-events-none absolute bottom-[19%] left-[27%] aspect-[3/2] w-[46%]">
        <Wok holding={holding} cooking={cooking} cooked={shoot.cooked} />
      </div>

      <StallFront />

      {/* The big senduk handle: press and hold to grab it and pose. */}
      <button
        type="button"
        onPointerDown={onDown}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        disabled={!live || outcome !== null}
        aria-pressed={holding}
        className={`absolute bottom-[3%] left-1/2 z-20 flex h-[12%] w-[44%] -translate-x-1/2 touch-none items-center justify-center gap-[2cqw] rounded-full border-[1cqw] font-display text-[6cqw] font-bold italic shadow-[0_6px_0_rgba(40,14,6,0.5)] transition-transform ${
          holding
            ? "translate-y-[0.8cqw] border-[var(--brass)] bg-[var(--sambal)] text-[var(--cream)] shadow-[0_2px_0_rgba(40,14,6,0.5)]"
            : cameraReady
              ? "hold-glow border-[var(--sambal)] bg-[#fff1c4] text-[var(--sambal)]"
              : "border-[#8a6a3a] bg-[#efe1c3] text-[#6a4a32]"
        }`}
      >
        <SendukIcon />
        {cameraReady || holding ? T.holdNow[lang] : T.hold[lang]}
      </button>

      {/* The press scrum: a photographer pushes in, camera up, counting down to the flash. */}
      {camera && !outcome && (
        <Photographer key={camera.index} side={camera.side} count={camera.count} lang={lang} />
      )}

      {hogging && !outcome && (
        <span className="combo-pop absolute top-[49%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] font-display text-[4.8cqw] font-bold whitespace-nowrap text-[var(--cream)] italic">
          {T.hogging[lang]}
        </span>
      )}

      {shot && !outcome && (
        <FrontPage key={`shot-${shot.n}`} good={shot.good} candidate={candidate} lang={lang} />
      )}

      {outcome === "won" && (
        <>
          <div className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white" />
          <p className="absolute top-[50%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.2cqw] text-center font-display text-[4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
            📸 {T.done[lang]}
          </p>
        </>
      )}
    </div>
  );
}

/** The back of the stall: a striped awning and the signboard. */
function StallBack({ lang }: { lang: Lang }) {
  return (
    <div className="pointer-events-none absolute top-[45%] left-[3%] w-[94%]">
      <div className="relative rounded-t-sm bg-[#7a3b1e] px-[3cqw] pt-[1.2cqw] pb-[1.4cqw] text-center shadow-[0_4px_6px_rgba(40,14,6,0.35)]">
        <span className="font-display text-[6.4cqw] leading-none font-bold tracking-wide text-[#fbf3e4]">
          {T.sign[lang]}
        </span>
      </div>
      {/* Awning scallops in red and cream. */}
      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        className="block h-[4cqw] w-full"
        aria-hidden="true"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 10} 0 h10 v3 a5 3 0 0 1 -10 0 z`}
            fill={i % 2 ? "#fbf3e4" : "#b2332a"}
          />
        ))}
      </svg>
    </div>
  );
}

/** The front of the stall: a wooden counter hiding the cooks' legs, with plates waiting. */
function StallFront() {
  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-[21%]">
      <div className="absolute inset-x-0 top-0 h-[12%] bg-[#c4a27a] shadow-[0_-2px_0_#e2c9a2]" />
      <div className="absolute inset-x-0 top-[12%] bottom-0 bg-[repeating-linear-gradient(90deg,#8a5a34_0_9%,#7b4e2c_9%_10%)]" />
      {/* Plates of finished noodles stacked at the corner. */}
      <div className="absolute -top-[22%] right-[6%] flex gap-[1cqw]">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="block h-[4cqw] w-[11cqw] rounded-[50%] border-[0.6cqw] border-[#e9eef2] bg-[#b06e2e]"
          />
        ))}
      </div>
    </div>
  );
}

/** A press photographer seen from behind, camera raised at the YB. */
function Photographer({ side, count, lang }: { side: Camera["side"]; count: number; lang: Lang }) {
  return (
    <div
      className={`press-in pointer-events-none absolute -bottom-[3%] z-20 h-[23%] w-[28%] ${
        side === "left" ? "-left-[5%]" : "-right-[5%]"
      }`}
    >
      <svg
        viewBox="0 0 80 100"
        className={`h-full w-full drop-shadow-[0_6px_8px_rgba(20,10,4,0.45)] ${
          side === "right" ? "-scale-x-100" : ""
        }`}
        aria-hidden="true"
      >
        {/* Shoulders and the back of the head. */}
        <path d="M2 100 Q4 70 26 64 L52 64 Q74 70 76 100 Z" fill="#24324a" />
        <circle cx="38" cy="50" r="15" fill="#1c140f" />
        {/* Arms up, holding the camera. */}
        <path d="M18 70 L34 30" stroke="#24324a" strokeWidth="10" strokeLinecap="round" />
        <path d="M58 70 L56 34" stroke="#24324a" strokeWidth="10" strokeLinecap="round" />
        {/* Camera body, lens and flash. */}
        <rect x="28" y="16" width="34" height="22" rx="3" fill="#2a2a2e" />
        <rect x="36" y="10" width="12" height="7" rx="1.5" fill="#3a3a40" />
        <circle cx="54" cy="27" r="9" fill="#111" stroke="#55555c" strokeWidth="2" />
        <circle cx="54" cy="27" r="4" fill="#3d5a80" />
        <rect x="30" y="4" width="10" height="7" rx="1" fill="#e9eef2" />
        <circle cx="66" cy="18" r="2.4" fill={count > 0 ? "#e4572e" : "#555"} />
      </svg>
      {count > 0 ? (
        <span
          key={count}
          className="count-pop absolute -top-[22%] left-[62%] flex h-[11cqw] w-[11cqw] items-center justify-center rounded-full border-[0.8cqw] border-[var(--sambal)] bg-[#fbf3e4] font-display text-[7cqw] font-bold text-[var(--sambal)]"
        >
          {count}
        </span>
      ) : (
        <span className="camera-flash absolute -top-[20%] left-[10%] h-[70%] w-[90%] rounded-full bg-[radial-gradient(circle,#ffffff,#fff6cf_35%,transparent_70%)]" />
      )}
      {count > 0 && (
        <span
          className={`absolute -top-[40%] font-display text-[4.4cqw] font-bold whitespace-nowrap text-[var(--sambal)] italic drop-shadow-[0_2px_0_#fbf3e4] ${
            side === "left" ? "left-[38%]" : "right-[38%]"
          }`}
        >
          {T.pose[lang]}
        </span>
      )}
    </div>
  );
}

/** The photo as it runs in the paper: a proud headline, or an embarrassing one. */
function FrontPage({ good, candidate, lang }: { good: boolean; candidate: Candidate; lang: Lang }) {
  const face: PuppetConfig = {
    ...candidate.puppet,
    expression: good ? "big_laugh" : "nervous_smile",
  };
  return (
    <div className="stamp-pop absolute top-[57%] left-1/2 z-30 w-[64%] bg-[#f4efe4] p-[2cqw] text-[var(--ink)] shadow-[0_10px_18px_rgba(40,14,6,0.5)]">
      <div className="border-b-[0.6cqw] border-[var(--ink)] pb-[0.6cqw] text-center">
        <span className="font-display text-[4.6cqw] leading-none font-bold">{T.paper[lang]}</span>
      </div>
      <p className="mt-[1cqw] font-display text-[4.4cqw] leading-[1.05] font-bold">
        {good ? T.headlineGood[lang] : T.headlineBad[lang]}
      </p>
      <div
        className={`relative mt-[1.2cqw] h-[24cqw] overflow-hidden ${good ? "bg-[#e8d9b8]" : "bg-[#cfc8bc] grayscale-[0.4]"}`}
      >
        <div className="absolute top-[4%] left-[18%] h-[190%] w-[64%]">
          <PuppetAvatar config={face} anim="idle" />
        </div>
        <span className="absolute right-[4%] bottom-[4%] text-[9cqw]">{good ? "🥢" : "📱"}</span>
      </div>
    </div>
  );
}

function SendukIcon() {
  return (
    <svg viewBox="0 0 40 24" className="h-[6cqw] w-auto" aria-hidden="true">
      <path d="M2 20 L26 8" stroke="#8a6a3a" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="31" cy="7" rx="8" ry="5" fill="#9aa0a6" stroke="#5f656b" strokeWidth="1.5" />
    </svg>
  );
}

/** The wok on the burner, with the senduk on whichever side is stirring it. */
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
