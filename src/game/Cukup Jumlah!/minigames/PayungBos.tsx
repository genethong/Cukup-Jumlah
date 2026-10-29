import React, { useEffect, useRef, useState } from "react";
import { CloudRain, Wind, ShieldAlert, CheckCircle2 } from "lucide-react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface PayungBosProps {
  onComplete: (success: boolean) => void;
  isMesraRakyat?: boolean;
}

export function PayungBosGame({ onComplete, isMesraRakyat = false }: PayungBosProps) {
  const { t } = useLanguage();
  const [vipX, setVipX] = useState(50);
  const [umbrellaX, setUmbrellaX] = useState(50);
  const [dryness, setDryness] = useState(100);
  const [isProtected, setIsProtected] = useState(true);
  const [walkProgress, setWalkProgress] = useState(0); // 0 to 100% (carpet walked)
  const [windActive, setWindActive] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const vipDirRef = useRef(1);
  const umbrellaXRef = useRef(50);
  const drynessRef = useRef(100);
  const walkProgressRef = useRef(0);
  const finishedRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const moveUmbrellaTo = (clientX: number) => {
    if (finishedRef.current || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.max(15, Math.min(85, ((clientX - rect.left) / rect.width) * 100));
    umbrellaXRef.current = x;
    setUmbrellaX(x);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    moveUmbrellaTo(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || e.pointerType === "touch") {
      moveUmbrellaTo(e.clientX);
    }
  };

  // Main simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // 0. Keyboard movement (A/D or Arrows)
      const keys = keysPressedRef.current;
      let kx = 0;
      if (keys.has("arrowleft") || keys.has("a")) kx -= 3.2;
      if (keys.has("arrowright") || keys.has("d")) kx += 3.2;
      if (kx !== 0) {
        umbrellaXRef.current = Math.max(15, Math.min(85, umbrellaXRef.current + kx));
        setUmbrellaX(umbrellaXRef.current);
      }

      // 1. VIP walk behavior (erratic turns, stops)
      setVipX((prev) => {
        // Occasional sudden direction reverse or pause
        if (Math.random() < 0.08) {
          vipDirRef.current = vipDirRef.current * -1;
        }

        let next = prev + vipDirRef.current * (2.0 + Math.random() * 1.5);
        if (next > 80) {
          next = 80;
          vipDirRef.current = -1;
        } else if (next < 20) {
          next = 20;
          vipDirRef.current = 1;
        }
        return next;
      });

      // 2. Wind gusts
      if (Math.random() < 0.05) {
        setWindActive(true);
        setTimeout(() => setWindActive(false), 900);
      }

      // 3. Check protection match
      setVipX((curVip) => {
        const diff = Math.abs(umbrellaXRef.current - curVip);
        const tolerance = isMesraRakyat ? 25 : 19;
        const covered = diff <= tolerance;
        setIsProtected(covered);

        if (!covered) {
          // Rain hurts dryness
          drynessRef.current = Math.max(0, drynessRef.current - 2.8);
          setDryness(Math.round(drynessRef.current));
        }

        return curVip;
      });

      // 4. Progress walked along the red carpet (~14 seconds)
      walkProgressRef.current = Math.min(100, walkProgressRef.current + 0.38);
      setWalkProgress(Math.round(walkProgressRef.current));

      // End conditions
      if (drynessRef.current <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        rhythmAudio.playSkrrtMiss();
        setTimeout(() => onComplete(false), 400);
      } else if (walkProgressRef.current >= 100 && !finishedRef.current) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isMesraRakyat, onComplete]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Banner: Boss Dryness & Carpet Progress */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <CloudRain className="w-4 h-4 text-sky-400" />
          <span className="text-sky-400">{t("HUJAN MONSUN:", "MONSOON RAINSTORM:")}</span>
          <span>{t(`KARPET VIP: ${walkProgress}% / 100%`, `VIP CARPET: ${walkProgress}% / 100%`)}</span>
        </div>
        <div className="flex items-center gap-2">
          {windActive && (
            <span className="text-[9px] font-black bg-sky-400 text-slate-950 px-2 py-0.5 rounded animate-bounce flex items-center gap-0.5">
              <Wind className="w-3 h-3" /> {t("ANGIN KENCANG! 💨", "GUST OF WIND! 💨")}
            </span>
          )}
          <span
            className={`font-black px-2 py-0.5 rounded border ${
              dryness > 60
                ? "bg-emerald-950 text-emerald-400 border-emerald-500"
                : dryness > 30
                  ? "bg-amber-950 text-amber-400 border-amber-500"
                  : "bg-rose-950 text-rose-400 border-rose-500 animate-pulse"
            }`}
          >
            {t(`KERING: ${dryness}%`, `DRYNESS: ${dryness}%`)}
          </span>
        </div>
      </div>

      {/* Rainy Arena with Lat Comic Caricatures */}
      <div
        ref={arenaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-52 bg-[#e0f2fe] p-3 rounded-2xl border-4 border-slate-900 comic-shadow relative overflow-hidden flex flex-col justify-between cursor-ew-resize touch-none"
      >
        {/* Cartoon Rain Streaks */}
        <div className={`absolute inset-0 pointer-events-none opacity-40 flex justify-around text-blue-600 font-mono text-sm ${windActive ? "skew-x-12" : ""}`}>
          <span className="animate-pulse">/ / / /</span>
          <span className="animate-pulse delay-75">/ / / /</span>
          <span className="animate-pulse delay-150">/ / / /</span>
          <span className="animate-pulse delay-100">/ / / /</span>
        </div>

        {/* Puddle / Red Carpet on ground */}
        <div className="absolute bottom-0 inset-x-0 h-7 bg-red-600/90 border-t-2 border-slate-900 flex items-center justify-around text-[8px] font-mono font-black text-amber-300">
          <span>{t("★ LALUAN KARPET MERAH VIP ★", "★ VIP RED CARPET WALKWAY ★")}</span>
          <span>{t("★ MENUJU PENTAS CERAMAH ★", "★ TO RALLY STAGE ★")}</span>
        </div>

        {/* Characters Arena */}
        <div className="relative w-full h-32 my-auto">
          {/* Boss VIP walking */}
          <div
            style={{ left: `${vipX}%` }}
            className="absolute bottom-2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
          >
            <div className="w-14 h-14 rounded-full bg-amber-200 border-3 border-slate-950 flex items-center justify-center text-3xl shadow-lg">
              🧓🏾✨
            </div>
            <span className="text-[8px] font-mono font-black bg-slate-950 text-amber-300 px-2 py-0.2 rounded-full border border-amber-400 mt-0.5">
              {t("BOS VIP (KETUA PARTI)", "VIP BOSS (PARTY LEADER)")}
            </span>
          </div>

          {/* Player Holding Giant Umbrella */}
          <div
            style={{ left: `${umbrellaX}%` }}
            className="absolute -top-3 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75 z-20"
          >
            {/* Giant Umbrella Canopy */}
            <div className={`w-36 h-12 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 rounded-t-full border-3 border-slate-950 shadow-xl flex items-center justify-center text-xs font-black text-slate-950 ${isProtected ? "shadow-[0_0_16px_rgba(251,191,36,0.6)]" : "opacity-80"}`}>
              {t("☂️ PAYUNG VIP", "☂️ VIP UMBRELLA")}
            </div>
            {/* Umbrella Pole */}
            <div className="w-1.5 h-16 bg-slate-800 border-r border-slate-950" />
            <span className="text-[7px] font-black bg-amber-400 text-slate-950 px-1 rounded shadow">
              {t("TANGAN YB", "YB'S HAND")}
            </span>
          </div>
        </div>

        {/* Protection alert status */}
        <div className="relative z-10 flex justify-between items-center text-[9px] font-mono font-bold">
          <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-700">
            {isProtected
              ? t("✅ BOS SELAMAT DALAM PAYUNG", "✅ VIP SAFE UNDER UMBRELLA")
              : t("❌ BOS KENA HUJAN! PAYUNGKAN CEPAT!", "❌ VIP IS GETTING WET! MOVE UMBRELLA!")}
          </span>
          <span className="text-slate-600">
            {t("SERET TETIKUS ATAU TEKAN A - D", "DRAG MOUSE OR PRESS A - D")}
          </span>
        </div>
      </div>

      <div className="text-[11px] font-bold text-slate-700 text-center font-mono">
        {t(
          "👆 Seret tetikus atau guna kekunci A & D untuk lindungi Bos VIP daripada hujan lebat hingga tamat karpet merah!",
          "👆 Drag mouse or use keys A & D to shield VIP from heavy rain until the end of the red carpet!"
        )}
      </div>
    </div>
  );
}
