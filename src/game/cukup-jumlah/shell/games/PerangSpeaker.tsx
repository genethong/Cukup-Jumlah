import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import {
  crowdCheer,
  feedbackSqueal,
  gendangHit,
  gendangMiss,
  paShout,
  tick,
} from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import type { ExpressionId, PuppetConfig } from "../../puppet/loadRig";
import type { PuppetAnim } from "../../puppet/motion";
import { PuppetAvatar } from "../../puppet/PuppetAvatar";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT } from "../strings";
import {
  CROWD,
  RIVAL_QUIET,
  freshRally,
  needed,
  rivalBursts,
  rivalLevel,
  rivalTell,
  shout,
  startCrowd,
  startPaces,
  stepRally,
  yours,
  type Rally,
} from "./perangRules";

const T = GAME_TEXT.speaker;
const TICK_FROM_S = 2;
const RIVAL_SHOUT_GAP = 0.24;

/** The other ceramah's speaker: a made-up candidate with no party. */
const RIVAL: PuppetConfig = {
  gender: "m",
  tone: "tone_3",
  faceShape: "square",
  hair: "sidepart",
  headwear: null,
  outfit: "business_suit",
  lower: null,
  footwear: "sneakers",
};

type Rival = "quiet" | "tell" | "loud";
type View = { rally: Rally; rival: Rival };

