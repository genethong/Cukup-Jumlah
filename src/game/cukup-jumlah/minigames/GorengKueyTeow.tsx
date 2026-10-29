import { useState, useEffect, useRef, useCallback } from "react";
import { Utensils, Flame, Camera } from "lucide-react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface GorengKueyTeowProps {
  onComplete: (success: boolean) => void;
  isMesraRakyat?: boolean;
}

type CookingPhase = {
  nameMs: string;
  nameEn: string;
  instructionMs: string;
  instructionEn: string;
  targetStirs: number;
  ingredientMs: string;
  ingredientEn: string;
};

const PHASES: CookingPhase[] = [
  {
    nameMs: "FASA 1: KUEY TEOW & TAUGEH SEGAR",
    nameEn: "PHASE 1: NOODLES & BEAN SPROUTS",
    instructionMs: "Kacau berirama supaya mi bersalut minyak panas!",
    instructionEn: "Stir rhythmically to coat the noodles in oil!",
    targetStirs: 6,
    ingredientMs: "🍜 Kuey Teow Segar & Taugeh Rangup",
    ingredientEn: "🍜 Fresh Kuey Teow & Bean Sprouts",
  },
  {
    nameMs: "FASA 2: KICAP PEKAT & KERANG SEGAR",
    nameEn: "PHASE 2: DARK SOY SAUCE & FRESH COCKLES",
    instructionMs: "Goncang kuali pantas untuk karamelkan kicap!",
    instructionEn: "Toss the wok quickly to caramelize the soy sauce!",
    targetStirs: 7,
    ingredientMs: "🦪 Kicap Pekat Manis & Kerang Basah",
    ingredientEn: "🦪 Sweet Dark Soy Sauce & Cockles",
  },
  {
    nameMs: "FASA 3: WOK-HEI API MARAK & UDANG GALAH!",
    nameEn: "PHASE 3: HIGH HEAT WOK-HEI & TIGER PRAWNS!",
    instructionMs: "Kacau laju-laju & senyum pada kamera wartawan!",
    instructionEn: "Stir at max speed & smile for the media camera!",
    targetStirs: 8,
    ingredientMs: "🦐 Udang Harimau & Telur Bebek",
    ingredientEn: "🦐 Tiger Prawns & Duck Egg",
  },
];

