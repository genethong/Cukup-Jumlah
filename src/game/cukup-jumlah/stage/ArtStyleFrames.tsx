import type { ReactNode } from "react";
import { loadCandidate, PARTIES } from "../creator/candidate";
import type { PuppetConfig } from "../puppet/loadRig";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import { DalangBanner, Kelir, StageBox } from "./Panggung";

// Art-pass style frames (/dev?lab=gaya): one frozen moment of Perang Speaker drawn in three
// looks, so Axel can choose before every game is redrawn. Nothing here is wired into play.
//   A. Kulit: props as carved, punched leather lit from behind, like the puppets.
//   B. Kertas: flat painted paper cut-outs under a night sky.
//   C. Kad: cardstock and felt with brass pins and gold filigree, per the puppet art bible.

const SAMPLE: PuppetConfig = {
  gender: "m",
  tone: "tone_5",
  faceShape: "oval",
  hair: "sidepart",
  headwear: null,
  outfit: "batik_shirt",
  lower: null,
  footwear: "selipar",
};

const RIVAL: PuppetConfig = {
  gender: "m",
  tone: "tone_3",
  faceShape: "square",
  hair: "sidepart",
  headwear: null,
  outfit: "business_suit",
  lower: null,
  footwear: "sneakers",
};

/** A frozen crowd mid-tug: 0 at your stage, 1 at the rival's. */
const CROWD = [
  0.08, 0.15, 0.22, 0.3, 0.12, 0.27, 0.36, 0.42, 0.19, 0.33, 0.46, 0.05, 0.39, 0.25, 0.55, 0.64,
  0.72, 0.6, 0.81, 0.9,
];

export function ArtStyleFrames() {
  const candidate = loadCandidate();
  const me = candidate?.puppet ?? SAMPLE;
  const colour = PARTIES.find((p) => p.id === candidate?.party)?.colour ?? PARTIES[0]!.colour;
  return (
    <main className="panggung h-dvh overflow-y-auto overscroll-contain bg-[#140b06] px-4 py-6 text-[var(--cream)]">
      <h1 className="mb-1 text-center font-display text-2xl font-bold italic">Gaya seni</h1>
      <p className="mx-auto mb-6 max-w-[40rem] text-center text-sm opacity-80">
        Same moment of Perang Speaker in three looks. Only the stage art differs; the puppets stay
        as they are. C follows the puppet art bible.
      </p>
      <div className="mx-auto grid max-w-[90rem] gap-8 md:grid-cols-3">
        <Frame label="C · Kad (cardstock, art bible)">
          <KadScene me={me} colour={colour} />
        </Frame>
        <Frame label="A · Kulit (carved leather)">
          <KulitScene me={me} colour={colour} />
        </Frame>
        <Frame label="B · Kertas (painted paper)">
          <KertasScene me={me} colour={colour} />
        </Frame>
      </div>
    </main>
  );
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-center font-tally text-lg tracking-[0.1em] uppercase">{label}</h2>
      <StageBox>
        <Kelir>{children}</Kelir>
      </StageBox>
    </section>
  );
}

/** The shell's top half, as the round shows it: banner, fuse, how-to. */
function Banner({ dark }: { dark?: boolean }) {
  return (
    <div className="absolute top-[15%] left-1/2 z-20 flex w-[90%] -translate-x-1/2 flex-col items-center gap-[1.6cqw]">
      <DalangBanner call="LAUNG!" hint="Ceramah lawan ceramah" />
      <div className="flex w-[80%] items-center gap-[2cqw]">
        <span className="text-[5cqw]">🧨</span>
        <div className="h-[2cqw] flex-1 rounded-full bg-[#2b2522]/30">
          <div className="h-full w-[55%] rounded-full bg-[linear-gradient(90deg,#8a5a2b,#e0a33a)]" />
        </div>
        <span
          className={`font-tally text-[4.4cqw] ${dark ? "text-[var(--cream)]" : "text-[var(--ink)]"}`}
        >
          3.2
        </span>
      </div>
      <span
        className={`font-tally text-[3.2cqw] tracking-[0.12em] uppercase ${dark ? "text-[var(--cream)]" : "text-[var(--ink)]"}`}
      >
        Laung masa lawan berhenti
      </span>
    </div>
  );
}

function Puppets({ me }: { me: PuppetConfig }) {
  return (
    <>
      <div className="pointer-events-none absolute bottom-[42.5%] left-[11%] z-10 h-[22%] w-[26%]">
        <PuppetAvatar config={{ ...me, expression: "angry_shout" }} anim="idle" />
      </div>
      <div className="pointer-events-none absolute right-[11%] bottom-[42.5%] z-10 h-[22%] w-[26%]">
        <PuppetAvatar config={{ ...RIVAL, expression: "neutral" }} anim="idle" />
      </div>
    </>
  );
}

function crowdSpot(p: number, i: number) {
  return {
    left: `${4 + p * 88 + ((i * 37) % 7) - 3}%`,
    top: `${(i % 5) * 16}%`,
    zIndex: i % 5,
  };
}

// ─── A · Kulit ──────────────────────────────────────────────────────────────────────────

const LEATHER = "#4a2511";
const LEATHER_LIGHT = "#6b3a1c";
const GOLD = "#d9a441";
const LIGHT = "#ffe3a3";
const RED = "#9b2a1c";

