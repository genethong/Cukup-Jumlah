import React from "react";
import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";

interface ComicAvatarProps {
  profile: CandidateProfile;
  size?: number;
  isBouncing?: boolean;
  mood?: "normal" | "happy" | "sweat" | "shout";
}

export function ComicAvatar({
  profile,
  size = 180,
  isBouncing = false,
  mood = "normal",
}: ComicAvatarProps) {
  const party = PARTIES[profile.party];
  const partyColor = party.themeColor === "#F8FAFC" ? "#94A3B8" : party.themeColor;

  return (
    <div
      className={`inline-block transition-transform duration-150 ${
        isBouncing ? "scale-[1.04] -translate-y-1" : "scale-100 translate-y-0"
      }`}
      style={{ width: size, height: size * 1.15 }}
    >
      <svg
        viewBox="0 0 200 230"
        className="w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
      >
        {/* Shadow under feet */}
        <ellipse cx="100" cy="218" rx="55" ry="8" fill="rgba(0,0,0,0.12)" />

        {/* 1. BODY & OUTFIT */}
        {profile.outfit === "baju_kurung" ? (
          <g>
            {/* Long Skirt */}
            <path
              d="M 68 150 L 132 150 L 145 208 L 55 208 Z"
              fill={partyColor}
              stroke="#0f172a"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Kurung Top */}
            <path
              d="M 60 115 Q 100 118 140 115 L 145 165 L 55 165 Z"
              fill={partyColor}
              stroke="#0f172a"
              strokeWidth="3.5"
            />
          </g>
        ) : (
          <g>
            {/* Pants / Trousers */}
            <path
              d="M 68 150 L 96 150 L 96 210 L 72 210 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            <path
              d="M 104 150 L 132 150 L 128 210 L 104 210 Z"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="3.5"
            />

            {/* Baju Melayu Samping (Songket Gold/Bronze Sash) */}
            {profile.outfit === "baju_melayu" && (
              <g>
                <path
                  d="M 64 140 L 136 140 L 138 172 L 62 172 Z"
                  fill="#b45309"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                />
                {/* Gold Songket Lines */}
                <line x1="66" y1="148" x2="134" y2="148" stroke="#fbbf24" strokeWidth="2.5" />
                <line x1="65" y1="160" x2="135" y2="160" stroke="#f59e0b" strokeWidth="2.5" />
              </g>
            )}

            {/* Torso */}
            <path
              d="M 62 110 L 138 110 L 140 152 L 60 152 Z"
              fill={
                profile.outfit === "baju_melayu"
                  ? partyColor
                  : profile.outfit === "batik"
                  ? "#9333ea"
                  : profile.outfit === "jaket_banjir"
                  ? "#ea580c"
                  : "#334155"
              }
              stroke="#0f172a"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Batik Flower Swirls (if batik) */}
            {profile.outfit === "batik" && (
              <g stroke="#f59e0b" strokeWidth="2" fill="none">
                <circle cx="85" cy="125" r="5" />
                <circle cx="115" cy="135" r="5" />
                <path d="M 80 135 Q 90 145 100 135" />
              </g>
            )}

            {/* Party Campaign Sash */}
            <path
              d="M 68 110 L 130 152"
              stroke={partyColor}
              strokeWidth="12"
              strokeLinecap="square"
            />
            <path
              d="M 68 110 L 130 152"
              stroke="#ffffff"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          </g>
        )}

        {/* Shoes */}
        <ellipse cx="80" cy="214" rx="14" ry="6" fill="#0f172a" />
        <ellipse cx="120" cy="214" rx="14" ry="6" fill="#0f172a" />

        {/* Good Morning Towel around neck */}
        {profile.prop === "tuala_goodmorning" && (
          <g>
            <path
              d="M 75 108 Q 100 125 125 108 L 128 145 L 120 145 L 118 118 L 82 118 L 80 145 L 72 145 Z"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="3"
            />
            <text x="88" y="132" fill="#ef4444" fontSize="6" fontWeight="bold">
              GOOD MORNING
            </text>
          </g>
        )}

        {/* 2. ARMS & ACCESSORIES */}
        {/* Left Arm: Holding Briefcase or Parker Gold Pen */}
        <path
          d="M 60 115 Q 45 135 52 160"
          fill="none"
          stroke="#0f172a"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {profile.prop === "briefcase" && (
          <g>
            <rect
              x="36"
              y="155"
              width="24"
              height="18"
              rx="3"
              fill="#78350f"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <path d="M 44 155 L 44 150 L 52 150 L 52 155" fill="none" stroke="#d97706" strokeWidth="2.5" />
            <circle cx="48" cy="164" r="2" fill="#fbbf24" />
          </g>
        )}

        {/* Right Arm: Big Thumb / Waving Hand with Gold Rolex */}
        <path
          d="M 140 115 Q 155 135 148 158"
          fill="none"
          stroke="#0f172a"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Hand */}
        <circle cx="148" cy="162" r="7" fill="#fed7aa" stroke="#0f172a" strokeWidth="2.5" />
        {/* Gold Rolex Watch */}
        <rect x="144" y="152" width="8" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
        <line x1="148" y1="150" x2="148" y2="159" stroke="#ffffff" strokeWidth="1" />

        {/* 3. HEAD & CARICATURE FACE (Datuk Lat & Gila-Gila Style) */}
        {/* Big expressive round head */}
        <circle
          cx="100"
          cy="68"
          r="36"
          fill="#fed7aa"
          stroke="#0f172a"
          strokeWidth="3.5"
        />

        {/* Ears */}
        <circle cx="64" cy="70" r="8" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
        <circle cx="136" cy="70" r="8" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />

        {/* Headwear / Hair */}
        {profile.headwear === "songkok" && (
          <path
            d="M 68 45 L 132 45 L 128 62 L 72 62 Z"
            fill="#0f172a"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
        )}
        {profile.headwear === "songkok_senget" && (
          <g>
            {/* Crooked jaunty VIP songkok */}
            <path
              d="M 64 36 L 134 46 L 128 62 L 70 54 Z"
              fill="#0f172a"
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            {/* Gold trim */}
            <line x1="70" y1="53" x2="128" y2="61" stroke="#fbbf24" strokeWidth="2.5" />
          </g>
        )}
        {profile.headwear === "tudung" && (
          <path
            d="M 62 45 Q 100 25 138 45 Q 146 80 138 115 Q 100 128 62 115 Q 54 80 62 45 Z"
            fill={partyColor}
            stroke="#0f172a"
            strokeWidth="3.5"
          />
        )}
        {profile.headwear === "kopiah" && (
          <path
            d="M 72 40 Q 100 30 128 40 L 126 56 L 74 56 Z"
            fill="#f8fafc"
            stroke="#0f172a"
            strokeWidth="3"
          />
        )}
        {profile.headwear === "pomade" && (
          <path
            d="M 68 50 Q 100 28 132 46 Q 138 58 132 64 Q 100 50 68 64 Z"
            fill="#0f172a"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
        )}
        {profile.headwear === "topi_jerami" && (
          <g>
            <ellipse cx="100" cy="50" rx="48" ry="12" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
            <path d="M 76 50 Q 100 28 124 50 Z" fill="#fde047" stroke="#0f172a" strokeWidth="3" />
          </g>
        )}

        {/* Eyes: Bulging cartoon eyes */}
        <ellipse cx="88" cy="65" rx="7" ry="9" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <ellipse cx="112" cy="65" rx="7" ry="9" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <ellipse cx="90" cy="66" rx="3.5" ry="4.5" fill="#0f172a" />
        <ellipse cx="114" cy="66" rx="3.5" ry="4.5" fill="#0f172a" />

        {/* Eyebrows */}
        <path d="M 80 54 Q 88 50 96 54" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 104 54 Q 112 50 120 54" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Iconic Lat Big Round Nose */}
        <ellipse cx="100" cy="75" rx="8" ry="6" fill="#fca5a5" stroke="#0f172a" strokeWidth="3" />

        {/* Mouth: Huge toothy comical grin (or shouting mouth) */}
        {mood === "shout" ? (
          <path
            d="M 84 86 Q 100 108 116 86 Z"
            fill="#b91c1c"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
        ) : (
          <g>
            <path
              d="M 82 86 Q 100 106 118 86 Z"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="3.5"
            />
            {/* Teeth dividing lines */}
            <line x1="100" y1="87" x2="100" y2="100" stroke="#0f172a" strokeWidth="2" />
            <line x1="91" y1="87" x2="91" y2="97" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="109" y1="87" x2="109" y2="97" stroke="#0f172a" strokeWidth="1.5" />
          </g>
        )}

        {/* Sweat beads (Slapstick / Stress) */}
        {(mood === "sweat" || mood === "normal") && (
          <g>
            <path
              d="M 132 58 Q 138 66 132 70 Q 126 66 132 58 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2"
            />
            <path
              d="M 68 62 Q 74 70 68 74 Q 62 70 68 62 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
