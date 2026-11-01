import { useEffect, useRef, useState } from "react";
import {
  crowdCheer,
  gendangHit,
  gendangMiss,
  gendangTak,
  paperSlap,
} from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import { mistakesAllowed, type MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  BOX_HALF,
  FRESH_DESK,
  LETTER_HALF,
  NEEDED,
  RELOAD_S,
  STAMP_X,
  applyStamp,
  dealLetters,
  deskVerdict,
  letterX,
  markGone,
  newlyGone,
  sealedCount,
  stampAt,
  type Desk,
  type Kind,
} from "./copRules";

const T = GAME_TEXT.cop;
/** Made-up candidates, one per letter. */
const NAMES = [
  "Aminah Bakar",
  "Lim Wei Jie",
  "Rajesh Kumar",
  "Faridah Osman",
  "Wong Kok Seng",
  "Joseph Gani",
  "Devi Ramasamy",
  "Azlan Hamid",
  "Tan Mei Ling",
];
/** The belt's band and each letter's height, in % of the stage height. */
const BELT_TOP = 54;
const LETTER_H = 30;
/** The seal boxes' line: this far down a letter, and so down the stage. */
const BOX_AT = 0.68;
const BOX_Y = BELT_TOP + LETTER_H * BOX_AT;

type Pop = { id: number; text: string; good: boolean };

