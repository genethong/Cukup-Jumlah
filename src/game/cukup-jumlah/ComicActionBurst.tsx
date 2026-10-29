import React from "react";

export type ComicBurstType = "success" | "fail" | "action";

interface ComicActionBurstProps {
  type: ComicBurstType;
  mainText?: string;
  subText?: string;
  onAnimationEnd?: () => void;
  className?: string;
}

export function ComicActionBurst({
  type,
  mainText,
  subText,
  onAnimationEnd,
  className = "",
}: ComicActionBurstProps) {
  if (type === "success") {
    const title = mainText || "PADU!";
    const subtitle = subText || "★ TEPAT PADA BEAT! ★";

    return (
      <div
        onAnimationEnd={onAnimationEnd}
        className={`pointer-events-none select-none animate-in zoom-in-50 duration-300 ease-out fill-mode-forwards ${className}`}
      >
        <svg
          width="290"
          height="195"
          viewBox="0 0 290 195"
          className="filter drop-shadow-[6px_8px_0px_rgba(15,23,42,1)]"
        >
          <defs>
            <linearGradient id="yellowBurstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <pattern id="dotPattern1" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#ca8a04" opacity="0.45" />
            </pattern>
          </defs>

          {/* Outer Comic Starburst */}
          <polygon
            points="145,5 180,42 230,18 220,68 278,72 240,112 272,150 215,155 218,188 160,165 145,190 120,160 72,188 78,148 15,145 50,110 10,70 68,65 54,18 110,42"
            fill="url(#yellowBurstGrad)"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Halftone Layer */}
          <polygon
            points="145,12 175,45 220,25 212,68 266,74 230,110 260,142 208,148 208,178 158,158 145,180 122,154 80,178 85,142 28,140 60,108 24,74 74,70 64,28 112,46"
            fill="url(#dotPattern1)"
          />

          {/* Speed Motion Whistles */}
          <path d="M 38 30 L 18 15" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <path d="M 252 35 L 275 20" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          <path d="M 262 165 L 282 180" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

          {/* 3D Extruded Text Drop */}
          <text
            x="147"
            y="116"
            textAnchor="middle"
            className="font-black text-5xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#7f1d1d"
            transform="rotate(-4 145 105)"
          >
            {title}
          </text>

          {/* Main Comic Text with Heavy Ink Stroke */}
          <text
            x="145"
            y="112"
            textAnchor="middle"
            className="font-black text-5xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="8"
            paintOrder="stroke fill"
            transform="rotate(-4 145 105)"
          >
            {title}
          </text>
          <text
            x="145"
            y="112"
            textAnchor="middle"
            className="font-black text-5xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#dc2626"
            transform="rotate(-4 145 105)"
          >
            {title}
          </text>

          {/* Subtitle Ribbon */}
          <g transform="translate(65, 126) rotate(-2)">
            <rect x="0" y="0" width="160" height="24" rx="6" fill="#0f172a" stroke="#fef08a" strokeWidth="1.5" />
            <text
              x="80"
              y="16"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', sans-serif", letterSpacing: "0.08em" }}
              fontSize="12"
              fontWeight="900"
              fill="#fde047"
            >
              {subtitle}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (type === "fail") {
    const title = mainText || "GEDEBUK!";
    const subtitle = subText || "💸 HILANG RM10,000 DEPOSIT!";

    return (
      <div
        onAnimationEnd={onAnimationEnd}
        className={`pointer-events-none select-none animate-in zoom-in-50 duration-300 ease-out fill-mode-forwards ${className}`}
      >
        <svg
          width="300"
          height="195"
          viewBox="0 0 300 195"
          className="filter drop-shadow-[6px_8px_0px_rgba(15,23,42,1)]"
        >
          <defs>
            <linearGradient id="redBurstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="50%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <pattern id="dotPattern2" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#450a0a" opacity="0.5" />
            </pattern>
          </defs>

          {/* Ragged Shattered Shape */}
          <polygon
            points="150,8 190,45 250,15 228,65 292,78 242,118 285,158 222,152 212,188 160,162 138,185 108,158 55,182 70,142 12,142 46,108 8,65 68,60 56,15 114,42"
            fill="url(#redBurstGrad)"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon
            points="150,16 185,48 238,24 220,65 278,78 232,114 270,150 215,145 204,178 156,156 138,176 112,152 68,172 78,138 25,136 55,106 20,68 72,64 64,24 116,46"
            fill="url(#dotPattern2)"
          />

          {/* Main Text */}
          <text
            x="152"
            y="112"
            textAnchor="middle"
            className="font-black text-4xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#0f172a"
            transform="rotate(3 150 105)"
          >
            {title}
          </text>
          <text
            x="150"
            y="108"
            textAnchor="middle"
            className="font-black text-4xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="8"
            paintOrder="stroke fill"
            transform="rotate(3 150 105)"
          >
            {title}
          </text>
          <text
            x="150"
            y="108"
            textAnchor="middle"
            className="font-black text-4xl tracking-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            fill="#fef08a"
            transform="rotate(3 150 105)"
          >
            {title}
          </text>

          {/* Banner with clean contained bounds */}
          <g transform="translate(42, 122) rotate(2)">
            <rect x="0" y="0" width="216" height="26" rx="6" fill="#0f172a" stroke="#fca5a5" strokeWidth="2" />
            <text
              x="108"
              y="17"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', sans-serif", letterSpacing: "0.04em" }}
              fontSize="12"
              fontWeight="900"
              fill="#fee2e2"
            >
              {subtitle}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // Action / Speed
  const title = mainText || "ZASSS!";
  const subtitle = subText || "⚡ PECUTAN KILAT!";

  return (
    <div
      onAnimationEnd={onAnimationEnd}
      className={`pointer-events-none select-none animate-in zoom-in-50 duration-300 ease-out fill-mode-forwards ${className}`}
    >
      <svg
        width="290"
        height="195"
        viewBox="0 0 290 195"
        className="filter drop-shadow-[6px_8px_0px_rgba(15,23,42,1)]"
      >
        <defs>
          <linearGradient id="cyanBurstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <pattern id="dotPattern3" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#083344" opacity="0.45" />
          </pattern>
        </defs>

        {/* Lightning Blade Shape */}
        <polygon
          points="145,8 195,40 258,15 228,70 288,85 232,120 272,165 202,150 190,188 140,160 120,185 88,150 42,175 62,135 10,130 50,95 15,55 78,55 72,12 122,40"
          fill="url(#cyanBurstGrad)"
          stroke="#0f172a"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <polygon
          points="145,16 190,44 245,24 220,68 274,84 224,115 260,154 196,142 185,176 138,154 120,174 92,144 50,165 68,130 24,126 56,96 28,62 80,60 76,22 122,44"
          fill="url(#dotPattern3)"
        />

        {/* Main Text */}
        <text
          x="148"
          y="112"
          textAnchor="middle"
          className="font-black text-5xl tracking-tight"
          style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
          fill="#083344"
          transform="rotate(-6 145 105)"
        >
          {title}
        </text>
        <text
          x="145"
          y="108"
          textAnchor="middle"
          className="font-black text-5xl tracking-tight"
          style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="8"
          paintOrder="stroke fill"
          transform="rotate(-6 145 105)"
        >
          {title}
        </text>
        <text
          x="145"
          y="108"
          textAnchor="middle"
          className="font-black text-5xl tracking-tight"
          style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
          fill="#facc15"
          transform="rotate(-6 145 105)"
        >
          {title}
        </text>

        {/* Banner */}
        <g transform="translate(65, 124) rotate(-3)">
          <rect x="0" y="0" width="160" height="24" rx="6" fill="#0f172a" stroke="#67e8f9" strokeWidth="1.5" />
          <text
            x="80"
            y="16"
            textAnchor="middle"
            style={{ fontFamily: "'Impact', sans-serif", letterSpacing: "0.06em" }}
            fontSize="12"
            fontWeight="900"
            fill="#a5f3fc"
          >
            {subtitle}
          </text>
        </g>
      </svg>
    </div>
  );
}
