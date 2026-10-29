import React from "react";

interface CukupJumlahLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}

export function CukupJumlahLogo({
  size = "md",
  className = "",
  showTagline = true,
}: CukupJumlahLogoProps) {
  const scale = size === "sm" ? 0.75 : size === "lg" ? 1.25 : 1.0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}>
        <svg
          width="380"
          height="145"
          viewBox="0 0 380 145"
          className="filter drop-shadow-[5px_7px_0px_rgba(15,23,42,1)]"
          aria-label="CUKUP JUMLAH! - Game Arked Pilihan Raya Malaysia"
        >
          <defs>
            <linearGradient id="cukupLogoYellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="40%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>

          {/* Top Word: CUKUP */}
          <g transform="rotate(-3 190 75)">
            <text
              x="194"
              y="58"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.04em" }}
              fontSize="48"
              fontWeight="900"
              fill="#0f172a"
            >
              CUKUP
            </text>
            <text
              x="190"
              y="54"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.04em" }}
              fontSize="48"
              fontWeight="900"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="9"
              paintOrder="stroke fill"
            >
              CUKUP
            </text>
            <text
              x="190"
              y="54"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.04em" }}
              fontSize="48"
              fontWeight="900"
              fill="#ffffff"
            >
              CUKUP
            </text>
          </g>

          {/* Bottom Word: JUMLAH! (Giant 3D Block) */}
          <g transform="rotate(-3 190 75)">
            <text
              x="195"
              y="114"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.02em" }}
              fontSize="62"
              fontWeight="900"
              fill="#991b1b"
            >
              JUMLAH!
            </text>
            <text
              x="193"
              y="112"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.02em" }}
              fontSize="62"
              fontWeight="900"
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth="10"
              paintOrder="stroke fill"
            >
              JUMLAH!
            </text>
            <text
              x="190"
              y="108"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", letterSpacing: "0.02em" }}
              fontSize="62"
              fontWeight="900"
              fill="url(#cukupLogoYellowGrad)"
              stroke="#0f172a"
              strokeWidth="6"
              paintOrder="stroke fill"
            >
              JUMLAH!
            </text>
          </g>

          {/* Official Stamp Accent: 112 KERUSI Stamp Badge */}
          <g transform="translate(295, 16) rotate(14)">
            <rect x="0" y="0" width="70" height="24" rx="4" fill="#dc2626" stroke="#0f172a" strokeWidth="2.5" />
            <text
              x="35"
              y="16"
              textAnchor="middle"
              style={{ fontFamily: "'Impact', sans-serif", letterSpacing: "0.05em" }}
              fontSize="12"
              fontWeight="900"
              fill="#ffffff"
            >
              ★ 112 ★
            </text>
          </g>
        </svg>

        {showTagline && (
          <div className="mt-1 bg-slate-950 text-white font-tally text-xs px-5 py-1 rounded-full border-2 border-slate-900 shadow-sm uppercase tracking-widest -rotate-1 text-center">
            GAME ARKED PILIHAN RAYA MALAYSIA
          </div>
        )}
      </div>
    </div>
  );
}
