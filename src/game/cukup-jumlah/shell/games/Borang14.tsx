import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BEATS_PER_BAR, HIT_BEAT_IN_BAR } from "../../beat/timing";
import { canang, gendangHit, gendangMiss, gong, kesi } from "../../beat/wayangSounds";
import { PARTIES, type Party } from "../../creator/candidate";
import { mistakesAllowed, type MicrogameProps } from "../microgame";
import { GAME_TEXT, fill, type Lang } from "../strings";
import {
  BALLOTS,
  EMPTY_COUNT,
  ballotSequence,
  pileForSwipe,
  sortBallot,
  sorted,
  verdict,
  type Count,
  type Pile,
} from "./borang14Rules";

const T = GAME_TEXT.borang14;
const FLY_MS = 160;

export function Borang14({
  clock,
  candidate,
  lang,
  talent,
  bars,
  onBeat,
  onTimeLeft,
  onJudge,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onBeat, onTimeLeft, onJudge, onFinish });
  callbacks.current = { onBeat, onTimeLeft, onJudge, onFinish };
  const allowed = mistakesAllowed(talent);
  // Six ballots need about a second each; one bar more than the shell's default.
  const timeBars = bars + 1;
  const [ballots] = useState(() => ballotSequence(BALLOTS));
  const [rivalParty] = useState(() => {
    const others = PARTIES.filter((p) => p.id !== candidate.party);
    return others[Math.floor(Math.random() * others.length)] ?? PARTIES[1]!;
  });
  const yourParty = PARTIES.find((p) => p.id === candidate.party) ?? PARTIES[0]!;

  const [live, setLive] = useState(false);
  const [count, setCount] = useState<Count>(EMPTY_COUNT);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<Pile | null>(null);
  const [wrong, setWrong] = useState(0);
  const [won, setWon] = useState(false);

  const countRef = useRef<Count>(EMPTY_COUNT);
  const liveRef = useRef(false);
  const busy = useRef(false);
  const done = useRef(false);
  const drag = useRef<{ x: number; width: number } | null>(null);

  const finish = (success: boolean) => {
    if (done.current) return;
    done.current = true;
    clock.halt();
    callbacks.current.onBeat(0);
    if (success) setWon(true);
    callbacks.current.onFinish(success);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Music and the countdown: a lead-in bar, then `timeBars` bars to sort every ballot.
  useEffect(() => {
    const lastBeat = (timeBars + 1) * BEATS_PER_BAR;
    void clock.begin((index, when, out) => {
      if (index >= lastBeat) return;
      const inBar = index % BEATS_PER_BAR;
      if (inBar === 0) gong(clock.ctx, out, when);
      else if (inBar === HIT_BEAT_IN_BAR) canang(clock.ctx, out, when);
      else kesi(clock.ctx, out, when);
    });

    let raf = 0;
    const frame = () => {
      if (done.current) return;
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const pos = (clock.heardTime() - clock.start) / clock.spb;
      callbacks.current.onBeat(
        pos < 0 || pos >= lastBeat ? 0 : (Math.floor(pos) % BEATS_PER_BAR) + 1,
      );
      const playPos = pos - BEATS_PER_BAR;
      if (playPos >= 0 && !liveRef.current) {
        liveRef.current = true;
        setLive(true);
      }
      callbacks.current.onTimeLeft?.(1 - Math.max(0, playPos) / (timeBars * BEATS_PER_BAR));
      if (playPos >= timeBars * BEATS_PER_BAR) {
        finishRef.current(verdict(countRef.current, BALLOTS, allowed, true) === "won");
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, timeBars, allowed]);

  const throwTo = (pile: Pile) => {
    if (!liveRef.current || done.current || busy.current) return;
    const index = sorted(countRef.current);
    const { count: next, correct } = sortBallot(countRef.current, ballots, index, pile);
    countRef.current = next;
    setCount(next);
    const now = clock.ctx.currentTime;
    if (!correct) {
      gendangMiss(clock.ctx, clock.out, now);
      setWrong((n) => n + 1);
      setDx(0);
      callbacks.current.onJudge("miss");
      if (verdict(next, BALLOTS, allowed, false) === "lost") finish(false);
      return;
    }
    gendangHit(clock.ctx, clock.out, now, true);
    callbacks.current.onJudge("perfect");
    busy.current = true;
    setFlying(pile);
    window.setTimeout(() => {
      busy.current = false;
      setFlying(null);
      setDx(0);
      if (verdict(countRef.current, BALLOTS, allowed, false) === "won") finishRef.current(true);
    }, FLY_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") throwTo("yours");
      else if (e.key === "ArrowRight") throwTo("rival");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!live || busy.current || done.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, width: e.currentTarget.offsetWidth };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) setDx(e.clientX - drag.current.x);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    if (!start) return;
    const pile = pileForSwipe(e.clientX - start.x, start.width);
    if (pile) throwTo(pile);
    else setDx(0);
  };

  const index = sorted(count);
  const current = index < BALLOTS ? ballots[index] : undefined;
  const helper = talent === "pakar_kira";
  const flyX = flying === "yours" ? "-140%" : flying === "rival" ? "140%" : null;

  return (
    <div className="absolute inset-0 z-10 select-none">
      {live && current && !won && (
        <div
          key={index}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="absolute top-[45%] left-[15%] w-[70%] cursor-grab touch-none"
          style={{
            transform: flyX
              ? `translateX(${flyX}) translateY(30%) rotate(${flying === "yours" ? -18 : 18}deg) scale(0.6)`
              : `translateX(${dx}px) rotate(${dx / 14}deg)`,
            opacity: flyX ? 0 : 1,
            transition: dragging ? "none" : `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms`,
          }}
        >
          <div className="ballot-show">
            <BallotPaper
              marked={current}
              lang={lang}
              you={{ name: candidate.name, party: yourParty }}
              rival={{
                name: fill(T.rivalName[lang], { party: rivalParty.name }),
                party: rivalParty,
              }}
              helper={helper}
            />
          </div>
        </div>
      )}

      {live && !won && (
        <p className="absolute top-[40.5%] left-1/2 -translate-x-1/2 font-tally text-[3.4cqw] text-[#6a4a32]">
          {fill(T.left[lang], { n: BALLOTS - index })}
        </p>
      )}

      {wrong > 0 && (
        <span
          key={wrong}
          className="stamp-pop absolute top-[50%] left-1/2 z-20 rounded-sm bg-[var(--sambal)] px-[3cqw] py-[1cqw] font-display text-[6cqw] font-bold whitespace-nowrap text-[var(--cream)] italic"
        >
          {T.wrong[lang]}
        </span>
      )}

      <PileTray
        side="left"
        party={yourParty}
        label={T.yours[lang]}
        n={count.yours}
        showCount={helper}
        glow={flying === "yours"}
        onTap={() => throwTo("yours")}
      />
      <PileTray
        side="right"
        party={rivalParty}
        label={T.rival[lang]}
        n={count.rival}
        showCount={helper}
        glow={flying === "rival"}
        onTap={() => throwTo("rival")}
      />

      {won && (
        <p className="absolute bottom-[31%] left-[7%] w-[86%] rotate-[-2deg] rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.6cqw] text-center text-[3.2cqw] font-semibold text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          ✍️ {T.signed[lang]}
        </p>
      )}
    </div>
  );
}

type Row = { name: string; party: Party };

/** A paper ballot: two candidates, the X in the box of the one voted for. */
function BallotPaper({
  marked,
  lang,
  you,
  rival,
  helper,
}: {
  marked: Pile;
  lang: Lang;
  you: Row;
  rival: Row;
  helper: boolean;
}) {
  const rows: { row: Row; x: boolean }[] = [
    { row: you, x: marked === "yours" },
    { row: rival, x: marked === "rival" },
  ];
  return (
    <div className="rounded-sm bg-[#fdfaf2] px-[3cqw] pt-[2cqw] pb-[2.4cqw] text-[var(--ink)] shadow-[0_10px_16px_rgba(40,14,6,0.4)]">
      <p className="text-center font-tally text-[2.8cqw] tracking-[0.18em] text-[#6a4a32] uppercase">
        {T.ballot[lang]}
      </p>
      {rows.map(({ row, x }) => (
        <div
          key={row.party.id}
          className="mt-[1.4cqw] flex items-center gap-[2cqw] border-t border-dashed border-[#b9a07a] pt-[1.4cqw]"
        >
          <span
            className="flex h-[9cqw] w-[9cqw] shrink-0 items-center justify-center rounded-sm text-[5.4cqw]"
            style={{ backgroundColor: row.party.colour }}
            aria-hidden="true"
          >
            {row.party.icon}
          </span>
          <span className="min-w-0 flex-1 truncate text-[4cqw] leading-tight font-bold">
            {row.name}
          </span>
          <span className="flex h-[9cqw] w-[9cqw] shrink-0 items-center justify-center border-2 border-[var(--ink)]">
            {x && (
              <span className="font-display text-[9cqw] leading-none font-bold text-[#1f3a8a]">
                ✗
              </span>
            )}
          </span>
        </div>
      ))}
      {helper && (
        <p
          className={`mt-[1.6cqw] text-center text-[3.2cqw] font-bold ${
            marked === "yours" ? "text-[#2f6b2f]" : "text-[var(--sambal)]"
          }`}
        >
          🧮 {marked === "yours" ? `← ${T.yours[lang]}` : `${T.rival[lang]} →`}
        </p>
      )}
    </div>
  );
}

/** Five-bar gate tally marks, the way counts are kept on paper. */
function TallyMarks({ n }: { n: number }) {
  const groups = Array.from({ length: Math.ceil(n / 5) }, (_, g) => Math.min(5, n - g * 5));
  return (
    <svg viewBox="0 0 60 22" className="h-[5cqw] w-auto" aria-hidden="true">
      {groups.map((c, g) => (
        <g
          key={g}
          transform={`translate(${g * 30} 0)`}
          stroke="#1f3a8a"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          {Array.from({ length: Math.min(4, c) }, (_, i) => (
            <line key={i} x1={3 + i * 5} x2={3 + i * 5} y1="3" y2="19" />
          ))}
          {c === 5 && <line x1="0" x2="22" y1="17" y2="5" />}
        </g>
      ))}
    </svg>
  );
}

/** A tray the ballots land in: the player's party on the left, the rival on the right. */
function PileTray({
  side,
  party,
  label,
  n,
  showCount,
  glow,
  onTap,
}: {
  side: "left" | "right";
  party: Party;
  label: string;
  n: number;
  showCount: boolean;
  glow: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className={`absolute bottom-[4%] flex h-[22%] w-[44%] flex-col items-center justify-end gap-[1cqw] rounded-sm border-[0.8cqw] bg-[#efe1c3]/90 pb-[2cqw] text-[var(--ink)] shadow-[0_6px_10px_rgba(40,14,6,0.35)] transition-transform duration-150 ${
        side === "left" ? "left-[4%]" : "right-[4%]"
      } ${glow ? "scale-105" : ""}`}
      style={{ borderColor: party.colour }}
    >
      <span
        className="mb-auto -mt-[5cqw] flex h-[12cqw] w-[12cqw] items-center justify-center rounded-full text-[7cqw] shadow-[0_3px_6px_rgba(40,14,6,0.35)]"
        style={{ backgroundColor: party.colour }}
        aria-hidden="true"
      >
        {party.icon}
      </span>
      <span className="font-tally text-[3.2cqw] tracking-[0.1em] uppercase">
        {side === "left" ? `← ${label}` : `${label} →`}
      </span>
      <span className="flex h-[6cqw] items-center gap-[1.5cqw]">
        <TallyMarks n={n} />
        {showCount && <span className="font-tally text-[4.4cqw]">{n}</span>}
      </span>
    </button>
  );
}
