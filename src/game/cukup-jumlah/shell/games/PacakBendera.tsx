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
import { PuppetAvatar } from "../../puppet/PuppetAvatar";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  CENTRE,
  FLAGS_NEEDED,
  FRESH_NIGHT,
  HITS_PER_FLAG,
  RING,
  clockMinutes,
  hammer,
  midnightAt,
  nightVerdict,
  offencesAllowed,
  planted,
  type Hammer,
  type Night,
} from "./pacakRules";

const T = GAME_TEXT.pacak;
/** The kampung ground, in % of the stage; flags go in below the clock row, away from the
 *  corner where the YB stands. */
const GROUND_TOP = 40;
const PLANT_TOP = 51;
const YB_CORNER = { right: 40, top: 66 };

type Pop = { id: number; x: number; y: number; result: Hammer };

const POP = {
  hit: "popHit",
  planted: "popPlanted",
  ring: "popRing",
  taken: "popTaken",
  late: "popLate",
} as const satisfies Record<Hammer, keyof typeof T>;

function clockText(minutes: number): { text: string; late: boolean } {
  if (minutes >= 60) {
    const m = Math.floor(minutes - 60);
    return { text: `12:${String(m).padStart(2, "0")} AM`, late: true };
  }
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
  onPuppet,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish });
  callbacks.current = { onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish };
  const allowed = offencesAllowed(talent === "mesra_rakyat");
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [night, setNight] = useState<Night>(FRESH_NIGHT);
  const [minutes, setMinutes] = useState(50);
  const [pops, setPops] = useState<Pop[]>([]);
  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const nightRef = useRef<Night>(FRESH_NIGHT);
  const lateRef = useRef(false);
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

  const end = (won: boolean) => {
    if (ended.current) return;
    ended.current = true;
    setOutcome(won ? "won" : "lost");
    clock.halt();
    callbacks.current.onPuppet?.(
      won ? { anim: "hop", face: "big_laugh" } : { anim: "rod-wiggle", face: "shocked_o" },
    );
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
      if (mins >= 60 && !lateRef.current) {
        lateRef.current = true;
        cempala(clock.ctx, clock.out, t, true);
      }
      const verdict = nightVerdict(nightRef.current, FLAGS_NEEDED, allowed, lateRef.current);
      if (verdict !== "going") {
        if (verdict === "lost") gendangMiss(clock.ctx, clock.out, t);
        endRef.current(verdict === "won");
      } else if (leftS <= 0) {
        endRef.current(false);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, allowed]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!liveRef.current || ended.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    if (y < PLANT_TOP || (x < YB_CORNER.right && y > YB_CORNER.top)) return;
    const { night: next, result } = hammer(nightRef.current, { x, y }, lateRef.current);
    nightRef.current = next;
    setNight(next);
    const id = ++ids.current;
    setPops((p) => [...p.slice(-4), { id, x, y, result }]);
    later(() => setPops((p) => p.filter((q) => q.id !== id)), 700);
    const t = clock.ctx.currentTime;
    if (result === "hit") gendangTak(clock.ctx, clock.out, t);
    if (result === "planted") {
      paperSlap(clock.ctx, clock.out, t);
      gendangHit(clock.ctx, clock.out, t + 0.03, true);
      callbacks.current.onJudge("perfect");
    }
    if (result === "ring" || result === "late") {
      gendangMiss(clock.ctx, clock.out, t);
      callbacks.current.onJudge("miss");
    }
  };

  const shown = clockText(minutes);
  const offence = night.late ? T.lateFact[lang] : night.offences > 0 ? T.ringFact[lang] : null;

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
    >
      {/* The kampung at night: grass, a lane, and the polling centre (a school). */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,#5d7a4a,#46603a)]"
        style={{ top: `${GROUND_TOP}%` }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[78%] h-[3%] bg-[#b39a72]/70" />
      {[
        { x: 10, y: 53 },
        { x: 30, y: 58 },
        { x: 92, y: 88 },
      ].map((h) => (
        <span
          key={`${h.x}`}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[7cqw] opacity-80"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          🏠
        </span>
      ))}
      <div
        className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.8cqw] border-dashed border-[#e4572e] bg-[#e4572e]/15"
        style={{ left: `${CENTRE.x}%`, top: `${CENTRE.y}%`, width: `${RING * 2}%` }}
      />
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${CENTRE.x}%`, top: `${CENTRE.y}%` }}
      >
        <span className="text-[8cqw] leading-none">🏫</span>
        <span className="mt-[0.4cqw] rounded-sm bg-[#fbf3e4] px-[1cqw] font-tally text-[2.4cqw] whitespace-nowrap text-[var(--ink)] uppercase">
          {T.centre[lang]}
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-[1%] left-[1%] h-[34%] w-[38%]">
        <PuppetAvatar
          config={
            outcome === "lost"
              ? { ...candidate.puppet, expression: "shocked_o" }
              : outcome === "won"
                ? { ...candidate.puppet, expression: "big_laugh" }
                : candidate.puppet
          }
          anim={outcome === "won" ? "hop" : pops.length ? "rod-wiggle" : "idle"}
          label={candidate.name}
        />
      </div>

      {night.flags.map((f, i) => (
        <FlagArt key={`flag-${i}`} x={f.x} y={f.y} hits={f.hits} colour={colour} />
      ))}

      {pops.map((p) => (
        <span
          key={`pop-${p.id}`}
          className={`combo-pop pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[160%] rounded-sm px-[1.2cqw] font-display text-[3.4cqw] font-bold whitespace-nowrap italic ${
            p.result === "ring" || p.result === "late"
              ? "bg-[var(--sambal)] text-[var(--cream)]"
              : "bg-[#fdfaf2] text-[var(--ink)]"
          }`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {T[POP[p.result]][lang]}
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
        {T.count[lang]} {planted(night)}/{FLAGS_NEEDED}
      </div>
      {live && !outcome && (
        <span className="pointer-events-none absolute top-[47%] left-[3%] font-tally text-[2.8cqw] tracking-[0.06em] text-[#f3ebdf] uppercase">
          {T.tapHint[lang].replace("{n}", String(HITS_PER_FLAG))}
        </span>
      )}

      {outcome && (
        <div className="combo-pop pointer-events-none absolute top-[50%] left-1/2 z-30 w-[80%] -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.4cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
          <p className="font-display text-[5.4cqw] font-bold italic">
            {outcome === "won"
              ? T.won[lang]
              : night.late
                ? T.late[lang]
                : night.offences > allowed
                  ? T.ring[lang]
                  : T.short[lang]}
          </p>
          <p className="mt-[0.6cqw] text-[3.2cqw] leading-tight">{offence ?? T.fact[lang]}</p>
        </div>
      )}
    </div>
  );
}

/** A flag going in: the pole rises with each hammer tap, the cloth goes up when it's in. */
function FlagArt({ x, y, hits, colour }: { x: number; y: number; hits: number; colour: string }) {
  const up = Math.min(1, hits / HITS_PER_FLAG);
  return (
    <svg
      viewBox="0 0 30 50"
      className="pointer-events-none absolute h-[7%] -translate-x-[20%] -translate-y-full overflow-visible"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    >
      <ellipse cx="6" cy="49" rx="5" ry="1.6" fill="#2b2522" opacity="0.4" />
      <rect x="5" y={50 - 48 * up} width="2.4" height={48 * up} fill="#8a5a32" />
      {up >= 1 && (
        <g className="combo-pop">
          <path d="M7.4 3 L28 9 L7.4 16 Z" fill={colour} />
          <path
            d="M7.4 3 L28 9 L7.4 16"
            fill="none"
            stroke="#3a2414"
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />
        </g>
      )}
    </svg>
  );
}
