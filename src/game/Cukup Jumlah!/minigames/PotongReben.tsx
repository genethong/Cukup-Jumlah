import { useEffect, useRef, useState, useCallback } from "react";
import { Scissors, CheckCircle2, Sparkles } from "lucide-react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface PotongRebenProps {
  onComplete: (success: boolean) => void;
  isMesraRakyat?: boolean;
}

interface RibbonCeremony {
  id: number;
  title: string;
  subtitle: string;
  budgetNotes: string;
  speed: number;
  tolerance: number;
  icon: string;
}

const CEREMONIES: RibbonCeremony[] = [
  {
    id: 1,
    title: "PERASMIAN CAT TIANG LAMPU NO. 042",
    subtitle: "Tiang Lampu Jalan Kampung Seri Wangi",
    budgetNotes: "Kos Cat: RM50 • Bajet Kenduri Perasmian: RM5,000",
    speed: 3.5,
    tolerance: 18,
    icon: "💡",
  },
  {
    id: 2,
    title: "PERASMIAN PAPAN TANDA BALAI RAYA",
    subtitle: "Papan Tanda Kayu Huruf Emas",
    budgetNotes: "Dua Reben Berkembar • Liputan Siaran RTM",
    speed: 4.6,
    tolerance: 15,
    icon: "🪧",
  },
  {
    id: 3,
    title: "PERASMIAN PAIP AIR DEWAN ORANG RAMAI",
    subtitle: "Paip Sinki Baru Selepas 15 Tahun",
    budgetNotes: "Reben Sutera Emas • Tepukan Gemuruh Penduduk",
    speed: 5.6,
    tolerance: 13,
    icon: "🚰",
  },
];

