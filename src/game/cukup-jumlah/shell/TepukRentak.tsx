import { useEffect, useRef, type PointerEvent } from "react";
import {
  BEATS_PER_BAR,
  HIT_BEAT_IN_BAR,
  hitWindows,
  judgeTap,
  nearestTarget,
} from "../beat/timing";
import { canang, gendangHit, gendangMiss, gong, kesi } from "../beat/wayangSounds";
import type { MicrogameProps } from "./microgame";
import { UI } from "./strings";

// Stand-in microgame used for every round until its real game is built: tap on beat 4 of
// each bar. Win by landing at least two of the beats.

const HITS_TO_WIN = 2;

export function TepukRentak({
  clock,
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
  const targets = useRef<number[]>([]);
  const judged = useRef(new Set<number>());
  const hits = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    // Lead-in bar, then `bars` bars with a target on beat 4 of each.
    targets.current = Array.from(
      { length: bars },
      (_, b) => (b + 1) * BEATS_PER_BAR + HIT_BEAT_IN_BAR,
    );
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
      // The clock starts a moment after mount, once the audio context has resumed.
      if (!clock.running) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const pos = (clock.heardTime() - clock.start) / clock.spb;
      callbacks.current.onBeat(
        pos < 0 || pos >= lastBeat ? 0 : (Math.floor(pos) % BEATS_PER_BAR) + 1,
      );

      const now = clock.ctx.currentTime - offsetMs / 1000;
      const goodWindow = hitWindows(mesra).good;
      for (const k of targets.current) {
        if (judged.current.has(k) || clock.beatTime(k) + goodWindow >= now) continue;
        judged.current.add(k);
        callbacks.current.onJudge("miss");
      }
      if (hits.current >= HITS_TO_WIN) return finish(true);
      const left = targets.current.filter((k) => !judged.current.has(k)).length;
      if (hits.current + left < HITS_TO_WIN) return finish(false);
      if (left === 0) return finish(hits.current >= HITS_TO_WIN);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clock.halt();
    };
  }, [clock, bars, mesra, offsetMs]);

  const tap = (eventTimeStamp: number) => {
    if (done.current || !clock.running) return;
    const corrected = clock.tapTime(eventTimeStamp) - offsetMs / 1000;
    const k = nearestTarget(corrected, clock.start, BEATS_PER_BAR, HIT_BEAT_IN_BAR, clock.spb);
    if (!targets.current.includes(k) || judged.current.has(k)) return;
    const { grade } = judgeTap(corrected, clock.beatTime(k), hitWindows(mesra));
    if (grade !== "miss") {
      judged.current.add(k);
      hits.current += 1;
      gendangHit(clock.ctx, clock.out, clock.ctx.currentTime, grade === "perfect");
    } else {
      gendangMiss(clock.ctx, clock.out, clock.ctx.currentTime);
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

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={UI.tapPad[lang]}
      onPointerDown={onPointerDown}
      className="absolute inset-0 z-10 touch-manipulation select-none"
    />
  );
}
