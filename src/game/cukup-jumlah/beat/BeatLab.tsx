import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import type { PuppetConfig } from "../puppet/loadRig";
import type { PuppetAnim } from "../puppet/motion";
import {
  BeatPins,
  ControlButton,
  CutStamp,
  DalangBanner,
  Kelir,
  StageBox,
  type StampTone,
} from "../stage/Panggung";
import { BeatClock } from "./beatClock";
import { loadOffsetMs, saveOffsetMs } from "./calibrationStore";
import {
  BEATS_PER_BAR,
  HIT_BEAT_IN_BAR,
  computeCalibration,
  hitWindows,
  judgeTap,
  nearestTarget,
  type Calibration,
  type Grade,
} from "./timing";
import { canang, gendangHit, gendangMiss, gong, kesi } from "./wayangSounds";

// Test page for the beat clock (/dev?lab=rentak). "Main" judges taps on beat 4 of each
// bar; "Kalibrasi" asks for a tap on every beat and saves the player's latency correction.

type Mode = "idle" | "main" | "kalibrasi";

const CALIBRATION_BEATS = 14;
const HISTORY = 12;
const COUNT_CALLS = ["SATU", "DUA", "TIGA", "TEPUK!"] as const;

const YB: PuppetConfig = {
  gender: "m",
  tone: "tone_5",
  faceShape: "oval",
  hair: "sidepart",
  headwear: "songkok",
  outfit: "baju_melayu",
  lower: "songket_samping",
};

type Tap = { offsetMs: number; grade: Grade };
type Stamp = { lines: readonly string[]; tone: StampTone; token: number };

const STAMPS: Record<Grade | "terlepas", { lines: readonly string[]; tone: StampTone }> = {
  perfect: { lines: ["PADU!"], tone: "gold" },
  good: { lines: ["BOLEH!"], tone: "pale" },
  miss: { lines: ["LARI", "RENTAK!"], tone: "red" },
  terlepas: { lines: ["TERLEPAS!"], tone: "red" },
};

