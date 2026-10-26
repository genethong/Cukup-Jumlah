import { useState } from "react";
import { Utensils } from "lucide-react";

interface GorengKueyTeowProps {
  onComplete: (success: boolean) => void;
}

export function GorengKueyTeowGame({ onComplete }: GorengKueyTeowProps) {
  const [stirCount, setStirCount] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const targetStirs = 8;

  const handleStir = () => {
    const next = stirCount + 1;
    setStirCount(next);

    // Flash camera
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    if (next >= targetStirs) {
      setTimeout(() => onComplete(true), 300);
    }
  };

  const progress = Math.min(100, (stirCount / targetStirs) * 100);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Blinding Camera Flash Overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-white/70 rounded-2xl z-30 pointer-events-none transition-opacity duration-75 flex items-center justify-center">
          <div className="bg-amber-300 text-slate-950 font-black text-xl px-4 py-1 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg]">
            KLIK! 📸 FLASH!
          </div>
        </div>
      )}

      {/* Lat Comic Illustration: YB Cooking at Hawker Stall */}
      <div className="w-full relative h-48 flex items-center justify-center">
        <svg viewBox="0 0 280 200" className="w-full h-full max-h-48 drop-shadow-md">
          {/* Hawker stall canvas roof */}
          <path d="M 30 25 L 250 25 L 240 45 L 40 45 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="3" />
          <path d="M 40 45 L 60 45 L 60 25" stroke="#ffffff" strokeWidth="12" fill="none" />
          <path d="M 100 45 L 120 45 L 120 25" stroke="#ffffff" strokeWidth="12" fill="none" />
          <path d="M 160 45 L 180 45 L 180 25" stroke="#ffffff" strokeWidth="12" fill="none" />
          <path d="M 220 45 L 240 45 L 240 25" stroke="#ffffff" strokeWidth="12" fill="none" />

          {/* Flames under wok */}
          <path
            d="M 95 170 Q 110 135 125 170 Q 140 135 155 170 Q 170 140 185 170 Z"
            fill="#f97316"
            className="animate-pulse"
          />
          <path
            d="M 110 170 Q 125 145 140 170 Q 155 150 170 170 Z"
            fill="#fde047"
          />

          {/* Wok */}
          <ellipse cx="140" cy="165" rx="65" ry="20" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
          <ellipse cx="140" cy="162" rx="58" ry="15" fill="#475569" />

          {/* Noodles & Prawn in Wok */}
          <path d="M 95 160 Q 115 150 135 162 T 175 160" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
          <path d="M 105 163 Q 125 152 145 164 T 180 162" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          {/* Flying Prawn */}
          <circle cx="155" cy={155 - stirCount * 2} r="6" fill="#f87171" stroke="#0f172a" strokeWidth="2" />

          {/* Wok Steam */}
          <path d="M 125 145 Q 115 125 125 110" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="3,3" />
          <path d="M 155 145 Q 165 125 155 110" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="3,3" />

          {/* Politician Behind Wok: White shirt, red sash, toothy grin */}
          <path d="M 110 100 L 170 100 L 180 145 L 100 145 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          {/* Red campaign sash */}
          <line x1="115" y1="100" x2="165" y2="145" stroke="#dc2626" strokeWidth="10" strokeLinecap="square" />

          {/* Oversized Spatula animated by stirCount */}
          <g transform={`rotate(${(stirCount % 2 === 0 ? -12 : 12)}, 140, 160)`}>
            <line x1="175" y1="95" x2="145" y2="155" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <rect x="135" y="150" width="22" height="12" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          </g>

          {/* Face: Sweating profusely, huge comedic smile */}
          <circle cx="140" cy="72" r="28" fill="#fed7aa" stroke="#0f172a" strokeWidth="3.5" />
          {/* Songkok Senget */}
          <path d="M 112 55 L 168 48 L 164 64 L 114 68 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="3" />
          <line x1="114" y1="67" x2="164" y2="63" stroke="#fbbf24" strokeWidth="2" />
          {/* Cartoon bulging eyes */}
          <ellipse cx="130" cy="70" rx="5" ry="7" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <ellipse cx="150" cy="70" rx="5" ry="7" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="131" cy="70" r="2.5" fill="#0f172a" />
          <circle cx="151" cy="70" r="2.5" fill="#0f172a" />
          {/* Big Lat Nose */}
          <ellipse cx="140" cy="78" rx="6" ry="5" fill="#fca5a5" stroke="#0f172a" strokeWidth="2.5" />
          {/* Wide toothy forced grin */}
          <path d="M 125 86 Q 140 102 155 86 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
          <line x1="140" y1="87" x2="140" y2="98" stroke="#0f172a" strokeWidth="1.5" />
          {/* Sweat droplet */}
          <path d="M 164 62 Q 170 70 164 74 Q 158 70 164 62 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
        </svg>

        {/* Comic Dialogue Pop */}
        <div className="absolute top-1 left-2 bg-amber-200 border-2 border-slate-900 rounded-xl px-2 py-0.5 text-[10px] font-black text-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-4deg]">
          "SENYUM! WARTAWAN TENGOK NI!"
        </div>
      </div>

      {/* Progress Gauge */}
      <div className="w-full bg-[#fbf5e5] p-2.5 rounded-2xl border-2 border-slate-900 my-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between text-[11px] font-black mb-1">
          <span className="text-slate-800">TAHAP WOK HEI:</span>
          <span className="text-amber-700">{stirCount} / {targetStirs} KACAUAN 🔥</span>
        </div>
        <div className="w-full bg-slate-300 h-3 rounded-full overflow-hidden border border-slate-900">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleStir}
        className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
      >
        <Utensils className="w-4 h-4" /> KACAU KUALI LAJU-LAJU!! 🥢
      </button>
    </div>
  );
}
