import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import type { PuppetConfig } from "../puppet/loadRig";
import type { PuppetAnim } from "../puppet/motion";
import { Gunungan } from "./Gunungan";
import "./stage.css";

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

            {stamp && <CutStamp key={stamp.token} kind={stamp.kind} />}
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

function StageBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,calc((100dvh-8rem)*9/16))] min-w-[280px] rounded-[18px] p-[10px] shadow-[0_24px_40px_rgba(0,0,0,0.55)] lg:w-[min(440px,calc((100dvh-8rem)*9/16))]"
      style={{
        background:
          "linear-gradient(160deg, var(--wood-light), var(--wood) 35%, var(--wood-dark) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-[5px] rounded-[14px] border-2 border-[var(--brass)]/60" />
      {(["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"] as const).map(
        (pos) => (
          <span
            key={pos}
            className={`beat-pin absolute ${pos} z-10 h-3 w-3 rounded-full`}
            aria-hidden="true"
          />
        ),
      )}
      {children}
    </div>
  );
}

function Kelir({ children }: { children: React.ReactNode }) {
  return (
    <div className="kelir @container relative aspect-[9/16] w-full overflow-hidden rounded-[8px]">
      <div className="kelir-glow pointer-events-none absolute inset-0" />
      <Pelita />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-[#6e4426]/35 to-transparent" />
      {children}
    </div>
  );
}

function Pelita() {
  return (
    <svg
      viewBox="0 0 40 50"
      className="pointer-events-none absolute top-[1%] left-1/2 h-[6%] -translate-x-1/2"
      aria-hidden="true"
    >
      <path
        className="pelita-flame"
        d="M20 4 C27 16 28 24 20 30 C12 24 13 16 20 4 Z"
        fill="#ffb347"
      />
      <path
        className="pelita-flame"
        d="M20 13 C24 20 24 25 20 28 C16 25 16 20 20 13 Z"
        fill="#fff1c4"
      />
      <path
        d="M6 32 Q20 44 34 32 L31 38 Q20 47 9 38 Z"
        fill="#9d7a2f"
        stroke="#5d4415"
        strokeWidth="1.5"
      />
    </svg>
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
        <BallotBox seats={seats} />
      </div>

      <div className="absolute top-[12%] left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col items-center gap-[2cqw]">
        <div
          className="bg-[var(--sambal)] px-[9cqw] py-[1.2cqw] text-[var(--cream)] shadow-[0_4px_6px_rgba(40,14,6,0.35)]"
          style={{ clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)" }}
        >
          <span className="font-display text-[12cqw] leading-tight font-bold italic tracking-tight">
            {call}
          </span>
        </div>
        <span className="rounded-sm bg-[#fbf3e4]/85 px-[2cqw] py-[0.5cqw] text-center text-[3.8cqw] font-medium text-[var(--ink)]">
          {hint}
        </span>
        <div className="flex items-center gap-[3cqw] pt-[1cqw]" aria-label={`Ketukan ${beat}`}>
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              data-on={n === beat}
              className={`beat-pin rounded-full transition-transform duration-100 ${n === 4 ? "h-[4.4cqw] w-[4.4cqw]" : "h-[3.2cqw] w-[3.2cqw]"}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function DepositEnvelope({ lost }: { lost: boolean }) {
  return (
    <svg
      viewBox="0 0 64 44"
      className={`h-[7cqw] w-auto drop-shadow-[0_3px_3px_rgba(40,14,6,0.35)] transition-all duration-300 ${
        lost ? "translate-y-1 rotate-6 opacity-30 grayscale" : ""
      }`}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="4"
        width="60"
        height="38"
        rx="2"
        fill="#d8b98a"
        stroke="#7a5a32"
        strokeWidth="1.5"
      />
      <path d="M2 6 L32 24 L62 6" fill="#c9a774" stroke="#7a5a32" strokeWidth="1.5" />
      <circle cx="32" cy="24" r="4" fill="#8a1c19" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fill="#3a2410"
        fontFamily="Oswald, Impact, sans-serif"
      >
        RM10,000
      </text>
    </svg>
  );
}

function BallotBox({ seats }: { seats: number }) {
  const fill = Math.min(1, seats / SEAT_GOAL);
  return (
    <div className="flex items-end gap-[1.5cqw]">
      <svg
        viewBox="0 0 54 60"
        className="h-[12cqw] w-auto drop-shadow-[0_3px_3px_rgba(40,14,6,0.35)]"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="ballot-inside">
            <rect x="6" y="14" width="42" height="42" />
          </clipPath>
        </defs>
        <rect
          x="4"
          y="12"
          width="46"
          height="46"
          rx="2"
          fill="#efe1c3"
          stroke="#5a3a1c"
          strokeWidth="2"
        />
        <g clipPath="url(#ballot-inside)">
          <rect
            x="6"
            y={56 - 42 * fill}
            width="42"
            height={42 * fill}
            fill="#c56e61"
            opacity="0.85"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={i}
              x1="6"
              x2="48"
              y1={56 - i * 7}
              y2={56 - i * 7}
              stroke="#783c2d"
              strokeWidth="0.8"
              opacity="0.5"
            />
          ))}
        </g>
        <rect x="2" y="6" width="50" height="8" rx="1.5" fill="#5a3a1c" />
        <rect x="16" y="9" width="22" height="2.5" rx="1" fill="#1a0f08" />
        <path d="M22 2 L32 2 L31 9 L23 9 Z" fill="#fbf3e4" stroke="#7a5a32" strokeWidth="1" />
      </svg>
      <div className="rounded-sm bg-[#fbf3e4]/90 px-[1.5cqw] py-[0.8cqw] text-right leading-none text-[var(--ink)]">
        <div className="font-tally text-[6.5cqw]">{seats}</div>
        <div className="font-tally text-[2.8cqw] text-[#6a4a32]">/ {SEAT_GOAL} kerusi</div>
      </div>
    </div>
  );
}

function CutStamp({ kind }: { kind: Stamp["kind"] }) {
  const padu = kind === "padu";
  const points = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 38 + ((i * 7) % 5);
    return `${60 + Math.cos(a) * r * 1.15},${50 + Math.sin(a) * r * 0.85}`;
  }).join(" ");
  return (
    <div
      className="stamp-pop pointer-events-none absolute top-[50%] left-1/2 z-40 w-[78%]"
      role="status"
    >
      <svg viewBox="0 0 120 100" className="w-full drop-shadow-[0_6px_6px_rgba(40,14,6,0.45)]">
        <polygon
          points={points}
          fill={padu ? "#e8b04a" : "#8a1c19"}
          stroke="#3a1f0f"
          strokeWidth="2"
        />
        <polygon
          points={points}
          fill="none"
          stroke={padu ? "#fff1c4" : "#f6ead8"}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          transform="translate(60 50) scale(0.86) translate(-60 -50)"
        />
        <text
          x="60"
          y={padu ? 60 : 47}
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize={padu ? 28 : 15}
          fill={padu ? "#3a1f0f" : "#f6ead8"}
        >
          {padu ? "PADU!" : "HILANG"}
        </text>
        {!padu && (
          <text
            x="60"
            y="64"
            textAnchor="middle"
            fontFamily="Fraunces, Georgia, serif"
            fontStyle="italic"
            fontWeight="700"
            fontSize="15"
            fill="#f6ead8"
          >
            DEPOSIT!
          </text>
        )}
      </svg>
    </div>
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

function ControlButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full bg-[var(--cream)] px-4 text-sm font-bold text-[var(--ink)] shadow-[2px_2px_0_var(--brass)] active:translate-y-px"
    >
      {children}
    </button>
  );
}
