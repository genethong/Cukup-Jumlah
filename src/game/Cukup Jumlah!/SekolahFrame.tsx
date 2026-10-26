import React from "react";
import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";
import { Volume2, VolumeX } from "lucide-react";
import { rhythmAudio } from "./rhythm";

interface SekolahFrameProps {
  profile: CandidateProfile | null;
  lives: number;
  seatsWon: number;
  timeLeft: number;
  isReadyPhase: boolean;
  currentBeat: number; // 1, 2, 3, 4
  rhythmicCueText?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  children: React.ReactNode;
}

export function SekolahFrame({
  profile,
  lives,
  seatsWon,
  timeLeft,
  isReadyPhase,
  currentBeat,
  rhythmicCueText,
  isMuted,
  onToggleMute,
  children,
}: SekolahFrameProps) {
  const partyInfo = profile ? PARTIES[profile.party] : null;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col justify-between select-none">
      
      {/* =================================================================== */}
      {/* 1. TOP HUD: PAPAN HITAM SEKOLAH KEBANGSAAN */}
      {/* =================================================================== */}
      <div className="bg-[#152a20] border-4 border-[#0f1d16] rounded-t-3xl p-3.5 shadow-2xl relative overflow-hidden">
        
        {/* Chalk dust pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-emerald-900/60 pb-2 mb-2">
          
          {/* School & Stream Badge */}
          <div className="flex items-center gap-2">
            <span className="bg-[#0b1711] text-emerald-300 border border-emerald-700/50 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SK SRI BANGSAR • SALURAN 3
            </span>
            {partyInfo && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm"
                style={{ backgroundColor: partyInfo.themeColor === "#F8FAFC" ? "#475569" : partyInfo.themeColor }}
              >
                {partyInfo.symbolEmoji} {partyInfo.name}
              </span>
            )}
          </div>

          {/* Sound & Kompang Beat Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition cursor-pointer"
            title={isMuted ? "Buka Muzik Kompang" : "Bisu"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Chalkboard Display Row: Timer, Beat Metronome, Deposit Cash Bundles */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          
          {/* Left: 4-Beat Rhythmic Metronome ("On-The-Beat" Visualizer) */}
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
              TEMPO KOMPANG:
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[1, 2, 3, 4].map((b) => (
                <div
                  key={b}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-75 flex items-center justify-center text-[8px] font-black ${
                    currentBeat === b
                      ? b === 4
                        ? "bg-amber-400 border-amber-300 text-slate-950 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                        : "bg-emerald-400 border-emerald-300 text-slate-950 scale-110 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                      : "bg-[#0b1711] border-emerald-800 text-emerald-600"
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Center: Chalk Countdown Timer */}
          <div className="text-center">
            <div
              className={`font-mono font-black text-xl md:text-2xl tracking-widest px-3 py-0.5 rounded-lg border-2 shadow-inner transition-colors duration-100 ${
                isReadyPhase
                  ? "bg-sky-950/80 border-sky-400 text-sky-200"
                  : timeLeft <= 2.5
                  ? "bg-red-950/80 border-red-500 text-red-300 animate-pulse"
                  : "bg-[#0b1711] border-emerald-500 text-yellow-300"
              }`}
            >
              {isReadyPhase ? "BERSEDIA" : `${timeLeft.toFixed(1)}s`}
            </div>
          </div>

          {/* Right: 3x RM10,000 Cash Deposit Bundles (Lives) */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider">
              WANG DEPOSIT SPR:
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {Array.from({ length: 3 }).map((_, i) => {
                const isAlive = i < lives;
                return (
                  <div
                    key={i}
                    className={`px-1.5 py-0.5 rounded border-2 transition-all duration-200 flex items-center gap-1 ${
                      isAlive
                        ? "bg-[#064e3b] border-emerald-400 text-emerald-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-[#3f1616] border-red-800 text-red-400 opacity-40 line-through"
                    }`}
                    title={isAlive ? "RM10,000 Wang Deposit Sah" : "Hilang Wang Deposit!"}
                  >
                    <span className="text-xs">{isAlive ? "💵" : "💸"}</span>
                    <span className="text-[8px] font-mono font-black">
                      {isAlive ? "RM10k" : "LEBUR"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Chalk dust ledge (Timber Molding at bottom of chalkboard) */}
        <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[#854d0e] border-t border-[#a16207]" />
      </div>

      {/* =================================================================== */}
      {/* 2. CENTER STAGE: MEJA KAYU SK (WOODEN DESK PLAYFIELD) */}
      {/* =================================================================== */}
      <div className="bg-[#c28448] border-x-4 border-[#0f1d16] p-3 md:p-5 relative shadow-inner">
        
        {/* Wood grain & subtle desk scratches overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Rhythmic "Say the Word" Speech Callout Banner */}
        {rhythmicCueText && (
          <div className="relative z-10 mb-3 bg-[#fef08a] border-4 border-slate-900 rounded-2xl p-2.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center animate-bounce">
            <span className="font-black text-slate-950 text-xs md:text-sm tracking-wide uppercase">
              🗣️ {rhythmicCueText}
            </span>
          </div>
        )}

        {/* Microgame Content Slot */}
        <div className="relative z-10 bg-[#fbf5e5] text-slate-900 border-4 border-slate-900 rounded-3xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-h-[340px] flex flex-col justify-between">
          {children}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM HUD: PETI UNDI SPR (TRANSPARENT ACRYLIC BALLOT BOX) */}
      {/* =================================================================== */}
      <div className="bg-[#1e293b]/95 backdrop-blur border-4 border-t-0 border-[#0f1d16] rounded-b-3xl p-3 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Acrylic Box Label */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-lg shadow">
              🗳️
            </div>
            <div>
              <div className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                PETI UNDI PARLIMEN • KERAJAAN BARU
              </div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                SASARAN: 112 KERUSI
              </div>
            </div>
          </div>

          {/* 112 Parliament Majority Progress Bar */}
          <div className="w-full sm:w-56 space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span className="text-emerald-400">{seatsWon} Kerusi Di Tangan</span>
              <span className="text-red-400">112 Cukup Jumlah</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-700 relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (seatsWon / 112) * 100)}%` }}
              />
              {/* 112 Threshold Line */}
              <div className="absolute top-0 bottom-0 left-full -ml-1 w-1 bg-white opacity-80" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
