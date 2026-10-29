import React, { useRef, useState, useCallback, useEffect } from "react";
import { rhythmAudio } from "../rhythm";
import { Camera } from "lucide-react";
import { useLanguage } from "../languageContext";

interface CuciLongkangProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface DrainSection {
  id: number;
  nameMs: string;
  nameEn: string;
  trashEmoji: string;
  debrisNameMs: string;
  debrisNameEn: string;
}

const SECTIONS: DrainSection[] = [
  {
    id: 1,
    nameMs: "SEKSYEN 1: LONGKANG PASAR AWAM",
    nameEn: "SECTION 1: PUBLIC MARKET DRAIN",
    trashEmoji: "🥬🍾",
    debrisNameMs: "Sisa Sayur & Botol Plastik",
    debrisNameEn: "Vegetable Waste & Plastic Bottles",
  },
  {
    id: 2,
    nameMs: "SEKSYEN 2: PARIT DEPAN BALAI",
    nameEn: "SECTION 2: COMMUNITY HALL DRAIN",
    trashEmoji: "🍂🥥",
    debrisNameMs: "Kelapa Hanyut & Daun Kering",
    debrisNameEn: "Drifting Coconuts & Dry Leaves",
  },
  {
    id: 3,
    nameMs: "SEKSYEN 3: TEBING KAWASAN KAMPUNG",
    nameEn: "SECTION 3: KAMPUNG RESIDENTIAL DRAIN",
    trashEmoji: "🪵📦",
    debrisNameMs: "Kotak Kertas & Ranting Kayu",
    debrisNameEn: "Cardboard Boxes & Tree Branches",
  },
];

