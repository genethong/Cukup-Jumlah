import { useEffect, useRef, useState } from "react";
import { crowdCheer, gendangHit, gendangMiss, shutter, tick } from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import { PuppetCameo } from "../../puppet/PuppetAvatar";
import { mistakesAllowed, type MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  FIGURE_W,
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
/** Where the line stands: the figures' feet, in % of the stage height. */
const FEET_Y = 84;
const FIGURE_H = 24;

type Shot = "good" | "elbow";

export function RebutKamera(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent);
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8a1c19";

  const [plan] = useState(() => planPhotos());
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

      {/* The latecomer, waiting behind a gap. */}
      {late && !late.stepped && (
        <div
          className="pointer-events-none absolute opacity-60"
          style={{
            left: `${late.x - FIGURE_W / 2}%`,
            width: `${FIGURE_W}%`,
            top: `${FEET_Y - FIGURE_H - 7}%`,
            height: `${FIGURE_H}%`,
          }}
        >
          <Colleague variant={3} colour={colour} tilt={0} />
          <span className="hold-glow absolute -top-[12%] left-1/2 -translate-x-1/2 rounded-full bg-[var(--sambal)] px-[1.2cqw] font-display text-[3.4cqw] font-bold text-[var(--cream)]">
            !
          </span>
        </div>
      )}

      {line.map((x, k) => (
        <div
          key={k}
          className={`pointer-events-none absolute ${k >= members.length ? "press-in" : ""}`}
          style={{
            left: `${x - FIGURE_W / 2}%`,
            width: `${FIGURE_W}%`,
            top: `${FEET_Y - FIGURE_H}%`,
            height: `${FIGURE_H}%`,
          }}
        >
          <Colleague
            variant={k}
            colour={colour}
            tilt={bumped(x) && justShot && lastShot === "elbow" ? (x < yb ? -14 : 14) : 0}
          />
        </div>
      ))}

      {/* The YB, in front, trying to get into the shot. */}
      <div
        className="pointer-events-none absolute z-10"
        style={{
          left: `${yb - FIGURE_W / 2}%`,
          width: `${FIGURE_W}%`,
          top: `${FEET_Y - FIGURE_H + 1}%`,
          height: `${FIGURE_H}%`,
        }}
      >
        <span
          className="absolute -top-[16%] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[1.6cqw] border-t-[2.2cqw] border-x-transparent"
          style={{ borderTopColor: colour }}
        />
        <span className="absolute -bottom-[3%] left-1/2 h-[6%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[#2b2522]/35" />
        <div className="absolute top-0 left-1/2 aspect-square w-[92%] -translate-x-1/2 overflow-hidden rounded-full">
          <PuppetCameo
            config={
              justShot
                ? {
                    ...candidate.puppet,
                    expression: lastShot === "good" ? "big_laugh" : "shocked_o",
                  }
                : candidate.puppet
            }
            className="h-full w-full scale-110"
          />
        </div>
        <svg
          viewBox="0 0 40 60"
          className="absolute bottom-0 left-0 h-[62%] w-full"
          aria-hidden="true"
        >
          <path d="M8 4 Q20 0 32 4 L34 36 H6 Z" fill={colour} />
          <path d="M8 6 L4 32" stroke={colour} strokeWidth="6" strokeLinecap="round" />
          <path d="M32 6 L36 32" stroke={colour} strokeWidth="6" strokeLinecap="round" />
          <rect x="10" y="36" width="8" height="22" rx="2" fill="#3a3f46" />
          <rect x="22" y="36" width="8" height="22" rx="2" fill="#3a3f46" />
        </svg>
      </div>

      {/* The photographer's countdown, and the flash. */}
      {live && count > 0 && !outcome && (
        <div className="pointer-events-none absolute top-[88%] left-1/2 z-20 flex -translate-x-1/2 items-center gap-[1.4cqw] rounded-full bg-[#2b2522]/90 px-[2.4cqw] py-[0.4cqw]">
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
        <span className="pointer-events-none absolute top-[93%] left-1/2 -translate-x-1/2 rounded-sm bg-[#2b2522]/80 px-[2cqw] py-[0.5cqw] font-tally text-[3.2cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
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

/** A party colleague in the line: cream baju, a party sash, shadow-puppet head. */
function Colleague({ variant, colour, tilt }: { variant: number; colour: string; tilt: number }) {
  const skin = ["#5a3a24", "#7a5034", "#9a6a44", "#6a4429", "#84583a"][variant % 5]!;
  return (
    <svg
      viewBox="0 0 40 80"
      className="h-full w-full overflow-visible transition-transform duration-150"
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% 100%" }}
      aria-hidden="true"
    >
      <circle cx="20" cy="14" r="10" fill={skin} />
      {variant % 3 === 0 && <path d="M10 10 Q20 0 30 10 Z" fill="#2b2522" />}
      {variant % 3 === 1 && <rect x="11" y="3" width="18" height="7" rx="2" fill="#2b2522" />}
      {variant % 3 === 2 && <path d="M9 12 Q20 -2 31 12 L31 22 Q20 18 9 22 Z" fill="#2b2522" />}
      <path d="M8 26 Q20 22 32 26 L34 56 H6 Z" fill="#f3ebdf" stroke="#c9bfae" />
      <path d="M10 26 L30 52" stroke={colour} strokeWidth="5" />
      <path d="M8 28 L5 52" stroke="#f3ebdf" strokeWidth="6" strokeLinecap="round" />
      <path d="M32 28 L35 52" stroke="#f3ebdf" strokeWidth="6" strokeLinecap="round" />
      <rect x="10" y="56" width="8" height="22" rx="2" fill="#3a3f46" />
      <rect x="22" y="56" width="8" height="22" rx="2" fill="#3a3f46" />
    </svg>
  );
}
