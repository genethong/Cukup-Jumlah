import { useRef, useState } from "react";
import { crowdCheer, gendangHit, gendangMiss, paperSlap } from "../../beat/wayangSounds";
import { PARTIES } from "../../creator/candidate";
import type { MicrogameProps } from "../microgame";
import { GAME_TEXT } from "../strings";
import { useRound } from "../useRound";
import {
  BASE,
  FRESH_TOWER,
  PROMISES_NEEDED,
  drop,
  missesAllowed,
  place,
  slideX,
  topOf,
  towerVerdict,
  type Block,
  type Tower,
} from "./susunRules";

const T = GAME_TEXT.susun;
const PROMISES = [T.p1, T.p2, T.p3, T.p4, T.p5, T.p6, T.p7, T.p8, T.p9, T.p10];
/** The base's top edge and each promise's height, in % of the stage height. */
const BASE_TOP = 88;
const BLOCK_H = 5;
/** The tower scrolls down once it's this many promises tall, so the top stays in view. */
const SCROLL_FROM = 4;
/** Seconds before the next promise starts sliding. */
const NEXT_S = 0.25;
const COLOURS = ["#0E897F", "#C18D48", "#6B6965"];
/** Narrower than this (% of width), a card shows its promise on a tag instead. */
const NARROW = 30;

type Falling = { id: number; block: Block; level: number; label: number; whole: boolean };
type Pop = { id: number; text: string; good: boolean };

export function SusunManifesto(props: MicrogameProps) {
  const { clock, candidate, lang, talent, onJudge } = props;
  const allowed = missesAllowed(talent === "mesra_rakyat");
  const colour = PARTIES.find((p) => p.id === candidate.party)?.colour ?? "#8A1C19";

  const [order] = useState(() => PROMISES.map((_, i) => i).sort(() => Math.random() - 0.5));
  const [tower, setTower] = useState<Tower>(FRESH_TOWER);
  const [now, setNow] = useState(0);
  const [spawnAt, setSpawnAt] = useState(0);
  const [dropped, setDropped] = useState(0);
  const [falling, setFalling] = useState<Falling[]>([]);
  const [broken, setBroken] = useState(0);
  const [pop, setPop] = useState<Pop | null>(null);
  const towerRef = useRef(tower);
  const nowRef = useRef(0);
  const spawnRef = useRef(0);
  const ids = useRef(0);

  const { live, outcome, playing, end, later } = useRound(props, ({ t, playS, leftS }) => {
    nowRef.current = playS;
    setNow(playS);
    if (towerVerdict(towerRef.current, allowed, leftS <= 0) === "lost") {
      gendangMiss(clock.ctx, clock.out, t);
      end(false);
    }
  });

  const level = tower.blocks.length;
  const top = topOf(tower);
  const width = top.w;
  const sliding = live && !outcome && now >= spawnAt;
  const slideAt = slideX(Math.max(0, now - spawnAt), level, width);
  const label = (n: number) => PROMISES[order[n % order.length]!]![lang];

  const tapDrop = () => {
    if (!playing() || nowRef.current < spawnRef.current) return;
    const t0 = towerRef.current;
    const lvl = t0.blocks.length;
    const w = topOf(t0).w;
    const x = slideX(nowRef.current - spawnRef.current, lvl, w);
    const d = drop(topOf(t0), x, w);
    const next = place(t0, d);
    towerRef.current = next;
    setTower(next);
    const t = clock.ctx.currentTime;
    const id = ++ids.current;
    const n = dropped;
    setDropped(n + 1);
    if (d.kind === "perfect") {
      gendangHit(clock.ctx, clock.out, t, true);
      onJudge("perfect");
      setPop({ id, text: T.perfect[lang], good: true });
    } else if (d.kind === "chopped") {
      paperSlap(clock.ctx, clock.out, t);
      setBroken((b) => b + 1);
      setFalling((f) => [
        ...f.slice(-4),
        { id, block: d.broken, level: lvl, label: n, whole: false },
      ]);
      setPop({ id, text: T.chopped[lang], good: false });
    } else {
      gendangMiss(clock.ctx, clock.out, t);
      onJudge("miss");
      setBroken((b) => b + 1);
      setFalling((f) => [
        ...f.slice(-4),
        { id, block: { x, w }, level: lvl, label: n, whole: true },
      ]);
      setPop({ id, text: T.missed[lang], good: false });
    }
    later(() => setFalling((f) => f.filter((g) => g.id !== id)), 800);
    spawnRef.current = nowRef.current + NEXT_S;
    setSpawnAt(spawnRef.current);
    const v = towerVerdict(next, allowed, false);
    if (v === "won") {
      crowdCheer(clock.ctx, clock.out, t + 0.05);
      end(true);
    } else if (v === "lost") end(false);
  };

  // Keep the top of the tower in view as it grows.
  const shift = Math.max(0, level - SCROLL_FROM) * BLOCK_H;
  const yOf = (lvl: number) => BASE_TOP - (lvl + 1) * BLOCK_H + shift;

  return (
    <div
      className="absolute inset-0 z-10 select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        tapDrop();
      }}
    >
      {/* The manifesto's base: a lectern-like stand with the party's colour. */}
      <div
        className="pointer-events-none absolute flex items-center justify-center rounded-t-[1cqw] shadow-[0_1cqw_1.4cqw_rgba(40,14,6,0.4)]"
        style={{
          left: `${BASE.x}%`,
          width: `${BASE.w}%`,
          top: `${BASE_TOP + shift}%`,
          height: "10%",
          background: colour,
        }}
      >
        <span className="font-display text-[5cqw] font-bold text-[#F3EBDF] italic">
          {T.base[lang]}
        </span>
      </div>

      {tower.blocks.map((b, i) => (
        <PromiseBlock key={`b-${i}`} block={b} y={yOf(i)} text={label(i)} tint={COLOURS[i % 3]!} />
      ))}

      {sliding && (
        <PromiseBlock
          block={{ x: slideAt, w: width }}
          y={yOf(level) - 1.2}
          text={label(dropped)}
          tint={COLOURS[level % 3]!}
          active
        />
      )}

      {falling.map((f) => (
        <div
          key={`fall-${f.id}`}
          className="piece-fall pointer-events-none absolute"
          style={{ left: 0, top: 0, width: "100%", height: "100%" }}
        >
          <PromiseBlock
            block={f.block}
            y={yOf(f.level)}
            text={f.whole ? label(f.label) : ""}
            tint="#a8a29a"
          />
        </div>
      ))}

      {/* The heap of broken promises. */}
      <div className="pointer-events-none absolute right-[3%] bottom-[2%] flex flex-col items-end">
        <span className="rounded-sm bg-[#2b2522]/80 px-[1.4cqw] py-[0.3cqw] font-tally text-[2.8cqw] tracking-[0.04em] whitespace-nowrap text-[var(--cream)] uppercase">
          {T.pile[lang]}: {broken}
        </span>
      </div>

      <div className="pointer-events-none absolute top-[40%] left-[4%] rounded-sm bg-[#2b2522]/85 px-[2cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        {T.count[lang]} {level}/{PROMISES_NEEDED}
      </div>

      {pop && !outcome && (
        <span
          key={`pop-${pop.id}`}
          className={`combo-pop pointer-events-none absolute top-[40%] right-[4%] rounded-sm px-[2cqw] py-[0.4cqw] font-display text-[4.4cqw] font-bold whitespace-nowrap italic ${
            pop.good ? "bg-[#efe1c3] text-[var(--ink)]" : "bg-[var(--sambal)] text-[var(--cream)]"
          }`}
        >
          {pop.text}
        </span>
      )}

      {outcome && (
        <p className="combo-pop pointer-events-none absolute top-[47%] left-1/2 z-30 -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1cqw] font-display text-[5.4cqw] font-bold whitespace-nowrap text-[var(--ink)] italic shadow-[0_4px_8px_rgba(40,14,6,0.3)]">
          {outcome === "won" ? T.won[lang] : T.lost[lang]}
        </p>
      )}
    </div>
  );
}

