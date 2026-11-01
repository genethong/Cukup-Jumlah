import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import {
  crowdCheer,
  gendangHit,
  gendangMiss,
  gendangTak,
  paperSlap,
  tick,
  whoosh,
} from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  FLIGHT_S,
  LANE_Y,
  TRAY,
  catcher,
  dealItems,
  flickTarget,
  isGift,
  leafletsNeeded,
  onStage,
  spawnVillager,
  stallVerdict,
  villagerX,
  type Item,
  type Stall,
  type Villager as Walker,
} from "./balingRules";
import { Villager } from "./PerangSpeaker";

const T = GAME_TEXT.baling;
const TICK_FROM_S = 2;
/** The bin sits right under the tray: swipe down to drop a gift in. */
const BIN = { x: TRAY.x, y: 92 };
/** Swipes shorter than this (in % of the stage) are ignored. */
const MIN_SWIPE = 4;

type Flyer = { id: number; item: Item; x: number; y: number; t0: number; toBin: boolean };
type Note = { id: number; text: string; x: number; good: boolean };

export function BalingRisalah({
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
  const needed = leafletsNeeded(talent === "mesra_rakyat");
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [now, setNow] = useState(0);
  const [items] = useState(() => dealItems(60));
  const [next, setNext] = useState(0);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stall, setStall] = useState<Stall>({ delivered: 0, bribed: false });
  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const playRef = useRef(0);
  const nextRef = useRef(0);
  const walkersRef = useRef<Walker[]>([]);
  const flyersRef = useRef<Flyer[]>([]);
  const stallRef = useRef<Stall>(stall);
  const liveRef = useRef(false);
  const ended = useRef(false);
  const done = useRef(false);
  const ids = useRef(0);
  const swipe = useRef<{ id: number; x: number; y: number; w: number; h: number } | null>(null);
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

  const note = (text: string, x: number, good: boolean) => {
    const id = ++ids.current;
    setNotes((n) => [...n.slice(-3), { id, text, x, good }]);
    later(() => setNotes((n) => n.filter((m) => m.id !== id)), 900);
  };
  const noteRef = useRef(note);
  noteRef.current = note;

  const end = (won: boolean) => {
    if (ended.current) return;
    ended.current = true;
    setOutcome(won ? "won" : "lost");
    clock.halt();
    later(() => finishRef.current(won), won ? 900 : 1300);
  };
  const endRef = useRef(end);
  endRef.current = end;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const limitS = bars * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    let nextSpawn = 0;
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
      if (leftS <= TICK_FROM_S && t >= nextTick) {
        tick(clock.ctx, clock.out, t);
        nextTick = t + clock.spb / 2;
      }

      // Villagers stroll in, a few at a time.
      if (playS >= nextSpawn) {
        walkersRef.current = [
          ...walkersRef.current.filter((v) => onStage(v, playS)),
          spawnVillager(++ids.current, playS),
        ];
        nextSpawn = playS + 0.55 + Math.random() * 0.45;
      }

      // Leaflets that reach the lane: caught, or lost on the road.
      const landed = flyersRef.current.filter((f) => playS - f.t0 >= FLIGHT_S);
      if (landed.length) {
        flyersRef.current = flyersRef.current.filter((f) => playS - f.t0 < FLIGHT_S);
        for (const f of landed) {
          if (f.toBin) continue;
          const who = catcher(walkersRef.current, f.x, playS);
          if (who) {
            walkersRef.current = walkersRef.current.map((v) =>
              v.id === who.id ? { ...v, served: true } : v,
            );
            stallRef.current = { ...stallRef.current, delivered: stallRef.current.delivered + 1 };
            setStall(stallRef.current);
            paperSlap(clock.ctx, clock.out, t);
            callbacks.current.onJudge("perfect");
            noteRef.current(T.thanks[lang], f.x, true);
          } else {
            noteRef.current(T.missed[lang], f.x, false);
          }
        }
      }

      setNow(playS);
      setWalkers(walkersRef.current);
      setFlyers(flyersRef.current);

      const verdict = stallVerdict(stallRef.current, needed, leftS <= 0);
      if (verdict === "won") {
        gendangHit(clock.ctx, clock.out, t, true);
        crowdCheer(clock.ctx, clock.out, t + 0.05);
        callbacks.current.onPuppet?.({ anim: "hop", face: "big_laugh" });
        endRef.current(true);
      } else if (verdict === "lost") {
        gendangMiss(clock.ctx, clock.out, t);
        endRef.current(false);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, needed, lang]);

  /** Throw the tray's top item: up toward the lane at `x`, or into the bin. */
  const throwItem = (x: number | "bin") => {
    if (!liveRef.current || ended.current || done.current) return;
    const item = items[nextRef.current % items.length]!;
    nextRef.current += 1;
    setNext(nextRef.current);
    const t = clock.ctx.currentTime;
    const toBin = x === "bin";
    flyersRef.current = [
      ...flyersRef.current,
      {
        id: ++ids.current,
        item,
        x: toBin ? BIN.x : x,
        y: toBin ? BIN.y : LANE_Y,
        t0: playRef.current,
        toBin,
      },
    ];
    setFlyers(flyersRef.current);
    if (toBin) {
      gendangTak(clock.ctx, clock.out, t);
      return;
    }
    whoosh(clock.ctx, clock.out, t);
    if (isGift(item)) {
      // Handing out money or goods to win votes is bribery: the round ends there.
      stallRef.current = { ...stallRef.current, bribed: true };
      setStall(stallRef.current);
      callbacks.current.onJudge("miss");
      callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "shocked_o" });
    } else {
      callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "big_laugh" });
      later(() => callbacks.current.onPuppet?.(null), 300);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  // The throw goes as soon as the finger has moved far enough, not on release, so it feels
  // instant.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = ((e.clientX - s.x) / s.w) * 100;
    const dy = ((e.clientY - s.y) / s.h) * 100;
    if (dy <= -MIN_SWIPE) {
      swipe.current = null;
      throwItem(flickTarget(dx, dy));
    } else if (dy >= MIN_SWIPE) {
      swipe.current = null;
      throwItem("bin");
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipe.current?.id === e.pointerId) swipe.current = null;
  };

  // Stop the page itself from scrolling or bouncing under a swipe (iOS ignores touch-action
  // on some layers).
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        throwItem("bin");
      } else if (e.key === "ArrowUp") {
        // Keyboard aims at the nearest villager still waiting for a leaflet.
        e.preventDefault();
        const t = playRef.current;
        const waiting = walkersRef.current
          .filter((v) => !v.served && onStage(v, t + FLIGHT_S))
          .map((v) => villagerX(v, t + FLIGHT_S))
          .sort((a, b) => Math.abs(a - TRAY.x) - Math.abs(b - TRAY.x));
        throwItem(waiting[0] ?? TRAY.x);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const current = items[next % items.length]!;
  const following = items[(next + 1) % items.length]!;

  return (
    <div
      ref={root}
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      {/* The kaki lima the villagers walk along. */}
      <div
        className="pointer-events-none absolute inset-x-0 h-[9%] bg-[linear-gradient(180deg,#c9b48f,#b39a72)] shadow-[0_0.6cqw_0_#8f7a58]"
        style={{ top: `${LANE_Y - 2}%` }}
      />

      {walkers.map((v) => {
        const x = villagerX(v, now);
        return (
          <div
            key={`v-${v.id}`}
            className="pointer-events-none absolute h-[11%]"
            style={{
              left: `${x}%`,
              top: `${LANE_Y - 6.5}%`,
              aspectRatio: "1 / 2",
              transform: "translateX(-50%)",
            }}
          >
            <div className={v.served ? "" : "crowd-walk"} style={{ height: "100%" }}>
              <Villager variant={v.id % 3} covering={false} won />
            </div>
            {v.served && (
              <span className="absolute -top-[30%] left-1/2 -translate-x-1/2 text-[4cqw]">👍</span>
            )}
          </div>
        );
      })}

      {/* The stall's tray: the top item, and the next one peeking out behind. */}
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${TRAY.x}%`, top: `${TRAY.y}%` }}
      >
        <div className="relative h-[16cqw] w-[24cqw]">
          <div className="absolute top-[-14%] left-[22%] h-full w-[70%] opacity-60">
            <ItemArt item={following} colour={colour} />
          </div>
          {live && !outcome && (
            <div key={`top-${next}`} className="combo-pop absolute inset-0">
              <ItemArt item={current} colour={colour} />
            </div>
          )}
        </div>
        <div className="mt-[0.6cqw] h-[2cqw] w-[30cqw] rounded-full bg-[#8a5a32] shadow-[0_0.6cqw_0_#4f321b]" />
      </div>
      <span
        className="pointer-events-none absolute -translate-x-1/2 font-tally text-[3cqw] tracking-[0.06em] whitespace-nowrap text-[var(--ink)] uppercase"
        style={{ left: `${TRAY.x}%`, top: `${TRAY.y - 12}%` }}
      >
        {T.swipe[lang]}
      </span>

      {/* The bin, for gifts. */}
      <div
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${BIN.x}%`, top: `${BIN.y}%` }}
      >
        <span className="text-[9cqw] leading-none">🗑️</span>
        <span className="font-tally text-[2.6cqw] text-[var(--ink)] uppercase">{T.bin[lang]}</span>
      </div>

      {flyers.map((f) => {
        const p = Math.min(1, (now - f.t0) / FLIGHT_S);
        const x = TRAY.x + (f.x - TRAY.x) * p;
        const arc = f.toBin ? 0 : Math.sin(p * Math.PI) * 6;
        const y = TRAY.y + (f.y - TRAY.y) * p - arc;
        return (
          <div
            key={`f-${f.id}`}
            className="pointer-events-none absolute z-20 h-[7cqw] w-[10cqw] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, rotate: `${p * 360}deg` }}
          >
            <ItemArt item={f.item} colour={colour} />
          </div>
        );
      })}

      {notes.map((n) => (
        <span
          key={`n-${n.id}`}
          className={`combo-pop pointer-events-none absolute z-20 -translate-x-1/2 rounded-sm px-[1.4cqw] py-[0.3cqw] font-display text-[3.6cqw] font-bold whitespace-nowrap italic ${
            n.good ? "bg-[#fdfaf2] text-[var(--ink)]" : "bg-[#2b2522]/70 text-[var(--cream)]"
          }`}
          style={{ left: `${Math.min(86, Math.max(14, n.x))}%`, top: `${LANE_Y - 15}%` }}
        >
          {n.text}
        </span>
      ))}

      {/* Leaflets handed out, out of those needed. */}
      <div className="pointer-events-none absolute top-[58.5%] left-[50%] flex -translate-x-1/2 items-center gap-[1cqw] rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.2cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        {T.count[lang]} {stall.delivered}/{needed}
      </div>

      {outcome === "lost" && stall.bribed && (
        <div className="combo-pop pointer-events-none absolute top-[40%] left-1/2 z-30 flex w-[78%] -translate-x-1/2 flex-col items-center gap-[1cqw] rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.6cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
          <span className="font-display text-[6cqw] font-bold text-[var(--sambal)] italic">
            {T.bribe[lang]}
          </span>
          <span className="text-[3.2cqw] leading-tight">{T.bribeFact[lang]}</span>
        </div>
      )}
      {outcome === "won" && (
        <p className="combo-pop pointer-events-none absolute top-[40%] left-1/2 z-30 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          {T.won[lang]}
        </p>
      )}
    </div>
  );
}

