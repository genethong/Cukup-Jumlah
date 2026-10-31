import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { gendangMiss, shutter, sizzle, tick, whoosh, wokClang } from "../../beat/wayangSounds";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  FRESH_WOK,
  RECIPE,
  TOSSES_NEEDED,
  TOSS_FROM,
  addIngredient,
  doneShare,
  heatUp,
  noodleColour,
  penaltySeconds,
  shuffledBowls,
  toss,
  wokVerdict,
  type Ingredient,
  type Wok,
} from "./gorengRules";

const T = GAME_TEXT.goreng;
/** Two bars more than the shell's default: six ingredients and four tosses take a while. */
const EXTRA_BARS = 2;
const TICK_FROM_S = 2.5;
/** A flick this far up (share of the stage's height) tosses the wok. */
const FLICK_SHARE = 0.06;

const ICON: Record<Ingredient, string> = {
  minyak: "🧄",
  udang: "🦐",
  kueyteow: "🍜",
  kicap: "🍶",
  telur: "🥚",
  taugeh: "🌱",
};

// Wok geometry in the SVG's own units (viewBox 0 0 300 200).
const CX = 150;
const CY = 92;

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Vibration is only a nicety.
  }
}

type Drag = { ing: Ingredient; x: number; y: number; startX: number; startY: number };
type Pop = { text: string; tone: "bad" | "hei"; n: number };

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
  const freeMistakes = forgiving ? 1 : 0;
  const helper = talent === "pakar_kira";
  const [bowls] = useState(() => shuffledBowls());

  const [live, setLive] = useState(false);
  const [wok, setWok] = useState<Wok>(FRESH_WOK);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [tossN, setTossN] = useState(0);
  const [pop, setPop] = useState<Pop | null>(null);
  const [flash, setFlash] = useState<{ side: "left" | "right"; n: number } | null>(null);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const wokRef = useRef<Wok>(FRESH_WOK);
  const liveRef = useRef(false);
  const done = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const wokBox = useRef<HTMLDivElement>(null);
  const flick = useRef<{ y: number; fired: boolean } | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const say = (text: string, tone: Pop["tone"]) =>
    setPop((p) => ({ text, tone, n: (p?.n ?? 0) + 1 }));
  const cameras = () => {
    setFlash((f) => ({ side: Math.random() < 0.5 ? "left" : "right", n: (f?.n ?? 0) + 1 }));
    shutter(clock.ctx, clock.out, clock.ctx.currentTime);
  };

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

  const commit = (next: Wok) => {
    wokRef.current = next;
    setWok(next);
    const v = wokVerdict(next, false);
    if (v !== "cooking") finish(v === "won");
  };

  const putIn = (ing: Ingredient) => {
    if (!liveRef.current || done.current) return;
    const { wok: next, correct } = addIngredient(wokRef.current, ing);
    const t = clock.ctx.currentTime;
    if (!correct) {
      gendangMiss(clock.ctx, clock.out, t);
      buzz(60);
      say(
        next.mistakes <= freeMistakes ? T.wrong[lang] : `${T.wrong[lang]} ${T.penalty[lang]}`,
        "bad",
      );
      callbacks.current.onJudge("miss");
    } else {
      sizzle(clock.ctx, clock.out, t, ing === "minyak" || ing === "kueyteow" ? 1.6 : 1);
      buzz(12);
      callbacks.current.onJudge("good");
    }
    commit(next);
  };

  const tossWok = () => {
    if (!liveRef.current || done.current) return;
    const { wok: next, result } = toss(wokRef.current);
    const t = clock.ctx.currentTime;
    setTossN((n) => n + 1);
    wokClang(clock.ctx, clock.out, t);
    if (result === "early") say(T.early[lang], "bad");
    if (result === "good" || result === "wokHei") {
      whoosh(clock.ctx, clock.out, t);
      sizzle(clock.ctx, clock.out, t + 0.12, 1.4);
      buzz(20);
      cameras();
      callbacks.current.onJudge(result === "wokHei" ? "perfect" : "good");
      if (result === "wokHei") say(T.wokHei[lang], "hei");
    }
    commit(next);
  };

  // Music, the fuse and the heat. Bar 0 is the dalang's call.
  useEffect(() => {
    const limitS = (bars + EXTRA_BARS) * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let last = performance.now() / 1000;
    let nextTick = 0;
    let warned = false;
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
      const leftS =
        limitS - Math.max(0, playS) - penaltySeconds(wokRef.current.mistakes, freeMistakes);
      callbacks.current.onTimeLeft?.(leftS / limitS, Math.max(0, leftS));

      if (liveRef.current) {
        const w = heatUp(wokRef.current, dt, forgiving);
        wokRef.current = w;
        setWok(w);
        if (!warned && w.heat > 0.8) {
          warned = true;
          callbacks.current.onJudge("miss");
        } else if (w.heat < 0.5) warned = false;
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
  }, [clock, bars, forgiving, freeMistakes]);

  // Keyboard: 1–6 picks a bowl, arrow up tosses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") tossWok();
      else if (/^[1-6]$/.test(e.key)) putIn(bowls[Number(e.key) - 1]!);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Dragging a bowl: follow the finger and drop it in the wok, or just tap it.
  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = { ...d, x: e.clientX, y: e.clientY };
      setDrag(dragRef.current);
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d || e.type === "pointercancel") return;
      const tapped = Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 10;
      const box = wokBox.current?.getBoundingClientRect();
      const overWok =
        !!box &&
        e.clientX > box.left - 20 &&
        e.clientX < box.right + 20 &&
        e.clientY > box.top - 40 &&
        e.clientY < box.bottom;
      if (tapped || overWok) putIn(d.ing);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // Only re-bind when a drag starts or ends; putIn reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const grab = (ing: Ingredient) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!liveRef.current || done.current) return;
    dragRef.current = { ing, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
    setDrag(dragRef.current);
  };

  // Flicking up anywhere off the bowls tosses the wok.
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    flick.current = { y: e.clientY, fired: false };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const f = flick.current;
    if (!f || f.fired) return;
    const h = root.current?.offsetHeight ?? 600;
    if (f.y - e.clientY > h * FLICK_SHARE) {
      f.fired = true;
      tossWok();
    }
  };
  const onUp = () => {
    flick.current = null;
  };

  const next = RECIPE[wok.added];
  const share = doneShare(wok);

  return (
    <div
      ref={root}
      className="absolute inset-0 z-10 touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* The recipe, in order, ticking off as each goes in. */}
      <ol
        className="absolute top-[38.5%] left-1/2 flex -translate-x-1/2 items-center gap-[1cqw] rounded-full bg-[#fbf3e4]/90 px-[2cqw] py-[0.8cqw] shadow-[0_3px_6px_rgba(40,14,6,0.25)]"
        aria-label={T.recipe[lang]}
      >
        {RECIPE.map((ing, i) => (
          <li
            key={ing}
            className={`relative flex h-[8cqw] w-[8cqw] items-center justify-center rounded-full text-[5cqw] ${
              i < wok.added
                ? "bg-[#c9e3b4] opacity-60"
                : i === wok.added
                  ? "bg-[var(--brass)] ring-2 ring-[var(--sambal)]"
                  : "bg-[#efe1c3]"
            }`}
            aria-label={T[ing][lang]}
          >
            {ICON[ing]}
            {i < wok.added && (
              <span className="absolute -right-[0.5cqw] -bottom-[0.5cqw] text-[3.4cqw]">✅</span>
            )}
          </li>
        ))}
      </ol>

      {/* The bowls, shuffled, in two columns either side of the stall. */}
      {bowls.map((ing, i) => {
        const row = i % 3;
        const isNext = helper && ing === next;
        const used = RECIPE.indexOf(ing) < wok.added;
        return (
          <button
            key={ing}
            type="button"
            onPointerDown={grab(ing)}
            disabled={used || !live || outcome !== null}
            aria-label={T[ing][lang]}
            className={`absolute flex w-[17%] flex-col items-center pt-[1cqw] transition-opacity ${
              i < 3 ? "left-[1.5%]" : "right-[1.5%]"
            } ${used ? "opacity-25" : ""} ${isNext ? "animate-pulse" : ""}`}
            style={{ top: `${45 + row * 9}%` }}
          >
            <span
              className={`flex h-[14cqw] w-[14cqw] items-center justify-center rounded-full border-[0.8cqw] bg-[#fdfaf2] text-[8cqw] shadow-[0_4px_6px_rgba(40,14,6,0.35)] ${
                isNext ? "border-[var(--sambal)]" : "border-[#c9a874]"
              }`}
            >
              {ICON[ing]}
            </span>
            <span className="mt-[0.4cqw] w-full truncate text-center font-tally text-[2.4cqw] leading-tight text-[var(--ink)] uppercase">
              {T[ing][lang]}
            </span>
          </button>
        );
      })}

      {/* Smoke once the wok gets hot: the cue to toss. */}
      {wok.heat > 0.4 && !outcome && (
        <div className="pointer-events-none absolute top-[52%] left-1/2 h-[16%] w-[44%] -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="smoke-rise absolute bottom-0 h-[9cqw] w-[9cqw] rounded-full bg-[#5a524c]"
              style={{
                left: `${15 + i * 30}%`,
                animationDelay: `${i * 0.3}s`,
                opacity: Math.min(0.8, (wok.heat - 0.3) * 1.4),
              }}
            />
          ))}
        </div>
      )}
      {wok.heat >= TOSS_FROM + 0.25 && !outcome && (
        <span className="combo-pop absolute top-[57%] left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] font-display text-[5cqw] font-bold whitespace-nowrap text-[var(--cream)] italic">
          ⬆ {T.toss[lang]}
        </span>
      )}

      <div ref={wokBox} className="absolute bottom-[7%] left-[12%] aspect-[3/2] w-[76%]">
        <WokArt wok={wok} tossN={tossN} />
      </div>

      {/* Done meter, with the tosses as arrows. */}
      <div className="absolute bottom-[1.5%] left-1/2 z-20 flex w-[74%] -translate-x-1/2 items-center gap-[2cqw] rounded-full bg-[#fbf3e4]/85 px-[2.4cqw] py-[0.8cqw]">
        <span className="font-tally text-[3.2cqw] tracking-[0.1em] text-[var(--ink)] uppercase">
          {T.cooked[lang]}
        </span>
        <div className="relative h-[3cqw] flex-1 overflow-hidden rounded-full bg-[#5a3a1c]/25">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#d9a441,#b06e2e)] transition-[width] duration-200"
            style={{ width: `${share * 100}%` }}
          />
        </div>
        <span
          className="font-tally text-[3.4cqw]"
          aria-label={`${Math.min(wok.tosses, TOSSES_NEEDED)}/${TOSSES_NEEDED}`}
        >
          {"⬆".repeat(Math.min(TOSSES_NEEDED, wok.tosses))}
          <span className="opacity-30">{"⬆".repeat(Math.max(0, TOSSES_NEEDED - wok.tosses))}</span>
        </span>
      </div>

      {pop && !outcome && (
        <span
          key={`pop-${pop.n}`}
          className={`stamp-pop absolute top-[66%] left-1/2 z-20 font-display font-bold whitespace-nowrap italic ${
            pop.tone === "hei"
              ? "text-[11cqw] text-[#e4572e] drop-shadow-[0_3px_0_#fff1c4]"
              : "rounded-sm bg-[var(--sambal)] px-[2.4cqw] py-[0.6cqw] text-[5cqw] text-[var(--cream)]"
          }`}
        >
          {pop.text}
        </span>
      )}

      {/* The press, off-stage: a camera flash from the wings on every good toss. */}
      {flash && (
        <span
          key={`flash-${flash.n}`}
          className={`camera-flash pointer-events-none absolute top-[36%] h-[30%] w-[40%] rounded-full bg-[radial-gradient(circle,#ffffff,#fff6cf_30%,transparent_70%)] ${
            flash.side === "left" ? "-left-[16%]" : "-right-[16%]"
          }`}
        />
      )}

      {drag && (
        <span
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 text-[12cqw] drop-shadow-[0_6px_6px_rgba(40,14,6,0.4)]"
          style={{ left: drag.x, top: drag.y }}
        >
          {ICON[drag.ing]}
        </span>
      )}

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

