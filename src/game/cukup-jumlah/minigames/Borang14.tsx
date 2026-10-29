import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { FileText, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../languageContext";

interface Borang14Props {
  onComplete: (success: boolean) => void;
  currentBeat: number;
  isPakarKira?: boolean;
}

const TARGET_VOTES = 112;

export function Borang14Game({ onComplete, isPakarKira = false }: Borang14Props) {
  const { t } = useLanguage();
  const [counted, setCounted] = useState(0);
  const [signed, setSigned] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [usedShield, setUsedShield] = useState(false);

  const finishedRef = useRef(false);

  const handleAddVotes = useCallback((amount: number) => {
    if (finishedRef.current || signed) return;

    rhythmAudio.playBeatSound(2);
    const next = counted + amount;

    if (next > TARGET_VOTES) {
      if (isPakarKira && !usedShield) {
        setUsedShield(true);
        rhythmAudio.playBeatSound(4);
        setShieldNotice(
          t(
            "🧮 BAKAT PAKAR KIRA: Lebihan undi ditolak automatik!",
            "🧮 MATH WHIZ TRAIT: Excess votes discarded automatically!"
          )
        );
        setTimeout(() => setShieldNotice(null), 1500);
        return;
      }

      rhythmAudio.playSkrrtMiss();
      setFeedback(
        t(
          "LEBIH DARIPADA 112! KIRAAN BATAL, KIRA SEMULA! ❌",
          "EXCEEDED 112! TALLY VOIDED, RECOUNT! ❌"
        )
      );
      setCounted(0);
      setTimeout(() => setFeedback(null), 1000);
      return;
    }

    setCounted(next);
    if (next === TARGET_VOTES) {
      rhythmAudio.playStampSlam();
      setFeedback(
        t(
          "TALLY TEPAT 112! TEKAN METERAI BORANG 14 SEKARANG! 📜✅",
          "TALLY EXACTLY 112! PRESS SEAL BORANG 14 NOW! 📜✅"
        )
      );
    }
  }, [counted, signed, isPakarKira, usedShield, t]);

  const handleSignBorang14 = useCallback(() => {
    if (finishedRef.current || counted !== TARGET_VOTES) return;

    finishedRef.current = true;
    setSigned(true);
    rhythmAudio.playPaduSuccess();
    setTimeout(() => onComplete(true), 450);
  }, [counted, onComplete]);

  // Spacebar shortcuts: 1, 2, 3 or Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") handleAddVotes(8);
      if (e.key === "2") handleAddVotes(16);
      if (e.key === "3") handleAddVotes(32);
      if (e.code === "Space" && counted === TARGET_VOTES) {
        e.preventDefault();
        handleSignBorang14();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAddVotes, handleSignBorang14, counted]);

  const progress = Math.min(100, (counted / TARGET_VOTES) * 100);

  return (
    <div className="space-y-2 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400">{t("BORANG 14 RASMI SPR:", "OFFICIAL FORM 14 SPR:")}</span>
          <span>{t("SEKSYEN 16 AKTA 19", "SECTION 16 ACT 19")}</span>
        </div>
        <div className="font-mono font-black text-amber-300">
          {t(`JUMLAH: ${counted} / 112 KERUSI`, `TOTAL: ${counted} / 112 SEATS`)}
        </div>
      </div>

      {/* Official Form Document */}
      <div className="bg-[#fbf7eb] text-slate-900 rounded-2xl border-4 border-slate-950 p-3 comic-shadow relative flex flex-col justify-between">
        {/* Document Header */}
        <div className="border-b-2 border-slate-300 pb-1 text-left flex justify-between items-center text-[9px] font-mono font-bold">
          <span className="text-red-700 uppercase">
            {t(
              "PENYATA PENGUNDIAN SELEPAS PENGIRAAN UNDI • BORANG 14 SPR",
              "STATEMENT OF POLL AFTER COUNTING • FORM 14 SPR"
            )}
          </span>
          <span className="bg-amber-200 px-1.5 py-0.2 rounded border border-slate-800">
            {t("BORANG RASMI", "OFFICIAL FORM")}
          </span>
        </div>

        {/* Counting Progress Meter */}
        <div className="my-2 space-y-1">
          <div className="flex justify-between text-xs font-mono font-black">
            <span className="text-slate-700">{t("TALLY UNDI KESELURUHAN:", "TOTAL BALLOT TALLY:")}</span>
            <span className={counted === 112 ? "text-emerald-700 text-sm font-black" : "text-amber-700"}>
              {counted} / 112 {counted === 112 ? t("★ CUKUP JUMLAH! ★", "★ SUFFICIENT MAJORITY! ★") : ""}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-300 rounded-full overflow-hidden p-0.5 border border-slate-600">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                counted === 112 ? "bg-emerald-500 animate-pulse" : "bg-gradient-to-r from-blue-500 to-amber-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* PACA & Clerk Signatures Zone */}
        <div className="grid grid-cols-2 gap-2 my-1 text-left text-[9px] font-mono border-t border-slate-300 pt-1.5">
          <div className="bg-slate-100 p-1.5 rounded border border-slate-300">
            <span className="text-slate-500 block">{t("KETUA TEMPAT MENGUNDI (KTM):", "PRESIDING OFFICER (KTM):")}</span>
            <span className="font-black text-slate-800">{t("EN. AHMAD (PEGAWAI SPR) ✍️", "EN. AHMAD (SPR OFFICER) ✍️")}</span>
          </div>
          <div className="bg-slate-100 p-1.5 rounded border border-slate-300">
            <span className="text-slate-500 block">{t("WAKIL CALON (PACA):", "CANDIDATE AGENT (PACA):")}</span>
            <span className="font-black text-slate-800">
              {signed ? t("DITANDATANGANI & DIMETERAI ✅", "SIGNED & SEALED ✅") : t("MENUNGGU TALLY...", "AWAITING TALLY...")}
            </span>
          </div>
        </div>

        {/* Feedback / Alert */}
        {feedback && (
          <div className="text-[10px] font-black text-center py-1 px-2 rounded-lg bg-amber-200 border border-slate-800 text-slate-950 my-1 animate-fade-in">
            {feedback}
          </div>
        )}

        {shieldNotice && (
          <div className="text-[10px] font-black text-center py-1 px-2 rounded-lg bg-blue-200 border border-blue-800 text-blue-950 my-1">
            {shieldNotice}
          </div>
        )}

        <div className="text-[8px] font-mono text-slate-500 text-center">
          {t(
            "IKAT UNDI TEPAT KE 112 • TEKAN SPACE/BUTANG UNTUK METERAI BORANG 14",
            "BUNDLE VOTES EXACTLY TO 112 • PRESS SPACE/BUTTON TO SEAL BORANG 14"
          )}
        </div>
      </div>

      {/* Controls */}
      {counted === TARGET_VOTES ? (
        <button
          type="button"
          onClick={handleSignBorang14}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-900 comic-shadow uppercase transition cursor-pointer flex flex-col items-center justify-center animate-bounce"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {t("METERAI & TANDATANGAN BORANG 14! ✍️ (SPACEBAR)", "SEAL & SIGN BORANG 14! ✍️ (SPACEBAR)")}
          </span>
          <span className="text-[10px] text-slate-900 font-mono font-normal">
            {t("[Meterai secara rasmi Borang 14 bersama KTM SPR]", "[Officially seal and sign Borang 14 with SPR KTM]")}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleAddVotes(8)}
            className="py-3 rounded-xl border-3 border-slate-950 comic-shadow font-mono font-black text-xs transition cursor-pointer active:scale-95 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-500 text-white"
          >
            <span>{t("+8 UNDI", "+8 VOTES")}</span>
            <span className="text-[8px] opacity-80">({t("Ikat Kecil", "Small")})</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddVotes(16)}
            className="py-3 rounded-xl border-3 border-slate-950 comic-shadow font-mono font-black text-xs transition cursor-pointer active:scale-95 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-500 text-white"
          >
            <span>{t("+16 UNDI", "+16 VOTES")}</span>
            <span className="text-[8px] opacity-80">({t("Ikat Sedang", "Medium")})</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddVotes(32)}
            className="py-3 rounded-xl border-3 border-slate-950 comic-shadow font-mono font-black text-xs transition cursor-pointer active:scale-95 flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <span>{t("+32 UNDI", "+32 VOTES")}</span>
            <span className="text-[8px] opacity-80">({t("Ikat Besar", "Large")})</span>
          </button>
        </div>
      )}
    </div>
  );
}
