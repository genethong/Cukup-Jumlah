import { useState } from "react";
import { Banknote } from "lucide-react";

interface BayarDepositProps {
  onComplete: (success: boolean) => void;
}

export function BayarDepositGame({ onComplete }: BayarDepositProps) {
  const [totalCounted, setTotalCounted] = useState(0);
  const target = 10000;

  const handleAddMoney = (amount: number) => {
    const next = totalCounted + amount;
    setTotalCounted(next);

    if (next === target) {
      setTimeout(() => onComplete(true), 350);
    } else if (next > target) {
      setTimeout(() => onComplete(false), 350);
    }
  };

  const handleReset = () => {
    setTotalCounted(0);
  };

  const progressPercent = Math.min(100, (totalCounted / target) * 100);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Kaunter Pegawai SPR Dialog */}
      <div className="w-full bg-amber-200 border-2 border-slate-900 rounded-xl px-3 py-1.5 mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono font-bold text-slate-700 uppercase block">PEGAWAI PENGURUS SPR:</span>
          <span className="text-xs font-black text-slate-950">"Kira tepat RM10,000 wang tunai! Kurang tolak, lebih pun tolak!"</span>
        </div>
        <span className="text-2xl">👮🏽‍♂️</span>
      </div>

      {/* Cash Counting Tray (Desk View) */}
      <div className="w-full bg-[#fdf8ee] p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3 relative text-center">
        <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
          JUMLAH ATAS MEJA SPR
        </div>

        <div className="text-3xl md:text-4xl font-mono font-black tracking-tight text-slate-950 mb-2">
          RM {totalCounted.toLocaleString()}
          <span className="text-xs font-bold text-slate-500 font-sans ml-2">/ RM 10,000</span>
        </div>

        {/* Meter Bar */}
        <div className="w-full bg-slate-300 rounded-full h-3.5 overflow-hidden border-2 border-slate-900 mb-2">
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

        {totalCounted > target && (
          <div className="bg-red-100 border border-red-500 text-red-800 text-[10px] font-black rounded-lg py-1 px-2 uppercase animate-bounce">
            ⚠️ TERLEBIH BAYAR! SPR REJECT WANG LEBIHAN!
          </div>
        )}

        {totalCounted === target && (
          <div className="bg-emerald-100 border border-emerald-500 text-emerald-800 text-[10px] font-black rounded-lg py-1 px-2 uppercase animate-bounce">
            ✅ TEPAT RM10,000! RESIT DEPOSIT DIKELUARKAN!
          </div>
        )}
      </div>

      {/* Cash Bundles Tapping Grid */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={() => handleAddMoney(1000)}
          className="p-3 bg-blue-500 hover:bg-blue-400 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-xl border-3 border-slate-900 text-slate-950 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-lg">💵</span>
          <span className="text-[9px] font-mono font-bold uppercase text-blue-950">IKAT KECIL</span>
          <span className="text-xs font-black">+RM 1,000</span>
        </button>

        <button
          onClick={() => handleAddMoney(2000)}
          className="p-3 bg-purple-400 hover:bg-purple-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-xl border-3 border-slate-900 text-slate-950 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-lg">💵</span>
          <span className="text-[9px] font-mono font-bold uppercase text-purple-950">IKAT SEDANG</span>
          <span className="text-xs font-black">+RM 2,000</span>
        </button>

        <button
          onClick={() => handleAddMoney(5000)}
          className="p-3 bg-emerald-400 hover:bg-emerald-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none rounded-xl border-3 border-slate-900 text-slate-950 font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex flex-col items-center"
        >
          <span className="text-lg">💰</span>
          <span className="text-[9px] font-mono font-bold uppercase text-emerald-950">IKAT BESAR</span>
          <span className="text-xs font-black">+RM 5,000</span>
        </button>
      </div>

      {totalCounted > 0 && totalCounted !== target && (
        <button
          onClick={handleReset}
          className="mt-2 text-[10px] text-slate-600 hover:text-slate-900 underline font-bold"
        >
          ↺ Reset Kiraan Semula
        </button>
      )}
    </div>
  );
}