export function PotongRebenGame({ onComplete, isMesraRakyat = false }: PotongRebenProps) {
  const { lang, t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedList, setCompletedList] = useState<number[]>([]);
  const [scissorX, setScissorX] = useState(50);
  const [isCutting, setIsCutting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "hit" | "miss"; text: string } | null>(null);

  const curCeremony = CEREMONIES[currentIdx] || CEREMONIES[0];
  const finishedRef = useRef(false);

  // Scissor sweep animation
  useEffect(() => {
    let forward = true;
    const interval = setInterval(() => {
      setScissorX((prev) => {
        const step = curCeremony.speed * (forward ? 1 : -1);
        let next = prev + step;
        if (next > 85) forward = false;
        if (next < 15) forward = true;
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [curCeremony.speed]);

  const handleSnip = useCallback(() => {
    if (isCutting || finishedRef.current) return;
    setIsCutting(true);

    const tolerance = isMesraRakyat ? curCeremony.tolerance + 5 : curCeremony.tolerance;
    const distance = Math.abs(scissorX - 50);
    const isAccurate = distance <= tolerance;

    if (isAccurate) {
      rhythmAudio.playStampSlam();
      rhythmAudio.playBeatSound(4);
      setFeedback({
        type: "hit",
        text: t("REBEN PUTUS! MAJLIS BERJAYA! ✂️🎉", "RIBBON CUT! CEREMONY SUCCESS! ✂️🎉"),
      });

      const nextCompleted = [...completedList, currentIdx];
      setCompletedList(nextCompleted);

      setTimeout(() => {
        if (nextCompleted.length >= CEREMONIES.length) {
          finishedRef.current = true;
          rhythmAudio.playPaduSuccess();
          setTimeout(() => onComplete(true), 400);
        } else {
          setCurrentIdx((prev) => prev + 1);
          setFeedback(null);
          setIsCutting(false);
        }
      }, 550);
    } else {
      rhythmAudio.playSkrrtMiss();
      setFeedback({
        type: "miss",
        text: t("TERPOTONG ANGIN! BIDIK TENGAH REBEN! ❌", "MISSED! AIM AT CENTER OF RIBBON! ❌"),
      });

      setTimeout(() => {
        setFeedback(null);
        setIsCutting(false);
      }, 400);
    }
  }, [isCutting, scissorX, isMesraRakyat, curCeremony, currentIdx, completedList, onComplete, t]);

  // Spacebar shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleSnip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSnip]);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative select-none">
      {/* Top Ceremony Progress */}
      <div className="w-full flex items-center justify-between bg-slate-900 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono text-white mb-2 comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("UPACARA RASMI:", "VIP CEREMONY:")}</span>
          <span>{completedList.length} / 3 {t("RASMI", "DONE")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {CEREMONIES.map((_, idx) => (
            <span
              key={idx}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border ${
                completedList.includes(idx)
                  ? "bg-emerald-500 border-emerald-300 text-slate-950"
                  : idx === currentIdx
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {completedList.includes(idx) ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Satirical Ribbon Ceremony Banner */}
      <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-3 border-slate-900 rounded-xl p-2 mb-2 text-white text-center comic-shadow-sm">
        <div className="text-[9px] font-mono tracking-wider uppercase font-bold text-amber-300 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{t(`UPACARA PERASMIAN VIP KE-${currentIdx + 1}`, `VIP CEREMONY #${currentIdx + 1}`)}</span>
          <Sparkles className="w-3 h-3" />
        </div>
        <div className="text-xs md:text-sm font-black tracking-tight uppercase leading-tight mt-0.5">
          {curCeremony.title}
        </div>
        <div className="text-[9px] font-mono text-red-100 mt-0.5">
          ({curCeremony.budgetNotes})
        </div>
      </div>

      {/* Ribbon Arena Desk */}
      <div
        onClick={handleSnip}
        className="w-full h-46 bg-[#fdf8ee] p-3 rounded-2xl border-4 border-slate-900 comic-shadow relative flex flex-col items-center justify-between overflow-hidden cursor-pointer active:scale-[0.99]"
      >
        {/* Project Target Center */}
        <div className="flex items-center gap-2">
          <span className="text-3xl">{curCeremony.icon}</span>
          <div className="text-left font-mono">
            <span className="text-[9px] font-bold text-slate-500 uppercase block">
              {t("Lokasi Projek", "Project Location")}
            </span>
            <span className="text-xs font-black text-slate-900">{curCeremony.subtitle}</span>
          </div>
        </div>

        {/* The Ceremonial Ribbon Across the Arena */}
        <div className="w-full relative h-16 flex items-center justify-center my-auto">
          {/* Ribbon Banner */}
          <div className="w-full h-8 bg-red-600 border-3 border-slate-950 rounded-lg shadow-md flex items-center justify-between px-3 text-white text-[10px] font-black tracking-wider">
            <span>🎗️</span>
            <div className="bg-amber-300 border-2 border-slate-950 text-slate-950 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
              {t("POTONG DI SINI! 🎯", "CUT HERE! 🎯")}
            </div>
            <span>🎗️</span>
          </div>

          {/* Golden Scissor Sweep Reticle */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-3 border-slate-950 bg-amber-400/90 flex items-center justify-center shadow-lg transition-transform pointer-events-none ${
              isCutting ? "scale-90 rotate-[-15deg]" : ""
            }`}
            style={{ left: `${scissorX}%` }}
          >
            <Scissors className="w-7 h-7 text-slate-950" />
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="absolute inset-x-2 bottom-3 flex justify-center pointer-events-none z-10 animate-fade-in">
            <div
              className={`px-3 py-1 rounded-xl border-2 border-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 ${
                feedback.type === "hit" ? "bg-emerald-400 text-slate-950" : "bg-rose-500 text-white animate-shake"
              }`}
            >
              {feedback.type === "hit" ? <CheckCircle2 className="w-4 h-4" /> : <Scissors className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        <div className="text-[9px] font-mono text-slate-500">
          {t("TEKAN BUTANG / SPACEBAR SEMASA GUNTING DI TENGAH REBEN!", "PRESS BUTTON OR SPACEBAR WHEN SCISSORS ARE IN THE CENTER!")}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSnip}
        disabled={isCutting}
        className="w-full mt-2.5 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-sm rounded-2xl border-4 border-slate-900 comic-shadow transition cursor-pointer flex flex-col items-center justify-center uppercase tracking-wider disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <Scissors className="w-5 h-5" /> {t("GUNTING REBEN EMAS SEKARANG! ✂️ (SPACEBAR)", "SNIP GOLDEN RIBBON NOW! ✂️ (SPACEBAR)")}
        </span>
        <span className="text-[10px] text-amber-200 font-mono font-normal">
          {t("[UPACARA PERASMIAN PROJEK DESA]", "[OFFICIAL RURAL PROJECT CEREMONY]")}
        </span>
      </button>
    </div>
  );
}
