import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Check, X } from "lucide-react";
import { useLanguage } from "../languageContext";

interface TapisUndiRosakProps {
  isPakarKira?: boolean;
  onComplete: (success: boolean) => void;
}

interface BallotPaper {
  id: number;
  boxA: string;
  boxB: string;
  note: string | null;
  isValid: boolean;
  legalReason: string;
}

const BALLOTS: BallotPaper[] = [
  {
    id: 1,
    boxA: "✖️",
    boxB: "",
    note: null,
    isValid: true,
    legalReason: "Tanda X jelas dalam satu petak calon (Peraturan 25)",
  },
  {
    id: 2,
    boxA: "✖️",
    boxB: "✖️",
    note: null,
    isValid: false,
    legalReason: "Pangkah dua calon serentak - Undi Ragu/Rosak!",
  },
  {
    id: 3,
    boxA: "",
    boxB: "✔️",
    note: null,
    isValid: true,
    legalReason: "Tanda 'Tick' dibenarkan jika niat pengundi jelas",
  },
  {
    id: 4,
    boxA: "🍈",
    boxB: "",
    note: "Conteng Gambar Durian Musang King!",
    isValid: false,
    legalReason: "Contengan gambar asing merosakkan kertas undi",
  },
  {
    id: 5,
    boxA: "",
    boxB: "",
    note: "Kertas Putih Kosong Tanpa Tanda",
    isValid: false,
    legalReason: "Undi tidak bertanda langsung (Undi Rosak)",
  },
  {
    id: 6,
    boxA: "✖️",
    boxB: "",
    note: "Nota: 'Sumpah undi YB! Tolong baiki jalan!'",
    isValid: false,
    legalReason: "Tulisan teks membolehkan identiti pengundi dicam",
  },
  {
    id: 7,
    boxA: "",
    boxB: "✖️",
    note: null,
    isValid: true,
    legalReason: "Tanda X kemas dalam petak calon kedua",
  },
];

