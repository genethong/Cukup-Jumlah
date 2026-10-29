import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface SemakBorangProps {
  onComplete: (success: boolean) => void;
}

interface ApplicationCase {
  id: number;
  candidateName: string;
  age: number;
  isBankrupt: boolean;
  fineAmount: number;
  prisonYears: number;
  isEligible: boolean;
  reason: string;
}

const DOSSIER_STACK: ApplicationCase[] = [
  {
    id: 1,
    candidateName: "Ali Jambul (TikToker)",
    age: 17,
    isBankrupt: false,
    prisonYears: 0,
    fineAmount: 0,
    isEligible: false,
    reason: "Umur baru 17 tahun! Perkara 47 syaratkan minima 18 tahun.",
  },
  {
    id: 2,
    candidateName: "Datin Salmah (Usahawan)",
    age: 46,
    isBankrupt: true,
    prisonYears: 0,
    fineAmount: 0,
    isEligible: false,
    reason: "Status Muflis! Hilang kelayakan bawah Perkara 48(1)(b).",
  },
  {
    id: 3,
    candidateName: "Cikgu Razak (Aktivis Komuniti)",
    age: 34,
    isBankrupt: false,
    prisonYears: 0,
    fineAmount: 0,
    isEligible: true,
    reason: "Warganegara layak, cukup umur & tiada sabitan jenayah!",
  },
  {
    id: 4,
    candidateName: "Daud Komisyen (Orang Tengah)",
    age: 52,
    isBankrupt: false,
    prisonYears: 0,
    fineAmount: 3500,
    isEligible: false,
    reason: "Didenda ≥ RM2,000 atas sabitan jenayah (Perkara 48(1)(e)).",
  },
  {
    id: 5,
    candidateName: "Nurul Aini (Graduan Belia)",
    age: 22,
    isBankrupt: false,
    prisonYears: 0,
    fineAmount: 0,
    isEligible: true,
    reason: "Syarat Perlembagaan dipenuhi sepenuhnya!",
  },
];

