import { useId } from "react";

// Placeholder gunungan drawn in SVG for the style frame. The final piece should be
// illustrated in the paper/felt look per docs/art/ART_BIBLE_PUPPET.md.
const LEAF =
  "M100 6 C128 40 172 120 186 210 C192 250 176 282 150 292 L50 292 C24 282 8 250 14 210 C28 120 72 40 100 6 Z";

function Curl({ d }: { d: string }) {
  return (
    <>
      <path d={d} />
      <path d={d} transform="translate(200 0) scale(-1 1)" />
    </>
  );
}

export function Gunungan({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 300" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`leaf-${id}`}>
          <path d={LEAF} />
        </clipPath>
        <pattern id={`holes-${id}`} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.3" fill="#ffe7b0" />
        </pattern>
        <linearGradient id={`hide-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4424" />
          <stop offset="1" stopColor="#4e2a16" />
        </linearGradient>
      </defs>

      <path d={LEAF} fill={`url(#hide-${id})`} stroke="#3a1f0f" strokeWidth="3" />
      <g clipPath={`url(#leaf-${id})`}>
        <rect x="0" y="0" width="200" height="300" fill={`url(#holes-${id})`} opacity="0.55" />
      </g>
      <path
        d={LEAF}
        fill="none"
        stroke="#c9963f"
        strokeWidth="5"
        transform="translate(100 170) scale(0.9) translate(-100 -170)"
      />

      <g fill="none" stroke="#e0b157" strokeWidth="4" strokeLinecap="round">
        <path d="M100 262 L100 70" strokeWidth="7" stroke="#d29c42" />
        <Curl d="M100 236 C76 230 54 214 60 194 C65 178 86 182 82 196" />
        <Curl d="M100 196 C80 190 62 170 70 150 C76 136 94 142 89 156" />
        <Curl d="M100 156 C86 148 76 128 84 112 C90 100 104 108 98 120" />
        <Curl d="M100 112 C94 102 92 88 100 74" />
      </g>
      <g fill="#9b2c1e" stroke="#3a1f0f" strokeWidth="1.5">
        <circle cx="70" cy="190" r="5" />
        <circle cx="130" cy="190" r="5" />
        <circle cx="82" cy="146" r="4.5" />
        <circle cx="118" cy="146" r="4.5" />
        <circle cx="100" cy="70" r="6" />
      </g>

      <path d="M78 292 L78 266 Q100 246 122 266 L122 292 Z" fill="#2a160b" stroke="#c9963f" strokeWidth="3" />
      <path d="M100 292 L100 262" stroke="#c9963f" strokeWidth="2" />
      <rect x="96" y="292" width="8" height="8" fill="#5a3a1c" />
    </svg>
  );
}
