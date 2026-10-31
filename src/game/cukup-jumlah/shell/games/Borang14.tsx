import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  BEATS_PER_BAR,
  HIT_BEAT_IN_BAR,
  hitWindows,
  judgeTap,
  nearestTarget,
} from "../../beat/timing";
import { canang, gendangHit, gendangMiss, gong, kesi } from "../../beat/wayangSounds";
import { PARTIES, type Party } from "../../creator/candidate";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT, UI, fill, type Lang } from "../strings";
import {
  EMPTY_TALLY,
  ballotAt,
  ballotSequence,
  ballotTarget,
  verdict,
  type Ballot,
  type Tally,
} from "./borang14Rules";

const T = GAME_TEXT.borang14;

export function Borang14({
  clock,
  candidate,
  lang,
  talent,
  bars,
  offsetMs,
  onBeat,
  onJudge,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onBeat, onJudge, onFinish });
  callbacks.current = { onBeat, onJudge, onFinish };
  const mesra = talent === "mesra_rakyat";
  const [ballots] = useState(() => ballotSequence(bars));
  const [rivalParty] = useState(() => {
    const others = PARTIES.filter((p) => p.id !== candidate.party);
    return others[Math.floor(Math.random() * others.length)] ?? PARTIES[1]!;
  });
  const yourParty = PARTIES.find((p) => p.id === candidate.party) ?? PARTIES[0]!;

  const [showing, setShowing] = useState(-1);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);
  const [wrong, setWrong] = useState(0);
  const tallyRef = useRef<Tally>(EMPTY_TALLY);
  const judged = useRef(new Set<number>());
  const done = useRef(false);

  const record = (patch: Partial<Tally>) => {
    const next = { ...tallyRef.current, ...patch };
    tallyRef.current = next;
    setTally(next);
  };

  useEffect(() => {
    const lastBeat = (bars + 1) * BEATS_PER_BAR;
    void clock.begin((index, when, out) => {
      if (index >= lastBeat) return;
      const inBar = index % BEATS_PER_BAR;
      if (inBar === 0) gong(clock.ctx, out, when);
      else if (inBar === HIT_BEAT_IN_BAR) canang(clock.ctx, out, when);
      else kesi(clock.ctx, out, when);
    });

    const finish = (success: boolean) => {
      if (done.current) return;
      done.current = true;
      clock.halt();
      callbacks.current.onBeat(0);
      callbacks.current.onFinish(success);
    };

    let raf = 0;
    const frame = () => {
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const pos = (clock.heardTime() - clock.start) / clock.spb;
      callbacks.current.onBeat(
        pos < 0 || pos >= lastBeat ? 0 : (Math.floor(pos) % BEATS_PER_BAR) + 1,
      );
      setShowing(ballotAt(pos, bars));

      // A ballot is settled once its beat-4 window has passed without a decisive tap.
      const now = clock.ctx.currentTime - offsetMs / 1000;
      const goodWindow = hitWindows(mesra).good;
      ballots.forEach((ballot, b) => {
        if (judged.current.has(b) || clock.beatTime(ballotTarget(b)) + goodWindow >= now) return;
        judged.current.add(b);
        const t = tallyRef.current;
        if (ballot === "rival") {
          record({ rival: t.rival + 1, judged: t.judged + 1 });
          callbacks.current.onJudge("good");
        } else {
          record({ mistakes: t.mistakes + 1, judged: t.judged + 1 });
          callbacks.current.onJudge("miss");
        }
      });

      const v = verdict(tallyRef.current, bars);
      if (v !== "counting") return finish(v === "won");
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, ballots, mesra, offsetMs]);

  const tap = (eventTimeStamp: number) => {
    if (done.current || !clock.running) return;
    const corrected = clock.tapTime(eventTimeStamp) - offsetMs / 1000;
    const k = nearestTarget(corrected, clock.start, BEATS_PER_BAR, HIT_BEAT_IN_BAR, clock.spb);
    const b = (k - HIT_BEAT_IN_BAR) / BEATS_PER_BAR - 1;
    if (b < 0 || b >= bars || judged.current.has(b)) return;
    const t = tallyRef.current;

    if (ballots[b] === "rival") {
      // Tallying a rival's vote for yourself is a miscount, whenever in that bar it happens.
      judged.current.add(b);
      record({ rival: t.rival + 1, mistakes: t.mistakes + 1, judged: t.judged + 1 });
      setWrong((n) => n + 1);
      gendangMiss(clock.ctx, clock.out, clock.ctx.currentTime);
      callbacks.current.onJudge("miss");
      return;
    }

    const { grade } = judgeTap(corrected, clock.beatTime(k), hitWindows(mesra));
    if (grade === "miss") {
      gendangMiss(clock.ctx, clock.out, clock.ctx.currentTime);
    } else {
      judged.current.add(b);
      record({ yours: t.yours + 1, judged: t.judged + 1 });
      gendangHit(clock.ctx, clock.out, clock.ctx.currentTime, grade === "perfect");
    }
    callbacks.current.onJudge(grade);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.code !== "Space" && e.code !== "Enter")) return;
      e.preventDefault();
      tap(e.timeStamp);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    tap(e.timeStamp);
  };

  const current = showing >= 0 ? ballots[showing] : undefined;
  const finished = verdict(tally, bars) === "won";

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={UI.tapPad[lang]}
      onPointerDown={onPointerDown}
      className="absolute inset-0 z-10 touch-manipulation select-none"
    >
      {current && (
        <BallotPaper
          key={showing}
          marked={current}
          lang={lang}
          you={{ name: candidate.name, party: yourParty }}
          rival={{ name: fill(T.rivalName[lang], { party: rivalParty.name }), party: rivalParty }}
          helper={talent === "pakar_kira"}
        />
      )}
      {wrong > 0 && (
        <span
          key={wrong}
          className="stamp-pop absolute top-[47%] left-1/2 z-20 rounded-sm bg-[var(--sambal)] px-[3cqw] py-[1cqw] font-display text-[6cqw] font-bold text-[var(--cream)] italic"
        >
          {T.wrong[lang]}
        </span>
      )}
      <TallySheet
        lang={lang}
        tally={tally}
        yourParty={yourParty}
        rivalParty={rivalParty}
        signed={finished}
      />
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
  marked: Ballot;
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
    <div className="ballot-show absolute top-[33%] left-1/2 w-[66%] -translate-x-1/2 rounded-sm bg-[#fdfaf2] px-[3cqw] pt-[2cqw] pb-[2.4cqw] text-[var(--ink)] shadow-[0_8px_14px_rgba(40,14,6,0.4)]">
      <p className="text-center font-tally text-[2.8cqw] tracking-[0.18em] text-[#6a4a32] uppercase">
        {GAME_TEXT.borang14.ballot[lang]}
      </p>
      {rows.map(({ row, x }) => (
        <div
          key={row.party.id}
          className="mt-[1.4cqw] flex items-center gap-[2cqw] border-t border-dashed border-[#b9a07a] pt-[1.4cqw]"
        >
          <span
            className="flex h-[8cqw] w-[8cqw] shrink-0 items-center justify-center rounded-sm text-[5cqw]"
            style={{ backgroundColor: row.party.colour }}
            aria-hidden="true"
          >
            {row.party.icon}
          </span>
          <span className="min-w-0 flex-1 truncate text-[3.8cqw] leading-tight font-bold">
            {row.name}
          </span>
          <span className="relative flex h-[8cqw] w-[8cqw] shrink-0 items-center justify-center border-2 border-[var(--ink)]">
            {x && (
              <span className="font-display text-[8cqw] leading-none font-bold text-[#1f3a8a]">
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
          🧮 {marked === "yours" ? GAME_TEXT.borang14.yours[lang] : GAME_TEXT.borang14.rival[lang]}
        </p>
      )}
    </div>
  );
}

/** Five-bar gate tally marks, the way counts are kept on paper. */
function TallyMarks({ n }: { n: number }) {
  const groups = Array.from({ length: Math.ceil(n / 5) }, (_, g) => Math.min(5, n - g * 5));
  return (
    <svg viewBox="0 0 60 22" className="h-[5.5cqw] w-auto" aria-label={String(n)}>
      {groups.map((count, g) => (
        <g
          key={g}
          transform={`translate(${g * 30} 0)`}
          stroke="#1f3a8a"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          {Array.from({ length: Math.min(4, count) }, (_, i) => (
            <line key={i} x1={3 + i * 5} x2={3 + i * 5} y1="3" y2="19" />
          ))}
          {count === 5 && <line x1="0" x2="22" y1="17" y2="5" />}
        </g>
      ))}
    </svg>
  );
}

function TallySheet({
  lang,
  tally,
  yourParty,
  rivalParty,
  signed,
}: {
  lang: Lang;
  tally: Tally;
  yourParty: Party;
  rivalParty: Party;
  signed: boolean;
}) {
  return (
    <div className="absolute right-[4%] bottom-[4%] w-[50%] rotate-[2deg] rounded-sm bg-[#efe1c3] px-[2.6cqw] py-[2cqw] text-[var(--ink)] shadow-[0_6px_10px_rgba(40,14,6,0.35)]">
      <p className="font-tally text-[2.8cqw] tracking-[0.12em] text-[var(--sambal)] uppercase">
        {GAME_TEXT.borang14.sheet[lang]}
      </p>
      {[
        { party: yourParty, n: tally.yours },
        { party: rivalParty, n: tally.rival },
      ].map(({ party, n }) => (
        <div key={party.id} className="mt-[1cqw] flex items-center gap-[1.5cqw]">
          <span className="text-[4cqw]" aria-hidden="true">
            {party.icon}
          </span>
          <span className="flex-1">
            <TallyMarks n={n} />
          </span>
          <span className="font-tally text-[4.4cqw]">{n}</span>
        </div>
      ))}
      <p
        className={`mt-[1cqw] border-t border-[#9b896a] pt-[0.8cqw] text-[2.6cqw] italic transition-opacity duration-300 ${
          signed ? "opacity-100" : "opacity-0"
        }`}
      >
        ✍️ {GAME_TEXT.borang14.signed[lang]}
      </p>
    </div>
  );
}
