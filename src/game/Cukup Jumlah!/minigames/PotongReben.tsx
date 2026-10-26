import { useState } from "react";
import { Scissors } from "lucide-react";

interface PotongRebenProps {
  onComplete: (success: boolean) => void;
}

export function PotongRebenGame({ onComplete }: PotongRebenProps) {
  const [cut, setCut] = useState(false);

  const handleCut = () => {
    if (cut) return;
    setCut(true);
    setTimeout(() => onComplete(true), 400);
  };

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Satirical Ribbon Ceremony Banner */}
      <div className="w-full bg-red-600 border-4 border-slate-900 rounded-2xl p-2 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white text-center">
        <div className="text-[9px] font-mono tracking-wider uppercase font-bold text-yellow-300">
          ★ MAJLIS RASMI PRU ★
        </div>
        <div className="text-xs md:text-sm font-black tracking-tight uppercase leading-tight">
          PERASMIAN CAT TIANG LAMPU JALAN NO. 042!
        </div>
        <div className="text-[8px] font-mono text-red-200 mt-0.5">
          (Bajet Majlis: RM5,000 • Kos Cat Tiang: RM50)
        </div>
      </div>

      {/* Main Stage: The Ribbon Across the Lamp Post */}
      <div className="w-full h-44 bg-[#fbf5e5] p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center justify-center overflow-hidden">
        
        {/* Street Lamp Post SVG */}
        <div className="flex items-center gap-3 mb-2">
          <svg viewBox="0 0 50 60" className="w-12 h-14">
            {/* Lamp Bulb */}
            <circle cx="25" cy="18" r="10" fill="#fef08a" stroke="#0f172a" strokeWidth="2.5" />
            <path d="M 18 20 Q 25 10 32 20" stroke="#f59e0b" strokeWidth="2" fill="none" />
            {/* Pole */}
            <rect x="22" y="28" width="6" height="32" fill="#94a3b8" stroke="#0f172a" strokeWidth="2" />
            {/* Fresh Red Paint Ring */}
            <rect x="21" y="40" width="8" height="10" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
          <div className="text-left font-mono">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Projek Berimpak Tinggi</span>
            <span className="text-xs font-black text-slate-900">Cat Tiang Lampu Desa</span>
          </div>
        </div>

        {/* The Giant Ceremonial Red Ribbon */}
        <div className="w-full relative h-12 flex items-center justify-center my-1">
          {!cut ? (
            <div className="w-full h-6 bg-red-600 border-2 border-slate-900 rounded-md shadow-md flex items-center justify-between px-4 text-white text-[10px] font-black tracking-wider select-none">
              <span>🎗️</span>
              <span>★ REBEN RASMI VIP ★</span>
              <span>🎗️</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between px-3 relative animate-bounce">
              <div className="w-5/12 h-6 bg-red-600 border-2 border-slate-900 rotate-[-15deg] rounded shadow flex items-center justify-center text-white text-[9px] font-bold">
                REBEN
              </div>
              {/* Comic Action Starburst */}
              <div className="bg-yellow-300 border-2 border-slate-900 font-black text-xs px-2 py-0.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-slate-950 scale-125 z-10">
                GUNTING! ✂️
              </div>
              <div className="w-5/12 h-6 bg-red-600 border-2 border-slate-900 rotate-[15deg] rounded shadow flex items-center justify-center text-white text-[9px] font-bold">
                PUTUS!
              </div>
            </div>
          )}
        </div>

        {/* Photographers Camera Flashes */}
        <div className="text-[9px] font-bold text-slate-500 mt-1 italic">
          "Pegang gunting emas, senyum sampai telinga!"
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleCut}
        disabled={cut}
        className="w-full mt-3 py-3.5 bg-red-600 hover:bg-red-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
      >
        <Scissors className="w-5 h-5" /> GUNTING REBEN SEKARANG! ✂️
      </button>
    </div>
  );
}