export function CopWatikah(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent);
  const party = PARTIES.find((p) => p.id === candidate.party);
  const colour = party?.colour ?? "#8a1c19";

  const [letters] = useState(() => dealLetters());
  const [rival] = useState(() => {
    const others = PARTIES.filter((p) => p.id !== candidate.party);
    return others[Math.floor(Math.random() * others.length)] ?? PARTIES[0]!;
  });
  const [names] = useState(() => [...NAMES].sort(() => Math.random() - 0.5));
  const [desk, setDesk] = useState<Desk>(FRESH_DESK);
  const [now, setNow] = useState(0);
  const [slam, setSlam] = useState(0);
  const [pop, setPop] = useState<Pop | null>(null);
  const deskRef = useRef(desk);
  const nowRef = useRef(0);
  const readyAt = useRef(0);

  const settle = (next: Desk, t: number) => {
    deskRef.current = next;
    setDesk(next);
    const v = deskVerdict(next, letters, allowed, false);
    if (v === "won") {
      crowdCheer(clock.ctx, clock.out, t + 0.05);
      end(true);
    } else if (v === "lost") {
      gendangMiss(clock.ctx, clock.out, t + 0.05);
      end(false);
    }
  };

  const { outcome, playing, end } = useRound(props, ({ t, playS, leftS }) => {
    nowRef.current = playS;
    setNow(playS);
    const gone = newlyGone(deskRef.current, letters, playS);
    if (gone.length) {
      gendangMiss(clock.ctx, clock.out, t);
      onJudge("miss");
      setPop({ id: Math.random(), text: T.gone[lang], good: false });
      settle(markGone(deskRef.current, gone), t);
    }
    if (deskVerdict(deskRef.current, letters, allowed, leftS <= 0) === "lost") end(false);
  });

  const stamp = () => {
    const at = nowRef.current;
    if (!playing() || at < readyAt.current) return;
    readyAt.current = at + RELOAD_S;
    setSlam((n) => n + 1);
    const t = clock.ctx.currentTime;
    const s = stampAt(deskRef.current, letters, at);
    const id = Math.random();
    if (s.kind === "empty" || s.kind === "again") {
      gendangTak(clock.ctx, clock.out, t);
      return;
    }
    paperSlap(clock.ctx, clock.out, t);
    if (s.kind === "clean" || s.kind === "ok") {
      gendangHit(clock.ctx, clock.out, t, s.kind === "clean");
      onJudge(s.kind === "clean" ? "perfect" : "good");
      setPop({ id, text: T[s.kind][lang], good: true });
    } else {
      gendangMiss(clock.ctx, clock.out, t);
      onJudge("miss");
      setPop({ id, text: T[s.kind][lang], good: false });
    }
    settle(applyStamp(deskRef.current, s), t);
  };

  const stampRef = useRef(stamp);
  stampRef.current = stamp;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) stampRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sealed = sealedCount(desk, letters);

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        stamp();
      }}
    >
      {/* The leader's desk, with the belt of letters running across it. */}
      <div className="pointer-events-none absolute inset-x-0 top-[48%] bottom-0 bg-[linear-gradient(180deg,#8a5a32,#6e4524)]" />
      <div
        className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(90deg,#3a3f46_0_3cqw,#4a5058_3cqw_6cqw)] shadow-[inset_0_1cqw_1cqw_rgba(0,0,0,0.35)]"
        style={{
          top: `${BELT_TOP - 2}%`,
          height: `${LETTER_H + 4}%`,
          backgroundPositionX: `${now * 30}cqw`,
        }}
      />

      {/* Where the seal comes down. */}
      <div
        className="pointer-events-none absolute w-[0.6cqw] bg-[#e0a33a]/70"
        style={{ left: `${STAMP_X}%`, top: `${BELT_TOP - 3}%`, height: `${LETTER_H + 6}%` }}
      />

      {letters.map((l, i) => {
        const x = letterX(l, now);
        if (x < -LETTER_HALF - 2 || x > 100 + LETTER_HALF + 2) return null;
        const seal = desk.seals.find((s) => s.letter === i);
        return (
          <Letter
            key={i}
            x={x}
            name={names[i % names.length]!}
            kind={l.kind}
            box={l.box}
            seal={seal?.off ?? null}
            gone={desk.gone.includes(i)}
            sealColour={colour}
            icon={party?.icon ?? "★"}
            head={l.kind === "rival" ? rival : (party ?? rival)}
            lang={lang}
          />
        );
      })}

      {/* The party seal, seen from above, hanging over the line the seal boxes run along.
          Each tap slams it down. */}
      <div
        className="pointer-events-none absolute z-20 aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${STAMP_X}%`, top: `${BOX_Y}%`, width: `${BOX_HALF * 2.3}cqw` }}
      >
        <div
          key={`slam-${slam}`}
          className={`flex h-full w-full items-center justify-center rounded-full border-[0.9cqw] shadow-[1.2cqw_1.6cqw_0.6cqw_rgba(20,8,2,0.35)] ${
            slam ? "seal-slam" : ""
          }`}
          style={{ borderColor: colour, background: `${colour}30` }}
        >
          <div className="h-[38%] w-[38%] rounded-full bg-[#5e3b20] shadow-[inset_-0.6cqw_-0.6cqw_0_rgba(0,0,0,0.3)]" />
        </div>
      </div>

      <div className="pointer-events-none absolute top-[40%] left-[3%] rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        {T.count[lang]} {sealed}/{NEEDED}
      </div>

      {pop && !outcome && (
        <span
          key={`pop-${pop.id}`}
          className={`combo-pop pointer-events-none absolute top-[40%] right-[3%] rounded-sm px-[2cqw] py-[0.4cqw] font-display text-[4.4cqw] font-bold whitespace-nowrap italic ${
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

/** One candidate's letter of authority, with its seal box and any seal that landed. */
function Letter({
  x,
  name,
  kind,
  box,
  seal,
  gone,
  sealColour,
  icon,
  head,
  lang,
}: {
  x: number;
  name: string;
  kind: Kind;
  box: number;
  seal: number | null;
  gone: boolean;
  sealColour: string;
  icon: string;
  /** The party on the letterhead: the YB's own, or a rival's on a letter to let go. */
  head: { name: string; colour: string; icon: string };
  lang: "ms" | "en";
}) {
  const colour = sealColour;
  const width = LETTER_HALF * 2;
  const inBox = seal !== null && Math.abs(seal) <= BOX_HALF;
  return (
    <div
      className={`pointer-events-none absolute flex flex-col items-center rounded-[0.6cqw] bg-[#fbf6ea] px-[1.2cqw] pt-[1.2cqw] shadow-[0_0.8cqw_1cqw_rgba(40,14,6,0.4)] ${
        gone ? "opacity-60" : ""
      }`}
      style={{
        left: `${x - LETTER_HALF}%`,
        width: `${width}%`,
        top: `${BELT_TOP}%`,
        height: `${LETTER_H}%`,
      }}
    >
      {/* The letterhead: the party's colour, icon and name. */}
      <div
        className="flex w-full items-center justify-center gap-[0.6cqw] rounded-[0.4cqw] px-[0.6cqw] py-[0.3cqw]"
        style={{ background: head.colour }}
      >
        <span className="text-[2.6cqw] leading-none">{head.icon}</span>
        <span className="truncate font-tally text-[2.1cqw] leading-tight tracking-[0.03em] text-[#fbf6ea] uppercase">
          {head.name}
        </span>
      </div>
      <p className="mt-[0.6cqw] text-center font-tally text-[2cqw] leading-tight tracking-[0.04em] text-[#6b6965] uppercase">
        {T.letter[lang]}
      </p>
      <p className="mt-[0.6cqw] text-[2.2cqw] text-[#6b6965]">{T.candidate[lang]}</p>
      <div className="relative">
        <p className="font-display text-[2.8cqw] leading-tight font-bold whitespace-nowrap text-[var(--ink)]">
          {name}
        </p>
        {kind === "crossed" && (
          <>
            <span className="absolute top-1/2 -left-[6%] h-[0.8cqw] w-[112%] -rotate-6 rounded-full bg-[var(--sambal)]" />
            <span className="absolute -top-[70%] -right-[10%] rotate-12 font-display text-[2.8cqw] font-bold text-[var(--sambal)]">
              {T.void[lang]}
            </span>
          </>
        )}
      </div>

      {/* The seal box sits left, centre or right; the seal lands wherever the letter was.
          Sizes are in cqw (stage width), the same unit as the letter's own width. */}
      <div
        className="absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[0.6cqw] border-[0.4cqw] border-dashed border-[#a8a29a]"
        style={{
          width: `${BOX_HALF * 2}cqw`,
          top: `${BOX_AT * 100}%`,
          left: `${50 + (box * 100) / width}%`,
        }}
      >
        {seal === null && (
          <span className="text-center font-tally text-[1.8cqw] leading-none text-[#a8a29a] uppercase">
            {T.box[lang]}
          </span>
        )}
      </div>
      {seal !== null && (
        <div
          className="absolute h-0 w-0"
          style={{ left: `${50 + ((box + seal) * 100) / width}%`, top: `${BOX_AT * 100}%` }}
        >
          <div
            className="stamp-stay absolute top-0 left-0 flex aspect-square items-center justify-center rounded-full border-[0.5cqw] text-[3.6cqw]"
            style={{
              width: `${BOX_HALF * 1.6}cqw`,
              borderColor: colour,
              color: colour,
              background: `${colour}22`,
              opacity: inBox ? 1 : 0.85,
            }}
          >
            {icon}
          </div>
        </div>
      )}
    </div>
  );
}