export function PerangSpeaker({
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
  const need = needed(talent === "mesra_rakyat");
  const party = PARTIES.find((p) => p.id === candidate.party);

  const [view, setView] = useState<View>(() => ({
    rally: freshRally(startCrowd(), startPaces()),
    rival: "quiet",
  }));
  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);
  const [screech, setScreech] = useState(0);

  const rallyRef = useRef<Rally>(view.rally);
  const liveRef = useRef(false);
  const ended = useRef(false);
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
    const bursts = rivalBursts(limitS);
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    let nextRivalShout = 0;
    let lastCheer = 0;
    let last = clock.ctx.currentTime;
    const frame = () => {
      if (done.current || ended.current) return;
      raf = requestAnimationFrame(frame);
      const t = clock.ctx.currentTime;
      const dt = Math.min(0.25, t - last);
      last = t;
      if (!clock.running) return;
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
      if (leftS <= TICK_FROM_S && t >= nextTick) {
        tick(clock.ctx, clock.out, t);
        nextTick = t + clock.spb / 2;
      }

      const level = rivalLevel(bursts, playS);
      const rival: Rival =
        level > RIVAL_QUIET ? "loud" : rivalTell(bursts, playS) ? "tell" : "quiet";
      if (rival === "loud" && t >= nextRivalShout) {
        paShout(clock.ctx, clock.out, t, true);
        nextRivalShout = t + RIVAL_SHOUT_GAP;
      }

      const before = rallyRef.current;
      const { rally, screeched } = stepRally(before, level, dt);
      rallyRef.current = rally;
      setView({ rally, rival });
      if (screeched) {
        feedbackSqueal(clock.ctx, clock.out, t);
        gendangMiss(clock.ctx, clock.out, t + 0.05);
        setScreech((n) => n + 1);
        callbacks.current.onJudge("miss");
      } else if (yours(rally.crowd) > yours(before.crowd) && t - lastCheer > 0.4) {
        crowdCheer(clock.ctx, clock.out, t);
        lastCheer = t;
      }

      if (leftS <= 0) {
        const won = yours(rally.crowd) >= need;
        setOutcome(won ? "won" : "lost");
        if (won) {
          gendangHit(clock.ctx, clock.out, t, true);
          crowdCheer(clock.ctx, clock.out, t + 0.05);
        } else gendangMiss(clock.ctx, clock.out, t);
        callbacks.current.onJudge(won ? "perfect" : "miss");
        ended.current = true;
        clock.halt();
        later(() => finishRef.current(won), won ? 900 : 300);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, need]);

  const tap = () => {
    if (!liveRef.current || ended.current || done.current) return;
    const before = rallyRef.current;
    const next = shout(before);
    if (next === before) return;
    rallyRef.current = next;
    paShout(clock.ctx, clock.out, clock.ctx.currentTime);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const { rally, rival } = view;
  const mine = yours(rally.crowd);
  const shouting = rally.volume > 0.3;
  const out = rally.tripped > 0;
  const hot = rally.heat > 0.75;

  const myAct: { anim: PuppetAnim; face: ExpressionId | null } =
    outcome === "won"
      ? { anim: "hop", face: "big_laugh" }
      : outcome === "lost"
        ? { anim: "idle", face: "crying_pout" }
        : out
          ? { anim: "rod-wiggle", face: "shocked_o" }
          : shouting
            ? { anim: "rod-wiggle", face: "angry_shout" }
            : { anim: "idle", face: null };
  const rivalAct: { anim: PuppetAnim; face: ExpressionId } =
    outcome === "won"
      ? { anim: "idle", face: "crying_pout" }
      : outcome === "lost"
        ? { anim: "hop", face: "big_laugh" }
        : rival === "loud"
          ? { anim: "rod-wiggle", face: "angry_shout" }
          : rival === "tell"
            ? { anim: "idle", face: "smug_grin" }
            : { anim: "idle", face: "neutral" };

  return (
    <div className="absolute inset-0 z-10 select-none">
      {/* Strings of lights over the field. */}
      <div className="pointer-events-none absolute inset-x-[6%] top-[39%] flex justify-between">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-[#ffd36b] shadow-[0_0_2cqw_#ffcf5a]"
            style={{ transform: `translateY(${Math.sin((i / 11) * Math.PI) * 2.4}cqw)` }}
          />
        ))}
      </div>

      <Stage side="left" colour={party?.colour ?? "#8a2f2f"} />
      <Stage side="right" colour="#5f6f80" />
      <SpeakerTower side="left" level={out ? 0 : rally.volume} smoking={hot || out} />
      <SpeakerTower side="right" level={rival === "loud" ? 0.8 : 0} smoking={false} />

      <div className="pointer-events-none absolute bottom-[38%] left-[11%] h-[24%] w-[26%]">
        <PuppetAvatar
          config={myAct.face ? { ...candidate.puppet, expression: myAct.face } : candidate.puppet}
          anim={myAct.anim}
          label={candidate.name}
        />
      </div>
      <div className="pointer-events-none absolute right-[11%] bottom-[38%] h-[24%] w-[26%]">
        <PuppetAvatar
          config={{ ...RIVAL, expression: rivalAct.face }}
          anim={rivalAct.anim}
          label={T.rivalName[lang]}
        />
      </div>

      {/* What each stage is saying. */}
      {live && !outcome && shouting && !out && <Bubble side="left" text={T.mine[lang]} loud />}
      {live && !outcome && out && <Bubble side="left" text={T.screech[lang]} loud bad />}
      {live && !outcome && (
        <Bubble
          side="right"
          text={rival === "loud" ? T.rival[lang] : rival === "tell" ? T.tell[lang] : T.drink[lang]}
          loud={rival === "loud"}
        />
      )}

      {screech > 0 && out && (
        <div
          key={`flash-${screech}`}
          className="camera-flash pointer-events-none absolute inset-0 z-20 bg-[var(--sambal)]"
        />
      )}

      <Crowd
        crowd={rally.crowd}
        pace={rally.pace}
        drift={rally.drift}
        covering={out}
        key={`crowd-${screech}`}
      />

      {/* The count: villagers on your half of the field, out of those needed. */}
      <div className="pointer-events-none absolute top-[62.5%] left-1/2 flex -translate-x-1/2 items-center gap-[2cqw] rounded-sm bg-[#2b2522]/85 px-[2.4cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        <span className={mine >= need ? "text-[#9be08a]" : ""}>
          {T.crowd[lang]} {mine}/{need}
        </span>
        <span className="opacity-60">·</span>
        <span>
          {T.rivalCrowd[lang]} {CROWD - mine}
        </span>
      </div>

      {/* The amp's heat, right above the mic so it's in view while mashing. */}
      <div className="pointer-events-none absolute top-[84.5%] left-1/2 flex w-[64%] -translate-x-1/2 items-center gap-[1.4cqw]">
        <span
          className={`font-tally text-[3cqw] tracking-[0.08em] whitespace-nowrap uppercase ${hot || out ? "text-[var(--sambal)]" : "text-[var(--ink)]"}`}
        >
          {out ? T.tripped[lang] : hot ? T.hot[lang] : T.amp[lang]}
        </span>
        <div className="h-[2.4cqw] flex-1 overflow-hidden rounded-full bg-[#2b2522]/25">
          <div
            className={`h-full rounded-full ${hot || out ? "hold-glow bg-[var(--sambal)]" : "bg-[#e0a33a]"}`}
            style={{ width: `${Math.round(rally.heat * 100)}%` }}
          />
        </div>
      </div>

      {/* The mic: mash it. */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          tap();
        }}
        onContextMenu={(e) => e.preventDefault()}
        disabled={!live || outcome !== null}
        aria-label={T.button[lang]}
        className={`absolute bottom-[2.5%] left-1/2 flex h-[9%] w-[56%] -translate-x-1/2 items-center justify-center gap-[2cqw] rounded-[3cqw] border-[0.8cqw] font-display text-[7cqw] font-bold italic shadow-[0_1.2cqw_0_#3b1410] transition-transform active:translate-y-[0.8cqw] active:shadow-none ${
          out
            ? "border-[#6b625c] bg-[#8d847d] text-[#e8e0d4]"
            : "border-[#5b1a14] bg-[var(--sambal)] text-[var(--cream)]"
        } ${live && !outcome && !out ? "" : "opacity-80"} ${
          live && !outcome && !out && !hot && rival !== "loud" ? "hold-glow" : ""
        } ${hot && !out ? "ears-shake" : ""}`}
        style={{ touchAction: "manipulation" }}
      >
        <span aria-hidden="true">🎤</span>
        {T.button[lang]}
      </button>

      {outcome && (
        <p className="combo-pop pointer-events-none absolute top-[44%] left-1/2 z-30 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          {outcome === "won" ? T.won[lang] : T.lost[lang]}
        </p>
      )}
    </div>
  );
}