export function CuciLongkangGame({ isMesraRakyat = false, onComplete }: CuciLongkangProps) {
  const { t } = useLanguage();
  const [currentSecIdx, setCurrentSecIdx] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [cleanProgress, setCleanProgress] = useState(0);
  const [broomX, setBroomX] = useState(50);
  const [isPhotoReady, setIsPhotoReady] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const curSection = SECTIONS[currentSecIdx] || SECTIONS[0];
  const lastXRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const advanceClean = (deltaAmount: number) => {
    if (finishedRef.current || isPhotoReady) return;
    setCleanProgress((prev) => {
      const next = Math.min(100, prev + deltaAmount);
      if (next >= 100 && prev < 100) {
        rhythmAudio.playBeatSound(4);
        setIsPhotoReady(true);
      }
      return next;
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (finishedRef.current || isPhotoReady) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    setBroomX(Math.max(10, Math.min(90, currentX)));

    if (lastXRef.current !== null) {
      const dist = Math.abs(currentX - lastXRef.current);
      if (dist > 1.2) {
        const gain = dist * (isMesraRakyat ? 0.75 : 0.55);
        advanceClean(gain);
      }
    }
    lastXRef.current = currentX;
  };

  const handleQuickScrubButton = useCallback(() => {
    if (finishedRef.current || isPhotoReady) return;
    rhythmAudio.playBeatSound(2);
    setBroomX((prev) => (prev < 50 ? 78 : 22));
    advanceClean(isMesraRakyat ? 22 : 16);
  }, [isPhotoReady, isMesraRakyat]);

  const handleThumbsUpPose = useCallback(() => {
    if (finishedRef.current || !isPhotoReady) return;

    setFlashActive(true);
    rhythmAudio.playStampSlam();

    const nextCompleted = [...completedSections, currentSecIdx];
    setCompletedSections(nextCompleted);

    setTimeout(() => {
      setFlashActive(false);
      if (nextCompleted.length >= SECTIONS.length) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      } else {
        setCurrentSecIdx((prev) => prev + 1);
        setCleanProgress(0);
        setIsPhotoReady(false);
      }
    }, 450);
  }, [isPhotoReady, currentSecIdx, completedSections, onComplete]);

  // Spacebar handles both scrub and pose!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (isPhotoReady) {
          handleThumbsUpPose();
        } else {
          handleQuickScrubButton();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPhotoReady, handleThumbsUpPose, handleQuickScrubButton]);

  return (
    <div className="space-y-2 select-none relative">
      {/* Flash overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-white/90 z-40 rounded-2xl flex items-center justify-center animate-fade-out">
          <span className="text-2xl md:text-3xl font-black text-slate-950">📸 CLICK! THUMBS UP FOR THE CAMERAS!</span>
        </div>
      )}

      {/* Progress Header */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("GOTONG-ROYONG LONGKANG:", "DRAIN CLEANUP:")}</span>
          <span>{t(`${completedSections.length} / 3 SELESAI`, `${completedSections.length} / 3 DONE`)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {SECTIONS.map((_, idx) => (
            <span
              key={idx}
              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] border ${
                completedSections.includes(idx)
                  ? "bg-emerald-500 border-emerald-300 text-slate-950"
                  : idx === currentSecIdx
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {completedSections.includes(idx) ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Drain Info Banner */}
      <div className="bg-amber-100 border-2 border-slate-900 rounded-xl p-1.5 text-left flex items-center justify-between text-xs comic-shadow-sm">
        <div>
          <span className="text-[9px] font-mono font-black text-red-700 uppercase block">
            {t(curSection.nameMs, curSection.nameEn)}
          </span>
          <span className="font-bold text-slate-900">
            {t("Halangan:", "Debris:")} {t(curSection.debrisNameMs, curSection.debrisNameEn)} {curSection.trashEmoji}
          </span>
        </div>
        <div className="text-right font-mono font-black text-emerald-700">
          {t("BERSIH:", "CLEAN:")} {Math.round(cleanProgress)}%
        </div>
      </div>

      {/* Drain Scrubbing Interactive Area */}
      <div
        onPointerMove={handlePointerMove}
        className="relative h-46 bg-[#0f172a] rounded-2xl border-4 border-slate-950 overflow-hidden cursor-ew-resize touch-none comic-shadow flex flex-col justify-between p-2"
      >
        {/* Concrete Drain Walls */}
        <div className="absolute inset-x-0 top-0 h-4 bg-[#64748b] border-b-2 border-slate-950 flex items-center justify-between px-3 text-[7px] font-mono text-slate-300">
          <span>{t("DINDING LONGKANG SIMEN", "CONCRETE DRAIN WALL")}</span>
          <span>{t("GOTONG-ROYONG KEMPEN PRU", "ELECTION GOTONG ROYONG CAMPAIGN")}</span>
        </div>

        {/* Sludge / Water in drain */}
        <div
          className="absolute inset-x-0 bottom-0 top-4 transition-colors duration-200"
          style={{
            backgroundColor: isPhotoReady
              ? "#0284c7"
              : cleanProgress > 60
                ? "#0d9488"
                : "#3f3f46",
          }}
        >
          {/* Moss & Debris (shrinks as cleaned) */}
          <div
            className="absolute inset-0 flex items-center justify-around text-2xl transition-all duration-150"
            style={{ opacity: Math.max(0.1, 1 - cleanProgress / 100) }}
          >
            <span>{curSection.trashEmoji}</span>
            <span>🌿</span>
            <span>{curSection.trashEmoji}</span>
            <span>🪵</span>
            <span>🌿</span>
          </div>

          {/* Sparkling Clean Effect */}
          {cleanProgress > 70 && (
            <div className="absolute inset-0 flex items-center justify-around text-xl text-yellow-300 animate-pulse">
              <span>✨</span>
              <span>✨</span>
              <span>✨</span>
            </div>
          )}
        </div>

        {/* Player Broom / Squeeze */}
        <div
          style={{ left: `${broomX}%` }}
          className="absolute bottom-2 -translate-x-1/2 pointer-events-none flex flex-col items-center transition-all duration-75 z-20"
        >
          <div className="text-3xl filter drop-shadow">🧹</div>
          <span className="text-[7px] font-black bg-amber-400 text-slate-950 px-1 rounded shadow">
            {t("PENYAPU YB", "YB'S BROOM")}
          </span>
        </div>

        {/* Instruction overlay */}
        <div className="relative z-10 text-center text-[9px] font-mono font-bold text-white bg-slate-950/70 py-0.5 rounded-full mt-auto">
          {isPhotoReady
            ? t("📸 LONGKANG DAH BERSIH! TEKAN POSE JEMPOL SEKARANG!", "📸 DRAIN IS SPARKLING! PRESS THUMBS UP POSE NOW!")
            : t("👆 SENTAL KIRI-KANAN (ATAU TEKAN SPACE) UNTUK BERSIHKAN KOTORAN!", "👆 SCRUB LEFT-RIGHT (OR PRESS SPACE) TO CLEAR DEBRIS!")}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleQuickScrubButton}
          disabled={isPhotoReady}
          className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl border-3 border-slate-950 comic-shadow-sm uppercase transition cursor-pointer flex flex-col items-center justify-center gap-0.5"
        >
          <span>{t("🧹 SENTAL LAJU! (SPACE)", "🧹 FAST SCRUB! (SPACE)")}</span>
          <span className="text-[9px] opacity-80 font-normal font-mono">
            {t("[Sental lumpur longkang pantas]", "[Fast scrub sludge & debris]")}
          </span>
        </button>

        <button
          type="button"
          onClick={handleThumbsUpPose}
          disabled={!isPhotoReady}
          className={`flex-1 py-3 font-black text-xs rounded-xl border-3 border-slate-950 comic-shadow-sm uppercase transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            isPhotoReady
              ? "bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 animate-bounce"
              : "bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Camera className="w-4 h-4" /> {t("POSE JEMPOL! 👍 (SPACE)", "THUMBS-UP POSE! 👍 (SPACE)")}
          </span>
          <span className="text-[9px] opacity-80 font-normal font-mono">
            {t("[Ambil gambar media sosial]", "[Social media photo-op]")}
          </span>
        </button>
      </div>
    </div>
  );
}
