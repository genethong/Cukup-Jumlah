import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { shutter, sizzle, tick, whoosh, wokClang } from "../../beat/wayangSounds";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  FRESH_WOK,
  SAFE_RPS,
  StirMeter,
  WOK_HEI_RPS,
  angleDelta,
  noodleColour,
  stepWok,
  wokVerdict,
  type Wok,
} from "./gorengRules";

const T = GAME_TEXT.goreng;
/** One bar more than the shell's default: cooking through takes a good four seconds. */
const EXTRA_BARS = 1;
const TICK_FROM_S = 2.5;
/** Arrow keys stir a sixth of a turn per press, for keyboards and testing. */
const KEY_TURN = Math.PI / 3;

// Wok geometry in the SVG's own units (viewBox 0 0 300 200).
const CX = 150;
const CY = 92;

type Strand = { d: string; colour: string; width: number };

/** Noodles and the bits fried with them, laid out once in a flat circle around the wok centre. */
function makeStrands(): Strand[] {
  const out: Strand[] = [];
  for (let i = 0; i < 16; i += 1) {
    const r = 18 + ((i * 29) % 90);
    const a = (i * 137.5 * Math.PI) / 180;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    const dx = Math.cos(a + 1.6) * 34;
    const dy = Math.sin(a + 1.6) * 34;
    out.push({
      d: `M${x - dx} ${y - dy} Q${x + dy * 0.5} ${y - dx * 0.5} ${x + dx} ${y + dy}`,
      colour: "noodle",
      width: 7,
    });
  }
  const bits: [string, number][] = [
    ["#f5efd8", 3], // taugeh
    ["#f5efd8", 3],
    ["#4f8a3a", 2.5], // kucai
    ["#4f8a3a", 2.5],
    ["#e8763a", 5], // udang
    ["#f2c94c", 6], // telur
  ];
  bits.forEach(([colour, width], i) => {
    const a = (i * 97 * Math.PI) / 180;
    const r = 30 + ((i * 41) % 70);
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    out.push({ d: `M${x - 9} ${y - 4} Q${x} ${y + 6} ${x + 9} ${y - 3}`, colour, width });
  });
  return out;
}