/** The wok seen from the front at a slant, with whatever has gone into it so far. */
function WokArt({ wok, tossN }: { wok: Wok; tossN: number }) {
  const has = (ing: Ingredient) => wok.added > RECIPE.indexOf(ing);
  const noodle = noodleColour(wok);
  return (
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

      {/* Flame under the wok: grows as it heats. */}
      <g
        className="pelita-flame"
        style={{ transformOrigin: "150px 196px", transform: `scale(${0.8 + wok.heat * 0.6})` }}
      >
        <ellipse cx="150" cy="168" rx="80" ry={30 + wok.heat * 20} fill="url(#wok-flame)" />
      </g>

      {/* The wok jumps on every toss; the food jumps higher. */}
      <g
        key={`wok-${tossN}`}
        className={tossN ? "wok-toss" : undefined}
        style={{ transformOrigin: "150px 120px" }}
      >
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
        <path d="M24 90 Q150 220 276 90 Z" fill="url(#wok-iron)" stroke="#0e0b09" strokeWidth="3" />
        <ellipse cx={CX} cy={CY} rx="126" ry="42" fill="#231c18" stroke="#6b5d52" strokeWidth="3" />
        <g clipPath="url(#wok-inside)">
          <g
            key={`food-${tossN}`}
            className={tossN ? "food-toss" : undefined}
            style={{ transformOrigin: "150px 92px" }}
          >
            {has("minyak") && (
              <>
                <ellipse cx={CX} cy={CY + 4} rx="100" ry="28" fill="#c9963f" opacity="0.35" />
                {[
                  [-40, 0],
                  [10, 8],
                  [45, -6],
                  [-12, -10],
                  [70, 6],
                ].map(([x, y], i) => (
                  <circle key={i} cx={CX + x!} cy={CY + y!} r="3" fill="#f3e6c4" />
                ))}
              </>
            )}
            {has("kueyteow") &&
              Array.from({ length: 11 }, (_, i) => {
                const x = CX - 95 + i * 19;
                const y = CY - 14 + ((i * 7) % 26);
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
            {has("kicap") &&
              [
                [-50, 2],
                [20, -6],
                [60, 10],
              ].map(([x, y], i) => (
                <ellipse
                  key={i}
                  cx={CX + x!}
                  cy={CY + y!}
                  rx="12"
                  ry="4"
                  fill="#3a2414"
                  opacity="0.5"
                />
              ))}
            {has("udang") &&
              [
                [-60, -4],
                [-5, 10],
                [40, -12],
                [80, 4],
              ].map(([x, y], i) => (
                <path
                  key={i}
                  d={`M${CX + x! - 8} ${CY + y!} q8 -10 16 0 q-6 6 -12 4`}
                  fill="#f08a4b"
                  stroke="#c4552a"
                  strokeWidth="1.5"
                />
              ))}
            {has("telur") &&
              [
                [-30, 8],
                [30, 2],
                [70, -8],
              ].map(([x, y], i) => (
                <ellipse key={i} cx={CX + x!} cy={CY + y!} rx="11" ry="5" fill="#f6d35b" />
              ))}
            {has("taugeh") && (
              <>
                {[
                  [-70, 6],
                  [-20, -12],
                  [15, 14],
                  [55, -4],
                  [95, 8],
                ].map(([x, y], i) => (
                  <line
                    key={`t${i}`}
                    x1={CX + x!}
                    y1={CY + y!}
                    x2={CX + x! + 10}
                    y2={CY + y! - 4}
                    stroke="#fbf6e4"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ))}
                {[
                  [-45, -8],
                  [5, 4],
                  [75, -10],
                ].map(([x, y], i) => (
                  <line
                    key={`k${i}`}
                    x1={CX + x!}
                    y1={CY + y!}
                    x2={CX + x! + 16}
                    y2={CY + y! + 2}
                    stroke="#4f8a3a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                ))}
              </>
            )}
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
          opacity={Math.max(0, wok.heat - 0.3)}
        />
      </g>
    </svg>
  );
}
