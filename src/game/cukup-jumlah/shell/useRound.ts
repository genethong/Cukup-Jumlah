import { useEffect, useRef, useState } from "react";
import { BEATS_PER_BAR } from "../beat/timing";
import { tick } from "../beat/wayangSounds";
import { LEAD_IN_BEATS, leadInStep } from "./leadIn";
import type { MicrogameProps } from "./microgame";
import { beginGroove } from "./music";

// The clock loop every microgame shares: start the groove, run the lead-in, report the fuse,
// tick the last seconds, and call the game's own `frame` every animation frame of play. The
// game calls `end` once when it's decided; the round finishes after a short beat so the
// result can show.

const TICK_FROM_S = 2;

export type PlayFrame = {
  /** Audio time now, seconds of play so far, seconds left, and seconds since the last frame. */
  t: number;
  playS: number;
  leftS: number;
  dt: number;
};

export function useRound(
  { clock, bars, onLeadIn, onTimeLeft, onFinish }: MicrogameProps,
  frame: (f: PlayFrame) => void,
) {
  const callbacks = useRef({ onLeadIn, onTimeLeft, onFinish });
  callbacks.current = { onLeadIn, onTimeLeft, onFinish };
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const [live, setLive] = useState(false);
  const [outcome, setOutcome] = useState<"won" | "lost" | null>(null);
  const liveRef = useRef(false);
  const ended = useRef(false);
  const done = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const end = (won: boolean, holdMs = won ? 900 : 1300) => {
    if (ended.current) return;
    ended.current = true;
    setOutcome(won ? "won" : "lost");
    clock.halt();
    later(() => {
      if (done.current) return;
      done.current = true;
      callbacks.current.onFinish(won);
    }, holdMs);
  };

  useEffect(() => {
    const limitS = bars * BEATS_PER_BAR * clock.spb;
    beginGroove(clock);
    let raf = 0;
    let step = -1;
    let nextTick = 0;
    let last = clock.ctx.currentTime;
    const loop = () => {
      if (done.current || ended.current) return;
      raf = requestAnimationFrame(loop);
      if (!clock.running) return;
      const t = clock.ctx.currentTime;
      const dt = Math.min(0.25, t - last);
      last = t;
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
      frameRef.current({ t, playS, leftS, dt });
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars]);

  /** Input counts only while the round is being played. */
  const playing = () => liveRef.current && !ended.current;

  return { live, outcome, playing, end, later };
}
