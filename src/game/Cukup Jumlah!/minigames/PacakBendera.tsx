import { useState } from "react";
import { Flag } from "lucide-react";
import type { PartyId } from "../types";
import { PARTIES } from "../types";

interface PacakBenderaProps {
  partyId: PartyId;
  onComplete: (success: boolean) => void;
}

export function PacakBenderaGame({ partyId, onComplete }: PacakBenderaProps) {
  const [flagsTied, setFlagsTied] = useState(0);
  const targetFlags = 4;
  const party = PARTIES[partyId];

  const handleTieFlag = () => {
    const next = flagsTied + 1;
    setFlagsTied(next);

    if (next >= targetFlags) {
      setTimeout(() => onComplete(true), 300);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Night Street Scene: Sodium Light & Bamboo Poles */}
      <div className="w-full h-48 bg-[#0f172a] p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between">
        
        {/* Streetlight Sodium Yellow Glow */}
        <div className="absolute top-0 right-10 w-28 h-28 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Top Countdown Warning */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono font-bold">
          <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600">
            ⏰ JAM: 11:54 PM (SEBELUM TAMAT TEMPOH)
          </span>
          <span className="text-white bg-slate-800 px-2 py-0.5 rounded">
            TALI RAFIA MERAH 🧶
          </span>
        </div>

        {/* Bamboo Pole & Tied Party Flags Arena */}
        <div className="relative w-full h-36 flex items-center justify-center">
          
          {/* Natural Bamboo Pole (Buluh) */}
          <div className="w-4 h-full bg-[#a16207] border-2 border-slate-900 rounded-sm relative flex flex-col justify-around items-center">
            {/* Bamboo rings */}
            <div className="w-full h-0.5 bg-[#78350f]" />
            <div className="w-full h-0.5 bg-[#78350f]" />
            <div className="w-full h-0.5 bg-[#78350f]" />
            <div className="w-full h-0.5 bg-[#78350f]" />

            {/* Attached fluttering party flags */}
            {Array.from({ length: flagsTied }).map((_, idx) => (
              <div
                key={idx}
                className="absolute text-[10px] font-black px-2 py-1 rounded-sm border-2 border-slate-900 text-white shadow-lg flex items-center gap-1 select-none animate-bounce"
                style={{
                  top: `${10 + idx * 22}%`,
                  left: idx % 2 === 0 ? "85%" : "-155%",
                  backgroundColor: party.themeColor === "#F8FAFC" ? "#475569" : party.themeColor,
                  transform: idx % 2 === 0 ? "rotate(6deg)" : "rotate(-6deg)",
                }}
              >
                <span>{party.symbolEmoji}</span>
                <span>{party.name}</span>
                {/* Tali rafia knot */}
                <span className="text-[8px] bg-red-600 px-1 rounded-full text-white">🧶</span>
              </div>
            ))}
          </div>

        </div>

        <div className="relative z-10 text-[9px] font-mono text-slate-400">
          "Ikat lebih tinggi daripada bendera parti lawan!"
        </div>
      </div>

      {/* Progress Counter */}
      <div className="w-full flex items-center justify-between text-xs font-black text-slate-800 my-2 px-1">
        <span>BENDERA DIPACAK:</span>
        <span className="text-amber-800 font-mono text-sm">{flagsTied} / {targetFlags} BENDERA 🚩</span>
      </div>

      {/* Action Tie Button */}
      <button
        onClick={handleTieFlag}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-white font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
      >
        <Flag className="w-5 h-5" /> IKAT BENDERA & TALI RAFIA! ({targetFlags - flagsTied} LAGI)
      </button>
    </div>
  );
}