export function BeatLab() {
  const [mode, setMode] = useState<Mode>("idle");
  const [mesra, setMesra] = useState(false);
  const [offsetMs, setOffsetMs] = useState(0);
  const [beat, setBeat] = useState(0);
  const [taps, setTaps] = useState<Tap[]>([]);
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [anim, setAnim] = useState<PuppetAnim>("idle");
  const [calTaps, setCalTaps] = useState(0);
  const [calResult, setCalResult] = useState<Calibration | null | "gagal">(null);
  const [noAudio, setNoAudio] = useState(false);

  const clockRef = useRef<BeatClock | null>(null);
  const modeRef = useRef<Mode>("idle");
  const mesraRef = useRef(false);
  const offsetRef = useRef(0);
  const judged = useRef(new Set<number>());
  const nextTarget = useRef(HIT_BEAT_IN_BAR);
  const calOffsets = useRef<number[]>([]);
  const animTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadOffsetMs();
    offsetRef.current = saved;
    setOffsetMs(saved);
  }, []);

  useEffect(() => {
    mesraRef.current = mesra;
  }, [mesra]);

  const showStamp = useCallback((kind: Grade | "terlepas") => {
    setStamp({ ...STAMPS[kind], token: performance.now() });
    setAnim(kind === "perfect" || kind === "good" ? "hop" : "rod-wiggle");
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnim("idle"), 700);
  }, []);

  const stop = useCallback(() => {
    clockRef.current?.halt();
    modeRef.current = "idle";
    setMode("idle");
    setBeat(0);
  }, []);

  const finishCalibration = useCallback(() => {
    const result = computeCalibration(calOffsets.current);
    if (result) {
      offsetRef.current = result.offsetMs;
      setOffsetMs(result.offsetMs);
      saveOffsetMs(result.offsetMs);
    }
    setCalResult(result ?? "gagal");
    stop();
  }, [stop]);

  const begin = useCallback(async (next: Exclude<Mode, "idle">) => {
    let clock = clockRef.current;
    if (!clock) {
      clock = BeatClock.create();
      if (!clock) {
        setNoAudio(true);
        return;
      }
      clockRef.current = clock;
      // Dev-only handle so automated QA can time synthetic taps against the audio clock.
      if (import.meta.env.DEV)
        (window as unknown as { __beatClock?: BeatClock }).__beatClock = clock;
    }
    judged.current = new Set();
    nextTarget.current = HIT_BEAT_IN_BAR;
    calOffsets.current = [];
    setCalTaps(0);
    if (next === "kalibrasi") setCalResult(null);
    setTaps([]);
    setStamp(null);
    modeRef.current = next;
    setMode(next);
    await clock.begin((index, when, out) => {
      const ctx = clock.ctx;
      if (modeRef.current === "kalibrasi") {
        if (index < CALIBRATION_BEATS) canang(ctx, out, when);
        return;
      }
      const inBar = index % BEATS_PER_BAR;
      if (inBar === 0) gong(ctx, out, when);
      else if (inBar === HIT_BEAT_IN_BAR) canang(ctx, out, when);
      else kesi(ctx, out, when);
    });
  }, []);

  // Visual beat, missed-beat detection and the end of calibration, all read from the audio clock.
  useEffect(() => {
    if (mode === "idle") return;
    let raf = 0;
    const frame = () => {
      const clock = clockRef.current;
      if (clock?.running) {
        const pos = (clock.heardTime() - clock.start) / clock.spb;
        setBeat(pos < 0 ? 0 : (Math.floor(pos) % BEATS_PER_BAR) + 1);

        const now = clock.ctx.currentTime - offsetRef.current / 1000;
        if (modeRef.current === "main") {
          const goodWindow = hitWindows(mesraRef.current).good;
          while (clock.beatTime(nextTarget.current) + goodWindow < now) {
            if (!judged.current.has(nextTarget.current)) {
              judged.current.add(nextTarget.current);
              setTaps((t) => [...t, { offsetMs: NaN, grade: "miss" as Grade }].slice(-HISTORY));
              showStamp("terlepas");
            }
            nextTarget.current += BEATS_PER_BAR;
          }
        } else if (
          modeRef.current === "kalibrasi" &&
          now > clock.beatTime(CALIBRATION_BEATS - 1) + 0.35
        ) {
          finishCalibration();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [mode, finishCalibration, showStamp]);

  const tap = useCallback(
    (eventTimeStamp: number) => {
      const clock = clockRef.current;
      if (!clock?.running) return;
      const raw = clock.tapTime(eventTimeStamp);

      if (modeRef.current === "kalibrasi") {
        const k = nearestTarget(raw, clock.start, 1, 0, clock.spb);
        if (k >= CALIBRATION_BEATS) return;
        calOffsets.current.push((raw - clock.beatTime(k)) * 1000);
        setCalTaps(calOffsets.current.length);
        gendangHit(clock.ctx, clock.out, clock.ctx.currentTime, false);
        return;
      }

      const corrected = raw - offsetRef.current / 1000;
      const k = nearestTarget(corrected, clock.start, BEATS_PER_BAR, HIT_BEAT_IN_BAR, clock.spb);
      if (judged.current.has(k)) return;
      const result = judgeTap(corrected, clock.beatTime(k), hitWindows(mesraRef.current));
      if (result.grade !== "miss") judged.current.add(k);
      setTaps((t) => [...t, result].slice(-HISTORY));
      showStamp(result.grade);
      if (result.grade === "miss") gendangMiss(clock.ctx, clock.out, clock.ctx.currentTime);
      else gendangHit(clock.ctx, clock.out, clock.ctx.currentTime, result.grade === "perfect");
    },
    [showStamp],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.code !== "Space" && e.code !== "Enter")) return;
      if (modeRef.current === "idle") return;
      e.preventDefault();
      tap(e.timeStamp);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  useEffect(
    () => () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
      void clockRef.current?.close();
    },
    [],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (modeRef.current === "idle") return;
    e.preventDefault();
    tap(e.timeStamp);
  };

  const call =
    mode === "kalibrasi"
      ? "IKUT RENTAK"
      : mode === "main"
        ? beat === 0
          ? "SEDIA..."
          : COUNT_CALLS[beat - 1]!
        : "SEDIA?";
  const hint =
    mode === "kalibrasi"
      ? `Tepuk setiap bunyi canang · ${calTaps}/${CALIBRATION_BEATS}`
      : mode === "main"
        ? "Tepuk pada ketukan ke-4 (canang)"
        : "Tekan Main atau Kalibrasi di bawah";

  const counts = taps.reduce((acc, t) => ({ ...acc, [t.grade]: acc[t.grade] + 1 }), {
    perfect: 0,
    good: 0,
    miss: 0,
  } as Record<Grade, number>);

  return (
    <div className="panggung h-dvh overflow-y-auto bg-[#1a0f08] text-[var(--cream)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 lg:grid lg:grid-cols-[auto_1fr] lg:items-start lg:gap-x-8">
        <header className="flex flex-wrap items-baseline justify-between gap-2 lg:col-span-2">
          <div>
            <p className="font-tally text-[11px] tracking-[0.18em] text-[var(--brass)] uppercase">
              Makmal rentak · 125 BPM
            </p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Rentak Dalang</h1>
          </div>
          <Link to="/dev" search={{ lab: "panggung" }} className="text-sm font-bold underline">
            Panggung →
          </Link>
        </header>

        <StageBox>
          <Kelir
            onPointerDown={onPointerDown}
            className="touch-manipulation select-none"
            role="button"
            aria-label="Pad tepuk"
          >
            <div className="absolute top-[12%] left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col items-center gap-[2cqw]">
              <DalangBanner call={call} hint={hint} />
              <BeatPins beat={beat} />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex h-[62%] items-end justify-center">
              <div className="relative h-full w-[64%]">
                <PuppetAvatar config={YB} anim={anim} label="YB anda" />
              </div>
            </div>

            {stamp && (
              <CutStamp
                key={stamp.token}
                lines={stamp.lines}
                tone={stamp.tone}
                className="top-[58%] w-[62%]"
              />
            )}
          </Kelir>
        </StageBox>

        <div className="flex flex-col gap-5">
          <section aria-label="Kawalan" className="flex flex-wrap gap-2">
            {mode === "idle" ? (
              <>
                <ControlButton onClick={() => void begin("main")}>Main</ControlButton>
                <ControlButton onClick={() => void begin("kalibrasi")}>Kalibrasi</ControlButton>
              </>
            ) : (
              <ControlButton onClick={stop}>Berhenti</ControlButton>
            )}
            <ControlButton onClick={() => setMesra((m) => !m)} pressed={mesra}>
              Mesra Rakyat {mesra ? "✓" : ""}
            </ControlButton>
          </section>

          {noAudio && (
            <p className="text-sm text-[#f0a090]">Pelayar ini tidak menyokong bunyi Web Audio.</p>
          )}

          <TimingStrip taps={taps} mesra={mesra} />

          <dl className="grid max-w-md grid-cols-3 gap-2 text-center">
            <Stat label="Padu" value={counts.perfect} />
            <Stat label="Boleh" value={counts.good} />
            <Stat label="Lari / terlepas" value={counts.miss} />
          </dl>

          <aside className="relative max-w-xl rounded-sm bg-[#efe1c3] px-5 py-4 text-[var(--ink)] shadow-[0_8px_14px_rgba(0,0,0,0.4)]">
            <p className="font-tally text-[11px] tracking-[0.16em] text-[#8a1c19] uppercase">
              Kalibrasi peranti ini
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {offsetMs >= 0 ? "+" : ""}
              {offsetMs} ms
            </p>
            <p className="copy-pretty mt-1 text-sm">
              {calResult === "gagal"
                ? "Ketukan tidak cukup. Cuba lagi dan tepuk setiap bunyi canang."
                : calResult
                  ? `Disimpan. Ketukan anda konsisten dalam ±${calResult.spreadMs} ms.`
                  : "Kalibrasi mengukur lambat bunyi dan skrin peranti anda (fon telinga Bluetooth boleh tambah 150 ms atau lebih), lalu membetulkannya."}
            </p>
          </aside>

          <p className="copy-pretty max-w-xl text-sm text-[#cdb79a]">
            Ketuk di mana-mana pada pentas, atau tekan Space. Gong pada ketukan 1, kesi pada 2 dan
            3, canang pada 4. Bunyi gendang mengesahkan tepukan anda.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm bg-[#2b170c] px-2 py-2">
      <dt className="font-tally text-[10px] tracking-[0.14em] text-[var(--brass)] uppercase">
        {label}
      </dt>
      <dd className="font-tally text-2xl">{value}</dd>
    </div>
  );
}

/** A paper ruler from 260 ms early to 260 ms late, with the last taps pinned on it. */
function TimingStrip({ taps, mesra }: { taps: Tap[]; mesra: boolean }) {
  const span = 260;
  const w = hitWindows(mesra);
  const x = (ms: number) => 10 + ((ms + span) / (span * 2)) * 300;
  const zone = (s: number) => ({ x: x(-s * 1000), width: x(s * 1000) - x(-s * 1000) });
  return (
    <figure className="max-w-md">
      <svg
        viewBox="0 0 320 64"
        className="w-full"
        role="img"
        aria-label="Ketepatan tepukan terakhir"
      >
        <rect x="4" y="8" width="312" height="40" rx="2" fill="#efe1c3" />
        <rect {...zone(w.good)} y="8" height="40" fill="#c9963f" opacity="0.35" />
        <rect {...zone(w.perfect)} y="8" height="40" fill="#c9963f" opacity="0.6" />
        <line x1={x(0)} x2={x(0)} y1="8" y2="48" stroke="#3a1f0f" strokeWidth="1.5" />
        {taps.map((t, i) =>
          Number.isFinite(t.offsetMs) ? (
            <circle
              key={i}
              cx={x(Math.max(-span, Math.min(span, t.offsetMs)))}
              cy={14 + (i % 6) * 6}
              r="3.5"
              fill={t.grade === "perfect" ? "#9d7a2f" : t.grade === "good" ? "#5d4415" : "#8a1c19"}
              stroke="#fef8cb"
              strokeWidth="0.8"
              opacity={0.35 + (0.65 * (i + 1)) / taps.length}
            />
          ) : null,
        )}
        <text x="8" y="60" fontSize="9" fill="#cdb79a" fontFamily="Oswald, sans-serif">
          ← awal
        </text>
        <text
          x="312"
          y="60"
          fontSize="9"
          fill="#cdb79a"
          fontFamily="Oswald, sans-serif"
          textAnchor="end"
        >
          lambat →
        </text>
        <text
          x={x(0)}
          y="60"
          fontSize="9"
          fill="#cdb79a"
          fontFamily="Oswald, sans-serif"
          textAnchor="middle"
        >
          tepat
        </text>
      </svg>
    </figure>
  );
}