function KulitScene({ me, colour }: { me: PuppetConfig; colour: string }) {
  return (
    <>
      {/* Night falls on the screen: the lamp lights the middle, the edges go dark. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,transparent_35%,rgba(43,18,6,0.55)_100%)]" />
      <KulitTree className="absolute top-[35%] -left-[6%] h-[27%]" />
      <KulitTree className="absolute top-[35%] -right-[6%] h-[27%] -scale-x-100" />
      <KulitLights />
      <KulitBackdrop className="absolute top-[42%] left-[7%] h-[16%] w-[34%]" colour={colour} />
      <KulitBackdrop className="absolute top-[42%] right-[7%] h-[16%] w-[34%]" colour="#3d5a6b" />
      <KulitSpeaker className="absolute top-[40%] left-[0.5%] h-[23%]" loud />
      <KulitSpeaker className="absolute top-[40%] right-[0.5%] h-[23%] -scale-x-100" />
      <Puppets me={me} />
      <KulitStage className="absolute top-[57%] left-[5%] z-10 h-[7%] w-[38%]" colour={colour} />
      <KulitStage className="absolute top-[57%] right-[5%] z-10 h-[7%] w-[38%]" colour="#3d5a6b" />
      <Banner />
      <p className="absolute top-[45%] left-[31%] z-20 rounded-[1.6cqw] border-[0.5cqw] border-[#7a4a1e] bg-[#f7e7c4] px-[2cqw] py-[0.5cqw] font-display text-[4.2cqw] font-bold text-[var(--ink)] italic shadow-[0_0.6cqw_0_#7a4a1e]">
        Undilah saya!
      </p>
      <p className="absolute top-[51%] right-[31%] z-20 rounded-[1.6cqw] border-[0.5cqw] border-[#7a4a1e]/60 bg-[#efe0bf] px-[2cqw] py-[0.4cqw] font-display text-[3.2cqw] font-bold text-[var(--ink)]/80 italic">
        Minum air…
      </p>

      <div className="absolute inset-x-0 top-[64%] h-[20%]">
        {CROWD.map((p, i) => (
          <div
            key={i}
            className="absolute h-[44%]"
            style={{ ...crowdSpot(p, i), aspectRatio: "3 / 7" }}
          >
            <KulitVillager variant={i % 3} near={p < 0.5} />
          </div>
        ))}
      </div>

      <div className="absolute top-[84.5%] left-1/2 z-20 flex -translate-x-1/2 items-center gap-[2cqw] rounded-[1cqw] border-[0.5cqw] border-[#d9a441] bg-[#2b1407] px-[2.4cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[var(--cream)] uppercase">
        <span className="text-[#ffd77a]">Anda 13/14</span>
        <span className="opacity-60">·</span>
        <span>Lawan 7</span>
      </div>
      <button
        type="button"
        className="absolute bottom-[2.5%] left-1/2 z-20 flex h-[8.5%] w-[60%] -translate-x-1/2 items-center justify-center"
      >
        <svg viewBox="0 0 220 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            d="M14 4 H206 Q216 4 216 14 V50 Q216 60 206 60 H14 Q4 60 4 50 V14 Q4 4 14 4 Z"
            fill={RED}
            stroke={GOLD}
            strokeWidth="4"
          />
          <path
            d="M20 10 H200 M20 54 H200"
            stroke={LIGHT}
            strokeWidth="2"
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
        </svg>
        <span className="relative font-display text-[7cqw] font-bold text-[#fff3d6] italic drop-shadow-[0_0.4cqw_0_#3b1410]">
          🎤 LAUNG!
        </span>
      </button>
    </>
  );
}

/** Dots of lamplight showing through punched holes along a line. */
function Punched({ d, gap = 5 }: { d: string; gap?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={LIGHT}
      strokeWidth="1.8"
      strokeDasharray={`0.1 ${gap}`}
      strokeLinecap="round"
    />
  );
}

/** A carved coconut palm at the field's edge. */
function KulitTree({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 60 120" className={`pointer-events-none ${className}`} aria-hidden="true">
      <path d="M30 120 Q26 80 34 34" fill="none" stroke={LEATHER} strokeWidth="7" />
      <Punched d="M30 116 Q26 80 34 38" gap={6} />
      {[-70, -35, 0, 35, 70, 110, -110].map((a) => (
        <g key={a} transform={`translate(34 32) rotate(${a})`}>
          <path d="M0 0 Q14 -6 30 4 Q14 2 0 0 Z" fill={LEATHER} />
          <Punched d="M3 -1 Q14 -4 26 2" gap={4} />
        </g>
      ))}
      <circle cx="31" cy="38" r="3" fill={LEATHER_LIGHT} />
      <circle cx="37" cy="37" r="3" fill={LEATHER_LIGHT} />
    </svg>
  );
}

/** A string of little oil lamps across the field. */
function KulitLights() {
  return (
    <svg
      viewBox="0 0 200 20"
      className="pointer-events-none absolute top-[37.5%] left-[4%] w-[92%]"
      aria-hidden="true"
    >
      <path d="M0 2 Q100 22 200 2" fill="none" stroke={LEATHER} strokeWidth="1.2" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 18;
        const y = 2 + 20 * (x / 200) * (1 - x / 200) * 1.6;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="5" fill="#ffcf5a" opacity="0.35" />
            <path d="M0 -3 C2 -1 2 1 0 2 C-2 1 -2 -1 0 -3 Z" fill="#ffb347" />
            <path d="M-2.4 2 H2.4 L1.6 4 H-1.6 Z" fill={GOLD} />
          </g>
        );
      })}
    </svg>
  );
}

