import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Droplet } from "lucide-react";
import { useLanguage } from "../languageContext";

interface CelupDakwatKekalProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface VoterQueue {
  id: number;
  nameMs: string;
  nameEn: string;
  emoji: string;
  descMs: string;
  descEn: string;
  speed: number;
  tolerance: number;
}

const VOTERS: VoterQueue[] = [
  {
    id: 1,
    nameMs: "Pengundi Kali Pertama (18 Tahun)",
    nameEn: "First-Time Voter (18 Years Old)",
    emoji: "🙋‍♂️",
    descMs: "Tangan menggigil kerana teruja kali pertama mengundi!",
    descEn: "Hands trembling with excitement for their first ballot!",
    speed: 3.2,
    tolerance: 16,
  },
  {
    id: 2,
    nameMs: "Warga Emas Kampung",
    nameEn: "Kampung Senior Citizen",
    emoji: "👴🏾",
    descMs: "Pergerakan jari perlahan & berhati-hati",
    descEn: "Slow, cautious and deliberate finger motion",
    speed: 2.5,
    tolerance: 18,
  },
  {
    id: 3,
    nameMs: "Pengundi Bergegas",
    nameEn: "Rushing Voter",
    emoji: "🏃‍♀️",
    descMs: "Cepat-cepat nak balik masak makan tengah hari!",
    descEn: "In a hurry to get back home and cook lunch!",
    speed: 4.4,
    tolerance: 13,
  },
  {
    id: 4,
    nameMs: "Calon Sendiri (Photo-Op Rasmi)",
    nameEn: "Candidate (Official Photo-Op)",
    emoji: "🧔🏾‍♂️✨",
    descMs: "Celup jari sambil senyum megah depan wartawan!",
    descEn: "Dipping finger with a wide smile for the press!",
    speed: 3.6,
    tolerance: 15,
  },
];

