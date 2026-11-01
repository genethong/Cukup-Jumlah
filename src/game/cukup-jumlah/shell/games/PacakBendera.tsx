import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import {
  cempala,
  gendangHit,
  gendangMiss,
  gendangTak,
  paperSlap,
  tick,
} from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  CENTRES,
  FLAGS_NEEDED,
  FRESH_NIGHT,
  SNEAK_GAP_S,
  SNEAK_S,
  clockMinutes,
  midnightAt,
  nightVerdict,
  offencesAllowed,
  pullDown,
  sneakIn,
  tap,
  type Night,
  type Tap,
} from "./pacakRules";
import { Villager } from "./PerangSpeaker";

const T = GAME_TEXT.pacak;
/** The kampung ground, in % of the stage; flags go in below the clock row. */
const GROUND_TOP = 40;
const PLANT_TOP = 51;
/** The rival's people start creeping in after this many seconds of play. */
const FIRST_SNEAK_S = 2;

type Pop = { id: number; x: number; y: number; text: string; bad: boolean };

const POP = {
  planted: "popPlanted",
  chased: "popChased",
  ring: "popRing",
  taken: "popTaken",
} as const satisfies Record<Tap, keyof typeof T>;

function clockText(minutes: number): { text: string; late: boolean } {
  if (minutes >= 60) return { text: "12:00 AM", late: true };
  return { text: `11:${String(Math.floor(minutes)).padStart(2, "0")} PM`, late: false };
}

