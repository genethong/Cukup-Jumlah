import { useEffect, useRef, useState, useCallback } from "react";
import { Stamp, CheckCircle2, AlertTriangle } from "lucide-react";
import type { PartyId } from "../types";
import { PARTIES } from "../types";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface CopWatikahProps {
  partyId: PartyId;
  onComplete: (success: boolean) => void;
  isMesraRakyat?: boolean;
}

interface WatikahDoc {
  id: number;
  title: string;
  salinan: string;
  clause: string;
  speed: number;
  tolerance: number;
}

const DOCUMENTS: WatikahDoc[] = [
  {
    id: 1,
    title: "SURAT PENGESAHAN CALON RASMI",
    salinan: "SALINAN 1: UNTUK PEGAWAI PENGURUS SPR",
    clause: "Peraturan 11(2)(c) Penjalanan Pilihan Raya 1981",
    speed: 3.8,
    tolerance: 18,
  },
  {
    id: 2,
    title: "PERAKUAN KELULUSAN PRESIDEN PARTI",
    salinan: "SALINAN 2: UNTUK IBU PEJABAT PARTI",
    clause: "Pengesahan Simbol & Logo Rasmi Parti",
    speed: 4.8,
    tolerance: 15,
  },
  {
    id: 3,
    title: "WATIKAH ASAL BERTANDATANGAN BASAH",
    salinan: "SALINAN 3: SIMPANAN KELAYAKAN CALON",
    clause: "Meterai Rasmi & Tandatangan Setiausaha Agung",
    speed: 5.8,
    tolerance: 13,
  },
];