export function SemakBorangGame({ onComplete }: SemakBorangProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [stampDecision, setStampDecision] = useState<"lulus" | "tolak" | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  const finishedRef = useRef(false);
  const currentCase = DOSSIER_STACK[currentIndex] || DOSSIER_STACK[0];

  const handleDecision = (playerChoseApprove: boolean) => {
    if (stampDecision !== null || finishedRef.current) return;

    const correct = playerChoseApprove === currentCase.isEligible;
    setStampDecision(playerChoseApprove ? "lulus" : "tolak");

    if (correct) {
      rhythmAudio.playStampSlam();
      setScore((s) => s + 1);
      setFeedback({ isCorrect: true, text: `${t("TEPAT!", "CORRECT!")} ${currentCase.reason}` });
    } else {
      rhythmAudio.playSkrrtMiss();
      setFeedback({ isCorrect: false, text: `${t("SALAH!", "WRONG!")} ${currentCase.reason}` });
    }

    setTimeout(() => {
      setStampDecision(null);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= DOSSIER_STACK.length) {
        finishedRef.current = true;
        // Need at least 4 out of 5 correct to pass
        const finalScore = score + (correct ? 1 : 0);
        const pass = finalScore >= 4;
        if (pass) {
          rhythmAudio.playPaduSuccess();
        } else {
          rhythmAudio.playSkrrtMiss();
        }
        setTimeout(() => onComplete(pass), 400);
      } else {
        setCurrentIndex(nextIndex);
        setFeedback(null);
      }
    }, 650);
  };

  // Keyboard support: Left/A = Reject, Right/D = Approve
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stampDecision !== null || finishedRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        handleDecision(false);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        handleDecision(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, stampDecision]);

  return (
    <div className="flex flex-col items-center justify-between p-1 text-center w-full relative select-none">
      {/* Top Counter Bar */}
      <div className="w-full flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono mb-2">
        <span className="text-amber-400 font-bold">
          {t("📑 MEJA SARINGAN KELAYAKAN SPR", "📑 SPR NOMINATION SCREENING DESK")}
        </span>
        <span className="text-emerald-400 font-black">
          {t("PEMOHON", "APPLICANT")}: {currentIndex + 1} / {DOSSIER_STACK.length}
        </span>
      </div>

      {/* Manila Dossier Card */}
      <div className="w-full bg-[#fdf8ee] text-slate-900 p-3.5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden transition-all">
        {/* Rubber Stamp Slam Overlay */}
        {stampDecision && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/15 pointer-events-none animate-in zoom-in-75 duration-100">
            <div
              className={`border-4 px-4 py-2 rounded-2xl font-black text-xl uppercase tracking-wider rotate-[-10deg] shadow-2xl ${
                stampDecision === "lulus"
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-red-700 bg-red-600 text-white"
              }`}
            >
              {stampDecision === "lulus"
                ? t("DILULUSKAN! ✅", "APPROVED! ✅")
                : t("DITOLAK! ❌", "REJECTED! ❌")}
            </div>
          </div>
        )}

        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
          <span className="text-[9px] font-mono font-bold text-red-700 uppercase">
            SURUHANJAYA PILIHAN RAYA (SPR)
          </span>
          <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow">
            BORANG 4 &amp; 5 (PARLIMEN)
          </span>
        </div>

        <h3 className="font-black text-sm text-slate-900 mb-1.5">
          {t("PENGISYTIHARAN KELAYAKAN CALON", "CANDIDATE ELIGIBILITY DECLARATION")} #{currentCase.id}
        </h3>

        {/* Data Fields Grid */}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">{t("NAMA CALON:", "CANDIDATE NAME:")}</span>
            <span className="font-black text-slate-900">{currentCase.candidateName}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">{t("UMUR PEMOHON:", "APPLICANT AGE:")}</span>
            <span className={`font-black ${currentCase.age < 18 ? "text-red-600 underline" : "text-slate-900"}`}>
              {currentCase.age} {t("TAHUN", "YEARS OLD")} {currentCase.age < 18 && "⚠️"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">{t("STATUS BANKRAP:", "BANKRUPTCY STATUS:")}</span>
            <span className={`font-black ${currentCase.isBankrupt ? "text-red-600 bg-red-100 px-1 rounded" : "text-emerald-700"}`}>
              {currentCase.isBankrupt
                ? t("BANKRAP / MUFLIS ⚠️", "BANKRUPT ⚠️")
                : t("BEBAS BANKRAP", "SOLVENT / CLEAR")}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">{t("SABITAN MAHKAMAH:", "COURT CONVICTIONS:")}</span>
            <span className={`font-black ${currentCase.fineAmount >= 2000 ? "text-red-600 bg-red-100 px-1 rounded" : "text-slate-900"}`}>
              {currentCase.fineAmount > 0
                ? `${t("DENDA", "FINE")} RM${currentCase.fineAmount.toLocaleString()} ⚠️`
                : t("TIADA REKOD", "NO RECORD")}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[9px] text-slate-500 font-mono italic">
          * Perkara 47 &amp; 48: Warganegara ≥18 tahun, tidak bankrap, tiada sabitan jenayah berat (denda ≥RM2,000 / penjara ≥1 tahun).
        </div>
      </div>

      {/* Immediate Feedback Banner */}
      {feedback && (
        <div
          className={`w-full mt-2 py-1 px-2.5 rounded-xl text-[10px] font-mono font-bold border ${
            feedback.isCorrect
              ? "bg-emerald-100 border-emerald-500 text-emerald-900"
              : "bg-rose-100 border-rose-500 text-rose-900"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Action Buttons: TOLAK vs LULUSKAN */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2.5">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          disabled={stampDecision !== null}
          className="py-3 px-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs md:text-sm rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-1.5 cursor-pointer uppercase disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> {t("TOLAK BORANG (A)", "REJECT FORM (A)")}
        </button>

        <button
          type="button"
          onClick={() => handleDecision(true)}
          disabled={stampDecision !== null}
          className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs md:text-sm rounded-2xl border-4 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-1.5 cursor-pointer uppercase disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" /> {t("LULUSKAN (D)", "APPROVE (D)")}
        </button>
      </div>
    </div>
  );
}
