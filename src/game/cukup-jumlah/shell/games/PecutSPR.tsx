import { useEffect, useRef, useState } from "react";
import { gendangHit, gendangMiss, gendangTak, paperSlap } from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import { PuppetCameo } from "../../puppet/PuppetAvatar";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  DISTANCE,
  FRESH_RUN,
  LANES,
  aboutToStep,
  laneAt,
  layCourse,
  runVerdict,
  stepRun,
  switchLane,
  type Kind,
  type Run,
} from "./pecutRules";
import { Villager } from "./PerangSpeaker";

const T = GAME_TEXT.pecut;
/** Where the runner is on screen, and how many % of the stage height a metre takes. */
const RUNNER_Y = 86;
const PCT_PER_M = 1.6;
const LANE_X = [24, 50, 76];
/** A sideways swipe this far (in % of the stage width) changes lane. */
const SWIPE = 7;

export function PecutSPR(props: MicrogameProps) {
  const { clock, candidate, lang, onJudge } = props;
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [course] = useState(() => layCourse());
  const [run, setRun] = useState<Run>(FRESH_RUN);
  const [clockText, setClockText] = useState("9:55");
  const [ouch, setOuch] = useState(0);
  const runRef = useRef<Run>(FRESH_RUN);

  const { live, outcome, playing, end } = useRound(props, ({ t, playS, leftS, dt }) => {
    // The wall clock runs from 9:55 to 10:00, when nominations close.
    const limitS = playS + leftS;
    const secs = Math.min(300, Math.floor((Math.max(0, playS) / limitS) * 300));
    setClockText(
      secs >= 300
        ? "10:00"
        : `9:${55 + Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`,
    );
    const { run: next, bumped } = stepRun(runRef.current, course, dt);
    runRef.current = next;
    setRun(next);
    if (bumped) {
      gendangMiss(clock.ctx, clock.out, t);
      setOuch((n) => n + 1);
      onJudge("miss");
    }
    const v = runVerdict(next, leftS <= 0);
    if (v === "won") {
      gendangHit(clock.ctx, clock.out, t, true);
      paperSlap(clock.ctx, clock.out, t + 0.08);
      end(true);
    } else if (v === "lost") {
      gendangMiss(clock.ctx, clock.out, t);
      end(false);
    }
  });

  const steer = (dir: -1 | 1) => {
    if (!playing()) return;
    runRef.current = switchLane(runRef.current, dir);
    setRun(runRef.current);
    gendangTak(clock.ctx, clock.out, clock.ctx.currentTime);
  };
  const gesture = useRef<{
    id: number;
    x: number;
    w: number;
    left: number;
    swiped: boolean;
  } | null>(null);

  // Stop the page itself from scrolling or bouncing under a swipe.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  const steerRef = useRef(steer);
  steerRef.current = steer;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") steerRef.current(-1);
      else if (e.key === "ArrowRight") steerRef.current(1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const yOf = (at: number) => RUNNER_Y - (at - run.distance) * PCT_PER_M;
  const finishY = yOf(DISTANCE);

  return (
    <div
      ref={root}
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        gesture.current = {
          id: e.pointerId,
          x: e.clientX,
          w: r.width,
          left: r.left,
          swiped: false,
        };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        // A sideways swipe changes lane as soon as it has moved far enough; a long swipe
        // can cross two lanes.
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const dx = ((e.clientX - g.x) / g.w) * 100;
        if (Math.abs(dx) >= SWIPE) {
          steer(dx < 0 ? -1 : 1);
          gesture.current = { ...g, x: e.clientX, swiped: true };
        }
      }}
      onPointerUp={(e) => {
        // A tap without a swipe steers toward the side tapped.
        const g = gesture.current;
        gesture.current = null;
        if (!g || g.id !== e.pointerId || g.swiped) return;
        steer(e.clientX - g.left < g.w / 2 ? -1 : 1);
      }}
      onPointerCancel={() => (gesture.current = null)}
    >
      {/* The road to the nomination centre, three lanes wide. */}
      <div className="pointer-events-none absolute inset-x-[8%] top-[38%] bottom-0 overflow-hidden bg-[linear-gradient(180deg,#b9a985,#a8956e)]">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[0.8cqw] bg-[repeating-linear-gradient(180deg,#f3ebdf_0_4cqw,transparent_4cqw_9cqw)] opacity-70"
            style={{ left: `${(i * 100) / LANES}%`, backgroundPositionY: `${run.distance * 3}cqw` }}
          />
        ))}
      </div>

      {/* The nomination centre's counter: the finish. */}
      {finishY > 30 && (
        <div
          className="pointer-events-none absolute inset-x-[8%] flex h-[6%] -translate-y-full items-center justify-center bg-[#8a5a32] shadow-[0_1cqw_0_#4f321b]"
          style={{ top: `${finishY}%` }}
        >
          <span className="rounded-sm bg-[#fbf3e4] px-[1.6cqw] font-tally text-[3.2cqw] tracking-[0.06em] text-[var(--ink)] uppercase">
            {T.counter[lang]}
          </span>
        </div>
      )}

      {course.map((o, i) => {
        const y = yOf(o.at);
        if (y < 34 || y > 104) return null;
        return (
          <div
            key={`o-${i}`}
            className="pointer-events-none absolute flex h-[9%] w-[22%] -translate-x-1/2 -translate-y-full items-end justify-center transition-[left] duration-200"
            style={{
              left: `${LANE_X[laneAt(o, run.distance)]}%`,
              top: `${y}%`,
              opacity: run.hit.includes(i) ? 0.45 : 1,
            }}
          >
            <ObstacleArt kind={o.kind} />
            {aboutToStep(o, run.distance) && (
              <span className="hold-glow absolute -top-[30%] rounded-full bg-[var(--sambal)] px-[1.2cqw] font-display text-[3.6cqw] font-bold text-[var(--cream)]">
                {o.toLane! > o.lane ? "!→" : "←!"}
              </span>
            )}
          </div>
        );
      })}

      {/* The YB, running, with the proposer and seconder's papers in hand. */}
      <div
        key={`ouch-${ouch}`}
        className={`pointer-events-none absolute h-[12%] w-[16%] -translate-x-1/2 -translate-y-full transition-[left] duration-100 ${
          run.stunned > 0 ? "ears-shake" : ""
        }`}
        style={{ left: `${LANE_X[run.lane]}%`, top: `${RUNNER_Y + 4}%` }}
      >
        <div className="absolute top-0 left-1/2 aspect-square w-[80%] -translate-x-1/2 overflow-hidden rounded-full">
          <PuppetCameo config={candidate.puppet} className="h-full w-full scale-110" />
        </div>
        <svg
          viewBox="0 0 40 40"
          className="absolute bottom-0 left-0 h-[52%] w-full"
          aria-hidden="true"
        >
          <path d="M12 2 Q20 0 28 2 L30 22 H10 Z" fill={colour} />
          <rect x="29" y="8" width="9" height="11" rx="1" fill="#fbf6ea" stroke="#a8a29a" />
          <g className={run.stunned > 0 ? "" : "crowd-walk"}>
            <rect x="12" y="22" width="6" height="16" rx="2" fill="#3a3f46" />
            <rect x="22" y="22" width="6" height="16" rx="2" fill="#3a3f46" />
          </g>
        </svg>
        {run.stunned > 0 && (
          <span className="absolute -top-[25%] left-1/2 -translate-x-1/2 rounded-sm bg-[var(--sambal)] px-[1cqw] font-display text-[3.4cqw] font-bold whitespace-nowrap text-[var(--cream)] italic">
            {T.ouch[lang]}
          </span>
        )}
      </div>

      {/* The wall clock. */}
      <div
        className={`pointer-events-none absolute top-[39.5%] right-[3%] rounded-[1cqw] border-[0.6cqw] px-[2cqw] py-[0.4cqw] font-tally text-[5.4cqw] leading-none tabular-nums ${
          clockText.startsWith("9:59")
            ? "hold-glow border-[#e0a33a] bg-[#2b2522] text-[#ffd77a]"
            : "border-[#6b6965] bg-[#2b2522] text-[#f3ebdf]"
        }`}
      >
        {clockText}
      </div>
      <div className="pointer-events-none absolute top-[40%] left-[3%] h-[1.8cqw] w-[30%] overflow-hidden rounded-full bg-[#2b2522]/30">
        <div
          className="h-full rounded-full bg-[#3f8f4f]"
          style={{ width: `${(run.distance / DISTANCE) * 100}%` }}
        />
      </div>
      {live && !outcome && run.distance < 8 && (
        <span className="pointer-events-none absolute top-[60%] left-1/2 -translate-x-1/2 rounded-sm bg-[#2b2522]/80 px-[2cqw] py-[0.5cqw] font-tally text-[3.2cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
          {T.tapHint[lang]}
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

/** A clump of supporters, a banner across the lane, or a kompang troupe. */
function ObstacleArt({ kind }: { kind: Kind }) {
  if (kind === "reporter") {
    return (
      <div className="relative h-full" style={{ aspectRatio: "1 / 2" }}>
        <Villager variant={1} covering={false} won />
        <span className="absolute top-[30%] -right-[60%] text-[4.4cqw]">🎙️</span>
      </div>
    );
  }
  if (kind === "banner") {
    return (
      <svg viewBox="0 0 60 30" className="h-[70%] w-full" aria-hidden="true">
        <rect x="2" y="2" width="3" height="28" fill="#5e3b20" />
        <rect x="55" y="2" width="3" height="28" fill="#5e3b20" />
        <rect x="5" y="4" width="50" height="14" fill="#c9a24a" stroke="#98733b" />
        <rect x="9" y="9" width="42" height="3" fill="#8a5a32" opacity="0.6" />
      </svg>
    );
  }
  return (
    <div className="flex h-full items-end">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="relative h-full"
          style={{ aspectRatio: "1 / 2", marginLeft: i ? "-1.5cqw" : 0 }}
        >
          <Villager variant={i} covering={false} won />
          {kind === "kompang" && (
            <span className="absolute top-[38%] left-1/2 h-[4cqw] w-[4cqw] -translate-x-1/2 rounded-full border-[0.5cqw] border-[#8a5a32] bg-[#e8d9b8]" />
          )}
        </div>
      ))}
    </div>
  );
}