export function TapisUndiRosakGame({ isPakarKira = false, onComplete }: TapisUndiRosakProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakeShieldUsed, setMistakeShieldUsed] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "hit" | "miss"; text: string } | null>(null);
  const finishedRef = useRef(false);

  const curBallot = BALLOTS[currentIndex] || BALLOTS[0];

  const handleDecision = useCallback((declareValid: boolean) => {
    if (finishedRef.current) return;

    const isCorrect = declareValid === curBallot.isValid;

    if (isCorrect) {
      rhythmAudio.playStampSlam();
      const nextIdx = currentIndex + 1;
      setFeedback({ type: "hit", text: `${t("TEPAT!", "CORRECT!")} ${curBallot.legalReason} ✅` });

      if (nextIdx >= BALLOTS.length) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      } else {
        setTimeout(() => {
          setCurrentIndex(nextIdx);
          setFeedback(null);
        }, 400);
      }
    } else {
      if (isPakarKira && !mistakeShieldUsed) {
        setMistakeShieldUsed(true);
        rhythmAudio.playBeatSound(4);
        setFeedback({
          type: "miss",
          text: t(
            "🧮 BAKAT PAKAR KIRA: Kesilapan tapisan diselamatkan! Teruskan!",
            "🧮 MATH WHIZ TRAIT: Saved 1 sorting mistake! Continue!"
          ),
        });
        setTimeout(() => setFeedback(null), 1200);
        return;
      }

      rhythmAudio.playSkrrtMiss();
      setFeedback({ type: "miss", text: `${t("SALAH!", "WRONG!")} ${curBallot.legalReason} ❌` });
      setTimeout(() => setFeedback(null), 900);
    }
  }, [currentIndex, curBallot, isPakarKira, mistakeShieldUsed, onComplete, t]);

  // Keyboard controls: A = Rosak, D = Sah
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || e.key === "ArrowLeft") {
        e.preventDefault();
        handleDecision(false);
      } else if (k === "d" || e.key === "ArrowRight") {
        e.preventDefault();
        handleDecision(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDecision]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Progress */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("SEMAKAN KERTAS UNDI:", "BALLOT AUDIT:")}</span>
          <span>{t(`${currentIndex} / ${BALLOTS.length} DISEMAK`, `${currentIndex} / ${BALLOTS.length} AUDITED`)}</span>
        </div>
        <div className="flex items-center gap-1">
          {BALLOTS.map((_, idx) => (
            <span
              key={idx}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border ${
                idx < currentIndex
                  ? "bg-emerald-500 border-emerald-300 text-slate-950"
                  : idx === currentIndex
                    ? "bg-amber-400 border-amber-200 text-slate-950 animate-pulse"
                    : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
            >
              {idx < currentIndex ? "✓" : idx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Official Ballot Inspection Card */}
      <div className="bg-[#fdfaf2] text-slate-900 rounded-2xl border-4 border-slate-950 p-3 comic-shadow relative overflow-hidden flex flex-col justify-between">
        {/* Ballot Paper Header */}
        <div className="border-b-2 border-slate-300 pb-1 text-left flex justify-between items-center text-[9px] font-mono font-bold">
          <span className="text-red-700 uppercase">
            {t("SARINGAN KERTAS UNDI PARLIMEN • PERATURAN 25 SPR", "PARLIAMENTARY BALLOT AUDIT • REGULATION 25")}
          </span>
          <span className="bg-slate-200 px-1.5 py-0.2 rounded text-slate-800 border border-slate-400">
            {t(`CONTOH #${currentIndex + 1}`, `SAMPLE #${currentIndex + 1}`)}
          </span>
        </div>

        {/* Ballot Boxes */}
        <div className="space-y-2 my-2 text-left">
          {/* Candidate 1 */}
          <div className="border-2 border-slate-900 rounded-lg p-1.5 bg-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-black text-slate-900">{t("1. CALON A", "1. CANDIDATE A")}</div>
              <div className="text-[9px] text-slate-500">{t("Parti: Nasi Lemak 🍛", "Party: Nasi Lemak 🍛")}</div>
            </div>
            <div className="w-12 h-10 border-2 border-slate-900 bg-amber-50 rounded flex items-center justify-center text-xl font-black">
              {curBallot.boxA}
            </div>
          </div>

          {/* Candidate 2 */}
          <div className="border-2 border-slate-900 rounded-lg p-1.5 bg-white flex items-center justify-between shadow-xs">
            <div>
              <div className="text-xs font-black text-slate-900">{t("2. CALON B", "2. CANDIDATE B")}</div>
              <div className="text-[9px] text-slate-500">{t("Parti: Teh Tarik ☕", "Party: Teh Tarik ☕")}</div>
            </div>
            <div className="w-12 h-10 border-2 border-slate-900 bg-amber-50 rounded flex items-center justify-center text-xl font-black">
              {curBallot.boxB}
            </div>
          </div>
        </div>

        {/* Voter Scribble / Defect Note if any */}
        {curBallot.note && (
          <div className="bg-amber-100 border border-amber-600 rounded-lg p-1 text-[10px] font-mono text-amber-900 mb-1">
            {t("⚠️ TANDAAN KHAS / ANOMALI:", "⚠️ SPECIAL MARKING / ANOMALY:")} <span className="font-bold">{curBallot.note}</span>
          </div>
        )}

        {/* Feedback alert banner */}
        {feedback && (
          <div
            className={`px-2.5 py-1 rounded-xl border-2 border-slate-950 font-black text-[10px] shadow text-center my-1 ${
              feedback.type === "hit" ? "bg-emerald-400 text-slate-950" : "bg-rose-500 text-white animate-shake"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="text-[8px] font-mono text-slate-500 text-center">
          {t(
            "TEKAN [A] UNTUK TOLAK UNDI ROSAK • TEKAN [D] UNTUK TERIMA UNDI SAH",
            "PRESS [A] TO REJECT SPOILT VOTE • PRESS [D] TO ACCEPT VALID VOTE"
          )}
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          className="py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs rounded-xl border-3 border-slate-950 comic-shadow uppercase transition cursor-pointer flex flex-col items-center justify-center gap-0.5"
        >
          <span className="flex items-center gap-1.5">
            <X className="w-4 h-4" /> {t("❌ UNDI ROSAK! (A)", "❌ SPOILT VOTE! (A)")}
          </span>
          <span className="text-[9px] text-rose-200 font-mono font-normal">
            {t("[Tolak kertas undi rosak / ragu]", "[Reject spoilt / doubtful vote]")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDecision(true)}
          className="py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl border-3 border-slate-950 comic-shadow uppercase transition cursor-pointer flex flex-col items-center justify-center gap-0.5"
        >
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {t("✅ UNDI SAH! (D)", "✅ VALID VOTE! (D)")}
          </span>
          <span className="text-[9px] text-emerald-200 font-mono font-normal">
            {t("[Terima undi sah Peraturan 25]", "[Accept valid vote per Reg 25]")}
          </span>
        </button>
      </div>
    </div>
  );
}
