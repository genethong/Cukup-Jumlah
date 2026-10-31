import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import type { PuppetConfig } from "../puppet/loadRig";
import type { PuppetAnim } from "../puppet/motion";
import { Gunungan } from "./Gunungan";
import { BallotBox, DepositEnvelope } from "./Hud";
import { BeatPins, ControlButton, CutStamp, DalangBanner, Kelir, StageBox } from "./Panggung";

// Style frame for the puppet-show look (docs/GAME_PLAN.md §3). A still scene with
// a few triggers; no game logic. Timing here is cosmetic until the beat clock lands.

const BEAT_MS = 480;
const SEAT_GOAL = 112;
const SEATS_PER_WIN = 5;

const CAST: PuppetConfig[] = [
  {
    gender: "f",
    tone: "tone_4",
    faceShape: "oval",
    hair: "bun",
    headwear: "tudung",
    outfit: "baju_kurung",
    lower: "sarong",
  },
  {
    gender: "m",
    tone: "tone_6",
    faceShape: "oval",
    hair: "sidepart",
    headwear: "songkok",
    outfit: "baju_melayu",
    lower: "songket_samping",
  },
  {
    gender: "m",
    tone: "tone_2",
    faceShape: "round",
    hair: "curly",
    headwear: "baseball_cap",
    outfit: "business_suit",
    lower: null,
  },
];

const SCENES = [
  { call: "BAYAR!", hint: "Deposit calon Parlimen: RM10,000" },
  { call: "KACAU!", hint: "Goreng kuey teow depan kamera" },
  { call: "CELUP!", hint: "Undi dulu, jari telunjuk kiri" },
] as const;

type Stamp = { kind: "padu" | "hilang"; token: number };

export function StageStyleFrame() {
  const [scene, setScene] = useState(0);
  const [beat, setBeat] = useState(1);
  const [deposits, setDeposits] = useState(3);
  const [seats, setSeats] = useState(47);
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [sweep, setSweep] = useState(0);
  const [anim, setAnim] = useState<PuppetAnim>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => setBeat((b) => (b % 4) + 1), BEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const fireStamp = (kind: Stamp["kind"]) => {
    const token = Date.now();
    setStamp({ kind, token });
    if (kind === "padu") {
      setSeats((s) => Math.min(SEAT_GOAL, s + SEATS_PER_WIN));
      setAnim("hop");
    } else {
      setDeposits((d) => (d <= 0 ? 3 : d - 1));
      setAnim("rod-wiggle");
    }
    later(() => setStamp((cur) => (cur?.token === token ? null : cur)), 1100);
    later(() => setAnim("idle"), 900);
  };

  const fireSweep = () => {
    setSweep((n) => n + 1);
    later(() => setScene((s) => (s + 1) % SCENES.length), 650);
  };

  const current = SCENES[scene]!;

  return (
    <div className="panggung h-dvh overflow-y-auto bg-[#1a0f08] text-[var(--cream)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5 lg:grid lg:grid-cols-[auto_1fr] lg:items-start lg:gap-x-8">
        <header className="flex flex-wrap items-baseline justify-between gap-2 lg:col-span-2">
          <div>
            <p className="font-tally text-[11px] tracking-[0.18em] text-[var(--brass)] uppercase">
              Bingkai gaya · draf
            </p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Panggung Wayang</h1>
          </div>
          <Link to="/dev" search={{ lab: "puppet" }} className="text-sm font-bold underline">
            Makmal boneka →
          </Link>
        </header>

        <StageBox>
          <Kelir>
            <Hud
              deposits={deposits}
              seats={seats}
              beat={beat}
              call={current.call}
              hint={current.hint}
            />

            <div className="absolute inset-x-0 bottom-0 flex h-[62%] items-end justify-center">
              <div className="bayang absolute bottom-[16%] left-[-4%] h-[62%] w-[38%]">
                <PuppetAvatar config={CAST[(scene + 1) % CAST.length]!} anim="idle" />
              </div>
              <div className="bayang absolute right-[-4%] bottom-[16%] h-[62%] w-[38%]">
                <PuppetAvatar config={CAST[(scene + 2) % CAST.length]!} anim="idle" />
              </div>
              <div className="relative h-full w-[64%]">
                <PuppetAvatar config={CAST[scene]!} anim={anim} label="YB anda" />
              </div>
            </div>

            {stamp && (
              <CutStamp
                key={stamp.token}
                lines={stamp.kind === "padu" ? ["PADU!"] : ["HILANG", "DEPOSIT!"]}
                tone={stamp.kind === "padu" ? "gold" : "red"}
              />
            )}
            {sweep > 0 && (
              <div
                key={sweep}
                className="gunungan-sweep pointer-events-none absolute top-1/2 left-1/2 z-30 h-[96%] drop-shadow-[0_18px_18px_rgba(30,12,4,0.55)]"
              >
                <Gunungan className="h-full w-auto" />
              </div>
            )}
          </Kelir>
        </StageBox>

        <div className="flex flex-col gap-5">
          <section aria-label="Cuba" className="flex flex-wrap gap-2">
            <ControlButton onClick={() => fireStamp("padu")}>Cop PADU!</ControlButton>
            <ControlButton onClick={() => fireStamp("hilang")}>Cop HILANG DEPOSIT!</ControlButton>
            <ControlButton onClick={fireSweep}>Peralihan gunungan</ControlButton>
          </section>

          <FactCard />

          <p className="copy-pretty max-w-2xl text-sm text-[#cdb79a]">
            Draf gaya sahaja. Boneka ialah aset sebenar; gunungan, sampul deposit, peti undi dan
            pelita dilukis dengan kod sebagai pemegang tempat dan akan dilukis semula dalam gaya
            kertas/felt. Pentas sentiasa 9:16 (potret) pada semua peranti.
          </p>
        </div>
      </div>
    </div>
  );
}

function Hud({
  deposits,
  seats,
  beat,
  call,
  hint,
}: {
  deposits: number;
  seats: number;
  beat: number;
  call: string;
  hint: string;
}) {
  return (
    <>
      <div
        className="absolute top-[2.5%] left-[4%] z-20 flex gap-[1.5cqw]"
        aria-label={`Deposit tinggal ${deposits}`}
      >
        {[0, 1, 2].map((i) => (
          <DepositEnvelope key={i} lost={i >= deposits} />
        ))}
      </div>

      <div
        className="absolute top-[2.5%] right-[4%] z-20"
        aria-label={`${seats} daripada ${SEAT_GOAL} kerusi`}
      >
        <BallotBox seats={seats} goal={SEAT_GOAL} label="kerusi" />
      </div>

      <div className="absolute top-[12%] left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col items-center gap-[2cqw]">
        <DalangBanner call={call} hint={hint} />
        <BeatPins beat={beat} />
      </div>
    </>
  );
}

function FactCard() {
  return (
    <aside className="relative max-w-xl rounded-sm bg-[#efe1c3] px-5 py-4 text-[var(--ink)] shadow-[0_8px_14px_rgba(0,0,0,0.4)]">
      <span
        className="beat-pin absolute top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full"
        aria-hidden="true"
      />
      <p className="font-tally text-[11px] tracking-[0.16em] text-[#8a1c19] uppercase">
        Fakta antara pusingan
      </p>
      <p className="copy-pretty mt-1 font-display text-lg font-semibold">
        Calon Parlimen membayar deposit RM10,000. Deposit itu hangus jika calon mendapat 1/8 undi
        atau kurang.
      </p>
    </aside>
  );
}