export function GorengKueyTeowGame({ onComplete, isMesraRakyat = false }: GorengKueyTeowProps) {
  const { t } = useLanguage();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseStirs, setPhaseStirs] = useState(0);
  const [totalStirs, setTotalStirs] = useState(0);
  const [heatLevel, setHeatLevel] = useState(65); // 0 to 100
  const [isWokHeiActive, setIsWokHeiActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [photoScore, setPhotoScore] = useState(0);

  const currentPhase = PHASES[currentPhaseIndex] || PHASES[0];
  const finishedRef = useRef(false);

  // Wok heat simulation: slowly drops if not stirred, rises on stir
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;
      setHeatLevel((prev) => {
        const drop = 1.2;
        const next = Math.max(20, prev - drop);
        setIsWokHeiActive(next >= 60 && next <= 90);
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Periodic press camera flashes
  useEffect(() => {
    const flashInterval = setInterval(() => {
      if (finishedRef.current) return;
      if (Math.random() < 0.45) {
        setFlashActive(true);
        rhythmAudio.playStampSlam();
        setTimeout(() => setFlashActive(false), 200);
      }
    }, 3200);

    return () => clearInterval(flashInterval);
  }, []);

  const handleStir = useCallback(() => {
    if (finishedRef.current) return;

    rhythmAudio.playBeatSound(2);

    // Increase heat
    setHeatLevel((prev) => Math.min(100, prev + 7));

    const nextPhaseStirs = phaseStirs + 1;
    const nextTotal = totalStirs + 1;
    setPhaseStirs(nextPhaseStirs);
    setTotalStirs(nextTotal);

    // If stirred during camera flash, bonus photo score!
    if (flashActive) {
      setPhotoScore((prev) => prev + 1);
      rhythmAudio.playPaduSuccess();
    }

    // Check phase completion
    const target = isMesraRakyat ? currentPhase.targetStirs - 1 : currentPhase.targetStirs;
    if (nextPhaseStirs >= target) {
      if (currentPhaseIndex < PHASES.length - 1) {
        rhythmAudio.playPaduSuccess();
        setCurrentPhaseIndex((prev) => prev + 1);
        setPhaseStirs(0);
      } else {
        // All phases complete!
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 500);
      }
    }
  }, [phaseStirs, totalStirs, flashActive, isMesraRakyat, currentPhase, currentPhaseIndex, onComplete]);

  // Spacebar support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleStir();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStir]);

  const currentPhaseTarget = isMesraRakyat ? currentPhase.targetStirs - 1 : currentPhase.targetStirs;
  const phaseProgress = Math.min(100, (phaseStirs / currentPhaseTarget) * 100);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative select-none">
      {/* Blinding Camera Flash Overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-white/80 rounded-2xl z-40 pointer-events-none transition-opacity duration-75 flex items-center justify-center">
          <div className="bg-amber-300 text-slate-950 font-black text-xl px-4 py-1.5 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-4deg] animate-bounce flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-600" />
            <span>{t("KLIK! 📸 MUKA YB MASUK TIKTOK!", "CLICK! 📸 YB FEATURED ON TIKTOK!")}</span>
          </div>
        </div>
      )}

      {/* Top HUD: Phase progress & Wok Hei Gauge */}
      <div className="w-full flex items-center justify-between bg-slate-900 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono text-white mb-2 shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("MASAKAN:", "COOKING:")}</span>
          <span>{t(`FASA ${currentPhaseIndex + 1} / 3`, `PHASE ${currentPhaseIndex + 1} / 3`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px]">
            <Flame className={`w-3.5 h-3.5 ${isWokHeiActive ? "text-amber-400 animate-bounce" : "text-slate-400"}`} />
            <span className={isWokHeiActive ? "text-amber-400 font-black" : "text-slate-400"}>
              {isWokHeiActive ? t("WOK HEI MANTAP! 🔥", "SOLID WOK HEI! 🔥") : t("SUHU BIASA", "NORMAL HEAT")}
            </span>
          </div>
          {photoScore > 0 && (
            <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600">
              📸 +{photoScore} {t("Foto", "Photos")}
            </span>
          )}
        </div>
      </div>

      {/* Phase Banner */}
      <div className="w-full bg-amber-100 border-2 border-slate-900 rounded-xl p-2 mb-2 text-left flex items-center justify-between shadow-sm">
        <div>
          <div className="text-[10px] font-black font-mono text-red-700 uppercase">
            {t(currentPhase.nameMs, currentPhase.nameEn)}
          </div>
          <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
            <span>{t(currentPhase.ingredientMs, currentPhase.ingredientEn)}</span>
            <span className="text-[10px] text-slate-600 font-normal">
              ({t(currentPhase.instructionMs, currentPhase.instructionEn)})
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black font-mono text-slate-900">
            {phaseStirs} / {currentPhaseTarget} {t("KACAU", "STIRS")}
          </span>
        </div>
      </div>

      {/* Lat Comic Illustration: YB Cooking at Hawker Stall */}
      <div className="w-full relative h-48 bg-amber-50 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
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
            fill={isWokHeiActive ? "#ea580c" : "#f97316"}
            className="animate-pulse"
          />
          <path
            d="M 110 170 Q 125 145 140 170 Q 155 150 170 170 Z"
            fill="#fde047"
          />

          {/* Wok */}
          <ellipse cx="140" cy="165" rx="65" ry="20" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
          <ellipse cx="140" cy="162" rx="58" ry="15" fill="#475569" />

          {/* Noodles & Ingredients in Wok */}
          <path d="M 95 160 Q 115 150 135 162 T 175 160" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
          <path d="M 105 163 Q 125 152 145 164 T 180 162" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          {/* Flying Prawn bouncing with stir */}
          <circle cx="155" cy={155 - (totalStirs % 5) * 5} r="6" fill="#f87171" stroke="#0f172a" strokeWidth="2" />
          {/* Taugeh bits */}
          <line x1="120" y1="160" x2="128" y2="158" stroke="#f8fafc" strokeWidth="2.5" />
          <line x1="148" y1="162" x2="154" y2="164" stroke="#f8fafc" strokeWidth="2.5" />

          {/* Wok Steam */}
          <path d="M 125 145 Q 115 125 125 110" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="3,3" />
          <path d="M 155 145 Q 165 125 155 110" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="3,3" />

          {/* Politician Behind Wok: White shirt, red sash */}
          <path d="M 110 100 L 170 100 L 180 145 L 100 145 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          <line x1="115" y1="100" x2="165" y2="145" stroke="#dc2626" strokeWidth="10" strokeLinecap="square" />

          {/* Oversized Spatula animated by totalStirs */}
          <g transform={`rotate(${(totalStirs % 2 === 0 ? -16 : 16)}, 140, 160)`}>
            <line x1="175" y1="95" x2="145" y2="155" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <rect x="135" y="150" width="24" height="13" rx="2" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.5" />
          </g>

          {/* Face: Sweating profusely, forced broad smile */}
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

          {/* Sweat droplets */}
          <circle cx="166" cy="70" r="2.5" fill="#38bdf8" />
          <circle cx="114" cy="74" r="2.5" fill="#38bdf8" />
        </svg>

        {/* Phase completion progress bar at bottom of illustration */}
        <div className="absolute bottom-2 inset-x-3 h-2.5 bg-slate-900/40 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all duration-100"
            style={{ width: `${phaseProgress}%` }}
          />
        </div>
      </div>

      {/* Action Button: Stir Wok */}
      <button
        onClick={handleStir}
        className="w-full mt-2.5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
      >
        <Utensils className="w-5 h-5" />
        {t("KACAU KUEY TEOW PANAS! 🍳 (SPACEBAR)", "STIR WOK CHAR KUEY TEOW! 🍳 (SPACEBAR)")}
      </button>
    </div>
  );
}
