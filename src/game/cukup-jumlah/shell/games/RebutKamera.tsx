import { useEffect, useRef, useState } from "react";
import { crowdCheer, gendangHit, gendangMiss, shutter, tick } from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import { PuppetAvatar } from "../../puppet/PuppetAvatar";
import { randomConfig } from "../../puppet/options";
import { mistakesAllowed, type MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  FIGURE_W,
  MEMBERS,
  PHOTOS,
  PHOTO_S,
  SHUFFLE_S,
  SHUTTER_S,
  TOUCH,
  judgeShot,
  lateAt,
  memberX,
  photoAt,
  planPhotos,
  shotsVerdict,
  shutterAt,
  walk,
} from "./rebutRules";

const T = GAME_TEXT.rebut;
/** Where the line stands: the figures' feet, in % of the stage height, and how big each
 *  puppet is drawn (wider than FIGURE_W, the room it takes in the line). */
const FEET_Y = 89;
const FIGURE_H = 36;
const PUPPET_W = 22;

type Shot = "good" | "elbow";

export function RebutKamera(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent);
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [plan] = useState(() => planPhotos());
  /** The colleagues in the line, and the latecomer last. */
  const [crew] = useState(() => Array.from({ length: MEMBERS + 1 }, () => randomConfig()));
  const [now, setNow] = useState(0);
  const [yb, setYb] = useState(50);
  const [shots, setShots] = useState<Shot[]>([]);
  const [flash, setFlash] = useState(0);
  const ybRef = useRef(50);
  const target = useRef(50);
  const shotsRef = useRef<Shot[]>([]);
  const lastCount = useRef(0);

  const { live, outcome, playing, end } = useRound(props, ({ t, playS, dt }) => {
    setNow(playS);
    if (!playing()) return;
    ybRef.current = walk(ybRef.current, target.current, dt);
    setYb(ybRef.current);

    const i = shotsRef.current.length;
    if (i >= PHOTOS) return;
    const count = countdown(playS, i);
    if (count !== lastCount.current) {
      lastCount.current = count;
      if (count > 0) tick(clock.ctx, clock.out, t);
    }
    if (playS < shutterAt(i)) return;
    const shot = judgeShot(plan, i, ybRef.current);
    const next = [...shotsRef.current, shot];
    shotsRef.current = next;
    setShots(next);
    setFlash((n) => n + 1);
    shutter(clock.ctx, clock.out, t);
    if (shot === "good") {
      gendangHit(clock.ctx, clock.out, t + 0.04, true);
      onJudge("perfect");
    } else {
      gendangMiss(clock.ctx, clock.out, t + 0.04);
      onJudge("miss");
    }
    const v = shotsVerdict(next, allowed);
    if (v === "won") {
      crowdCheer(clock.ctx, clock.out, t + 0.1);
      end(true);
    } else if (v === "lost") end(false);
  });

  // Arrow keys walk the YB while held.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") target.current = 0;
      else if (e.key === "ArrowRight") target.current = 100;
      else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") target.current = ybRef.current;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const aim = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    target.current = ((e.clientX - r.left) / r.width) * 100;
  };

  const i = Math.min(shots.length, PHOTOS - 1);
  const count = shots.length < PHOTOS ? countdown(now, i) : 0;
  const late = live ? lateAt(plan, now) : null;
  const members = plan[0]!.slots.map((_, k) => memberX(plan, k, now));
  const line = late?.stepped ? [...members, late.x] : members;
  const bumped = (x: number) => FIGURE_W - Math.abs(x - yb) > TOUCH;
  const lastShot = shots.at(-1);
  const walking = Math.abs(target.current - yb) > 1 && !outcome;
  // Just after a click, the line holds still for the photo.
  const justShot = shots.length > 0 && now - shutterAt(shots.length - 1) < 0.45;

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        aim(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === "touch") aim(e);
      }}
    >
      {/* The backdrop: bunting and the event banner behind the line. */}
      <div className="pointer-events-none absolute inset-x-[3%] top-[46%] h-[16%] rounded-t-[1cqw] bg-[#e8d9b8] shadow-[inset_0_-1cqw_0_rgba(40,14,6,0.12)]">
        <div className="absolute inset-x-0 top-0 flex justify-around">
          {Array.from({ length: 11 }, (_, k) => (
            <span
              key={k}
              className="h-0 w-0 border-x-[2cqw] border-t-[3cqw] border-x-transparent"
              style={{ borderTopColor: k % 2 ? colour : "#c9a24a" }}
            />
          ))}
        </div>
        <p className="absolute inset-x-0 bottom-[14%] text-center font-display text-[3.6cqw] font-bold text-[var(--ink)] italic">
          {T.banner[lang]}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[62%] bottom-0 bg-[linear-gradient(180deg,#8a5a32,#6e4524)]" />

      {/* The latecomer, wandering behind the line until they make for a gap. */}
      {late && !late.stepped && (
        <Figure x={late.x} lift={6} className={late.heading ? "opacity-90" : "opacity-60"}>
          <PuppetAvatar config={crew[MEMBERS]!} anim="rod-wiggle" />
          {late.heading && (
            <span className="hold-glow absolute top-[2%] left-1/2 -translate-x-1/2 rounded-full bg-[var(--sambal)] px-[1.4cqw] font-display text-[3.6cqw] font-bold text-[var(--cream)]">
              !
            </span>
          )}
        </Figure>
      )}

      {line.map((x, k) => {
        const shoved = bumped(x) && justShot && lastShot === "elbow";
        return (
          <Figure
            key={k}
            x={x}
            tilt={shoved ? (x < yb ? -12 : 12) : 0}
            className={k >= members.length ? "press-in" : ""}
          >
            <PuppetAvatar
              config={shoved ? { ...crew[k]!, expression: "angry_shout" } : crew[k]!}
              anim={justShot && lastShot === "good" ? "hop" : shoved ? "rod-wiggle" : "idle"}
            />
          </Figure>
        );
      })}

      {/* The YB, in front, trying to get into the shot. */}
      <Figure x={yb} lift={-1.5} className="z-10">
        <span
          className="absolute bottom-[0%] left-1/2 h-[6%] w-[80%] -translate-x-1/2 rounded-[50%] opacity-60"
          style={{ background: colour }}
        />
        <PuppetAvatar
          config={
            justShot
              ? { ...candidate.puppet, expression: lastShot === "good" ? "big_laugh" : "shocked_o" }
              : candidate.puppet
          }
          anim={
            justShot ? (lastShot === "good" ? "hop" : "still") : walking ? "rod-wiggle" : "idle"
          }
          label={candidate.name}
        />
        <span
          className="absolute top-[12%] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[1.8cqw] border-t-[2.6cqw] border-x-transparent"
          style={{ borderTopColor: colour }}
        />
      </Figure>

      {/* The camera's viewfinder over the line while it counts down. */}
      {live && count > 0 && !outcome && (
        <div className="pointer-events-none absolute inset-x-[2%] top-[46%] bottom-[10%] z-10">
          {[
            "top-0 left-0 border-t-[0.8cqw] border-l-[0.8cqw]",
            "top-0 right-0 border-t-[0.8cqw] border-r-[0.8cqw]",
            "bottom-0 left-0 border-b-[0.8cqw] border-l-[0.8cqw]",
            "bottom-0 right-0 border-b-[0.8cqw] border-r-[0.8cqw]",
          ].map((c) => (
            <span key={c} className={`absolute h-[10%] w-[10%] border-[#fbf6ea] ${c}`} />
          ))}
        </div>
      )}

      {/* The photographer's countdown, and the flash. */}
      {live && count > 0 && !outcome && (
        <div className="pointer-events-none absolute top-[91%] left-1/2 z-20 flex -translate-x-1/2 items-center gap-[1.4cqw] rounded-full bg-[#2b2522]/90 px-[2.4cqw] py-[0.4cqw]">
          <span className="text-[4.4cqw]">📷</span>
          <span
            key={`count-${i}-${count}`}
            className="count-pop font-tally text-[6cqw] leading-none text-[#ffd77a]"
          >
            {count}
          </span>
        </div>
      )}
      {flash > 0 && (
        <div
          key={`flash-${flash}`}
          className="camera-flash pointer-events-none absolute inset-0 z-30 bg-white"
        />
      )}

      {/* The photos taken so far. */}
      <div className="pointer-events-none absolute top-[40%] left-[3%] flex items-center gap-[1cqw]">
        <span className="rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
          {T.count[lang]}
        </span>
        {Array.from({ length: PHOTOS }, (_, k) => (
          <span
            key={k}
            className={`flex h-[5cqw] w-[6cqw] items-center justify-center rounded-[0.4cqw] border-[0.5cqw] border-[#fbf6ea] font-display text-[3cqw] font-bold shadow-[0_0.4cqw_0.6cqw_rgba(40,14,6,0.4)] ${
              shots[k] === "good"
                ? "bg-[#3f8f4f] text-[var(--cream)]"
                : shots[k] === "elbow"
                  ? "bg-[var(--sambal)] text-[var(--cream)]"
                  : "bg-[#6b6965]/60"
            }`}
          >
            {shots[k] === "good" ? "✓" : shots[k] === "elbow" ? "✗" : ""}
          </span>
        ))}
      </div>

      {lastShot && justShot && !outcome && (
        <span
          key={`pop-${shots.length}`}
          className={`combo-pop pointer-events-none absolute top-[40%] right-[3%] rounded-sm px-[2cqw] py-[0.4cqw] font-display text-[4.4cqw] font-bold whitespace-nowrap italic ${
            lastShot === "good"
              ? "bg-[#efe1c3] text-[var(--ink)]"
              : "bg-[var(--sambal)] text-[var(--cream)]"
          }`}
        >
          {lastShot === "good" ? T.good[lang] : T.elbow[lang]}
        </span>
      )}

      {live && !outcome && now < 1.2 && (
        <span className="pointer-events-none absolute top-[96%] left-1/2 -translate-x-1/2 rounded-sm bg-[#2b2522]/80 px-[2cqw] py-[0.5cqw] font-tally text-[3.2cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
          {T.dragHint[lang]}
        </span>
      )}

      {outcome && (
        <p className="combo-pop pointer-events-none absolute top-[52%] left-1/2 z-40 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          {outcome === "won" ? T.won[lang] : T.lost[lang]}
        </p>
      )}
    </div>
  );
}

/** 3, 2, 1 before photo `i`'s click; 0 while the line is still shuffling or after. */
function countdown(t: number, i: number): number {
  const rel = t - i * PHOTO_S;
  if (rel < SHUFFLE_S || rel >= SHUTTER_S || photoAt(t) !== i) return 0;
  const step = (SHUTTER_S - SHUFFLE_S) / 3;
  return 3 - Math.floor((rel - SHUFFLE_S) / step);
}

/** One figure in the photo, centred on `x`, standing on the line (or `lift` % behind it).
 *  The puppet is drawn wider than the space it takes in the line, as people crowd in. */
function Figure({
  x,
  lift = 0,
  tilt = 0,
  className = "",
  children,
}: {
  x: number;
  lift?: number;
  tilt?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        left: `${x - PUPPET_W / 2}%`,
        width: `${PUPPET_W}%`,
        top: `${FEET_Y - FIGURE_H - lift}%`,
        height: `${FIGURE_H}%`,
      }}
    >
      <div
        className="relative h-full w-full transition-transform duration-150"
        style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% 100%" }}
      >
        {children}
      </div>
    </div>
  );
}
