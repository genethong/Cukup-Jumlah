import { useState } from "react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface BayarDepositProps {
  onComplete: (success: boolean) => void;
  isPakarKira?: boolean;
}

interface FeeStage {
  id: "calon" | "kempen";
  titleMs: string;
  titleEn: string;
  subtextMs: string;
  subtextEn: string;
  lawRefMs: string;
  lawRefEn: string;
  target: number;
}

const STAGES: FeeStage[] = [
  {
    id: "calon",
    titleMs: "SAMPUL 1: DEPOSIT STATUTORI CALON PARLIMEN",
    titleEn: "ENVELOPE 1: CANDIDATE STATUTORY DEPOSIT",
    subtextMs: "Kira tepat RM10,000 wang tunai untuk layak bertanding!",
    subtextEn: "Count exactly RM10,000 in cash bundles to qualify for the ballot!",
    lawRefMs: "Peraturan 8, Peraturan Pilihan Raya (Penjalanan Pilihan Raya) 1981",
    lawRefEn: "Regulation 8, Elections (Conduct of Elections) Regs 1981",
    target: 10000,
  },
  {
    id: "kempen",
    titleMs: "SAMPUL 2: DEPOSIT BAHAN KEMPEN & PERMIT BENDERA",
    titleEn: "ENVELOPE 2: CAMPAIGN MATERIALS PERMIT DEPOSIT",
    subtextMs: "Kira tepat RM5,000 untuk permit bendera & poster pilihan raya!",
    subtextEn: "Count exactly RM5,000 for campaign posters and party flag permits!",
    lawRefMs: "Seksyen 24B, Akta Kesalahan Pilihan Raya 1954",
    lawRefEn: "Section 24B, Election Offences Act 1954",
    target: 5000,
  },
];