/** A leaflet in the party's colour, an envelope of cash or a sack of rice. */
function ItemArt({ item, colour }: { item: Item; colour: string }) {
  if (item === "leaflet") {
    return (
      <svg viewBox="0 0 60 40" className="h-full w-full" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="54"
          height="34"
          rx="2"
          fill="#fbf3e4"
          stroke="#cdbd9f"
          strokeWidth="1.5"
        />
        <rect x="3" y="3" width="54" height="10" rx="2" fill={colour} />
        <rect x="9" y="18" width="28" height="3" fill="#6b6965" />
        <rect x="9" y="24" width="40" height="3" fill="#a8a29a" />
        <rect x="9" y="30" width="34" height="3" fill="#a8a29a" />
        <circle cx="47" cy="22" r="6" fill={colour} opacity="0.85" />
      </svg>
    );
  }
  if (item === "cash") {
    return (
      <svg viewBox="0 0 60 40" className="h-full w-full" aria-hidden="true">
        <rect
          x="6"
          y="6"
          width="48"
          height="30"
          rx="2"
          fill="#c9a24a"
          stroke="#98733b"
          strokeWidth="1.5"
        />
        <path d="M6 8 L30 24 L54 8" fill="none" stroke="#98733b" strokeWidth="1.5" />
        <rect
          x="14"
          y="0"
          width="30"
          height="12"
          rx="1"
          fill="#5e9c6b"
          stroke="#3d6b46"
          strokeWidth="1"
        />
        <text x="29" y="9" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#f3ebdf">
          RM
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className="h-full w-full" aria-hidden="true">
      <path
        d="M14 6 Q30 0 46 6 L50 36 Q30 40 10 36 Z"
        fill="#e8dcc0"
        stroke="#b39a72"
        strokeWidth="1.5"
      />
      <path d="M18 6 Q30 10 42 6" fill="none" stroke="#8a5a32" strokeWidth="2" />
      <text x="30" y="27" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#8a1c19">
        BERAS
      </text>
    </svg>
  );
}