/** A ceramah stage: a plank platform with bunting along the front. */
function Stage({ side, colour }: { side: "left" | "right"; colour: string }) {
  return (
    <div
      className={`pointer-events-none absolute top-[57%] h-[5%] w-[36%] ${side === "left" ? "left-[6%]" : "right-[6%]"}`}
    >
      <div className="absolute inset-0 rounded-[0.6cqw] bg-[linear-gradient(180deg,#7a5232,#4e3220)] shadow-[0_1cqw_1.4cqw_rgba(40,14,6,0.4)]" />
      <div className="absolute inset-x-0 top-0 flex justify-around">
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="h-0 w-0 border-x-[1.6cqw] border-t-[2.4cqw] border-x-transparent"
            style={{ borderTopColor: i % 2 ? "#f4efe4" : colour }}
          />
        ))}
      </div>
    </div>
  );
}

/** A stack of speaker boxes, throwing sound waves toward the field when loud. */
function SpeakerTower({
  side,
  level,
  smoking,
}: {
  side: "left" | "right";
  level: number;
  smoking: boolean;
}) {
  const left = side === "left";
  return (
    <div
      className={`pointer-events-none absolute top-[41%] flex h-[21%] w-[9%] flex-col gap-[0.6cqw] ${left ? "left-[1.5%]" : "right-[1.5%]"}`}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-1 items-center justify-center rounded-[0.8cqw] border-[0.5cqw] border-[#111] bg-[#2a2624]"
        >
          <span
            className="aspect-square w-[70%] rounded-full border-[0.6cqw] border-[#5b5552] bg-[#151312]"
            style={{ transform: `scale(${1 + level * 0.12 * (i === 1 ? 1 : 0.6)})` }}
          />
        </div>
      ))}
      <svg
        viewBox="0 0 40 60"
        className={`absolute top-[10%] h-[80%] w-[160%] ${left ? "left-[105%]" : "right-[105%] -scale-x-100"}`}
        style={{ opacity: level }}
        aria-hidden="true"
      >
        {[10, 20, 30].map((r) => (
          <path
            key={r}
            d={`M${r * 0.6} ${30 - r} Q${r * 1.25} 30 ${r * 0.6} ${30 + r}`}
            fill="none"
            stroke="#2b2522"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>
      {smoking && (
        <span className="smoke-rise absolute -top-[18%] left-1/2 h-[4cqw] w-[4cqw] -translate-x-1/2 rounded-full bg-[#9d958e]/70" />
      )}
    </div>
  );
}

function Bubble({
  side,
  text,
  loud,
  bad,
}: {
  side: "left" | "right";
  text: string;
  loud?: boolean;
  bad?: boolean;
}) {
  return (
    <p
      className={`pointer-events-none absolute z-20 rounded-[2cqw] px-[2cqw] py-[0.6cqw] text-center font-display leading-[1.05] font-bold whitespace-nowrap italic shadow-[0_3px_6px_rgba(40,14,6,0.25)] ${
        side === "left" ? "top-[43%] left-[31%]" : "top-[50%] right-[31%]"
      } ${loud ? "text-[4.4cqw]" : "text-[3.4cqw] opacity-85"} ${
        bad
          ? "bg-[var(--sambal)] text-[var(--cream)]"
          : loud
            ? "bg-[#fdfaf2] text-[var(--ink)]"
            : "bg-[#efe6d4] text-[var(--ink)]"
      }`}
    >
      {text}
    </p>
  );
}

/**
 * The villagers on the field, as shadow figures; 0 is at your stage, 1 at the rival's.
 * Those on the move bob and lean the way they're walking, each at their own pace.
 */
function Crowd({
  crowd,
  pace,
  drift,
  covering,
}: {
  crowd: number[];
  pace: number[];
  drift: number;
  covering: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[64%] h-[20%]">
      <div className="absolute top-[8%] bottom-[6%] left-1/2 border-l-[0.4cqw] border-dashed border-[#2b2522]/30" />
      {crowd.map((p, i) => {
        const row = i % 5;
        return (
          <div
            key={i}
            className={`absolute h-[34%] ${covering ? "ears-shake" : ""}`}
            style={{
              left: `${4 + p * 88 + ((i * 37) % 7) - 3}%`,
              top: `${row * 16}%`,
              aspectRatio: "1 / 2",
              zIndex: row,
            }}
          >
            <div
              className={`h-full w-full ${walking(p, drift * (pace[i] ?? 1)) ? "crowd-walk" : ""}`}
              style={{ transform: `skewX(${walking(p, drift) ? (drift < 0 ? 8 : -8) : 0}deg)` }}
            >
              <Villager variant={i % 3} covering={covering} won={p < 0.5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Walking unless the pull is faint, or they're already pressed up against a stage. */
function walking(p: number, drift: number): boolean {
  if (Math.abs(drift) < 0.08) return false;
  return drift < 0 ? p > 0 : p < 1;
}

/** A villager in shadow; those on your half stand dark and solid, the rest faded. */
function Villager({
  variant,
  covering,
  won,
}: {
  variant: number;
  covering: boolean;
  won: boolean;
}) {
  const fill = won ? "#2b2522" : "#8d847d";
  return (
    <svg viewBox="0 0 20 40" className="h-full w-full overflow-visible" aria-hidden="true">
      <circle cx="10" cy="7" r="5" fill={fill} />
      {variant === 1 && <path d="M4 5 Q10 -1 16 5 L18 6 L4 6 Z" fill={fill} />}
      {variant === 2 && <rect x="5" y="9" width="10" height="3" fill={fill} />}
      <path d="M4 14 Q10 11 16 14 L17 30 L3 30 Z" fill={fill} />
      <rect x="5" y="29" width="4" height="10" rx="1.5" fill={fill} />
      <rect x="11" y="29" width="4" height="10" rx="1.5" fill={fill} />
      {covering ? (
        <>
          <path d="M4 15 L2 6" stroke={fill} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 15 L18 6" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M4 15 L2 27" stroke={fill} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 15 L18 27" stroke={fill} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