/** The cloth banner behind a stage, hung on two poles, with a tumpal border. */
function KulitBackdrop({ className, colour }: { className: string; colour: string }) {
  return (
    <svg viewBox="0 0 120 60" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect x="4" y="0" width="3" height="60" fill={LEATHER} />
      <rect x="113" y="0" width="3" height="60" fill={LEATHER} />
      <path
        d="M7 6 H113 V44 L106 50 L99 44 L92 50 L85 44 L78 50 L71 44 L64 50 L57 44 L50 50 L43 44 L36 50 L29 44 L22 50 L15 44 L7 50 Z"
        fill={colour}
      />
      <path d="M7 6 H113" stroke={GOLD} strokeWidth="2.5" />
      <path d="M11 11 H109 V40 H11 Z" fill="none" stroke={GOLD} strokeWidth="1" />
      <Punched d="M14 14 H106" gap={4} />
      <Punched d="M14 37 H106" gap={4} />
    </svg>
  );
}

/** A stack of speaker boxes cut from leather; the cones are rings of punched holes. */
function KulitSpeaker({ className, loud }: { className: string; loud?: boolean }) {
  return (
    <svg
      viewBox="0 0 70 110"
      className={`pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* A carved crest on top, like a little gunungan. */}
      <path d="M6 12 L20 0 L34 12 Z" fill={LEATHER} />
      <Punched d="M12 10 L20 3 L28 10" gap={3} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(4 ${12 + i * 32})`}>
          <rect width="32" height="30" rx="2" fill={LEATHER} stroke={GOLD} strokeWidth="1.4" />
          <circle cx="16" cy="15" r="11" fill="#2a1408" stroke={GOLD} strokeWidth="1.2" />
          <circle
            cx="16"
            cy="15"
            r="8"
            fill="none"
            stroke={LIGHT}
            strokeWidth="1.6"
            strokeDasharray="0.1 3.1"
            strokeLinecap="round"
          />
          <circle cx="16" cy="15" r="3.6" fill={RED} stroke={GOLD} strokeWidth="1" />
        </g>
      ))}
      {loud &&
        [10, 18, 26].map((r, k) => (
          <g key={r} opacity={1 - k * 0.2}>
            <path
              d={`M${38 + r * 0.5} ${55 - r} Q${38 + r * 1.2} 55 ${38 + r * 0.5} ${55 + r}`}
              fill="none"
              stroke={LEATHER}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Punched
              d={`M${38 + r * 0.5} ${57 - r} Q${38 + r * 1.2} 55 ${38 + r * 0.5} ${53 + r}`}
              gap={4}
            />
          </g>
        ))}
    </svg>
  );
}

/** A plank stage with a carved skirt of tumpal triangles. */
function KulitStage({ className, colour }: { className: string; colour: string }) {
  return (
    <svg viewBox="0 0 160 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect x="0" y="0" width="160" height="6" fill={LEATHER_LIGHT} stroke={GOLD} strokeWidth="1" />
      <rect x="2" y="6" width="156" height="20" fill={LEATHER} />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <path
            d={`M${4 + i * 15.4} 26 L${11.7 + i * 15.4} 8 L${19.4 + i * 15.4} 26 Z`}
            fill={i % 2 ? GOLD : colour}
          />
          <circle cx={11.7 + i * 15.4} cy="20" r="1.3" fill={LIGHT} />
        </g>
      ))}
      <Punched d="M4 3 H156" gap={4} />
      <rect x="6" y="26" width="5" height="4" fill={LEATHER} />
      <rect x="149" y="26" width="5" height="4" fill={LEATHER} />
    </svg>
  );
}

/**
 * A villager as a little wayang rakyat figure, faceless, in punched leather. Those won over
 * stand bold; the rest are faded into the far side of the screen.
 */
function KulitVillager({ variant, near }: { variant: number; near: boolean }) {
  const body = near ? LEATHER : "#9a7a5c";
  const accent = near ? GOLD : "#c9b08a";
  const cloth = near ? RED : "#b49378";
  return (
    <svg viewBox="0 0 30 70" className="h-full w-full overflow-visible" aria-hidden="true">
      {/* head */}
      <ellipse cx="15" cy="9" rx="5.2" ry="6" fill={body} />
      {variant === 0 && <path d="M9 6 Q15 0 21 6 L25 7 L9 7.5 Z" fill={cloth} />}
      {variant === 1 && <circle cx="10" cy="5" r="3.4" fill={body} />}
      {/* torso: baju, with a punched collar */}
      <path d="M8 18 Q15 14 22 18 L23 38 L7 38 Z" fill={body} />
      <path d="M11 17 Q15 21 19 17" fill="none" stroke={accent} strokeWidth="1.2" />
      <path
        d="M10 26 H20"
        stroke={LIGHT}
        strokeWidth="1.3"
        strokeDasharray="0.1 3"
        strokeLinecap="round"
        opacity={near ? 1 : 0.4}
      />
      {/* kain / sarong with a tumpal hem */}
      <path d="M7 37 H23 L24 58 H6 Z" fill={variant === 1 ? cloth : body} />
      <path d="M6 58 L9 52 L12 58 L15 52 L18 58 L21 52 L24 58" fill={accent} />
      {/* legs */}
      <rect x="9" y="58" width="4" height="11" rx="1.5" fill={body} />
      <rect x="17" y="58" width="4" height="11" rx="1.5" fill={body} />
      {/* long wayang arms */}
      <path
        d="M8 19 Q4 32 5 46"
        fill="none"
        stroke={body}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M22 19 Q26 32 25 46"
        fill="none"
        stroke={body}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {variant === 2 && <path d="M26 44 L27 69" stroke={accent} strokeWidth="1.6" />}
    </svg>
  );
}

// ─── B · Kertas ─────────────────────────────────────────────────────────────────────────

const NIGHT = "#1d2547";
const PAPER_EDGE = "#fdf6e6";