export function GorengKueyTeow({
  clock,
  lang,
  talent,
  bars,
  onLeadIn,
  onTimeLeft,
  onJudge,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onLeadIn, onTimeLeft, onJudge, onFinish });
  callbacks.current = { onLeadIn, onTimeLeft, onJudge, onFinish };
  const forgiving = talent === "mesra_rakyat";
  const [strands] = useState(makeStrands);

  const [live, setLive] = useState(false);
  const [wok, setWok] = useState<Wok>(FRESH_WOK);
  const [slow, setSlow] = useState(false);
  const [heat, setHeat] = useState(0);
  const [wokHei, setWokHei] = useState(0);
  const [flash, setFlash] = useState<{ side: "left" | "right"; n: number } | null>(null);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const wokRef = useRef<Wok>(FRESH_WOK);
  const meter = useRef(new StirMeter());
  const liveRef = useRef(false);
  const done = useRef(false);
  const noodles = useRef<SVGGElement>(null);
  const wokBox = useRef<HTMLDivElement>(null);
  const spin = useRef(0);
  const lastAngle = useRef<number | null>(null);
  const soundTurn = useRef(0);

  const finish = (success: boolean) => {
    if (done.current) return;
    done.current = true;
    clock.halt();
    setOutcome(success ? "won" : "lost");
    if (success) shutter(clock.ctx, clock.out, clock.ctx.currentTime);
    callbacks.current.onFinish(success);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  /** Turns the noodles by `delta` radians and plays the wok sounds as they go round. */
  const stir = (delta: number) => {
    if (!liveRef.current || done.current) return;
    const now = performance.now() / 1000;
    meter.current.add(now, delta);
    spin.current += delta;
    noodles.current?.setAttribute(
      "transform",
      `rotate(${(spin.current * 180) / Math.PI} ${CX} ${CY})`,
    );
    soundTurn.current += Math.abs(delta);
    if (soundTurn.current >= Math.PI / 2) {
      soundTurn.current = 0;
      const t = clock.ctx.currentTime;
      sizzle(clock.ctx, clock.out, t, 0.6 + Math.min(1, meter.current.rps(now) / 2));
      if (Math.random() < 0.5) wokClang(clock.ctx, clock.out, t);
    }
  };

  useEffect(() => {
    const limitS = (bars + EXTRA_BARS) * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);

    let raf = 0;
    let step = -1;
    let last = performance.now() / 1000;
    let nextTick = 0;
    let lastHei = -10;
    let lastFlash = 0;
    let warned = false;
    let slowSince: number | null = null;
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
        const speed = meter.current.rps(now);
        const w = stepWok(wokRef.current, dt, speed, forgiving);
        wokRef.current = w;
        setWok(w);
        setHeat(Math.min(1, speed / WOK_HEI_RPS));
        // Only nag after half a second of slow stirring, so a brief pause doesn't flicker it.
        slowSince = speed < SAFE_RPS ? (slowSince ?? now) : null;
        setSlow(slowSince !== null && now - slowSince > 0.5);

        if (speed >= WOK_HEI_RPS && now - lastHei > 1.4) {
          lastHei = now;
          setWokHei((n) => n + 1);
          whoosh(clock.ctx, clock.out, clock.ctx.currentTime);
          callbacks.current.onJudge("perfect");
        }
        // The press love a fast cook: the faster the stirring, the more the cameras flash.
        if (speed > 1 && now - lastFlash > 0.9 / speed && Math.random() < 0.35) {
          lastFlash = now;
          setFlash((f) => ({ side: Math.random() < 0.5 ? "left" : "right", n: (f?.n ?? 0) + 1 }));
          shutter(clock.ctx, clock.out, clock.ctx.currentTime);
        }
        if (!warned && w.burnt > 0.4) {
          warned = true;
          callbacks.current.onJudge("miss");
        } else if (warned && w.burnt < 0.2) {
          warned = false;
        }
        if (leftS <= TICK_FROM_S && clock.ctx.currentTime >= nextTick) {
          tick(clock.ctx, clock.out, clock.ctx.currentTime);
          nextTick = clock.ctx.currentTime + clock.spb / 2;
        }
        const v = wokVerdict(w, leftS <= 0);
        if (v !== "cooking") {
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
  }, [clock, bars, forgiving]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") stir(-KEY_TURN);
      else if (e.key === "ArrowRight") stir(KEY_TURN);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Angle of the finger around the wok's centre. */
  const angleOf = (e: PointerEvent<HTMLDivElement>) => {
    const box = wokBox.current?.getBoundingClientRect();
    if (!box) return 0;
    const cx = box.left + box.width * (CX / 300);
    const cy = box.top + box.height * (CY / 200);
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers can't be captured; stirring still works.
    }
    lastAngle.current = angleOf(e);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (lastAngle.current === null) return;
    const a = angleOf(e);
    stir(angleDelta(lastAngle.current, a));
    lastAngle.current = a;
  };
  const onUp = () => {
    lastAngle.current = null;
  };

  const nudge =
    live && !outcome ? (wok.burnt > 0.45 ? T.burning[lang] : slow ? T.faster[lang] : null) : null;

  return (
    <div
      className="absolute inset-0 z-10 touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Reporter side="left" flashing={flash?.side === "left" ? flash.n : 0} />
      <Reporter side="right" flashing={flash?.side === "right" ? flash.n : 0} />

      {/* Cooked meter: fills gold as the noodles brown. */}
      <div className="absolute bottom-[1.5%] left-1/2 z-20 flex w-[70%] -translate-x-1/2 items-center gap-[2cqw] rounded-full bg-[#fbf3e4]/85 px-[2.4cqw] py-[0.8cqw]">
        <span className="font-tally text-[3.2cqw] tracking-[0.1em] text-[var(--ink)] uppercase">
          {T.cooked[lang]}
        </span>
        <div className="relative h-[3cqw] flex-1 overflow-hidden rounded-full bg-[#5a3a1c]/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#d9a441,#b06e2e)]"
            style={{ width: `${wok.cooked * 100}%` }}
          />
        </div>
        <span className="w-[9cqw] text-right font-tally text-[4cqw] tabular-nums">
          {Math.round(wok.cooked * 100)}%
        </span>
      </div>

      {nudge && (
        <span
          key={nudge}
          className="combo-pop absolute top-[40%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] font-display text-[4.6cqw] font-bold whitespace-nowrap text-[var(--cream)] italic"
        >
          {nudge}
        </span>
      )}

      {wokHei > 0 && !outcome && (
        <span
          key={`hei-${wokHei}`}
          className="stamp-pop absolute top-[72%] left-1/2 z-20 font-display text-[11cqw] font-bold whitespace-nowrap text-[#e4572e] italic drop-shadow-[0_3px_0_#fff1c4]"
        >
          {T.wokHei[lang]}
        </span>
      )}

      {/* Smoke when the noodles catch. */}
      {wok.burnt > 0.25 && (
        <div className="pointer-events-none absolute top-[50%] left-1/2 h-[18%] w-[50%] -translate-x-1/2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="smoke-rise absolute bottom-0 h-[10cqw] w-[10cqw] rounded-full bg-[#4a4440]"
              style={{
                left: `${10 + i * 24}%`,
                animationDelay: `${i * 0.35}s`,
                opacity: Math.min(0.75, wok.burnt),
              }}
            />
          ))}
        </div>
      )}

      <div ref={wokBox} className="absolute bottom-[7%] left-[6%] aspect-[3/2] w-[88%]">
        <svg viewBox="0 0 300 200" className="h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <clipPath id="wok-inside">
              <ellipse cx={CX} cy={CY} rx="122" ry="40" />
            </clipPath>
            <radialGradient id="wok-iron" cx="50%" cy="20%" r="80%">
              <stop offset="0" stopColor="#4b413a" />
              <stop offset="1" stopColor="#161210" />
            </radialGradient>
            <radialGradient id="wok-flame" cx="50%" cy="100%" r="70%">
              <stop offset="0" stopColor="#fff1c4" />
              <stop offset="0.45" stopColor="#ffb347" />
              <stop offset="1" stopColor="#e4572e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Flame under the wok: grows with stirring speed. */}
          <g
            className="pelita-flame"
            style={{ transformOrigin: "150px 196px", transform: `scale(${0.7 + heat * 0.7})` }}
          >
            <ellipse
              cx="150"
              cy="168"
              rx={70 + heat * 30}
              ry={26 + heat * 22}
              fill="url(#wok-flame)"
            />
          </g>

          {/* Handles. */}
          <path
            d="M14 84 Q2 80 4 92 Q8 100 26 96"
            fill="none"
            stroke="#2a1d15"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M286 84 Q298 80 296 92 Q292 100 274 96"
            fill="none"
            stroke="#2a1d15"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* The iron bowl, then the food seen from above at a slant. */}
          <path
            d="M24 90 Q150 220 276 90 Z"
            fill="url(#wok-iron)"
            stroke="#0e0b09"
            strokeWidth="3"
          />
          <ellipse
            cx={CX}
            cy={CY}
            rx="126"
            ry="42"
            fill="#231c18"
            stroke="#6b5d52"
            strokeWidth="3"
          />
          <g clipPath="url(#wok-inside)">
            <g transform={`translate(0 ${CY}) scale(1 0.33) translate(0 ${-CY})`}>
              <g ref={noodles}>
                {strands.map((s, i) => (
                  <path
                    key={i}
                    d={s.d}
                    fill="none"
                    stroke={s.colour === "noodle" ? noodleColour(wok) : s.colour}
                    strokeWidth={s.width * 2.4}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            </g>
          </g>
          <ellipse
            cx={CX}
            cy={CY}
            rx="126"
            ry="42"
            fill="none"
            stroke="#e4572e"
            strokeWidth="4"
            opacity={wok.burnt * 0.8}
          />
        </svg>
      </div>

      {outcome === "won" && (
        <div className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white" />
      )}
      {outcome && (
        <p
          className={`absolute top-[64%] left-1/2 z-20 -translate-x-1/2 rounded-sm px-[3cqw] py-[1.2cqw] text-center font-display text-[4.6cqw] font-bold whitespace-nowrap italic shadow-[0_4px_8px_rgba(40,14,6,0.3)] ${
            outcome === "won"
              ? "bg-[#efe1c3] text-[var(--ink)]"
              : "bg-[#2b2522] text-[var(--cream)]"
          }`}
        >
          {outcome === "won" ? `📸 ${T.done[lang]}` : `💨 ${T.burnt[lang]}`}
        </p>
      )}
    </div>
  );
}

/** A reporter cast as a shadow on the kelir, camera up; flashes when the cook gets exciting. */
function Reporter({ side, flashing }: { side: "left" | "right"; flashing: number }) {
  return (
    <div
      className={`pointer-events-none absolute top-[44%] h-[22%] w-[20%] ${
        side === "left" ? "left-[1%]" : "right-[1%] -scale-x-100"
      }`}
    >
      <svg viewBox="0 0 60 100" className="bayang h-full w-full" aria-hidden="true">
        <circle cx="24" cy="18" r="11" fill="#000" />
        <path d="M10 34 Q24 26 38 34 L42 96 L6 96 Z" fill="#000" />
        <path d="M34 40 L50 32" stroke="#000" strokeWidth="7" strokeLinecap="round" />
        <rect x="44" y="22" width="15" height="12" rx="2" fill="#000" />
        <rect x="18" y="96" width="4" height="4" fill="#000" />
      </svg>
      {flashing > 0 && (
        <span
          key={flashing}
          className="camera-flash absolute top-[22%] right-[-8%] h-[40%] w-[60%] rounded-full bg-[radial-gradient(circle,#ffffff,#fff6cf_35%,transparent_70%)]"
        />
      )}
    </div>
  );
}