export function BayarDepositGame({ onComplete, isPakarKira = false }: BayarDepositProps) {
  const { t } = useLanguage();
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [totalCounted, setTotalCounted] = useState(0);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [usedShield, setUsedShield] = useState(false);
  const [envelopeStamped, setEnvelopeStamped] = useState(false);

  const stage = STAGES[currentStageIdx];
  const target = stage.target;

  const handleAddMoney = (amount: number) => {
    if (envelopeStamped) return;
    const next = totalCounted + amount;

    // Pakar Kira Shield: First time overcounting, save the player!
    if (isPakarKira && next > target && !usedShield) {
      setUsedShield(true);
      rhythmAudio.playBeatSound(4);
      setShieldNotice(
        t(
          "🧮 PAKAR KIRA: Lebihan duit ditolak automatik!",
          "🧮 MATH WHIZ: Excess cash deducted automatically!"
        )
      );
      setTimeout(() => setShieldNotice(null), 1800);
      return;
    }

    if (next === target) {
      rhythmAudio.playStampSlam();
      setTotalCounted(next);
      setEnvelopeStamped(true);

      setTimeout(() => {
        if (currentStageIdx + 1 < STAGES.length) {
          // Slide in next envelope!
          rhythmAudio.playBeatSound(1);
          setCurrentStageIdx(currentStageIdx + 1);
          setTotalCounted(0);
          setEnvelopeStamped(false);
        } else {
          // Completed both fee packets!
          rhythmAudio.playPaduSuccess();
          onComplete(true);
        }
      }, 700);
    } else if (next > target) {
      rhythmAudio.playSkrrtMiss();
      setTotalCounted(next);
      setTimeout(() => onComplete(false), 500);
    } else {
      rhythmAudio.playBeatSound(2);
      setTotalCounted(next);
    }
  };

  const handleDistractionClick = () => {
    rhythmAudio.playSkrrtMiss();
    setShieldNotice(
      t(
        "⚠️ RESIT MAMAK DITOLAK! Jangan masukkan resit kedai makan!",
        "⚠️ MAMAK RECEIPT REJECTED! Do not mix restaurant receipts!"
      )
    );
    setTimeout(() => setShieldNotice(null), 1500);
  };

  const handleReset = () => {
    if (envelopeStamped) return;
    setTotalCounted(0);
  };

  const progressPercent = Math.min(100, (totalCounted / target) * 100);

  return (
    <div className="flex flex-col items-center justify-between p-1.5 text-center w-full relative select-none">
      {/* Kaunter Pegawai SPR Dialog */}
      <div className="w-full bg-amber-200 border-2 border-slate-900 rounded-xl px-3 py-1.5 mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">
            {t("PEGAWAI PENGURUS SPR • KAUNTER DEPOSIT:", "RETURNING OFFICER • DEPOSIT DESK:")}
          </span>
          <span className="text-xs font-black text-slate-950">
            {t(
              "\"Selesaikan 2 sampul deposit tunai rasmi. Kurang tolak, terlebih pun tolak!\"",
              "\"Count both official cash deposit envelopes. Under or over by RM1 and you are rejected!\""
            )}
          </span>
        </div>
        <span className="text-2xl">👮🏽‍♂️</span>
      </div>

      {/* Cash Counting Tray (Desk View) */}
      <div className="w-full bg-[#fdf8ee] p-3.5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-2 relative text-center overflow-hidden">
        {/* Envelope Stage Stamp */}
        {envelopeStamped && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/15 pointer-events-none animate-in zoom-in-75 duration-100">
            <div className="border-4 border-emerald-700 bg-emerald-600 text-white px-4 py-1.5 rounded-2xl font-black text-lg uppercase tracking-wider rotate-[-8deg] shadow-2xl">
              {t(`SAMPUL ${currentStageIdx + 1} SELESAI! ✅`, `ENVELOPE ${currentStageIdx + 1} COMPLETE! ✅`)}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-1.5">
          <span className="text-[10px] font-mono font-black text-amber-800 uppercase">
            {t(stage.titleMs, stage.titleEn)}
          </span>
          <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
            {t(`SAMPUL ${currentStageIdx + 1} / 2`, `ENVELOPE ${currentStageIdx + 1} / 2`)}
          </span>
        </div>

        <div className="text-3xl font-mono font-black tracking-tight text-slate-950 mb-1">
          RM {totalCounted.toLocaleString()}
          <span className="text-xs font-bold text-slate-500 font-sans ml-2">
            / RM {target.toLocaleString()}
          </span>
        </div>

        {/* Pakar Kira Helper & Shield Notice */}
        {shieldNotice && (
          <div className="bg-amber-100 border-2 border-amber-500 text-amber-950 text-[10px] font-mono font-black rounded-lg py-0.5 px-2 mb-1.5 animate-bounce">
            {shieldNotice}
          </div>
        )}

        {isPakarKira && totalCounted < target && !shieldNotice && (
          <div className="bg-blue-50 border border-blue-400 text-blue-900 text-[10px] font-mono font-bold rounded-lg py-0.5 px-2 mb-1.5 flex items-center justify-between">
            <span>{t("🧮 BAKAT PAKAR KIRA:", "🧮 MATH WHIZ TRAIT:")}</span>
            <span className="font-black text-blue-950">
              {t("Baki Diperlukan:", "Remaining:")} +RM {(target - totalCounted).toLocaleString()}
            </span>
          </div>
        )}

        {/* Meter Bar */}
        <div className="w-full bg-slate-300 rounded-full h-3 overflow-hidden border-2 border-slate-900 mb-1.5">
          <div
            className={`h-full transition-all duration-150 ${
              totalCounted > target
                ? "bg-red-600"
                : totalCounted === target
                  ? "bg-emerald-500"
                  : "bg-amber-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="text-[9px] font-mono text-slate-500 italic">
          * {t(stage.lawRefMs, stage.lawRefEn)}
        </div>
      </div>

      {/* Cash Bundles & Distraction Grid */}
      <div className="grid grid-cols-4 gap-1.5 w-full">
        <button
          type="button"
          onClick={() => handleAddMoney(500)}
          className="p-2 bg-rose-500 hover:bg-rose-400 active:scale-95 rounded-xl border-3 border-slate-950 text-white font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-base">💵</span>
          <span className="text-[8px] font-mono uppercase text-rose-100">{t("MERAH", "RED")}</span>
          <span className="text-[11px] font-black">+RM 500</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddMoney(1000)}
          className="p-2 bg-blue-500 hover:bg-blue-400 active:scale-95 rounded-xl border-3 border-slate-950 text-slate-950 font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-base">💵</span>
          <span className="text-[8px] font-mono uppercase text-blue-950">{t("BIRU", "BLUE")}</span>
          <span className="text-[11px] font-black">+RM 1,000</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddMoney(2000)}
          className="p-2 bg-purple-400 hover:bg-purple-300 active:scale-95 rounded-xl border-3 border-slate-950 text-slate-950 font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-base">💵</span>
          <span className="text-[8px] font-mono uppercase text-purple-950">{t("UNGU", "PURPLE")}</span>
          <span className="text-[11px] font-black">+RM 2,000</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddMoney(5000)}
          className="p-2 bg-emerald-400 hover:bg-emerald-300 active:scale-95 rounded-xl border-3 border-slate-950 text-slate-950 font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-base">💰</span>
          <span className="text-[8px] font-mono uppercase text-emerald-950">{t("HIJAU", "GREEN")}</span>
          <span className="text-[11px] font-black">+RM 5,000</span>
        </button>
      </div>

      {/* Distraction Note & Reset Button */}
      <div className="flex items-center justify-between w-full mt-2 px-1">
        <button
          type="button"
          onClick={handleDistractionClick}
          className="text-[9px] font-mono font-bold text-slate-500 bg-slate-200 hover:bg-rose-100 px-2 py-0.5 rounded border border-dashed border-slate-400 cursor-pointer"
        >
          {t("🧾 Resit Kari Kedai Mamak RM12 (Abaikan!)", "🧾 Mamak Stall Curry Receipt RM12 (Ignore!)")}
        </button>

        {totalCounted > 0 && totalCounted !== target && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] text-slate-600 hover:text-slate-900 underline font-bold cursor-pointer"
          >
            {t("↺ Kira Semula Sampul", "↺ Reset Envelope Count")}
          </button>
        )}
      </div>
    </div>
  );
}
