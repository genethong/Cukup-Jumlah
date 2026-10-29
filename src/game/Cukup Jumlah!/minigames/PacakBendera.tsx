import { useEffect, useRef, useState, useCallback } from "react";
import { Flag, Wind, CheckCircle2 } from "lucide-react";
import type { PartyId } from "../types";
import { PARTIES } from "../types";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface PacakBenderaProps {
  partyId: PartyId;
  onComplete: (success: boolean) => void;
  isMesraRakyat?: boolean;
}

export function PacakBenderaGame({ partyId, onComplete, isMesraRakyat = false }: PacakBenderaProps) {
  const { t } = useLanguage();
  const targetFlags = isMesraRakyat ? 4 : 5;
  const [flagsTied, setFlagsTied] = useState(0);
  const [poleAngle, setPoleAngle] = useState(0); // -25 to +25 degrees
  const [windForce, setWindForce] = useState(0);

  const party = PARTIES[partyId];
  const poleAngleRef = useRef(0);
  const windRef = useRef(0);
  const finishedRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Wind and pole balance loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // Wind randomly shifts direction
      if (Math.random() < 0.12) {
        windRef.current = (Math.random() - 0.5) * 3.5;
        setWindForce(Math.round(windRef.current * 10));
      }

      // Keyboard controls (A/D or Arrows to counter-balance pole)
      const keys = keysPressedRef.current;
      let counter = 0;
      if (keys.has("arrowleft") || keys.has("a")) counter -= 2.8;
      if (keys.has("arrowright") || keys.has("d")) counter += 2.8;

      // Update angle
      let nextAngle = poleAngleRef.current + windRef.current + counter;
      // Slight natural decay towards center
      nextAngle *= 0.94;
      nextAngle = Math.max(-28, Math.min(28, nextAngle));
      poleAngleRef.current = nextAngle;
      setPoleAngle(nextAngle);
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key.toLowerCase());
      if (e.code === "Space") {
        e.preventDefault();
        handleTieFlag();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleTieFlag = useCallback(() => {
    if (finishedRef.current) return;

    // Must be reasonably upright (within +/- 18 deg)
    const tolerance = isMesraRakyat ? 22 : 16;
    if (Math.abs(poleAngleRef.current) > tolerance) {
      rhythmAudio.playSkrrtMiss();
      return;
    }

    rhythmAudio.playStampSlam();
    const next = flagsTied + 1;
    setFlagsTied(next);

    if (next >= targetFlags) {
      finishedRef.current = true;
      rhythmAudio.playPaduSuccess();
      setTimeout(() => onComplete(true), 450);
    }
  }, [flagsTied, isMesraRakyat, targetFlags, onComplete]);

  const handleNudge = (dir: number) => {
    poleAngleRef.current = Math.max(-28, Math.min(28, poleAngleRef.current + dir * 6));
    setPoleAngle(poleAngleRef.current);
  };

  const isBalanced = Math.abs(poleAngle) <= (isMesraRakyat ? 22 : 16);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative select-none">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between bg-slate-900 border-2 border-slate-950 px-3 py-1.5 rounded-xl text-xs font-mono text-white mb-2 comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-amber-400">{t("PACAK BENDERA PARTI:", "TIE PARTY FLAGS:")}</span>
          <span>{t(`${flagsTied} / ${targetFlags} TERIKAT`, `${flagsTied} / ${targetFlags} TIED`)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px]">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-sky-300">{t("ANGIN:", "WIND:")} {windForce} km/h</span>
          </div>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
              isBalanced ? "bg-emerald-950 text-emerald-400 border-emerald-500" : "bg-rose-950 text-rose-400 border-rose-500 animate-pulse"
            }`}
          >
            {isBalanced ? t("SEIMBANG ✅", "BALANCED ✅") : t("SENGET! ⚠️", "TILTED! ⚠️")}
          </span>
        </div>
      </div>

      {/* Night Street Scene: Sodium Light & Bamboo Poles */}
      <div className="w-full h-50 bg-[#0f172a] p-3 rounded-2xl border-4 border-slate-900 comic-shadow relative overflow-hidden flex flex-col justify-between">
        {/* Streetlight Sodium Yellow Glow */}
        <div className="absolute top-0 right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />

        {/* Top Countdown Warning */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono font-bold">
          <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600">
            {t("⏰ 11:55 MLM (TEMPOH KEMPEN TAMAT 12:00 MLM)", "⏰ 11:55 PM (MIDNIGHT CAMPAIGN DEADLINE APPROACHING)")}
          </span>
          <span className="text-white bg-slate-800 px-2 py-0.5 rounded">
            {t("TALI RAFIA MERAH 🧶", "RED RAFIA STRING 🧶")}
          </span>
        </div>

        {/* Bamboo Pole & Tied Party Flags Arena */}
        <div className="relative w-full h-34 flex items-end justify-center">
          {/* Rival party pole on the right */}
          <div className="absolute right-8 bottom-0 w-3 h-28 bg-stone-700 border border-slate-950 opacity-40 flex flex-col justify-around">
            <span className="text-[8px] bg-rose-700 text-white px-1 rounded -translate-x-3">{t("🏴 LAWAN", "🏴 RIVAL")}</span>
            <span className="text-[8px] bg-rose-700 text-white px-1 rounded -translate-x-3">{t("🏴 LAWAN", "🏴 RIVAL")}</span>
          </div>

          {/* Player Bamboo Pole (Buluh) with dynamic tilt */}
          <div
            className="w-4 h-32 bg-[#a16207] border-2 border-slate-950 rounded-sm relative flex flex-col justify-around items-center transition-transform duration-75 origin-bottom shadow-lg"
            style={{ transform: `rotate(${poleAngle}deg)` }}
          >
            {/* Bamboo rings */}
            <div className="w-full h-0.5 bg-[#78350f]" />
            <div className="w-full h-0.5 bg-[#78350f]" />
            <div className="w-full h-0.5 bg-[#78350f]" />

            {/* Attached fluttering party flags */}
            {Array.from({ length: flagsTied }).map((_, idx) => (
              <div
                key={idx}
                className="absolute text-[9px] font-black px-2 py-0.5 rounded-sm border-2 border-slate-900 text-white shadow-lg flex items-center gap-1 select-none animate-bounce"
                style={{
                  top: `${8 + idx * 18}%`,
                  left: idx % 2 === 0 ? "85%" : "-155%",
                  backgroundColor: party.themeColor === "#F8FAFC" ? "#475569" : party.themeColor,
                  transform: idx % 2 === 0 ? "rotate(6deg)" : "rotate(-6deg)",
                }}
              >
                <span>{party.symbolEmoji}</span>
                <span>{party.name}</span>
                <span className="text-[7px] bg-red-600 px-0.5 rounded-full text-white">🧶</span>
              </div>
            ))}
          </div>
        </div>

        {/* Base grass ground */}
        <div className="relative z-10 border-t-2 border-slate-700 pt-1 flex justify-between items-center text-[9px] font-mono text-slate-400">
          <span>{t("TEKAN A / D UNTUK IMBANGKAN BULUH", "PRESS A / D TO BALANCE POLE")}</span>
          <span className="font-bold text-amber-300">{t("TEKAN SPACE UNTUK IKAT BENDERA!", "PRESS SPACE TO TIE FLAG!")}</span>
          <span>{t("BATANG BULUH 10M", "BAMBOO POLE 10M")}</span>
        </div>
      </div>

      {/* Manual balance & tie controls */}
      <div className="w-full flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => handleNudge(-1)}
          className="px-3 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-xl border-2 border-slate-950 comic-shadow-sm cursor-pointer"
        >
          {t("⬅️ CONDONG KIRI (A)", "⬅️ TILT LEFT (A)")}
        </button>

        <button
          type="button"
          onClick={handleTieFlag}
          disabled={!isBalanced}
          className={`flex-1 py-3 font-black text-xs rounded-xl border-3 border-slate-950 comic-shadow uppercase transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
            isBalanced
              ? "bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 text-white active:scale-95"
              : "bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Flag className="w-4 h-4" />
            {isBalanced ? t("IKAT BENDERA! 🧶 (SPACEBAR)", "TIE FLAG! 🧶 (SPACEBAR)") : t("IMBANGKAN BULUH DULU! ⚖️", "BALANCE THE POLE FIRST! ⚖️")}
          </span>
          <span className="text-[9px] text-amber-200 font-mono font-normal">
            {t("[Ikat bendera parti dengan tali rafia]", "[Tie party flag with rafia string]")}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNudge(1)}
          className="px-3 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-xl border-2 border-slate-950 comic-shadow-sm cursor-pointer"
        >
          {t("CONDONG KANAN (D) ➡️", "TILT RIGHT ➡️ (D)")}
        </button>
      </div>
    </div>
  );
}
