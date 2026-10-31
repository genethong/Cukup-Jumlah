import { useId } from "react";

// Paper props for the HUD: cut-out deposit envelopes and a ballot box that fills with seats.
// Code-drawn stand-ins until the paper/felt art is drawn (docs/art/ART_BIBLE_PUPPET.md).

export function DepositEnvelope({ lost }: { lost: boolean }) {
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

export function BallotBox({ seats, goal, label }: { seats: number; goal: number; label: string }) {
  const fill = Math.min(1, seats / goal);
  const clipId = `ballot-${useId().replace(/:/g, "")}`;
  return (
    <div className="flex items-end gap-[1.5cqw]">
      <svg
        viewBox="0 0 54 60"
        className="h-[12cqw] w-auto drop-shadow-[0_3px_3px_rgba(40,14,6,0.35)]"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
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
        <g clipPath={`url(#${clipId})`}>
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
        <div className="font-tally text-[2.8cqw] text-[#6a4a32]">
          / {goal} {label}
        </div>
      </div>
    </div>
  );
}
