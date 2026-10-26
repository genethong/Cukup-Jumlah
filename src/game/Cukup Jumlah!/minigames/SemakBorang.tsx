import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface SemakBorangProps {
  onComplete: (success: boolean) => void;
}

interface ApplicationCase {
  candidateName: string;
  age: number;
  isBankrupt: boolean;
  prisonSentenceYears: number;
  fineAmount: number;
  isEligible: boolean;
  reason: string;
}

const CASES: ApplicationCase[] = [
  {
    candidateName: "Ali Jambul",
    age: 17,
    isBankrupt: false,
    prisonSentenceYears: 0,
    fineAmount: 0,
    isEligible: false,
    reason: "Umur baru 17 tahun! Perkara 47 mensyaratkan minima 18 tahun.",
  },
  {
    candidateName: "Datin Salmah",
    age: 45,
    isBankrupt: true,
    prisonSentenceYears: 0,
    fineAmount: 0,
    isEligible: false,
    reason: "Status Muflis! Hilang kelayakan bawah Perkara 48(1)(b).",
  },
  {
    candidateName: "Cikgu Razak",
    age: 32,
    isBankrupt: false,
    prisonSentenceYears: 0,
    fineAmount: 0,
    isEligible: true,
    reason: "Memenuhi semua syarat kelayakan Perlembagaan Persekutuan!",
  },
  {
    candidateName: "Ah Meng Pasar",
    age: 26,
    isBankrupt: false,
    prisonSentenceYears: 0,
    fineAmount: 2500,
    isEligible: false,
    reason: "Didenda ≥ RM2,000 atas kesalahan jenayah (Perkara 48(1)(e)).",
  },
];

export function SemakBorangGame({ onComplete }: SemakBorangProps) {
  const [currentCase, setCurrentCase] = useState<ApplicationCase | null>(null);
  const [stampDecision, setStampDecision] = useState<"lulus" | "tolak" | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CASES.length);
    setCurrentCase(CASES[randomIndex]);
  }, []);

  const handleDecision = (playerChoseApprove: boolean) => {
    if (stampDecision !== null || !currentCase) return;
    const correct = playerChoseApprove === currentCase.isEligible;
    setStampDecision(playerChoseApprove ? "lulus" : "tolak");
    setIsCorrect(correct);

    setTimeout(() => {
      onComplete(correct);
    }, 650);
  };

  if (!currentCase) return null;

  return (
    <div className="flex flex-col items-center justify-between p-1 text-center w-full relative">
      
      {/* Comic Manila Dossier Folder */}
      <div className="w-full bg-[#fdf8ee] text-slate-900 p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left relative overflow-hidden">
        
        {/* Rubber Stamp Slam Overlay */}
        {stampDecision && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none">
            <div
              className={`border-4 px-4 py-1.5 rounded-2xl font-black text-xl uppercase tracking-wider rotate-[-12deg] shadow-xl ${
                stampDecision === "lulus"
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : "border-red-700 bg-red-600 text-white"
              }`}
            >
              {stampDecision === "lulus" ? "DILULUSKAN! ✅" : "DITOLAK! ❌"}
            </div>
          </div>
        )}

        {/* Header Strip */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2">
          <span className="text-[9px] font-mono font-bold text-red-700 uppercase">
            SURUHANJAYA PILIHAN RAYA (SPR)
          </span>
          <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow">
            BORANG 4A
          </span>
        </div>

        <h3 className="font-black text-base text-slate-900 mb-2">
          PENGISYTIHARAN KELAYAKAN CALON
        </h3>

        {/* Data Fields */}
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">NAMA CALON:</span>
            <span className="font-black text-slate-900">{currentCase.candidateName}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">UMUR PEMOHON:</span>
            <span className={`font-black ${currentCase.age < 18 ? "text-red-600 underline" : "text-slate-900"}`}>
              {currentCase.age} TAHUN {currentCase.age < 18 && "⚠️"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">STATUS BANKRAP:</span>
            <span className={`font-black ${currentCase.isBankrupt ? "text-red-600 bg-red-100 px-1 rounded" : "text-emerald-700"}`}>
              {currentCase.isBankrupt ? "BANKRAP / MUFLIS ⚠️" : "BEBAS BANKRAP"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-0.5">
            <span className="text-slate-500 font-bold">SABITAN MAHKAMAH:</span>
            <span className={`font-black ${currentCase.fineAmount >= 2000 ? "text-red-600 bg-red-100 px-1 rounded" : "text-slate-900"}`}>
              {currentCase.fineAmount > 0 ? `DENDA RM${currentCase.fineAmount} ⚠️` : "TIADA REKOD"}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[9px] text-slate-500 font-mono italic">
          * Perkara 47 & 48: Warganegara ≥18 tahun, tidak bankrap, tiada sabitan jenayah berat.
        </div>
      </div>

      {/* Comic Action Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full mt-3">
        <button
          onClick={() => handleDecision(false)}
          disabled={stampDecision !== null}
          className="py-3 px-3 bg-red-600 hover:bg-red-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-xs md:text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-1.5 cursor-pointer uppercase disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> REJECT (TOLAK)
        </button>

        <button
          onClick={() => handleDecision(true)}
          disabled={stampDecision !== null}
          className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-xs md:text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition flex items-center justify-center gap-1.5 cursor-pointer uppercase disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" /> LULUSKAN! ✅
        </button>
      </div>

      {isCorrect !== null && (
        <div className={`mt-2 font-mono font-bold text-xs ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
          {isCorrect ? "KEPUTUSAN TEPAT! " : "KEPUTUSAN SALAH! "}
          {currentCase.reason}
        </div>
      )}
    </div>
  );
}