function KertasScene({ me, colour }: { me: PuppetConfig; colour: string }) {
  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="kertas-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0" />
          <feComposite in2="SourceGraphic" operator="in" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>
      {/* Night sky above the field, painted on paper. */}
      <div className="absolute inset-x-0 top-0 h-[66%] bg-[linear-gradient(180deg,#141a36,#2c3466_60%,#4b3f6e)]" />
      <svg
        viewBox="0 0 100 60"
        className="pointer-events-none absolute inset-x-0 top-0 h-[66%] w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[
          [8, 6],
          [22, 12],
          [36, 4],
          [58, 9],
          [74, 5],
          [90, 13],
          [14, 22],
          [84, 24],
          [48, 2],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" fill="#fff6d6" />
        ))}
      </svg>
      <div className="absolute top-[3.5%] right-[10%] h-[9cqw] w-[9cqw] rounded-full bg-[#fff1c4] shadow-[0_0_6cqw_#fff1c4aa]" />
      {/* The field. */}
      <div
        className="absolute inset-x-0 top-[60%] bottom-0 bg-[linear-gradient(180deg,#3f5a33,#2c4226)]"
        style={{ filter: "url(#kertas-grain)" }}
      />
      <KertasPalms />
      <KertasLights />
      <KertasBackdrop className="absolute top-[42%] left-[7%] h-[16%] w-[34%]" colour={colour} />
      <KertasBackdrop className="absolute top-[42%] right-[7%] h-[16%] w-[34%]" colour="#4d6b80" />
      <KertasSpeaker className="absolute top-[40%] left-[0.5%] h-[23%]" loud />
      <KertasSpeaker className="absolute top-[40%] right-[0.5%] h-[23%] -scale-x-100" />
      <Puppets me={me} />
      <KertasStage className="absolute top-[57%] left-[5%] z-10 h-[7%] w-[38%]" colour={colour} />
      <KertasStage className="absolute top-[57%] right-[5%] z-10 h-[7%] w-[38%]" colour="#4d6b80" />
      <Banner dark />
      <p className="absolute top-[45%] left-[31%] z-20 rotate-[-3deg] rounded-[2cqw] border-[0.6cqw] border-[#fdf6e6] bg-[#ffd84d] px-[2cqw] py-[0.5cqw] font-display text-[4.2cqw] font-bold text-[#2b1a0e] italic shadow-[0.8cqw_0.8cqw_0_rgba(0,0,0,0.35)]">
        Undilah saya!
      </p>
      <p className="absolute top-[51%] right-[31%] z-20 rotate-[2deg] rounded-[2cqw] border-[0.6cqw] border-[#fdf6e6] bg-[#dfe7f2] px-[2cqw] py-[0.4cqw] font-display text-[3.2cqw] font-bold text-[#2b1a0e]/80 italic shadow-[0.6cqw_0.6cqw_0_rgba(0,0,0,0.3)]">
        Minum air…
      </p>

      <div className="absolute inset-x-0 top-[64%] h-[20%]">
        {CROWD.map((p, i) => (
          <div
            key={i}
            className="absolute h-[44%]"
            style={{ ...crowdSpot(p, i), aspectRatio: "3 / 7" }}
          >
            <KertasVillager variant={i % 4} near={p < 0.5} />
          </div>
        ))}
      </div>

      <div className="absolute top-[84.5%] left-1/2 z-20 flex -translate-x-1/2 -rotate-1 items-center gap-[2cqw] border-[0.6cqw] border-[#fdf6e6] bg-[#1d2547] px-[2.4cqw] py-[0.5cqw] font-tally text-[3.4cqw] tracking-[0.06em] whitespace-nowrap text-[#fdf6e6] uppercase shadow-[0.6cqw_0.6cqw_0_rgba(0,0,0,0.35)]">
        <span className="text-[#ffd84d]">Anda 13/14</span>
        <span className="opacity-60">·</span>
        <span>Lawan 7</span>
      </div>
      <button
        type="button"
        className="absolute bottom-[2.5%] left-1/2 z-20 flex h-[8.5%] w-[60%] -translate-x-1/2 rotate-[-1.5deg] items-center justify-center rounded-[2.4cqw] border-[0.9cqw] border-[#fdf6e6] bg-[#e4402f] font-display text-[7cqw] font-bold text-[#fdf6e6] italic shadow-[1.2cqw_1.2cqw_0_rgba(0,0,0,0.4)]"
      >
        🎤 LAUNG!
      </button>
    </>
  );
}

const paperShadow = { filter: "drop-shadow(1.2px 1.6px 0 rgba(0,0,0,0.35))" };

