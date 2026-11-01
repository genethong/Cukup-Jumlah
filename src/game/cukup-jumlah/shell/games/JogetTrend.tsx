import { useEffect, useRef, useState } from "react";
import { canang, crowdCheer, gendangHit, gendangMiss, kesi } from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import type { ExpressionId } from "../../puppet/loadRig";
import type { PuppetPose } from "../../puppet/motion";
import { PuppetAvatar } from "../../puppet/PuppetAvatar";
import { randomConfig } from "../../puppet/options";
import { mistakesAllowed, type MicrogameProps } from "../microgame";
import { GAME_TEXT, fill } from "../strings";
import { useRound } from "../useRound";
import {
  DANCE_LENGTHS,
  FRESH_FLOOR,
  advanceShow,
  floorVerdict,
  makeDances,
  shownMove,
  shownSoFar,
  strike,
  type Floor,
  type Move,
} from "./jogetRules";

const T = GAME_TEXT.joget;
/** The four poses, struck by the trend-setter and copied by the YB. */
const POSES: Record<Move, PuppetPose> = {
  up: { shoulder: 150, elbow: -20, bob: -18, head: -4 },
  left: { sway: -16, shoulder: 60, elbow: 80, head: -14, hip: 6 },
  right: { sway: 16, shoulder: 60, elbow: 80, head: 14, hip: 6 },
  down: { bob: 90, hip: 24, shoulder: 15, elbow: 120, foot: 14, head: 6 },
};
const ARROWS: Record<Move, string> = { up: "↑", left: "←", right: "→", down: "↓" };
const KEYS: Record<string, Move> = {
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
};
/** A swipe this far (in % of the stage width) strikes a pose. */
const SWIPE = 6;
/** Seconds the YB holds a pose after striking it. */
const HOLD_S = 0.4;

type Pop = { id: number; text: string; good: boolean };

