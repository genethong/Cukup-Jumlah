import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Truck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../languageContext";

interface TurapJalanKilatProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

type HoleState = "smooth" | "cracked" | "tarred";

export function TurapJalanKilatGame({ isMesraRakyat = false, onComplete }: TurapJalanKilatProps) {
  const { t } = useLanguage();
  const targetPatches = isMesraRakyat ? 7 : 8;
  const [holes, setHoles] = useState<HoleState[]>([
    "cracked",
    "smooth",
    "tarred",
    "cracked",
    "smooth",
    "cracked",
    "tarred",
    "smooth",
  ]);
  const [patchedCount, setPatchedCount] = useState(0);
  const [activeCarDistance, setActiveCarDistance] = useState(100); // 100% (far) to 0% (arrived)
  const [chickenIndex, setChickenIndex] = useState<number | null>(null);

  const finishedRef = useRef(false);

  // Convoy approaches & potholes spawn
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // Convoy approaches
      setActiveCarDistance((prev) => Math.max(0, prev - 1.2));

      // Periodically crack another hole
      setHoles((prev) => {
        const smoothIndices = prev
          .map((state, idx) => (state === "smooth" ? idx : -1))
          .filter((idx) => idx !== -1);
        if (smoothIndices.length <= 1) return prev;
        const pick = smoothIndices[Math.floor(Math.random() * smoothIndices.length)];
        const copy = [...prev];
        copy[pick] = "cracked";
        return copy;
      });

      // Stray chicken wanders
      if (Math.random() < 0.25) {
        setChickenIndex(Math.floor(Math.random() * 8));
      } else if (Math.random() < 0.4) {
        setChickenIndex(null);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handleHoleTap = useCallback((index: number) => {
    if (finishedRef.current) return;

    // Tapped chicken?
    if (chickenIndex === index) {
      rhythmAudio.playSkrrtMiss();
      setChickenIndex(null);
      return;
    }

    const currentState = holes[index];
    if (currentState === "smooth") return;

    if (currentState === "cracked") {
      // Step 1: Pour hot asphalt
      rhythmAudio.playBeatSound(2);
      if (isMesraRakyat) {
        completePatch(index);
      } else {
        setHoles((prev) => {
          const copy = [...prev];
          copy[index] = "tarred";
          return copy;
        });
      }
    } else if (currentState === "tarred") {
      // Step 2: Flatten smooth with steamroller
      completePatch(index);
    }
  }, [holes, chickenIndex, isMesraRakyat]);

  const completePatch = (index: number) => {
    rhythmAudio.playStampSlam();
    setHoles((prev) => {
      const copy = [...prev];
      copy[index] = "smooth";
      return copy;
    });

    setPatchedCount((prev) => {
      const next = prev + 1;
      if (next >= targetPatches && !finishedRef.current) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2 select-none">
      {/* Top Banner: Convoy Approach Progress */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <Truck className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-amber-400">{t("KONVOI VIP:", "VIP CONVOY:")}</span>
          <span>{t(`TIBA DALAM ${Math.round(activeCarDistance * 0.15)}s`, `ARRIVES IN ${Math.round(activeCarDistance * 0.15)}s`)}</span>
        </div>
        <div className="font-black text-emerald-400">
          {t(`DITURAP: ${patchedCount} / ${targetPatches}`, `PAVED: ${patchedCount} / ${targetPatches}`)}
        </div>
      </div>

      {/* Road Pavement Grid */}
      <div className="bg-[#1e293b] rounded-2xl border-4 border-slate-950 p-2.5 relative shadow-inner">
        {/* Road center white dashed line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 border-r-2 border-dashed border-amber-300 opacity-60 pointer-events-none" />

        <div className="grid grid-cols-4 gap-2 relative z-10">
          {holes.map((state, idx) => {
            const hasChicken = chickenIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleHoleTap(idx)}
                className={`h-22 rounded-xl border-3 border-slate-950 flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer active:scale-95 ${
                  hasChicken
                    ? "bg-amber-100 border-amber-500 shadow-md animate-bounce"
                    : state === "smooth"
                      ? "bg-slate-700/80 border-slate-600 opacity-90"
                      : state === "tarred"
                        ? "bg-slate-950 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                        : "bg-stone-900 border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                }`}
              >
                {hasChicken ? (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl">🐔</span>
                    <span className="text-[7px] font-black bg-rose-600 text-white px-1 rounded">
                      {t("AYAM! 🐔", "CHICKEN!")}
                    </span>
                  </div>
                ) : state === "smooth" ? (
                  <div className="flex flex-col items-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[8px] font-mono font-bold mt-1 text-slate-300">
                      {t("LICIN ✅", "SMOOTH ✅")}
                    </span>
                  </div>
                ) : state === "tarred" ? (
                  <div className="flex flex-col items-center text-amber-400">
                    <span className="text-xl">🛢️</span>
                    <span className="text-[8px] font-black uppercase text-amber-300 mt-0.5">
                      {t("RATAKAN! 🚜", "FLATTEN! 🚜")}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-rose-400">
                    <span className="text-xl">🕳️</span>
                    <span className="text-[8px] font-black uppercase text-rose-300 mt-0.5">
                      {t("TUANG TAR! 🔥", "POUR TAR! 🔥")}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instruction */}
      <div className="text-[11px] font-bold text-slate-700 text-center">
        {t(
          "👆 Ketuk lubang untuk tuang tar panas ➔ ketuk sekali lagi untuk ratakan sebelum konvoi VIP tiba!",
          "👆 Tap pothole to pour hot tar ➔ tap again to steamroll smooth before VIP convoy arrives!"
        )}
      </div>
    </div>
  );
}