function KertasPalms() {
  return (
    <svg
      viewBox="0 0 100 40"
      className="pointer-events-none absolute inset-x-0 top-[40%] h-[22%] w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 40 Q20 30 40 34 T100 30 V40 Z" fill="#26304f" />
      {[6, 94].map((x) => (
        <g key={x} transform={`translate(${x} 40)`}>
          <path d="M0 0 Q-1 -16 1 -30" stroke="#1a2038" strokeWidth="1.6" fill="none" />
          {[-60, -25, 15, 50, 160, 200].map((a) => (
            <path
              key={a}
              d="M0 0 Q6 -3 12 1 Q6 0 0 0 Z"
              fill="#1a2038"
              transform={`translate(1 -30) rotate(${a})`}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function KertasLights() {
  const colours = ["#ff6b5a", "#ffd84d", "#6fd3a0", "#6ab6ff"];
  return (
    <svg
      viewBox="0 0 200 20"
      className="pointer-events-none absolute top-[37.5%] left-[4%] w-[92%]"
      aria-hidden="true"
    >
      <path d="M0 2 Q100 22 200 2" fill="none" stroke="#fdf6e6" strokeWidth="0.8" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = 8 + i * 15.3;
        const y = 2 + 20 * (x / 200) * (1 - x / 200) * 1.6;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="5" fill={colours[i % 4]} opacity="0.25" />
            <ellipse
              cx="0"
              cy="2"
              rx="2"
              ry="2.8"
              fill={colours[i % 4]}
              stroke="#fdf6e6"
              strokeWidth="0.6"
            />
          </g>
        );
      })}
    </svg>
  );
}

function KertasBackdrop({ className, colour }: { className: string; colour: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      preserveAspectRatio="none"
      className={className}
      style={paperShadow}
      aria-hidden="true"
    >
      <rect x="4" y="0" width="3" height="60" fill="#8a5a2b" />
      <rect x="113" y="0" width="3" height="60" fill="#8a5a2b" />
      <rect
        x="7"
        y="5"
        width="106"
        height="40"
        rx="2"
        fill={colour}
        stroke={PAPER_EDGE}
        strokeWidth="2"
      />
    </svg>
  );
}

function KertasSpeaker({ className, loud }: { className: string; loud?: boolean }) {
  return (
    <svg
      viewBox="0 0 70 110"
      className={`pointer-events-none overflow-visible ${className}`}
      style={paperShadow}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(4 ${10 + i * 32})`}>
          <rect
            width="32"
            height="30"
            rx="3"
            fill="#23232b"
            stroke={PAPER_EDGE}
            strokeWidth="1.6"
          />
          <circle cx="16" cy="15" r="10" fill="#4a4a57" />
          <circle cx="16" cy="15" r="5" fill="#8f8fa3" />
          <circle cx="16" cy="15" r="2" fill="#23232b" />
        </g>
      ))}
      {loud &&
        [10, 18, 26].map((r, k) => (
          <path
            key={r}
            d={`M${38 + r * 0.5} ${55 - r} Q${38 + r * 1.2} 55 ${38 + r * 0.5} ${55 + r}`}
            fill="none"
            stroke="#ffd84d"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity={1 - k * 0.25}
          />
        ))}
    </svg>
  );
}

function KertasStage({ className, colour }: { className: string; colour: string }) {
  return (
    <svg
      viewBox="0 0 160 30"
      preserveAspectRatio="none"
      className={className}
      style={paperShadow}
      aria-hidden="true"
    >
      <rect
        x="0"
        y="0"
        width="160"
        height="8"
        fill="#c98a4b"
        stroke={PAPER_EDGE}
        strokeWidth="1.2"
      />
      <rect x="2" y="8" width="156" height="18" fill="#8a5a2b" />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${4 + i * 17.3} 8 L${12.6 + i * 17.3} 18 L${21.3 + i * 17.3} 8 Z`}
          fill={i % 2 ? PAPER_EDGE : colour}
        />
      ))}
    </svg>
  );
}