export function JogetTrend(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent);
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [dances] = useState(() => makeDances());
  // The trend-setter is bare-headed: no religious or official headwear on a dancing influencer.
  const [star] = useState(() => {
    const c = randomConfig();
    return {
      ...c,
      headwear: null,
      hair: c.hair === "none" ? "ponytail" : c.hair,
      expression: "smug_grin" as ExpressionId,
    };
  });
  const [floor, setFloor] = useState<Floor>(FRESH_FLOOR);
  const [now, setNow] = useState(0);
  const [mine, setMine] = useState<{ move: Move | null; at: number; wrong: boolean }>({
    move: null,
    at: -9,
    wrong: false,
  });
  const [likes, setLikes] = useState(800);
  const [pop, setPop] = useState<Pop | null>(null);
  const floorRef = useRef(floor);
  const nowRef = useRef(0);
  const lastShown = useRef<Move | null>(null);

  const { outcome, playing, end } = useRound(props, ({ t, playS, leftS }) => {
    nowRef.current = playS;
    setNow(playS);
    const before = floorRef.current;
    const shown = shownMove(dances, before, playS, clock.spb);
    if (shown && shown !== lastShown.current) canang(clock.ctx, clock.out, t);
    lastShown.current = shown;
    const next = advanceShow(dances, before, playS, clock.spb);
    if (next !== before) {
      floorRef.current = next;
      setFloor(next);
    }
    if (floorVerdict(floorRef.current, allowed, leftS <= 0) === "lost") {
      gendangMiss(clock.ctx, clock.out, t);
      end(false);
    }
  });

  const dance = (move: Move) => {
    if (!playing()) return;
    const at = nowRef.current;
    const { floor: next, result } = strike(dances, floorRef.current, move, at);
    if (result === "ignored") return;
    floorRef.current = next;
    setFloor(next);
    const t = clock.ctx.currentTime;
    const id = Math.random();
    if (result === "wrong") {
      gendangMiss(clock.ctx, clock.out, t);
      onJudge("miss");
      setMine({ move: null, at, wrong: true });
      setPop({ id, text: T.wrong[lang], good: false });
    } else {
      gendangHit(clock.ctx, clock.out, t, result === "danced");
      kesi(clock.ctx, clock.out, t + 0.05);
      onJudge(result === "danced" ? "perfect" : "good");
      setMine({ move, at, wrong: false });
      setLikes((n) => Math.round(n * 1.6 + 400));
      if (result === "danced") setPop({ id, text: T.nice[lang], good: true });
    }
    const v = floorVerdict(next, allowed, false);
    if (v === "won") {
      crowdCheer(clock.ctx, clock.out, t + 0.05);
      end(true);
    } else if (v === "lost") end(false);
  };

  const danceRef = useRef(dance);
  danceRef.current = dance;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const move = KEYS[e.key];
      if (!move) return;
      e.preventDefault();
      if (!e.repeat) danceRef.current(move);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const swipe = useRef<{ id: number; x: number; y: number; w: number; done: boolean } | null>(null);

  // Stop the page itself from scrolling or bouncing under a swipe.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  const shown = shownMove(dances, floor, now, clock.spb);
  const soFar = shownSoFar(dances, floor, now, clock.spb);
  const holding = now - mine.at < HOLD_S;
  const myPose = holding && mine.move ? POSES[mine.move] : undefined;
  const myFace: ExpressionId | null = holding ? (mine.wrong ? "shocked_o" : "big_laugh") : null;
  const stage = floor.stage;
  const danceNo = stage.kind === "done" ? DANCE_LENGTHS.length : stage.dance + 1;

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      ref={root}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, done: false };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      // A pose strikes as soon as the finger has travelled far enough, one per swipe.
      onPointerMove={(e) => {
        const s = swipe.current;
        if (!s || s.id !== e.pointerId || s.done) return;
        const move = swipeMove(e.clientX - s.x, e.clientY - s.y, s.w);
        if (!move) return;
        s.done = true;
        dance(move);
      }}
      onPointerUp={() => (swipe.current = null)}
      onPointerCancel={() => (swipe.current = null)}
    >
      {/* The trend-setter's video on a phone. */}
      <div className="pointer-events-none absolute top-[46%] left-[4%] h-[41%] w-[40%] overflow-hidden rounded-[3cqw] border-[1.2cqw] border-[#2b2522] bg-[linear-gradient(180deg,#3a2f4a,#1f1a26)] shadow-[0_1.2cqw_2cqw_rgba(40,14,6,0.45)]">
        <div className="absolute inset-x-[6%] top-[4%] bottom-[16%]">
          <PuppetAvatar
            config={star}
            pose={shown ? POSES[shown] : undefined}
            anim={shown ? "still" : "idle"}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-[#1f1a26]/90 px-[1.6cqw] py-[0.8cqw]">
          <p className="font-tally text-[2.6cqw] leading-tight text-[#f3ebdf]">{T.star[lang]}</p>
          <p className="font-tally text-[2.4cqw] leading-tight text-[#ffd77a]">{T.tag[lang]}</p>
        </div>
        <span className="absolute top-[4%] right-[6%] rounded-full bg-[#1f1a26]/80 px-[1.2cqw] font-tally text-[2.4cqw] text-[#f3ebdf]">
          ♥ {formatLikes(likes, lang)} {T.likes[lang]}
        </span>
        {/* The moves shown so far, as the video's caption. */}
        <div className="absolute inset-x-0 bottom-[17%] flex justify-center gap-[0.8cqw]">
          {soFar.map((m, k) => (
            <span
              key={k}
              className="flex h-[5cqw] w-[5cqw] items-center justify-center rounded-full bg-[#f3ebdf]/90 font-display text-[3.6cqw] font-bold text-[var(--ink)]"
            >
              {ARROWS[m]}
            </span>
          ))}
        </div>
        {shown && (
          <span
            key={`arrow-${now - (now % clock.spb)}`}
            className="count-pop absolute top-[38%] left-[50%] flex h-[11cqw] w-[11cqw] -translate-x-1/2 items-center justify-center rounded-full bg-[#ffd77a] font-display text-[8cqw] font-bold text-[var(--ink)] shadow-[0_0.8cqw_1.2cqw_rgba(0,0,0,0.4)]"
          >
            {ARROWS[shown]}
          </span>
        )}
      </div>

      {/* The YB, copying. */}
      <div className="pointer-events-none absolute top-[45%] right-[3%] h-[44%] w-[48%]">
        {holding && mine.move && (
          <span
            key={`swiped-${mine.at}`}
            className="combo-pop absolute top-[40%] left-1/2 z-10 -translate-x-1/2 font-display text-[12cqw] font-bold text-[var(--sambal)] opacity-80"
          >
            {ARROWS[mine.move]}
          </span>
        )}
        <PuppetAvatar
          config={myFace ? { ...candidate.puppet, expression: myFace } : candidate.puppet}
          pose={myPose}
          anim={myPose ? "still" : mine.wrong && holding ? "rod-wiggle" : "idle"}
          label={candidate.name}
        />
      </div>

      {/* Whose turn it is, and how far into the dance the YB has got. */}
      <div className="pointer-events-none absolute top-[39.5%] left-1/2 z-10 flex -translate-x-1/2 items-center gap-[1.6cqw] whitespace-nowrap">
        <span
          className={`rounded-sm px-[2cqw] py-[0.3cqw] font-display text-[4cqw] font-bold whitespace-nowrap italic ${
            stage.kind === "copy"
              ? "hold-glow bg-[var(--sambal)] text-[var(--cream)]"
              : "bg-[#2b2522]/85 text-[var(--cream)]"
          }`}
        >
          {stage.kind === "copy" ? T.you[lang] : T.watch[lang]}
        </span>
        <span className="font-tally text-[2.8cqw] tracking-[0.06em] text-[var(--ink)] uppercase">
          {fill(T.dance[lang], { n: danceNo, of: DANCE_LENGTHS.length })}
        </span>
        {stage.kind === "copy" && (
          <div className="flex gap-[0.8cqw]">
            {dances[stage.dance]!.map((_, k) => (
              <span
                key={k}
                className="h-[2.4cqw] w-[2.4cqw] rounded-full border-[0.4cqw] border-[#2b2522]"
                style={{ background: k < stage.step ? colour : "transparent" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Swipe anywhere; the pad shows which way strikes which pose. */}
      <div
        className={`pointer-events-none absolute inset-x-[4%] bottom-[2.5%] flex items-center justify-center gap-[2cqw] rounded-[2cqw] border-[0.5cqw] border-dashed py-[1.6cqw] ${
          stage.kind === "copy"
            ? "border-[var(--sambal)] bg-[#efe1c3]"
            : "border-[#6b6965]/50 bg-[#efe1c3]/50"
        }`}
      >
        <span className="font-tally text-[3.4cqw] tracking-[0.06em] text-[var(--ink)] uppercase">
          {T.swipe[lang]}
        </span>
        <span className="font-display text-[5cqw] font-bold text-[var(--ink)]">↑ ← → ↓</span>
      </div>

      {pop && !outcome && now - mine.at < 0.9 && (
        <span
          key={`pop-${pop.id}`}
          className={`combo-pop pointer-events-none absolute top-[62%] left-1/2 z-20 -translate-x-1/2 rounded-sm px-[2cqw] py-[0.4cqw] font-display text-[4.4cqw] font-bold whitespace-nowrap italic ${
            pop.good ? "bg-[#efe1c3] text-[var(--ink)]" : "bg-[var(--sambal)] text-[var(--cream)]"
          }`}
        >
          {pop.text}
        </span>
      )}

      {outcome && (
        <div className="combo-pop pointer-events-none absolute top-[52%] left-1/2 z-30 w-[80%] -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.4cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
          <p className="font-display text-[5.4cqw] font-bold italic">
            {outcome === "won" ? T.won[lang] : T.lost[lang]}
          </p>
          <p className="mt-[0.6cqw] text-[3.2cqw] leading-tight">{T.fact[lang]}</p>
        </div>
      )}
    </div>
  );
}

/** Which pose a swipe of (dx, dy) pixels strikes, once it is long enough. */
function swipeMove(dx: number, dy: number, width: number): Move | null {
  const x = (dx / width) * 100;
  const y = (dy / width) * 100;
  if (Math.max(Math.abs(x), Math.abs(y)) < SWIPE) return null;
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? "left" : "right";
  return y < 0 ? "up" : "down";
}

function formatLikes(n: number, lang: "ms" | "en"): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}${lang === "ms" ? "j" : "M"}`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
