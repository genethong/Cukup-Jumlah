import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Volume2, Zap, Flame, Wind } from "lucide-react";
import { useLanguage } from "../languageContext";

interface PerangSpeakerProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface SloganWave {
  slogan: string;
  opponentSlogan: string;
  targetDominance: number;
}

const WAVES: SloganWave[] = [
  {
    slogan: "AYAM MURAH RM1 SEKILO! 🍗",
    opponentSlogan: "KAMI BAGI TELUR GRED A! 🥚",
    targetDominance: 75,
  },
  {
    slogan: "TURAP JALAN TANPA TOL! 🛣️",
    opponentSlogan: "KAMI DAH BUAT JAMBATAN DULU! 🌉",
    targetDominance: 80,
  },
  {
    slogan: "CUKUP JUMLAH! RAKYAT MENANG! 🏆",
    opponentSlogan: "TUNGGU KAMI FAILKAN PETISYEN! 📑",
    targetDominance: 85,
  },
];

export function PerangSpeakerGame({ isMesraRakyat = false, onComplete }: PerangSpeakerProps) {
  const { t } = useLanguage();
  const [currentWaveIdx, setCurrentWaveIdx] = useState(0);
  const [dominance, setDominance] = useState(50);
  const [ampHeat, setAmpHeat] = useState(15);
  const [isOverheated, setIsOverheated] = useState(false);
  const [shoutAnimation, setShoutAnimation] = useState(false);
  const [completedWaves, setCompletedWaves] = useState<number[]>([]);

  const curWave = WAVES[currentWaveIdx] || WAVES[0];
  const finishedRef = useRef(false);

  // Rival speaker constantly counters + cool down amp heat naturally
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // Natural cooling
      setAmpHeat((prev) => Math.max(0, prev - (isOverheated ? 5.5 : 2.5)));

      // Rival pushback
      setDominance((prev) => {
        const rivalPush = isOverheated ? 2.8 : isMesraRakyat ? 1.0 : 1.35;
        return Math.max(15, prev - rivalPush);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isOverheated, isMesraRakyat]);

  const handleMegaphoneShout = useCallback(() => {
    if (finishedRef.current || isOverheated) return;

    // Increase amp heat
    setAmpHeat((prevHeat) => {
      const nextHeat = prevHeat + 11;
      if (nextHeat >= 100) {
        rhythmAudio.playSkrrtMiss();
        setIsOverheated(true);
        setTimeout(() => setIsOverheated(false), 1200);
        return 100;
      }
      return nextHeat;
    });

    setShoutAnimation(true);
    setTimeout(() => setShoutAnimation(false), 200);
    rhythmAudio.playBeatSound(4);

    setDominance((prev) => {
      const boost = isMesraRakyat ? 8.5 : 6.8;
      const next = Math.min(100, prev + boost);

      // Check wave win
      if (next >= curWave.targetDominance) {
        const nextCompleted = [...completedWaves, currentWaveIdx];
        setCompletedWaves(nextCompleted);

        if (nextCompleted.length >= WAVES.length) {
          finishedRef.current = true;
          rhythmAudio.playPaduSuccess();
          setTimeout(() => onComplete(true), 400);
        } else {
          rhythmAudio.playPaduSuccess();
          setCurrentWaveIdx((w) => w + 1);
          return 50; // reset center for next clash
        }
      }
      return next;
    });
  }, [isOverheated, isMesraRakyat, curWave, currentWaveIdx, completedWaves, onComplete]);

  // Quick ice fan button to clear heat immediately
  const handleFanGenerator = () => {
    if (finishedRef.current) return;
    rhythmAudio.playBeatSound(2);
    setAmpHeat(0);
    setIsOverheated(false);
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleMegaphoneShout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMegaphoneShout]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Wave Progress Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("PERTEMPURAN CERAMAH:", "CERAMAH RALLY CLASH:")}</span>
          <span>{t(`${completedWaves.length} / 3 MENANG`, `${completedWaves.length} / 3 WON`)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {WAVES.map((_, idx) => (
            <span
              key={idx}
              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] border ${
                completedWaves.includes(idx)
                  ? "bg-emerald-500 border-emerald-300 text-slate-950"
                  : idx === currentWaveIdx
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {completedWaves.includes(idx) ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Slogans Banner */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-1.5 rounded-xl text-left">
          <span className="text-[8px] font-bold text-amber-400 block uppercase">
            {t("LAUNGAN YB ANDA:", "YOUR YB SLOGAN:")}
          </span>
          <span className="font-black text-white">{curWave.slogan}</span>
        </div>
        <div className="bg-rose-950/80 border border-rose-500 text-rose-200 p-1.5 rounded-xl text-right">
          <span className="text-[8px] font-bold text-rose-400 block uppercase">
            {t("BALASAN KHEMAH SEBELAH:", "RIVAL TENT REPLY:")}
          </span>
          <span className="font-black text-white">{curWave.opponentSlogan}</span>
        </div>
      </div>

      {/* Soundwave Clash Arena */}
      <div className="relative h-44 bg-slate-900 rounded-2xl border-4 border-slate-950 overflow-hidden flex items-center justify-between px-3 shadow-inner">
        {/* Dynamic Decibel Clash Line */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/20 transition-all duration-75 border-r-4 border-amber-400"
          style={{ width: `${dominance}%` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-rose-500/20 transition-all duration-75"
          style={{ width: `${100 - dominance}%` }}
        />

        {/* Player Ceramah Tent (Left) */}
        <div className="z-10 flex flex-col items-center">
          <div
            className={`w-14 h-14 rounded-2xl bg-emerald-500 border-3 border-slate-950 flex items-center justify-center text-3xl shadow-lg transition-transform ${
              shoutAnimation ? "scale-115 rotate-[-8deg]" : ""
            }`}
          >
            📢
          </div>
          <span className="text-[9px] font-mono font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded mt-1 shadow">
            {t("CERAMAH YB", "YB'S RALLY")}
          </span>
          <span className="text-[8px] font-mono text-emerald-300 font-bold mt-0.5">
            {Math.round(dominance)} dB
          </span>
        </div>

        {/* Center Clash Sparks */}
        <div className="z-10 flex flex-col items-center pointer-events-none">
          <div className="text-xl animate-bounce">⚡💥⚡</div>
          <span className="text-[9px] font-mono font-black text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-400">
            {t("SASARAN:", "TARGET:")} {curWave.targetDominance}%
          </span>
        </div>

        {/* Rival Ceramah Tent (Right) */}
        <div className="z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-600 border-3 border-slate-950 flex items-center justify-center text-3xl shadow-lg">
            🔊
          </div>
          <span className="text-[9px] font-mono font-black bg-rose-950 text-rose-200 px-2 py-0.5 rounded mt-1 border border-rose-500">
            {t("KHEMAH LAWAN", "RIVAL RALLY TENT")}
          </span>
          <span className="text-[8px] font-mono text-rose-300 font-bold mt-0.5">
            {100 - Math.round(dominance)} dB
          </span>
        </div>
      </div>

      {/* Amplifier Heat Gauge & Quick Cool */}
      <div className="flex items-center justify-between gap-2 bg-slate-900 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono">
        <div className="flex items-center gap-2 flex-1">
          <Flame className={`w-4 h-4 ${isOverheated ? "text-rose-500 animate-ping" : ampHeat > 70 ? "text-amber-400" : "text-slate-400"}`} />
          <div className="flex-1">
            <div className="flex justify-between text-[9px] font-bold">
              <span className={isOverheated ? "text-rose-400 font-black animate-pulse" : "text-slate-300"}>
                {isOverheated
                  ? t("GENERATOR TERLALU PANAS! BERASAP! 💨", "GENERATOR OVERHEAT! SMOKING! 💨")
                  : t("SUHU AMPLIFIER GENERATOR", "GENERATOR AMPLIFIER TEMP")}
              </span>
              <span className="text-amber-400">{Math.round(ampHeat)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isOverheated ? "bg-rose-600" : ampHeat > 75 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${ampHeat}%` }}
              />
            </div>
          </div>
        </div>

        {/* Cool Amp Button */}
        <button
          type="button"
          onClick={handleFanGenerator}
          className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-[10px] rounded-lg border border-slate-950 shadow transition cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>{t("KIPAS GENERATOR! 🧊", "FAN GENERATOR! 🧊")}</span>
        </button>
      </div>

      {/* Main Megaphone Shout Button */}
      <button
        onClick={handleMegaphoneShout}
        disabled={isOverheated}
        className={`w-full py-3.5 font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider ${
          isOverheated
            ? "bg-rose-900/60 text-rose-300 opacity-60 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 active:translate-x-0.5 active:translate-y-0.5 text-slate-950"
        }`}
      >
        <Volume2 className="w-5 h-5" />
        {isOverheated
          ? t("TUNGGU GENERATOR SEJUK DULU...", "WAIT FOR GENERATOR TO COOL DOWN...")
          : t("LAUNG MEGAFON KUAT-KUAT! 📢 (SPACEBAR)", "SHOUT INTO MEGAPHONE! 📢 (SPACEBAR)")}
      </button>
    </div>
  );
}