export function CelupDakwatKekalGame({ isMesraRakyat = false, onComplete }: CelupDakwatKekalProps) {
  const { t } = useLanguage();
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [completedVoters, setCompletedVoters] = useState<number[]>([]);
  const [fingerX, setFingerX] = useState(50);
  const [bottleX, setBottleX] = useState(50);
  const [dipStatus, setDipStatus] = useState<"idle" | "dipped" | "spilled">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const curVoter = VOTERS[currentVoterIdx] || VOTERS[0];
  const dirRef = useRef(1);
  const finishedRef = useRef(false);

  // Trembling finger sweep
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current || dipStatus !== "idle") return;

      setFingerX((prev) => {
        const speed = curVoter.speed;
        const jitter = (Math.random() - 0.5) * 2.4;
        let next = prev + dirRef.current * speed + jitter;
        if (next >= 82) {
          next = 82;
          dirRef.current = -1;
        } else if (next <= 18) {
          next = 18;
          dirRef.current = 1;
        }
        return next;
      });
    }, 35);

    return () => clearInterval(interval);
  }, [curVoter.speed, dipStatus]);

  const handlePlungeFinger = useCallback(() => {
    if (finishedRef.current || dipStatus !== "idle") return;

    const tolerance = isMesraRakyat ? curVoter.tolerance + 5 : curVoter.tolerance;
    const dist = Math.abs(fingerX - bottleX);

    if (dist <= tolerance) {
      rhythmAudio.playStampSlam();
      setDipStatus("dipped");
      setFeedback(t("JARI SAH DIBASAHI DAKWAT KEKAL! 🟣✅", "INDEX FINGER OFFICIALLY INKED! 🟣✅"));

      const nextCompleted = [...completedVoters, currentVoterIdx];
      setCompletedVoters(nextCompleted);

      setTimeout(() => {
        if (nextCompleted.length >= VOTERS.length) {
          finishedRef.current = true;
          rhythmAudio.playPaduSuccess();
          setTimeout(() => onComplete(true), 400);
        } else {
          setCurrentVoterIdx((prev) => prev + 1);
          setBottleX(30 + Math.random() * 40);
          setDipStatus("idle");
          setFeedback(null);
        }
      }, 550);
    } else {
      rhythmAudio.playSkrrtMiss();
      setDipStatus("spilled");
      setFeedback(t("TERLEPAS BOTOL! CUBA CELUP LAGI! ❌", "MISSED BOTTLE! TRY AGAIN! ❌"));
      setTimeout(() => {
        setDipStatus("idle");
        setFeedback(null);
      }, 400);
    }
  }, [dipStatus, isMesraRakyat, curVoter, fingerX, bottleX, completedVoters, currentVoterIdx, onComplete, t]);

  // Spacebar support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handlePlungeFinger();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlungeFinger]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Status */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <Droplet className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300">{t("DAKWAT KEKAL SPR:", "SPR INDELIBLE INK:")}</span>
          <span>{t(`${completedVoters.length} / 4 PENGUNDI`, `${completedVoters.length} / 4 VOTERS`)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {VOTERS.map((_, idx) => (
            <span
              key={idx}
              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] border ${
                completedVoters.includes(idx)
                  ? "bg-purple-600 border-purple-300 text-white"
                  : idx === currentVoterIdx
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {completedVoters.includes(idx) ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Current Voter Banner */}
      <div className="bg-purple-100 border-2 border-slate-900 rounded-xl p-2 text-left flex items-center justify-between comic-shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{curVoter.emoji}</span>
          <div>
            <div className="text-[9px] font-mono font-black text-purple-800 uppercase">
              {t("PENGUNDI", "VOTER")} #{currentVoterIdx + 1}: {t(curVoter.nameMs, curVoter.nameEn)}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {t(curVoter.descMs, curVoter.descEn)}
            </div>
          </div>
        </div>
        <div className="text-right text-[9px] font-mono font-bold text-purple-900">
          Peraturan 19 SPR
        </div>
      </div>

      {/* Dipping Stage */}
      <div className="relative h-48 bg-slate-800 rounded-2xl border-4 border-slate-950 overflow-hidden comic-shadow flex flex-col justify-between p-2">
        {/* Desk texture */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-amber-950/70 border-t-2 border-slate-950 flex items-center justify-around text-[8px] font-mono text-amber-200">
          <span>{t("MEJA KERANI SPR NO. 2", "SPR CLERK DESK NO. 2")}</span>
          <span>{t("DAKWAT KEKAL RASMI SPR", "OFFICIAL SPR INDELIBLE INK")}</span>
        </div>

        {/* Trembling Voter Index Finger */}
        <div
          style={{ left: `${fingerX}%` }}
          className={`absolute -translate-x-1/2 pointer-events-none flex flex-col items-center transition-all duration-75 z-20 ${
            dipStatus === "dipped" ? "top-20" : "top-2"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-amber-200 border-2 border-slate-950 flex items-center justify-center text-2xl shadow-md">
            ☝️
          </div>
          <span className="text-[7px] font-mono font-black bg-purple-900 text-purple-200 px-1 rounded border border-purple-400 mt-0.5">
            {t("Jari Telunjuk", "Index Finger")}
          </span>
        </div>

        {/* Indelible Ink Bottle at Bottom */}
        <div
          style={{ left: `${bottleX}%` }}
          className="absolute bottom-3 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-10"
        >
          {/* Target Reticle Indicator */}
          <div className="w-12 h-6 border-2 border-dashed border-amber-300 bg-amber-400/20 rounded-t-lg mb-0.5 animate-pulse flex items-center justify-center">
            <span className="text-[6px] font-mono font-black text-amber-300">TARGET</span>
          </div>
          {/* Bottle body */}
          <div className="w-11 h-14 bg-purple-950 border-3 border-slate-950 rounded-xl flex flex-col items-center justify-center p-0.5 shadow-xl">
            <div className="w-5 h-2 bg-purple-800 rounded-t mb-0.5" />
            <span className="text-[6px] font-black font-mono text-purple-300 uppercase leading-none">
              DAKWAT SPR
            </span>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="absolute top-2 inset-x-4 text-center pointer-events-none z-30 animate-fade-in">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border-2 border-slate-950 shadow-md ${
                dipStatus === "dipped" ? "bg-emerald-400 text-slate-950" : "bg-rose-500 text-white animate-shake"
              }`}
            >
              {feedback}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handlePlungeFinger}
        disabled={dipStatus !== "idle"}
        className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 active:translate-x-0.5 active:translate-y-0.5 text-white font-black text-sm rounded-2xl border-4 border-slate-900 comic-shadow transition cursor-pointer flex flex-col items-center justify-center uppercase tracking-wider disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-purple-300" />
          {t("CELUP JARI TELUNJUK SEKARANG! ☝️ (SPACEBAR)", "DIP INDEX FINGER NOW! ☝️ (SPACEBAR)")}
        </span>
        <span className="text-[10px] text-purple-200 font-mono font-normal">
          {t("[Celup jari pengundi ke dalam botol dakwat kekal]", "[Dip voter's index finger into indelible ink bottle]")}
        </span>
      </button>
    </div>
  );
}