/** A villager as a faceless paper doll in a bright baju; the far side fades into the dark. */
function KertasVillager({ variant, near }: { variant: number; near: boolean }) {
  const shirts = ["#e4402f", "#ffd84d", "#3fa7d6", "#7ccf6a"];
  const shirt = near ? shirts[variant]! : "#59607e";
  const dark = near ? "#2b1a0e" : "#3a4060";
  return (
    <svg
      viewBox="0 0 30 70"
      className="h-full w-full overflow-visible"
      style={paperShadow}
      aria-hidden="true"
    >
      <circle cx="15" cy="9" r="6" fill={dark} stroke={PAPER_EDGE} strokeWidth="1.2" />
      {variant === 0 && <path d="M8 7 Q15 0 22 7 L25 8 H8 Z" fill={near ? "#3fa7d6" : "#4b5170"} />}
      <path d="M7 18 Q15 13 23 18 L24 40 H6 Z" fill={shirt} stroke={PAPER_EDGE} strokeWidth="1.2" />
      <path d="M7 40 H23 L22 58 H8 Z" fill={dark} stroke={PAPER_EDGE} strokeWidth="1" />
      <rect x="9" y="58" width="4.5" height="10" rx="2" fill={dark} />
      <rect x="16.5" y="58" width="4.5" height="10" rx="2" fill={dark} />
      {variant === 3 && (
        <path d="M23 20 L28 8" stroke={shirt} strokeWidth="3.4" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ─── C · Kad (cardstock, per docs/art/ART_BIBLE_PUPPET.md) ─────────────────────────────
// Props are built like the puppets: flat matte card with a darker cut-edge bevel (no ink
// outline), fine felt grain, soft shadows between layers, gold-foil filigree and brass
// split pins. Warm earthy palette only: no neon, no pure white.

const K = {
  red: "#8A1C19",
  redEdge: "#5a0f0d",
  teal: "#0E897F",
  tealEdge: "#08544e",
  gold: "#C18D48",
  goldDeep: "#98733B",
  grey: "#6B6965",
  greyEdge: "#46443f",
  card: "#2a2420",
  cardEdge: "#120e0b",
  cream: "#F3EBDF",
  creamEdge: "#cdbd9f",
  wood: "#8a5a32",
  woodEdge: "#4f321b",
  hair: "#201A12",
  skin: ["#E0AA64", "#C48854", "#A0643A"],
  palm: "#3d5b45",
  palmEdge: "#22362a",
};

/** Shared SVG defs for look C: the card filter (grain + layer shadow) and the brass. */
function KadDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="kad" x="-15%" y="-15%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.3"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0" result="g" />
          <feComposite in="g" in2="SourceGraphic" operator="in" result="gi" />
          <feBlend in="SourceGraphic" in2="gi" mode="multiply" result="tex" />
          <feDropShadow
            in="tex"
            dx="0.7"
            dy="1.3"
            stdDeviation="0.8"
            floodColor="#3a2414"
            floodOpacity="0.45"
          />
        </filter>
        <radialGradient id="kad-brass" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FEF8CB" />
          <stop offset="0.35" stopColor="#c9a24a" />
          <stop offset="0.75" stopColor="#9D7A2F" />
          <stop offset="1" stopColor="#5d4415" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** A die-cut card piece: the darker cut edge peeks out below-right, like card thickness. */
function Card({
  d,
  fill,
  edge,
  depth = 1,
}: {
  d: string;
  fill: string;
  edge: string;
  depth?: number;
}) {
  return (
    <g filter="url(#kad)">
      <path d={d} fill={edge} transform={`translate(${0.6 * depth} ${0.9 * depth})`} />
      <path d={d} fill={fill} />
    </g>
  );
}

function rect(x: number, y: number, w: number, h: number, r = 0): string {
  return `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

function Pin({ x, y, r = 1.6 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x + r * 0.25} cy={y + r * 0.35} r={r} fill="#3a2414" opacity="0.35" />
      <circle cx={x} cy={y} r={r} fill="url(#kad-brass)" />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#FEF8CB" />
    </g>
  );
}

/** A run of awan larat scrolls in gold foil, as a border. */
function Scrolls({ x, y, w, size = 5 }: { x: number; y: number; w: number; size?: number }) {
  const n = Math.max(1, Math.floor(w / (size * 2)));
  const step = w / n;
  return (
    <g fill="none" stroke={K.gold} strokeWidth={size * 0.16} strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const sx = x + i * step;
        const flip = i % 2 ? -1 : 1;
        return (
          <path
            key={i}
            d={`M${sx} ${y} C${sx + step * 0.25} ${y - size * 0.7 * flip} ${sx + step * 0.6} ${y - size * 0.7 * flip} ${sx + step * 0.6} ${y - size * 0.15 * flip} C${sx + step * 0.6} ${y + size * 0.2 * flip} ${sx + step * 0.38} ${y + size * 0.2 * flip} ${sx + step * 0.4} ${y} M${sx + step * 0.6} ${y} Q${sx + step * 0.85} ${y + size * 0.35 * flip} ${sx + step} ${y}`}
          />
        );
      })}
    </g>
  );
}

function KadScene({ me, colour }: { me: PuppetConfig; colour: string }) {
  return (
    <>
      <KadDefs />
      {/* Evening on the paper stage: the lamp lights the middle, the edges warm and dim. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_40%,rgba(110,68,38,0.35)_100%)]" />
      <KadPalm className="absolute top-[36%] -left-[5%] h-[26%]" />
      <KadPalm className="absolute top-[36%] -right-[5%] h-[26%] -scale-x-100" />
      <KadLights />
      <KadBackdrop className="absolute top-[41.5%] left-[7%] h-[16.5%] w-[34%]" colour={colour} />
      <KadBackdrop className="absolute top-[41.5%] right-[7%] h-[16.5%] w-[34%]" colour={K.teal} />
      <KadSpeaker className="absolute top-[40%] left-[0.5%] h-[23%]" loud />
      <KadSpeaker className="absolute top-[40%] right-[0.5%] h-[23%] -scale-x-100" />
      <Puppets me={me} />
      <KadStage
        className="absolute top-[56.5%] left-[4.5%] z-10 h-[7.5%] w-[39%]"
        colour={colour}
      />
      <KadStage
        className="absolute top-[56.5%] right-[4.5%] z-10 h-[7.5%] w-[39%]"
        colour={K.teal}
      />
      <Banner />
      <KadBubble className="top-[45%] left-[31%]" loud>
        Undilah saya!
      </KadBubble>
      <KadBubble className="top-[51%] right-[31%]">Minum air…</KadBubble>

      <div className="absolute inset-x-0 top-[64.5%] h-[20%]">
        {CROWD.map((p, i) => (
          <div
            key={i}
            className="absolute h-[46%]"
            style={{
              ...crowdSpot(p, i),
              aspectRatio: "3 / 7",
              ...(p < 0.5 ? {} : { opacity: 0.55, filter: "saturate(0.35) brightness(1.08)" }),
            }}
          >
            <KadVillager variant={i % 4} skin={K.skin[i % 3]!} />
          </div>
        ))}
      </div>

      <div className="absolute top-[85%] left-1/2 z-20 h-[4.6%] w-[46%] -translate-x-1/2">
        <svg viewBox="0 0 120 22" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <Card d={rect(1, 1, 118, 19, 3)} fill={K.card} edge={K.cardEdge} />
          <path d={rect(4, 4, 112, 13, 2)} fill="none" stroke={K.gold} strokeWidth="0.8" />
          <Pin x={5} y={10.5} r={1.4} />
          <Pin x={115} y={10.5} r={1.4} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center gap-[1.6cqw] font-tally text-[3.3cqw] tracking-[0.06em] whitespace-nowrap text-[#F3EBDF] uppercase">
          <span className="text-[#e9c27a]">Anda 13/14</span>
          <span className="opacity-60">·</span>
          <span>Lawan 7</span>
        </span>
      </div>
      <button
        type="button"
        className="absolute bottom-[2.3%] left-1/2 z-20 flex h-[9%] w-[62%] -translate-x-1/2 items-center justify-center"
      >
        <svg viewBox="0 0 220 64" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <Card d={rect(3, 3, 212, 56, 10)} fill={K.red} edge={K.redEdge} depth={2.4} />
          <path d={rect(10, 9, 198, 44, 6)} fill="none" stroke={K.gold} strokeWidth="1.6" />
          <Scrolls x={22} y={13.5} w={176} size={6} />
          <Scrolls x={22} y={48.5} w={176} size={6} />
          <Pin x={14} y={31} r={3.2} />
          <Pin x={204} y={31} r={3.2} />
        </svg>
        <span className="relative font-display text-[7cqw] font-bold text-[#F3EBDF] italic drop-shadow-[0_0.35cqw_0_#5a0f0d]">
          🎤 LAUNG!
        </span>
      </button>
    </>
  );
}

function KadBubble({
  className,
  loud,
  children,
}: {
  className: string;
  loud?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={`absolute z-20 rounded-[1.8cqw] bg-[#F3EBDF] px-[2.2cqw] py-[0.6cqw] font-display font-bold whitespace-nowrap text-[#24170f] italic shadow-[0.5cqw_0.8cqw_0_#cdbd9f,0.8cqw_1.4cqw_1.2cqw_rgba(58,36,20,0.35)] ${className} ${loud ? "text-[4.2cqw]" : "text-[3.2cqw] opacity-85"}`}
    >
      <span className="absolute top-[0.9cqw] left-[0.9cqw] h-[1.4cqw] w-[1.4cqw] rounded-full bg-[radial-gradient(circle_at_35%_35%,#FEF8CB,#9D7A2F_70%,#5d4415)]" />
      {children}
    </p>
  );
}

/** A coconut palm cut from card: trunk in rings, fronds pinned at the crown. */
function KadPalm({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 60 120"
      className={`pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <Card d="M27 120 Q24 80 31 36 L36 36 Q30 80 34 120 Z" fill={K.wood} edge={K.woodEdge} />
      {[50, 64, 78, 92, 106].map((y) => (
        <path
          key={y}
          d={`M${28 - (120 - y) * 0.02} ${y} q4 2 7 0`}
          stroke={K.woodEdge}
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
      ))}
      {[-150, -110, -70, -30, 10, 50].map((a) => (
        <g key={a} transform={`translate(33 34) rotate(${a})`}>
          <Card d="M0 -2 Q16 -9 32 2 Q16 3 0 2 Z" fill={K.palm} edge={K.palmEdge} />
          <path d="M3 0 Q16 -4 28 1" stroke={K.gold} strokeWidth="0.6" fill="none" opacity="0.7" />
        </g>
      ))}
      <Pin x={33} y={34} r={2.2} />
    </svg>
  );
}

/** A string of paper lanterns across the field, each pinned to the cord. */
function KadLights() {
  return (
    <svg
      viewBox="0 0 200 22"
      className="pointer-events-none absolute top-[37.3%] left-[4%] w-[92%] overflow-visible"
      aria-hidden="true"
    >
      <path d="M0 2 Q100 22 200 2" fill="none" stroke={K.hair} strokeWidth="0.9" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 18;
        const y = 2 + 20 * (x / 200) * (1 - x / 200) * 1.6;
        const fill = [K.red, K.gold, K.teal][i % 3]!;
        const edge = [K.redEdge, K.goldDeep, K.tealEdge][i % 3]!;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle cy="4.5" r="6" fill="#ffcf5a" opacity="0.28" />
            <Card d="M-3 1.5 Q0 0 3 1.5 L3.6 7 Q0 9 -3.6 7 Z" fill={fill} edge={edge} depth={0.6} />
            <path d="M-3 4.3 H3.2" stroke={K.gold} strokeWidth="0.5" />
            <Pin x={0} y={1.2} r={0.9} />
          </g>
        );
      })}
    </svg>
  );
}

/** The cloth banner behind a stage: a card panel with a gold scroll border, on two poles. */
function KadBackdrop({ className, colour }: { className: string; colour: string }) {
  return (
    <svg viewBox="0 0 120 60" preserveAspectRatio="none" className={className} aria-hidden="true">
      <Card d={rect(3, 0, 4, 60, 1)} fill={K.wood} edge={K.woodEdge} />
      <Card d={rect(113, 0, 4, 60, 1)} fill={K.wood} edge={K.woodEdge} />
      <Card
        d="M7 5 H113 V46 L106 51 L99 46 L92 51 L85 46 L78 51 L71 46 L64 51 L57 46 L50 51 L43 46 L36 51 L29 46 L22 51 L15 46 L7 51 Z"
        fill={colour}
        edge="#3a2414"
      />
      <path d={rect(11, 9, 98, 33, 1)} fill="none" stroke={K.gold} strokeWidth="1" />
      <Scrolls x={14} y={13} w={92} size={4} />
      <Scrolls x={14} y={38} w={92} size={4} />
      <Pin x={10} y={7} r={1.8} />
      <Pin x={110} y={7} r={1.8} />
    </svg>
  );
}

/** A stack of speaker boxes in black card; the cones are stacked card discs. */
function KadSpeaker({ className, loud }: { className: string; loud?: boolean }) {
  return (
    <svg
      viewBox="0 0 70 110"
      className={`pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <Card d="M6 13 L20 1 L34 13 Z" fill={K.gold} edge={K.goldDeep} />
      <Pin x={20} y={9} r={1.4} />
      {[0, 1, 2].map((i) => {
        const y = 13 + i * 32;
        return (
          <g key={i}>
            <Card d={rect(4, y, 32, 30, 2.5)} fill={K.card} edge={K.cardEdge} />
            <path
              d={rect(6.5, y + 2.5, 27, 25, 1.5)}
              fill="none"
              stroke={K.gold}
              strokeWidth="0.7"
            />
            <Card d={circle(20, y + 15, 10)} fill={K.grey} edge={K.greyEdge} depth={0.7} />
            <Card d={circle(20, y + 15, 6)} fill="#4f4c48" edge={K.greyEdge} depth={0.6} />
            <Pin x={20} y={y + 15} r={2.4} />
            {[
              [7.5, y + 3.5],
              [32.5, y + 3.5],
              [7.5, y + 26.5],
              [32.5, y + 26.5],
            ].map(([px, py]) => (
              <Pin key={`${px}-${py}`} x={px!} y={py!} r={1} />
            ))}
          </g>
        );
      })}
      {loud &&
        [10, 18, 26].map((r, k) => (
          <g key={r} opacity={1 - k * 0.22}>
            <Card
              d={`M${39 + r * 0.5} ${57 - r} Q${39 + r * 1.25} 57 ${39 + r * 0.5} ${57 + r} L${41 + r * 0.5} ${57 + r} Q${41 + r * 1.25} 57 ${41 + r * 0.5} ${57 - r} Z`}
              fill={K.gold}
              edge={K.goldDeep}
              depth={0.6}
            />
          </g>
        ))}
    </svg>
  );
}

/** A plank stage with a skirt of songket lattice and a tumpal hem, pinned at the ends. */
function KadStage({ className, colour }: { className: string; colour: string }) {
  return (
    <svg viewBox="0 0 160 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <Card d={rect(2, 6, 156, 22, 1)} fill={colour} edge="#3a2414" />
      {/* songket diamond lattice */}
      <g stroke={K.gold} strokeWidth="0.6" opacity="0.85">
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d={`M${6 + i * 10} 9 L${11 + i * 10} 15 L${6 + i * 10} 21 L${1 + i * 10} 15 Z`}
            fill="none"
          />
        ))}
      </g>
      {Array.from({ length: 14 }, (_, i) => (
        <path
          key={i}
          d={`M${4 + i * 11} 28 L${9.5 + i * 11} 21.5 L${15 + i * 11} 28 Z`}
          fill={K.gold}
        />
      ))}
      <Card d={rect(0, 0, 160, 6.5, 1.2)} fill={K.wood} edge={K.woodEdge} />
      <Pin x={5} y={3.2} r={1.6} />
      <Pin x={155} y={3.2} r={1.6} />
    </svg>
  );
}

/**
 * A villager as a small chibi card figure like the puppets, but faceless: felt head and hair,
 * a baju and kain, brass pins at the shoulders.
 */
function KadVillager({ variant, skin }: { variant: number; skin: string }) {
  const baju = [K.red, K.teal, K.gold, K.grey][variant]!;
  const bajuEdge = [K.redEdge, K.tealEdge, K.goldDeep, K.greyEdge][variant]!;
  return (
    <svg viewBox="0 0 30 70" className="h-full w-full overflow-visible" aria-hidden="true">
      {/* legs and feet */}
      <Card d={rect(10, 54, 4, 12, 1.5)} fill={skin} edge="#7a4a26" depth={0.5} />
      <Card d={rect(16, 54, 4, 12, 1.5)} fill={skin} edge="#7a4a26" depth={0.5} />
      <Card d={rect(8.5, 64, 6.5, 3.5, 1.5)} fill="#664427" edge="#3d2618" depth={0.5} />
      <Card d={rect(15, 64, 6.5, 3.5, 1.5)} fill="#664427" edge="#3d2618" depth={0.5} />
      {/* kain */}
      <Card
        d="M8 38 H22 L23 56 H7 Z"
        fill={variant === 1 ? K.gold : K.hair}
        edge="#0e0b08"
        depth={0.7}
      />
      <path
        d="M8 52 L10.5 48 L13 52 L15.5 48 L18 52 L20.5 48 L23 52"
        fill="none"
        stroke={variant === 1 ? K.red : K.gold}
        strokeWidth="0.9"
      />
      {/* arms */}
      <Card d="M6.5 21 Q4 30 5 38 L8 38 Q8 30 9.5 22 Z" fill={baju} edge={bajuEdge} depth={0.6} />
      <Card
        d="M23.5 21 Q26 30 25 38 L22 38 Q22 30 20.5 22 Z"
        fill={baju}
        edge={bajuEdge}
        depth={0.6}
      />
      <Card d={circle(5.8, 39.5, 2)} fill={skin} edge="#7a4a26" depth={0.4} />
      <Card d={circle(24.2, 39.5, 2)} fill={skin} edge="#7a4a26" depth={0.4} />
      {/* baju with a gold neckline */}
      <Card d="M8 20 Q15 16.5 22 20 L22.5 40 H7.5 Z" fill={baju} edge={bajuEdge} />
      <path d="M12 19 Q15 23 18 19" fill="none" stroke={K.gold} strokeWidth="0.9" />
      <Pin x={8.4} y={21.5} r={1.1} />
      <Pin x={21.6} y={21.5} r={1.1} />
      {/* head and hair */}
      {variant === 1 && <Card d={circle(15, 3.2, 3.2)} fill={K.hair} edge="#0e0b08" depth={0.5} />}
      <Card d={circle(15, 11, 8)} fill={skin} edge="#7a4a26" />
      {variant === 2 ? (
        <Card
          d="M6.8 9.5 Q15 1 23.2 9.5 L27 10.6 L6.8 11.2 Z"
          fill={K.teal}
          edge={K.tealEdge}
          depth={0.6}
        />
      ) : (
        <Card
          d="M7 10.5 Q8 2.5 15 2.6 Q22 2.5 23 10.5 Q19 6.5 15 6.8 Q11 6.5 7 10.5 Z"
          fill={K.hair}
          edge="#0e0b08"
          depth={0.6}
        />
      )}
    </svg>
  );
}
