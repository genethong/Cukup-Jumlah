import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../../beat/timing";
import { gendangHit, gendangMiss, paperSlap, tick } from "../../beat/wayangSounds";
import type { MicrogameProps } from "../microgame";
import { LEAD_IN_BEATS, leadInStep } from "../leadIn";
import { beginGroove } from "../music";
import { GAME_TEXT, type Lang } from "../strings";
import {
  BUNDLES,
  DEPOSIT,
  dealCase,
  judgePayment,
  tillVerdict,
  total,
  wrongPaymentsAllowed,
  type Bundle,
  type Till,
} from "./bayarRules";

const T = GAME_TEXT.bayar;
const TICK_FROM_S = 2;

type Slot = { id: number; value: Bundle; onCounter: boolean };

function rm(n: number): string {
  return `RM${n.toLocaleString("en-MY")}`;
}

export function BayarDeposit({
  clock,
  lang,
  talent,
  bars,
  onLeadIn,
  onTimeLeft,
  onJudge,
  onPuppet,
  onFinish,
}: MicrogameProps) {
  const callbacks = useRef({ onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish });
  callbacks.current = { onLeadIn, onTimeLeft, onJudge, onPuppet, onFinish };
  const allowed = wrongPaymentsAllowed(talent === "mesra_rakyat");
  const helper = talent === "pakar_kira";

  const [slots, setSlots] = useState<Slot[]>(() =>
    dealCase().map((value, id) => ({ id, value, onCounter: false })),
  );
  const [till, setTill] = useState<Till>({ wrong: 0, paid: false });
  const [clerk, setClerk] = useState<{ text: string; n: number; good: boolean } | null>(null);
  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);

  const tillRef = useRef<Till>(till);
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

  const end = (won: boolean) => {
    if (ended.current) return;
    ended.current = true;
    setOutcome(won ? "won" : "lost");
    clock.halt();
    later(() => finishRef.current(won), won ? 1400 : 900);
  };
  const endRef = useRef(end);
  endRef.current = end;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const limitS = bars * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    const frame = () => {
      if (done.current || ended.current) return;
      raf = requestAnimationFrame(frame);
      if (!clock.running) return;
      const t = clock.ctx.currentTime;
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
      if (tillVerdict(tillRef.current, allowed, leftS <= 0) === "lost") {
        gendangMiss(clock.ctx, clock.out, t);
        endRef.current(false);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, allowed]);

  /** Move one bundle of `value` from the briefcase to the counter, or back. */
  const move = (value: Bundle, toCounter: boolean) => {
    if (!liveRef.current || ended.current) return;
    setSlots((s) => {
      const i = s.findIndex((b) => b.value === value && b.onCounter !== toCounter);
      return i < 0 ? s : s.map((b, j) => (j === i ? { ...b, onCounter: toCounter } : b));
    });
    paperSlap(clock.ctx, clock.out, clock.ctx.currentTime);
  };
  const count = (value: Bundle, onCounter: boolean) =>
    slots.filter((s) => s.value === value && s.onCounter === onCounter).length;

  const counter = slots.filter((s) => s.onCounter);
  const paid = total(counter.map((s) => s.value));

  const pay = () => {
    if (!liveRef.current || ended.current || counter.length === 0) return;
    const t = clock.ctx.currentTime;
    const verdict = judgePayment(paid);
    if (verdict === "exact") {
      tillRef.current = { ...tillRef.current, paid: true };
      setTill(tillRef.current);
      setClerk({ text: T.exact[lang], n: Date.now(), good: true });
      gendangHit(clock.ctx, clock.out, t, true);
      callbacks.current.onJudge("perfect");
      callbacks.current.onPuppet?.({ anim: "hop", face: "big_laugh" });
      endRef.current(true);
      return;
    }
    tillRef.current = { ...tillRef.current, wrong: tillRef.current.wrong + 1 };
    setTill(tillRef.current);
    const diff = rm(Math.abs(paid - DEPOSIT));
    setClerk({
      text: (verdict === "short" ? T.short[lang] : T.over[lang]).replace("{rm}", diff),
      n: Date.now(),
      good: false,
    });
    gendangMiss(clock.ctx, clock.out, t);
    callbacks.current.onJudge("miss");
    callbacks.current.onPuppet?.({ anim: "rod-wiggle", face: "shocked_o" });
    later(() => callbacks.current.onPuppet?.(null), 600);
    if (tillVerdict(tillRef.current, allowed, false) === "lost") endRef.current(false);
  };
  const payRef = useRef(pay);
  payRef.current = pay;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      payRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busy = !live || outcome !== null;

  return (
    <div className="absolute inset-0 z-10 select-none">
      {/* The payment counter, with what's been put down so far. */}
      <div className="pointer-events-none absolute inset-x-[2%] top-[54%] h-[5%] rounded-[1cqw] bg-[linear-gradient(180deg,#8a5a32,#5e3b20)] shadow-[0_1cqw_1.4cqw_rgba(40,14,6,0.4)]" />
      <span className="pointer-events-none absolute top-[55%] left-[4%] rounded-sm bg-[#fbf3e4] px-[1.4cqw] py-[0.2cqw] font-tally text-[2.6cqw] tracking-[0.06em] text-[var(--ink)] uppercase">
        {T.counter[lang]}
      </span>
      <div className="absolute inset-x-[4%] top-[42%] flex h-[12%] items-end justify-center gap-[2cqw]">
        {BUNDLES.filter((v) => count(v, true) > 0).map((v) => (
          <BundleStack
            key={`c-${v}`}
            value={v}
            n={count(v, true)}
            small
            onTap={() => move(v, false)}
            disabled={busy}
          />
        ))}
      </div>
      {helper && (
        <span className="pointer-events-none absolute top-[35%] right-[4%] rounded-sm bg-[#2b2522]/85 px-[1.6cqw] py-[0.3cqw] font-tally text-[3.4cqw] text-[var(--cream)]">
          {rm(paid)}
        </span>
      )}

      {clerk && outcome !== "won" && (
        <p
          key={`clerk-${clerk.n}`}
          className={`combo-pop pointer-events-none absolute top-[33%] left-[4%] z-20 rounded-sm px-[2.4cqw] py-[0.6cqw] font-display text-[4.4cqw] font-bold whitespace-nowrap italic shadow-[0_4px_8px_rgba(40,14,6,0.3)] ${
            clerk.good ? "bg-[#efe1c3] text-[var(--ink)]" : "bg-[var(--sambal)] text-[var(--cream)]"
          }`}
        >
          {clerk.text}
        </p>
      )}

      {/* The briefcase: one stack per kind of bundle. Tap a stack to put one on the counter. */}
      <div className="absolute top-[63%] right-[2%] bottom-[11%] left-[44%] rounded-[2cqw] border-[0.8cqw] border-[#4f321b] bg-[#2b1d14] p-[1.6cqw] shadow-[inset_0_1cqw_2cqw_rgba(0,0,0,0.5)]">
        <div className="grid h-full grid-cols-2 gap-[1.6cqw]">
          {BUNDLES.map((v) => (
            <BundleStack
              key={`b-${v}`}
              value={v}
              n={count(v, false)}
              onTap={() => move(v, true)}
              disabled={busy || count(v, false) === 0}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          pay();
        }}
        disabled={busy || counter.length === 0}
        className="absolute right-[2%] bottom-[2%] left-[44%] h-[7.5%] rounded-[2.4cqw] border-[0.8cqw] border-[#5b1a14] bg-[var(--sambal)] font-display text-[6cqw] font-bold text-[var(--cream)] italic shadow-[0_1cqw_0_#3b1410] active:translate-y-[0.6cqw] active:shadow-none disabled:opacity-60"
        style={{ touchAction: "manipulation" }}
      >
        {T.pay[lang]} {rm(DEPOSIT)}
      </button>

      {outcome === "won" && <Fact lang={lang} />}
    </div>
  );
}

