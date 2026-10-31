import type { HTMLAttributes, ReactNode } from "react";
import "./stage.css";

// Shared pieces of the puppet-show stage (docs/GAME_PLAN.md §3). The stage is always
// 9:16; children of <Kelir> size themselves in container units (cqw) so the layout is
// identical on every screen.

/** Carved wooden frame. Wrap it around <Kelir> inside an element with the `panggung` class. */
export function StageBox({ children }: { children: ReactNode }) {
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

/** The lit cloth screen, 9:16, with the lamp glow. Extra props go to the screen element. */
export function Kelir({ children, className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`kelir @container relative aspect-[9/16] w-full overflow-hidden rounded-[8px] ${className}`}
    >
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

/** The dalang's call on a cut-paper banner, with an optional hint underneath. */
export function DalangBanner({ call, hint }: { call: string; hint?: string }) {
  return (
    <>
      <div
        className="bg-[var(--sambal)] px-[9cqw] py-[1.2cqw] text-[var(--cream)] shadow-[0_4px_6px_rgba(40,14,6,0.35)]"
        style={{ clipPath: "polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)" }}
      >
        <span className="font-display text-[12cqw] leading-tight font-bold italic tracking-tight">
          {call}
        </span>
      </div>
      {hint && (
        <span className="rounded-sm bg-[#fbf3e4]/85 px-[2cqw] py-[0.5cqw] text-center text-[3.8cqw] font-medium text-[var(--ink)]">
          {hint}
        </span>
      )}
    </>
  );
}

/** Four brass pins; `beat` (1–4) lights one, 0 lights none. Pin 4 is the hit beat. */
export function BeatPins({ beat }: { beat: number }) {
  return (
    <div className="flex items-center gap-[3cqw] pt-[1cqw]" aria-label={`Ketukan ${beat}`}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          data-on={n === beat}
          className={`beat-pin rounded-full transition-transform duration-100 ${n === 4 ? "h-[4.4cqw] w-[4.4cqw]" : "h-[3.2cqw] w-[3.2cqw]"}`}
        />
      ))}
    </div>
  );
}

export type StampTone = "gold" | "red" | "pale";

const STAMP_COLOURS: Record<StampTone, { fill: string; dash: string; text: string }> = {
  gold: { fill: "#e8b04a", dash: "#fff1c4", text: "#3a1f0f" },
  red: { fill: "#8a1c19", dash: "#f6ead8", text: "#f6ead8" },
  pale: { fill: "#efe1c3", dash: "#9b896a", text: "#3a1f0f" },
};

/** Cut-paper starburst stamp. Remount (new `key`) to replay the pop. */
export function CutStamp({
  lines,
  tone,
  className = "top-[50%] w-[78%]",
}: {
  lines: readonly string[];
  tone: StampTone;
  className?: string;
}) {
  const c = STAMP_COLOURS[tone];
  const points = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 38 + ((i * 7) % 5);
    return `${60 + Math.cos(a) * r * 1.15},${50 + Math.sin(a) * r * 0.85}`;
  }).join(" ");
  const single = lines.length === 1;
  const fontSize = single ? (lines[0]!.length <= 6 ? 28 : 19) : 15;
  return (
    <div
      className={`stamp-pop pointer-events-none absolute left-1/2 z-40 ${className}`}
      role="status"
    >
      <svg viewBox="0 0 120 100" className="w-full drop-shadow-[0_6px_6px_rgba(40,14,6,0.45)]">
        <polygon points={points} fill={c.fill} stroke="#3a1f0f" strokeWidth="2" />
        <polygon
          points={points}
          fill="none"
          stroke={c.dash}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          transform="translate(60 50) scale(0.86) translate(-60 -50)"
        />
        {lines.map((line, i) => (
          <text
            key={line}
            x="60"
            y={single ? 50 + fontSize * 0.35 : 47 + i * 17}
            textAnchor="middle"
            fontFamily="Fraunces, Georgia, serif"
            fontStyle="italic"
            fontWeight="700"
            fontSize={fontSize}
            fill={c.text}
          >
            {line}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function ControlButton({
  onClick,
  children,
  pressed,
}: {
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`min-h-11 rounded-full px-4 text-sm font-bold shadow-[2px_2px_0_var(--brass)] active:translate-y-px ${
        pressed ? "bg-[var(--brass)] text-[var(--ink)]" : "bg-[var(--cream)] text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}