export function PacakBendera({
  clock,
  candidate,
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
  const allowed = offencesAllowed(talent === "mesra_rakyat");
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [night, setNight] = useState<Night>(FRESH_NIGHT);
  const [now, setNow] = useState(0);
  const [minutes, setMinutes] = useState(50);
  const [pops, setPops] = useState<Pop[]>([]);
  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const nightRef = useRef<Night>(FRESH_NIGHT);
  const playRef = useRef(0);
  const liveRef = useRef(false);
  const ended = useRef(false);
  const done = useRef(false);
  const ids = useRef(0);
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

  const pop = (x: number, y: number, text: string, bad: boolean) => {
    const id = ++ids.current;
    setPops((p) => [...p.slice(-4), { id, x, y, text, bad }]);
    later(() => setPops((p) => p.filter((q) => q.id !== id)), 700);
  };
  const popRef = useRef(pop);
  popRef.current = pop;

  const end = (won: boolean) => {
    if (ended.current) return;
    ended.current = true;
    setOutcome(won ? "won" : "lost");
    clock.halt();
    later(() => finishRef.current(won), won ? 900 : 1400);
  };
  const endRef = useRef(end);
  endRef.current = end;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const limitS = bars * BEATS_PER_BAR * clock.spb;
    const midnightS = midnightAt(limitS);
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    let nextSneak = FIRST_SNEAK_S;
    const frame = () => {
      if (done.current || ended.current) return;
      raf = requestAnimationFrame(frame);
      if (!clock.running) return;
      const t = clock.ctx.currentTime;
      const heardBeats = (clock.heardTime() - clock.start) / clock.spb;
      const nextStep = leadInStep(heardBeats);
      if (nextStep !== step) {
        step = nextStep;
        callbacks.current.onLeadIn?.(step);
      }
      const playS = (heardBeats - LEAD_IN_BEATS) * clock.spb;
      if (playS < 0) return;
      playRef.current = playS;
      if (!liveRef.current) {
        liveRef.current = true;
        setLive(true);
      }
      const leftS = limitS - playS;
      callbacks.current.onTimeLeft?.(Math.max(0, leftS) / limitS, Math.max(0, leftS));
      const mins = clockMinutes(playS, midnightS);
      setMinutes(mins);
      // The last minute ticks out loud.
      if (mins >= 59 && mins < 60 && t >= nextTick) {
        tick(clock.ctx, clock.out, t);
        nextTick = t + clock.spb / 2;
      }

      // The rival's people creep up on your flags, and pull down any not chased off.
      let n = nightRef.current;
      if (playS >= nextSneak) {
        n = sneakIn(n, playS);
        nextSneak = playS + SNEAK_GAP_S * (0.7 + Math.random() * 0.6);
      }
      const before = n;
      const { night: after, fell } = pullDown(n, playS);
      if (fell > 0) {
        for (const f of before.flags.filter((g) => !after.flags.includes(g))) {
          popRef.current(f.x, f.y, T.popPulled[lang], true);
        }
        gendangMiss(clock.ctx, clock.out, t);
        callbacks.current.onJudge("miss");
      }
      if (after !== nightRef.current) {
        nightRef.current = after;
        setNight(after);
      }
      setNow(playS);

      const midnight = mins >= 60;
      const verdict = nightVerdict(nightRef.current, FLAGS_NEEDED, allowed, midnight);
      if (verdict !== "going") {
        if (midnight) cempala(clock.ctx, clock.out, t, true);
        if (verdict === "won") gendangHit(clock.ctx, clock.out, t + 0.05, true);
        else gendangMiss(clock.ctx, clock.out, t + 0.05);
        endRef.current(verdict === "won");
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, allowed, lang]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!liveRef.current || ended.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    if (y < PLANT_TOP) return;
    const { night: next, result } = tap(nightRef.current, { x, y });
    nightRef.current = next;
    setNight(next);
    popRef.current(x, y, T[POP[result]][lang], result === "ring");
    const t = clock.ctx.currentTime;
    if (result === "planted") {
      gendangTak(clock.ctx, clock.out, t);
      paperSlap(clock.ctx, clock.out, t + 0.02);
    }
    if (result === "chased") {
      gendangHit(clock.ctx, clock.out, t, true);
      callbacks.current.onJudge("perfect");
    }
    if (result === "ring") {
      gendangMiss(clock.ctx, clock.out, t);
      callbacks.current.onJudge("miss");
    }
  };

  const shown = clockText(minutes);
  const standing = night.flags.length;
  const shortBy = Math.max(0, FLAGS_NEEDED - standing);

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      {/* The kampung at night: grass, a lane, and two polling centres with their rings. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#5d7a4a,#46603a)]"
        style={{ top: `${GROUND_TOP}%` }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[80%] h-[3%] bg-[#b39a72]/70" />
      {[
        { x: 48, y: 54 },
        { x: 92, y: 90 },
      ].map((h) => (
        <span
          key={`${h.x}`}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[6cqw] opacity-80"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          🏠
        </span>
      ))}
      {CENTRES.map((c, i) => (
        <div key={`ring-${i}`}>
          <div
            className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.8cqw] border-dashed border-[#e4572e] bg-[#e4572e]/15"
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.r * 2}%` }}
          />
          <div
            className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          >
            <span className="text-[7cqw] leading-none">{i === 0 ? "🏫" : "🏛️"}</span>
            <span className="mt-[0.4cqw] rounded-sm bg-[#fbf3e4] px-[1cqw] font-tally text-[2.2cqw] whitespace-nowrap text-[var(--ink)] uppercase">
              {T.centre[lang]}
            </span>
          </div>
        </div>
      ))}

      {night.flags.map((f) => (
        <FlagArt key={`flag-${f.id}`} x={f.x} y={f.y} colour={colour} />
      ))}

      {/* The rival's people, creeping up on a flag: the closer they get, the bolder. */}
      {night.sneaks.map((s) => {
        const f = night.flags.find((g) => g.id === s.flagId);
        if (!f) return null;
        const p = Math.min(1, Math.max(0, 1 - (s.pullAt - now) / SNEAK_S));
        return (
          <div
            key={`sneak-${s.id}`}
            className="pointer-events-none absolute h-[8%] -translate-y-full"
            style={{
              left: `${f.x + 6 - p * 4}%`,
              top: `${f.y}%`,
              aspectRatio: "1 / 2",
              opacity: 0.45 + p * 0.55,
            }}
          >
            <div className="crowd-walk h-full">
              <Villager variant={s.id % 3} covering={false} won />
            </div>
            <span className="absolute -top-[45%] left-1/2 -translate-x-1/2 rounded-full bg-[var(--sambal)] px-[1cqw] font-display text-[3.4cqw] font-bold text-[var(--cream)]">
              !
            </span>
          </div>
        );
      })}

      {pops.map((p) => (
        <span
          key={`pop-${p.id}`}
          className={`combo-pop pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[160%] rounded-sm px-[1.2cqw] font-display text-[3.4cqw] font-bold whitespace-nowrap italic ${
            p.bad ? "bg-[var(--sambal)] text-[var(--cream)]" : "bg-[#fdfaf2] text-[var(--ink)]"
          }`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.text}
        </span>
      ))}

      {/* The clock that matters tonight. */}
      <div
        className={`pointer-events-none absolute top-[40.5%] right-[3%] rounded-[1cqw] border-[0.6cqw] px-[2cqw] py-[0.4cqw] font-tally text-[6cqw] leading-none tabular-nums ${
          shown.late
            ? "border-[#e4572e] bg-[#2b1410] text-[#ff8a6a]"
            : minutes >= 58
              ? "hold-glow border-[#e0a33a] bg-[#2b2522] text-[#ffd77a]"
              : "border-[#6b6965] bg-[#2b2522] text-[#f3ebdf]"
        }`}
      >
        {shown.text}
      </div>
      <div className="pointer-events-none absolute top-[41%] left-[3%] rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        {T.count[lang]} {standing}/{FLAGS_NEEDED}
      </div>
      {live && !outcome && (
        <span className="pointer-events-none absolute top-[47%] left-[3%] font-tally text-[2.8cqw] tracking-[0.06em] text-[#f3ebdf] uppercase">
          {T.tapHint[lang]}
        </span>
      )}

      {outcome && (
        <div className="combo-pop pointer-events-none absolute top-[50%] left-1/2 z-30 w-[80%] -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.4cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
          <p className="font-display text-[5.4cqw] font-bold italic">
            {outcome === "won"
              ? T.won[lang]
              : night.offences > allowed
                ? T.ring[lang]
                : T.short[lang].replace("{n}", String(shortBy))}
          </p>
          <p className="mt-[0.6cqw] text-[3.2cqw] leading-tight">
            {night.offences > allowed ? T.ringFact[lang] : T.fact[lang]}
          </p>
        </div>
      )}
    </div>
  );
}

/** A flag in the party's colour, planted in the grass. */
function FlagArt({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <svg
      viewBox="0 0 30 50"
      className="combo-pop pointer-events-none absolute h-[8.5%] -translate-x-[20%] -translate-y-full overflow-visible"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    >
      <ellipse cx="6" cy="49" rx="5" ry="1.6" fill="#2b2522" opacity="0.4" />
      <rect x="5" y="2" width="2.4" height="48" fill="#8a5a32" />
      <path d="M7.4 3 L28 9 L7.4 16 Z" fill={colour} />
      <path
        d="M7.4 3 L28 9 L7.4 16"
        fill="none"
        stroke="#3a2414"
        strokeOpacity="0.4"
        strokeWidth="0.8"
      />
    </svg>
  );
}
