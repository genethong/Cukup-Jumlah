import { useRef, useState } from "react";
import { crowdCheer, gendangHit, gendangMiss, whoosh } from "../../beat/wayangSounds";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  RIBBON,
  RIBBONS_NEEDED,
  bowX,
  ceremonyVerdict,
  crossing,
  judgeCut,
  mistakesAllowed,
  ribbonY,
  sag,
  type Ceremony,
  type Cut,
} from "./potongRules";

const T = GAME_TEXT.potong;
const VENUES = [T.venue1, T.venue2, T.venue3] as const;

type Stroke = { id: number; points: { x: number; y: number }[] };

export function PotongReben(props: MicrogameProps) {
  const { clock, lang, talent, onJudge } = props;
  const allowed = mistakesAllowed(talent === "mesra_rakyat");

  const [phase] = useState(() => Math.random() * 6);
  const [ceremony, setCeremony] = useState<Ceremony>({ cut: 0, mistakes: 0 });
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<{ cut: Cut; x: number; n: number } | null>(null);
  const [stroke, setStroke] = useState<Stroke | null>(null);
  const ceremonyRef = useRef(ceremony);
  const nowRef = useRef(0);
  const pointer = useRef<{ id: number; last: { x: number; y: number }; judged: boolean } | null>(
    null,
  );
  const resting = useRef(false);

  const { live, outcome, playing, end, later } = useRound(props, ({ t, playS, leftS }) => {
    nowRef.current = playS;
    setNow(playS);
    if (ceremonyVerdict(ceremonyRef.current, allowed, leftS <= 0) === "lost") {
      gendangMiss(clock.ctx, clock.out, t);
      end(false);
    }
  });

  const n = ceremony.cut;
  const s = sag(now, n, phase);
  const bow = bowX(now, n, phase);

  const cutAt = (x: number) => {
    const sNow = sag(nowRef.current, ceremonyRef.current.cut, phase);
    const bowNow = bowX(nowRef.current, ceremonyRef.current.cut, phase);
    const cut = judgeCut(x, sNow, bowNow);
    const t = clock.ctx.currentTime;
    setResult({ cut, x, n: Date.now() });
    if (cut === "clean") {
      const next = { ...ceremonyRef.current, cut: ceremonyRef.current.cut + 1 };
      gendangHit(clock.ctx, clock.out, t, true);
      crowdCheer(clock.ctx, clock.out, t + 0.05);
      onJudge("perfect");
      // The cut halves fall, then the next ceremony's ribbon goes up.
      resting.current = true;
      later(() => {
        ceremonyRef.current = next;
        setCeremony(next);
        setResult(null);
        resting.current = false;
        if (ceremonyVerdict(next, allowed, false) === "won") end(true);
      }, 650);
      return;
    }
    const next = { ...ceremonyRef.current, mistakes: ceremonyRef.current.mistakes + 1 };
    ceremonyRef.current = next;
    setCeremony(next);
    gendangMiss(clock.ctx, clock.out, t);
    onJudge("miss");
    if (ceremonyVerdict(next, allowed, false) === "lost") end(false);
  };

  const at = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  // Ribbon geometry for drawing: a gentle curve between the posts.
  const midY = ribbonY(50, s);
  const cutClean = result?.cut === "clean";

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (!playing() || resting.current) return;
        const p = at(e);
        pointer.current = { id: e.pointerId, last: p, judged: false };
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setStroke({ id: e.pointerId + Date.now(), points: [p] });
        whoosh(clock.ctx, clock.out, clock.ctx.currentTime);
      }}
      onPointerMove={(e) => {
        const ptr = pointer.current;
        if (!ptr || ptr.id !== e.pointerId) return;
        const p = at(e);
        setStroke((st) => (st ? { ...st, points: [...st.points.slice(-8), p] } : st));
        if (!ptr.judged && playing() && !resting.current) {
          const x = crossing(ptr.last, p, sag(nowRef.current, ceremonyRef.current.cut, phase));
          if (x !== null) {
            ptr.judged = true;
            cutAt(x);
          }
        }
        ptr.last = p;
      }}
      onPointerUp={() => {
        pointer.current = null;
        later(() => setStroke(null), 120);
      }}
      onPointerCancel={() => {
        pointer.current = null;
        setStroke(null);
      }}
    >
      {/* The ceremony: a sign for what's being opened, two posts, and the ribbon. */}
      <div className="pointer-events-none absolute top-[41%] left-1/2 -translate-x-1/2 rounded-[1cqw] border-[0.6cqw] border-[#98733b] bg-[#fbf6ea] px-[3cqw] py-[0.8cqw] text-center shadow-[0_1cqw_1.4cqw_rgba(40,14,6,0.3)]">
        <p className="font-tally text-[2.8cqw] tracking-[0.08em] text-[#6b6965] uppercase">
          {T.opening[lang]} · {Math.min(n + 1, RIBBONS_NEEDED)}/{RIBBONS_NEEDED}
        </p>
        <p className="font-display text-[4.6cqw] font-bold whitespace-nowrap text-[var(--ink)]">
          {VENUES[Math.min(n, VENUES.length - 1)]![lang]}
        </p>
      </div>
      {[RIBBON.left, RIBBON.right].map((x) => (
        <div
          key={x}
          className="pointer-events-none absolute top-[60%] h-[34%] w-[2.4cqw] -translate-x-1/2 rounded-t-full bg-[linear-gradient(90deg,#c9a24a,#98733b)]"
          style={{ left: `${x}%` }}
        />
      ))}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {cutClean ? (
          <>
            <path
              className="ribbon-fall-left"
              d={`M${RIBBON.left} ${RIBBON.y} Q${(RIBBON.left + result.x) / 2} ${RIBBON.y + 2} ${result.x} ${RIBBON.y + 5}`}
              stroke="#c0262d"
              strokeWidth="1.6"
              fill="none"
            />
            <path
              className="ribbon-fall-right"
              d={`M${result.x} ${RIBBON.y + 5} Q${(RIBBON.right + result.x) / 2} ${RIBBON.y + 2} ${RIBBON.right} ${RIBBON.y}`}
              stroke="#c0262d"
              strokeWidth="1.6"
              fill="none"
            />
          </>
        ) : (
          <path
            className={result && result.cut !== "clean" ? "ears-shake" : ""}
            key={`r-${result?.n ?? 0}`}
            d={`M${RIBBON.left} ${RIBBON.y} Q50 ${2 * midY - RIBBON.y} ${RIBBON.right} ${RIBBON.y}`}
            stroke={s <= 2.2 ? "#d8323a" : "#b0272e"}
            strokeWidth={s <= 2.2 ? 1.9 : 1.5}
            fill="none"
          />
        )}
        {stroke && stroke.points.length > 1 && (
          <polyline
            points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
            stroke="#fbf6ea"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        )}
      </svg>

      {/* The bow marks where to cut. */}
      {!cutClean && live && (
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-[7cqw]"
          style={{ left: `${bow}%`, top: `${ribbonY(bow, s)}%` }}
        >
          🎀
        </span>
      )}

      {/* Taut or slack, so the moment is readable. */}
      {live && !outcome && (
        <span
          className={`pointer-events-none absolute top-[54%] left-1/2 -translate-x-1/2 rounded-sm px-[2cqw] py-[0.3cqw] font-tally text-[3.2cqw] tracking-[0.08em] uppercase ${
            s <= 2.2 ? "bg-[#3f8f4f] text-[#fbf6ea]" : "bg-[#2b2522]/70 text-[var(--cream)]"
          }`}
        >
          {s <= 2.2 ? T.taut[lang] : T.slack[lang]}
        </span>
      )}

      {result && (
        <span
          key={`res-${result.n}`}
          className={`combo-pop pointer-events-none absolute top-[74%] z-20 -translate-x-1/2 rounded-sm px-[2cqw] py-[0.4cqw] font-display text-[4.6cqw] font-bold whitespace-nowrap italic ${
            result.cut === "clean"
              ? "bg-[#efe1c3] text-[var(--ink)]"
              : "bg-[var(--sambal)] text-[var(--cream)]"
          }`}
          style={{ left: `${Math.min(80, Math.max(20, result.x))}%` }}
        >
          {result.cut === "clean"
            ? T.clean[lang]
            : result.cut === "slack"
              ? T.slackCut[lang]
              : T.off[lang]}
        </span>
      )}

      {outcome && (
        <p className="combo-pop pointer-events-none absolute top-[82%] left-1/2 z-30 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          {outcome === "won" ? T.won[lang] : T.lost[lang]}
        </p>
      )}
    </div>
  );
}