export function CopWatikahGame({ partyId, onComplete, isMesraRakyat = false }: CopWatikahProps) {
  const { t } = useLanguage();
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [completedDocs, setCompletedDocs] = useState<number[]>([]);
  const [reticleX, setReticleX] = useState(50);
  const [isStamping, setIsStamping] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "miss"; text: string } | null>(null);
  const [stampedStampList, setStampedStampList] = useState<{ x: number; y: number; success: boolean }[]>([]);

  const party = PARTIES[partyId];
  const containerRef = useRef<HTMLDivElement>(null);
  const isFinishedRef = useRef(false);
  const curDoc = DOCUMENTS[currentDocIndex] || DOCUMENTS[0];

  // Moving stamp reticle back and forth
  useEffect(() => {
    let forward = true;
    const interval = setInterval(() => {
      setReticleX((prev) => {
        const step = curDoc.speed * (forward ? 1 : -1);
        const nextX = prev + step;
        if (nextX > 82) forward = false;
        if (nextX < 18) forward = true;
        return nextX;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [curDoc.speed]);

  const handleStamp = useCallback(() => {
    if (isStamping || isFinishedRef.current) return;
    setIsStamping(true);

    const tolerance = isMesraRakyat ? curDoc.tolerance + 5 : curDoc.tolerance;
    const distance = Math.abs(reticleX - 50);
    const isAccurate = distance <= tolerance;

    // Record stamp position for visual mark
    setStampedStampList((prev) => [...prev, { x: reticleX, y: 50, success: isAccurate }]);

    if (isAccurate) {
      rhythmAudio.playStampSlam();
      setFeedback({
        type: "success",
        text: t(
          `COP BERJAYA! (SALINAN ${currentDocIndex + 1}/3) ✅`,
          `STAMP SUCCESS! (COPY ${currentDocIndex + 1}/3) ✅`
        ),
      });

      const nextCompleted = [...completedDocs, currentDocIndex];
      setCompletedDocs(nextCompleted);

      setTimeout(() => {
        if (nextCompleted.length >= DOCUMENTS.length) {
          isFinishedRef.current = true;
          rhythmAudio.playPaduSuccess();
          setTimeout(() => onComplete(true), 350);
        } else {
          setCurrentDocIndex((prev) => prev + 1);
          setStampedStampList([]);
          setFeedback(null);
          setIsStamping(false);
        }
      }, 550);
    } else {
      rhythmAudio.playStampSlam();
      setTimeout(() => rhythmAudio.playSkrrtMiss(), 100);
      setFeedback({
        type: "miss",
        text: t("TERLARI DARI RUANG COP! CUBA LAGI! ❌", "MISSED STAMP TARGET! TRY AGAIN! ❌"),
      });

      setTimeout(() => {
        setFeedback(null);
        setIsStamping(false);
      }, 450);
    }
  }, [isStamping, reticleX, isMesraRakyat, curDoc, currentDocIndex, completedDocs, onComplete, t]);

  // Keyboard shortcut: Spacebar to slam stamp
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        handleStamp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStamp]);

  return (
    <div className="flex flex-col items-center justify-between p-1.5 text-center w-full select-none">
      {/* Top Document Progress Indicator */}
      <div className="w-full flex items-center justify-between bg-slate-900 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono mb-2 text-white shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("STATUS WATIKAH:", "WATIKAH STATUS:")}</span>
          <span>{t(`${completedDocs.length} / 3 DISAHKAN`, `${completedDocs.length} / 3 CERTIFIED`)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {DOCUMENTS.map((doc, idx) => (
            <span
              key={doc.id}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] border ${
                completedDocs.includes(idx)
                  ? "bg-emerald-500 border-emerald-300 text-slate-950"
                  : idx === currentDocIndex
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {completedDocs.includes(idx) ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Official Legal Document Desk */}
      <div
        ref={containerRef}
        onClick={handleStamp}
        className="w-full h-56 bg-[#fbf6ea] text-slate-900 p-3.5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all active:scale-[0.99]"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-300 pb-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-black text-red-700 uppercase tracking-tight">
              WATIKAH PARTI • {curDoc.clause}
            </span>
            <span className="text-[9px] font-bold bg-amber-200 text-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {curDoc.salinan}
            </span>
          </div>
          <div className="text-xs font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>{curDoc.title}</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded font-black text-white"
              style={{ backgroundColor: party.themeColor === "#F8FAFC" ? "#334155" : party.themeColor }}
            >
              {party.name}
            </span>
          </div>
          <p className="text-[10px] text-slate-600 italic mt-0.5 line-clamp-1">
            "Mengesahkan calon ini dicalonkan mewakili {party.fullName} bertanding di PRU..."
          </p>
        </div>

        {/* Center Target Box: Green/Red Boundary */}
        <div className="relative w-full h-24 flex items-center justify-center my-auto">
          {/* Official Stamp Target Zone in Center */}
          <div
            className={`w-36 h-20 border-3 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
              isMesraRakyat
                ? "border-emerald-600 bg-emerald-100/60"
                : "border-red-600 bg-red-100/50"
            }`}
          >
            <span className="text-[8px] font-mono font-black uppercase text-slate-700 tracking-wider">
              {isMesraRakyat
                ? t("ZON COP MESRA RAKYAT 🤝", "PEOPLE-FRIENDLY STAMP ZONE 🤝")
                : t("ZON COP METERAI PARTI", "PARTY SEAL STAMP ZONE")}
            </span>
            <span className="text-[9px] font-bold text-red-800 uppercase mt-0.5">
              {t("KETUK DI SINI! 🎯", "SLAM HERE! 🎯")}
            </span>
          </div>

          {/* Sweeping Reticle */}
          {!isStamping && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-slate-950 bg-red-600/40 flex items-center justify-center pointer-events-none shadow-md transition-transform duration-75"
              style={{ left: `${reticleX}%` }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm">
                🛑
              </div>
            </div>
          )}

          {/* Render Previous Stamps / Mis-stamps */}
          {stampedStampList.map((stamp, sIdx) => (
            <div
              key={sIdx}
              style={{ left: `${stamp.x}%` }}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-3 py-1 rounded-xl font-black uppercase text-xs rotate-[-6deg] shadow-lg border-3 ${
                stamp.success
                  ? "border-red-800 bg-red-600 text-white animate-bounce"
                  : "border-slate-800 bg-slate-400 text-slate-900"
              }`}
            >
              {stamp.success
                ? t(`${party.name} DISAHKAN ✅`, `${party.name} CERTIFIED ✅`)
                : t("SENGET! ❌", "SKEWED! ❌")}
            </div>
          ))}
        </div>

        {/* Feedback Alert Overlay */}
        {feedback && (
          <div className="absolute inset-x-2 bottom-8 flex justify-center pointer-events-none z-10 animate-fade-in">
            <div
              className={`px-3 py-1 rounded-xl border-2 border-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 ${
                feedback.type === "success"
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-rose-500 text-white animate-shake"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          </div>
        )}

        {/* Legal Footer */}
        <div className="border-t border-slate-300 pt-1 text-[9px] font-mono text-slate-500 flex justify-between items-center">
          <span>{t("SURAT ASAL BERMETERAI", "ORIGINAL SEALED LETTER")}</span>
          <span className="font-bold text-slate-700">
            {t("TEKAN SPACE / KLIK UNTUK COP!", "PRESS SPACE / CLICK TO STAMP!")}
          </span>
          <span>{t("MASA: SEBELUM 10:00 PG", "DEADLINE: BEFORE 10:00 AM")}</span>
        </div>
      </div>

      {/* Action Stamp Button */}
      <button
        onClick={handleStamp}
        disabled={isStamping}
        className="w-full mt-2.5 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
      >
        <Stamp className="w-5 h-5" />
        {t(
          `COP WATIKAH SALINAN KE-${currentDocIndex + 1}! 📑 (SPACEBAR)`,
          `SLAM STAMP ON COPY ${currentDocIndex + 1}! 📑 (SPACEBAR)`
        )}
      </button>
    </div>
  );
}
