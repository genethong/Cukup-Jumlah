import { useEffect, useRef, useState, type PointerEvent } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import {
  gendangDum,
  gendangMiss,
  gendangTak,
  gong,
  kesi,
  paperSlap,
  tick,
} from "../../beat/wayangSounds";
import { PARTIES, type Party } from "../../creator/candidate";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT, fill, type Lang } from "../strings";
import {
  BALLOTS,
  COMBO_AT,
  EMPTY_COUNT,
  ballotSequence,
  penaltySeconds,
  pileForSwipe,
  sortBallot,
  sorted,
  verdict,
  type Count,
  type Pile,
} from "./borang14Rules";

const T = GAME_TEXT.borang14;
const FLY_MS = 140;
/** Ten ballots need about a second each: two bars more than the shell's default. */
const EXTRA_BARS = 2;
/** The fuse starts ticking with this many seconds left. */
const TICK_FROM_S = 2.5;

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not every browser allows vibration; it's only a nicety.
  }
}

export function Borang14({
  clock,
  candidate,
  lang,
  talent,
  bars,
  onTimeLeft,
  onJudge,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onTimeLeft, onJudge, onFinish });
  callbacks.current = { onTimeLeft, onJudge, onFinish };
  const freeMistakes = talent === "mesra_rakyat" ? 1 : 0;
  const [ballots] = useState(() => ballotSequence(BALLOTS));
  const [rivalParty] = useState(() => {
    const others = PARTIES.filter((p) => p.id !== candidate.party);
    return others[Math.floor(Math.random() * others.length)] ?? PARTIES[1]!;
  });
  const yourParty = PARTIES.find((p) => p.id === candidate.party) ?? PARTIES[0]!;

  const [live, setLive] = useState(false);
  const [count, setCount] = useState<Count>(EMPTY_COUNT);
  const [flying, setFlying] = useState<Pile | null>(null);
  const [wrong, setWrong] = useState(0);
  const [won, setWon] = useState(false);

  const countRef = useRef<Count>(EMPTY_COUNT);
  const liveRef = useRef(false);
  const busy = useRef(false);
  const done = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; width: number } | null>(null);

  const finish = (success: boolean) => {
    if (done.current) return;
    done.current = true;
    clock.halt();
    if (success) setWon(true);
    callbacks.current.onFinish(success);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Groove and countdown. Bar 0 is the dalang's call; then the fuse burns for the time limit.
  useEffect(() => {
    const limitS = (bars + EXTRA_BARS) * BEATS_PER_BAR * clock.spb;
    void clock.begin((index, when, out) => {
      if (index === 0) gong(clock.ctx, out, when);
      if (index < BEATS_PER_BAR) return;
      if (index % 2 === 0) gendangDum(clock.ctx, out, when);
      else gendangTak(clock.ctx, out, when);
      kesi(clock.ctx, out, when + clock.spb / 2);
    });

    let raf = 0;
    let nextTick = 0;
    const frame = () => {
      if (done.current) return;
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const playS = clock.heardTime() - clock.start - BEATS_PER_BAR * clock.spb;
      if (playS >= 0 && !liveRef.current) {
        liveRef.current = true;
        setLive(true);
      }
      const leftS =
        limitS - Math.max(0, playS) - penaltySeconds(countRef.current.mistakes, freeMistakes);
      callbacks.current.onTimeLeft?.(leftS / limitS, Math.max(0, leftS));
      if (liveRef.current && leftS <= TICK_FROM_S && clock.ctx.currentTime >= nextTick) {
        tick(clock.ctx, clock.out, clock.ctx.currentTime);
        nextTick = clock.ctx.currentTime + clock.spb / 2;
      }
      if (leftS <= 0) {
        finishRef.current(verdict(countRef.current, BALLOTS, true) === "won");
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, freeMistakes]);

  const setCardX = (dx: number, animate: boolean) => {
    const el = card.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${FLY_MS}ms ease-out` : "none";
    el.style.transform = `translateX(${dx}px) rotate(${dx / 12}deg)`;
  };

  const throwTo = (pile: Pile) => {
    if (!liveRef.current || done.current || busy.current) return;
    const index = sorted(countRef.current);
    const { count: next, correct } = sortBallot(countRef.current, ballots, index, pile);
    countRef.current = next;
    setCount(next);
    const now = clock.ctx.currentTime;
    if (!correct) {
      gendangMiss(clock.ctx, clock.out, now);
      buzz(60);
      setWrong((n) => n + 1);
      setCardX(0, true);
      callbacks.current.onJudge("miss");
      return;
    }
    paperSlap(clock.ctx, clock.out, now);
    buzz(12);
    callbacks.current.onJudge("perfect");
    busy.current = true;
    setFlying(pile);
    window.setTimeout(() => {
      busy.current = false;
      setFlying(null);
      if (verdict(countRef.current, BALLOTS, false) === "won") finishRef.current(true);
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

  // The card follows the finger by writing its transform directly: no re-render per move.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!liveRef.current || busy.current || done.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; dragging still works.
    }
    drag.current = { x: e.clientX, width: e.currentTarget.offsetWidth };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) setCardX(e.clientX - drag.current.x, false);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const pile = pileForSwipe(e.clientX - start.x, start.width);
    if (pile) throwTo(pile);
    else setCardX(0, true);
  };

  const index = sorted(count);
  const current = index < BALLOTS ? ballots[index] : undefined;
  const helper = talent === "pakar_kira";
  const waiting = BALLOTS - index - 1;

  return (
    <div className="absolute inset-0 z-10 select-none">
      {/* The stack still to sort: paper edges behind the top ballot. */}
      {live && !won && (
        <div className="absolute top-[45%] left-[15%] w-[70%]">
          {Array.from({ length: Math.min(6, Math.max(0, waiting)) }, (_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 top-0 h-[24cqw] rounded-sm bg-[#f4ecdc] shadow-[0_2px_3px_rgba(40,14,6,0.25)]"
              style={{
                transform: `translate(${(i % 2 ? 1 : -1) * (0.6 + i * 0.3)}cqw, ${(i + 1) * 0.9}cqw) rotate(${(i % 2 ? 1 : -1) * (1 + i * 0.6)}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {live && current && !won && (
        <div
          key={index}
          ref={card}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="absolute top-[45%] left-[15%] w-[70%] cursor-grab touch-none"
        >
          <div
            key={wrong}
            className={`ballot-show ${wrong ? "ballot-shake" : ""}`}
            style={
              flying
                ? {
                    transform: `translate(${flying === "yours" ? "-60%" : "60%"}, 120%) rotate(${flying === "yours" ? -25 : 25}deg) scale(0.35)`,
                    opacity: 0,
                    transition: `transform ${FLY_MS}ms ease-in, opacity ${FLY_MS}ms ease-in`,
                  }
                : undefined
            }
          >
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
        <p className="absolute top-[40.5%] left-1/2 -translate-x-1/2 font-tally text-[3.6cqw] text-[#6a4a32]">
          {fill(T.left[lang], { n: BALLOTS - index })}
        </p>
      )}

      {count.streak >= COMBO_AT && !won && (
        <span
          key={`combo-${count.streak}`}
          className="combo-pop absolute top-[36%] right-[6%] z-20 font-display text-[7cqw] font-bold text-[var(--sambal)] italic drop-shadow-[0_2px_0_#fbf3e4]"
        >
          {fill(T.combo[lang], { n: count.streak })}
        </span>
      )}

      {wrong > 0 && (
        <span
          key={`wrong-${wrong}`}
          className="stamp-pop absolute top-[52%] left-1/2 z-20 rounded-sm bg-[var(--sambal)] px-[3cqw] py-[1cqw] font-display text-[6cqw] font-bold whitespace-nowrap text-[var(--cream)] italic"
        >
          {count.mistakes <= freeMistakes ? T.wrong[lang] : `${T.wrong[lang]} ${T.penalty[lang]}`}
        </span>
      )}

      <PileTray
        side="left"
        party={yourParty}
        label={T.yours[lang]}
        n={count.yours}
        mark="yours"
        bump={flying === "yours"}
        onTap={() => throwTo("yours")}
      />
      <PileTray
        side="right"
        party={rivalParty}
        label={T.rival[lang]}
        n={count.rival}
        mark="rival"
        bump={flying === "rival"}
        onTap={() => throwTo("rival")}
      />

      {won && (
        <p className="absolute top-[47%] left-[7%] w-[86%] rotate-[-2deg] rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.6cqw] text-center text-[3.4cqw] font-semibold text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          ✍️ {T.signed[lang]}
          <br />
          <span className="font-tally text-[4.4cqw] not-italic">
            {yourParty.icon} {count.yours} · {rivalParty.icon} {count.rival}
          </span>
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

/** A small sorted ballot lying on a pile, tilted a little differently each time. */
function MiniBallot({ i, mark }: { i: number; mark: Pile }) {
  const tilt = ((i * 37) % 11) - 5;
  const shift = ((i * 53) % 7) - 3;
  return (
    <div
      className="absolute left-1/2 h-[9cqw] w-[24cqw] rounded-[1px] border border-[#cdbb96] bg-[#fdfaf2] shadow-[0_1px_2px_rgba(40,14,6,0.3)]"
      style={{
        bottom: `${2 + i * 1.1}cqw`,
        transform: `translateX(calc(-50% + ${shift}cqw)) rotate(${tilt}deg)`,
      }}
    >
      <span
        className={`absolute right-[1.5cqw] font-display text-[4.4cqw] leading-none font-bold text-[#1f3a8a] ${
          mark === "yours" ? "top-[0.4cqw]" : "bottom-[0.2cqw]"
        }`}
      >
        ✗
      </span>
    </div>
  );
}

/** A tray the ballots land in: the player's party on the left, the rival on the right. */
function PileTray({
  side,
  party,
  label,
  n,
  mark,
  bump,
  onTap,
}: {
  side: "left" | "right";
  party: Party;
  label: string;
  n: number;
  mark: Pile;
  bump: boolean;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`${label}: ${n}`}
      className={`absolute bottom-[3%] h-[25%] w-[44%] rounded-sm border-[0.8cqw] bg-[#efe1c3]/90 text-[var(--ink)] shadow-[0_6px_10px_rgba(40,14,6,0.35)] transition-transform duration-100 ${
        side === "left" ? "left-[4%]" : "right-[4%]"
      } ${bump ? "scale-[1.06]" : ""}`}
      style={{ borderColor: party.colour }}
    >
      <span
        className="absolute -top-[5cqw] left-1/2 flex h-[11cqw] w-[11cqw] -translate-x-1/2 items-center justify-center rounded-full text-[6.4cqw] shadow-[0_3px_6px_rgba(40,14,6,0.35)]"
        style={{ backgroundColor: party.colour }}
        aria-hidden="true"
      >
        {party.icon}
      </span>
      <span className="absolute inset-x-0 top-[24%] bottom-[30%]">
        {Array.from({ length: n }, (_, i) => (
          <MiniBallot key={i} i={i} mark={mark} />
        ))}
      </span>
      <span className="absolute inset-x-0 bottom-[6%] flex items-baseline justify-center gap-[2cqw]">
        <span className="font-tally text-[3cqw] tracking-[0.1em] uppercase">
          {side === "left" ? `← ${label}` : `${label} →`}
        </span>
        <span className="font-tally text-[6cqw] leading-none">{n}</span>
      </span>
    </button>
  );
}