/** A promise card in the tower, its text shrinking with the card. */
function PromiseBlock({
  block,
  y,
  text,
  tint,
  active,
}: {
  block: Block;
  y: number;
  text: string;
  tint: string;
  active?: boolean;
}) {
  // A card too narrow for its words wears them on a tag that sticks out past its edges.
  const narrow = block.w < NARROW;
  return (
    <div
      className={`pointer-events-none absolute flex items-center justify-center rounded-[0.8cqw] border-[0.5cqw] border-[#2b2522]/30 ${
        active
          ? "shadow-[0_1.2cqw_1.4cqw_rgba(40,14,6,0.35)]"
          : "shadow-[0_0.5cqw_0_rgba(40,14,6,0.3)]"
      }`}
      style={{
        left: `${block.x}%`,
        width: `${block.w}%`,
        top: `${y}%`,
        height: `${BLOCK_H}%`,
        background: tint,
      }}
    >
      {text &&
        (narrow ? (
          <span className="absolute left-1/2 z-10 -translate-x-1/2 rounded-[0.6cqw] bg-[#F3EBDF] px-[1.2cqw] py-[0.1cqw] font-display text-[3cqw] font-bold whitespace-nowrap text-[var(--ink)] shadow-[0_0.4cqw_0.8cqw_rgba(40,14,6,0.35)]">
            {text}
          </span>
        ) : (
          <span className="truncate px-[1cqw] font-display text-[3.6cqw] font-bold text-[#F3EBDF]">
            {text}
          </span>
        ))}
    </div>
  );
}