const NOTE_COLOUR: Record<Bundle, { face: string; edge: string; label: string }> = {
  1000: { face: "#7b4f9e", edge: "#4e2f69", label: "RM1,000" },
  500: { face: "#9a72bb", edge: "#5e3f7b", label: "RM500" },
  100: { face: "#b598d0", edge: "#6d5088", label: "RM100" },
  50: { face: "#5fa39a", edge: "#346b63", label: "RM50" },
};

/** A stack of same-value bundles, thicker the more there are, with how many on a badge. */
function BundleStack({
  value,
  n,
  small,
  disabled,
  onTap,
}: {
  value: Bundle;
  n: number;
  small?: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  const c = NOTE_COLOUR[value];
  const layers = Math.min(6, n);
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap();
      }}
      aria-label={c.label}
      className={`relative flex items-center justify-center rounded-[0.8cqw] border-[0.4cqw] font-tally font-bold text-[#fbf3e4] disabled:opacity-40 ${
        small ? "h-[6.5cqw] w-[15cqw] text-[2.6cqw]" : "h-full w-full text-[3.6cqw]"
      }`}
      style={{
        background: c.face,
        borderColor: c.edge,
        boxShadow: Array.from(
          { length: layers },
          (_, i) => `0 ${(i + 1) * 0.5}cqw 0 ${c.edge}`,
        ).join(","),
        touchAction: "manipulation",
      }}
    >
      {c.label}
      <span className="absolute -top-[1.6cqw] -right-[1.6cqw] flex h-[5cqw] min-w-[5cqw] items-center justify-center rounded-full bg-[#fbf3e4] px-[0.8cqw] text-[2.8cqw] text-[var(--ink)] shadow">
        ×{n}
      </span>
    </button>
  );
}

function Fact({ lang }: { lang: Lang }) {
  return (
    <div className="combo-pop pointer-events-none absolute top-[44%] left-1/2 z-30 w-[80%] -translate-x-1/2 rounded-sm bg-[#efe1c3] px-[3cqw] py-[1.4cqw] text-center text-[var(--ink)] shadow-[0_6px_12px_rgba(40,14,6,0.4)]">
      <p className="font-display text-[5.4cqw] font-bold italic">{T.exact[lang]}</p>
      <p className="mt-[0.6cqw] text-[3.2cqw] leading-tight">{T.fact[lang]}</p>
    </div>
  );
}
