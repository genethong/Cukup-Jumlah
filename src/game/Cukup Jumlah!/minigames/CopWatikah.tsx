import { useEffect, useRef, useState } from "react";
import { Stamp } from "lucide-react";
import type { PartyId } from "../types";
import { PARTIES } from "../types";

interface CopWatikahProps {
  partyId: PartyId;
  onComplete: (success: boolean) => void;
}

export function CopWatikahGame({ partyId, onComplete }: CopWatikahProps) {
  const [stamped, setStamped] = useState(false);
  const [stampSuccess, setStampSuccess] = useState(false);
  const [offsetPos, setOffsetPos] = useState({ x: 50 }); // moving target percentage
  const containerRef = useRef<HTMLDivElement>(null);

  const party = PARTIES[partyId];

  // Moving target circle to align
  useEffect(() => {
    let forward = true;
    const interval = setInterval(() => {
      setOffsetPos((prev) => {
        let nextX = prev.x + (forward ? 5 : -5);
        if (nextX > 75) forward = false;
        if (nextX < 25) forward = true;
        return { x: nextX };
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  const handleStamp = () => {
    if (stamped) return;
    setStamped(true);

    // Accurate if within 36% to 64%
    const isAccurate = Math.abs(offsetPos.x - 50) <= 14;
    setStampSuccess(isAccurate);

    setTimeout(() => {
      onComplete(isAccurate);
    }, 450);
  };

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Official Legal Document (Watikah Pelantikan) */}
      <div
        ref={containerRef}
        className="w-full h-52 bg-[#fdf8ee] text-slate-900 p-4 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-300 pb-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-red-700 uppercase">
              BORANG SPR WATIKAH 2A
            </span>
            <span className="text-[9px] font-bold bg-amber-200 px-1.5 py-0.5 rounded border border-slate-800">
              SULIT & RASMI
            </span>
          </div>
          <div className="text-xs font-black text-slate-900 mt-0.5">
            SURAT PENGESAHAN CALON RASMI: {party.fullName}
          </div>
          <p className="text-[10px] text-slate-600 italic">
            "Mengesahkan calon ini mendapat perkenan Presiden Parti untuk bertanding..."
          </p>
        </div>

        {/* Center Target Box: Red Dashed Boundary */}
        <div className="relative w-32 h-20 border-4 border-dashed border-red-500 rounded-2xl mx-auto flex items-center justify-center bg-red-50/50">
          <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-wider text-center">
            RUANG COP RASMI PARTI
          </span>

          {/* Moving Stamp Reticle (Before Stamp) */}
          {!stamped && (
            <div
              className="absolute w-14 h-14 rounded-full border-4 border-slate-900 bg-red-500/30 flex items-center justify-center transition-all duration-75 pointer-events-none"
              style={{ left: `${offsetPos.x - 28}%` }}
            >
              <span className="text-xl">🛑</span>
            </div>
          )}

          {/* Stamped Result */}
          {stamped && (
            <div
              className={`absolute border-4 px-3 py-1 rounded-xl font-black uppercase text-xs rotate-[-8deg] shadow-lg ${
                stampSuccess
                  ? "border-red-700 bg-red-600 text-white animate-bounce"
                  : "border-slate-800 bg-slate-300 text-slate-700"
              }`}
            >
              {party.name} DISAHKAN ✅
            </div>
          )}
        </div>

        {/* Legal Footer */}
        <div className="border-t border-slate-300 pt-1 text-[9px] font-mono text-slate-500 flex justify-between">
          <span>COP DITANDATANGANI</span>
          <span>SAH SEHINGGA 5:00 PM</span>
        </div>
      </div>

      {/* Action Stamp Button */}
      <button
        onClick={handleStamp}
        disabled={stamped}
        className="w-full mt-3 py-3.5 bg-red-600 hover:bg-red-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
      >
        <Stamp className="w-5 h-5" /> KETUK COP SEKARANG! 📑
      </button>
    </div>
  );
}
