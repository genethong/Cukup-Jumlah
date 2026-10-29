import { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Shirt, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../languageContext";

interface BalingBajuKempenProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface VoterTarget {
  id: number;
  labelMs: string;
  labelEn: string;
  emoji: string;
  x: number;
  dir: number;
  speed: number;
}

export function BalingBajuKempenGame({ isMesraRakyat = false, onComplete }: BalingBajuKempenProps) {
  const { t } = useLanguage();
  const targetHits = isMesraRakyat ? 4 : 5;
  const [hits, setHits] = useState(0);
  const [aimX, setAimX] = useState(50);
  const [chickenX, setChickenX] = useState(25);
  const [flyingShirt, setFlyingShirt] = useState<{ x: number; y: number; hitLabel?: string } | null>(null);

  // 3 moving voters in the crowd
  const [voters, setVoters] = useState<VoterTarget[]>([
    { id: 1, labelMs: "Pakcik Warung", labelEn: "Stall Uncle", emoji: "👴🏾", x: 20, dir: 1, speed: 1.6 },
    { id: 2, labelMs: "Makcik Pasar", labelEn: "Market Auntie", emoji: "👵🏻", x: 55, dir: -1, speed: 2.1 },
    { id: 3, labelMs: "Belia Pengundi", labelEn: "Youth Voter", emoji: "🙋‍♂️", x: 80, dir: 1, speed: 2.6 },
  ]);

  const aimDirRef = useRef(1);
  const chickenDirRef = useRef(1);
  const finishedRef = useRef(false);

  // Movement loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // Sweep aim cursor
      setAimX((prev) => {
        let next = prev + aimDirRef.current * 3.8;
        if (next >= 88) {
          next = 88;
          aimDirRef.current = -1;
        } else if (next <= 12) {
          next = 12;
          aimDirRef.current = 1;
        }
        return next;
      });

      // Move voters
      setVoters((prev) =>
        prev.map((v) => {
          let nextX = v.x + v.dir * v.speed;
          let nextDir = v.dir;
          if (nextX >= 88) {
            nextX = 88;
            nextDir = -1;
          } else if (nextX <= 12) {
            nextX = 12;
            nextDir = 1;
          }
          return { ...v, x: nextX, dir: nextDir };
        })
      );

      // Move stray chicken
      setChickenX((prev) => {
        let next = prev + chickenDirRef.current * 3.2;
        if (next >= 85) {
          next = 85;
          chickenDirRef.current = -1;
        } else if (next <= 15) {
          next = 15;
          chickenDirRef.current = 1;
        }
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleThrowShirt = useCallback(() => {
    if (finishedRef.current || flyingShirt) return;

    rhythmAudio.playBeatSound(2);

    // Check hit against chicken first
    const chickenDist = Math.abs(aimX - chickenX);
    if (chickenDist <= 10) {
      rhythmAudio.playSkrrtMiss();
      setFlyingShirt({
        x: aimX,
        y: 50,
        hitLabel: t("KACAU AYAM KAMPUNG! 🐔❌", "HIT THE KAMPUNG CHICKEN! 🐔❌"),
      });
      setTimeout(() => setFlyingShirt(null), 500);
      return;
    }

    // Check hit against any voter
    const hitTolerance = isMesraRakyat ? 16 : 12;
    const hitVoter = voters.find((v) => Math.abs(v.x - aimX) <= hitTolerance);

    if (hitVoter) {
      rhythmAudio.playStampSlam();
      const voterLabel = t(hitVoter.labelMs, hitVoter.labelEn);
      setFlyingShirt({
        x: aimX,
        y: 35,
        hitLabel: t(`${voterLabel} DAPAT BAJU! 👕✅`, `${voterLabel} CAUGHT THE SHIRT! 👕✅`),
      });

      setHits((prev) => {
        const next = prev + 1;
        if (next >= targetHits && !finishedRef.current) {
          finishedRef.current = true;
          rhythmAudio.playPaduSuccess();
          setTimeout(() => onComplete(true), 400);
        }
        return next;
      });
    } else {
      rhythmAudio.playSkrrtMiss();
      setFlyingShirt({
        x: aimX,
        y: 70,
        hitLabel: t("TERLEPAS KE TANAH! ❌", "MISSED! HIT THE DIRT! ❌"),
      });
    }

    setTimeout(() => setFlyingShirt(null), 450);
  }, [flyingShirt, aimX, chickenX, voters, isMesraRakyat, targetHits, onComplete, t]);

  // Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleThrowShirt();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleThrowShirt]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Banner: Shirt Score */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <Shirt className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400">{t("AGIHAN BAJU KEMPEN:", "CAMPAIGN SHIRT TOSS:")}</span>
          <span>{t(`${hits} / ${targetHits} DITERIMA`, `${hits} / ${targetHits} CAUGHT`)}</span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: targetHits }).map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${
                i < hits ? "bg-emerald-500 border-emerald-300 text-slate-950 font-black" : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
            >
              {i < hits ? "✓" : i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Kampung Crowd Field Arena */}
      <div className="relative h-50 bg-[#15803d] rounded-2xl border-4 border-slate-950 overflow-hidden comic-shadow flex flex-col justify-between p-2">
        {/* Kampung backdrop trees */}
        <div className="absolute top-1 inset-x-0 flex justify-around text-lg opacity-30 pointer-events-none">
          <span>🌴</span>
          <span>🏡</span>
          <span>🌴</span>
          <span>🏘️</span>
          <span>🌴</span>
        </div>

        {/* Row of moving voters */}
        <div className="relative w-full h-20 my-auto">
          {voters.map((voter) => (
            <div
              key={voter.id}
              style={{ left: `${voter.x}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-75"
            >
              <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-slate-950 flex items-center justify-center text-xl shadow-md">
                {voter.emoji}
              </div>
              <span className="text-[7px] font-mono font-black bg-slate-950 text-white px-1 py-0.2 rounded mt-0.5 whitespace-nowrap border border-slate-800">
                {t(voter.labelMs, voter.labelEn)}
              </span>
            </div>
          ))}

          {/* Stray kampung chicken running across */}
          <div
            style={{ left: `${chickenX}%` }}
            className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
          >
            <span className="text-xl animate-bounce">🐔</span>
            <span className="text-[6px] font-black bg-rose-600 text-white px-0.5 rounded">
              {t("JANGAN BALING! ⚠️", "DON'T HIT! ⚠️")}
            </span>
          </div>

          {/* Flying T-shirt / Pop Alert */}
          {flyingShirt && (
            <div
              style={{ left: `${flyingShirt.x}%`, top: `${flyingShirt.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-fade-in flex flex-col items-center"
            >
              <span className="text-2xl animate-spin">👕</span>
              {flyingShirt.hitLabel && (
                <span className="bg-amber-300 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-950 shadow whitespace-nowrap mt-1">
                  {flyingShirt.hitLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Aim cursor at bottom */}
        <div className="relative w-full h-8 flex items-center">
          {/* Aim Reticle */}
          <div
            style={{ left: `${aimX}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center transition-all duration-75"
          >
            <div className="w-8 h-8 rounded-full border-3 border-amber-300 bg-red-600/60 flex items-center justify-center text-xs shadow-lg animate-pulse">
              🎯
            </div>
          </div>
        </div>
      </div>

      {/* Throw Action Button */}
      <button
        onClick={handleThrowShirt}
        disabled={!!flyingShirt}
        className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:translate-x-0.5 active:translate-y-0.5 text-white font-black text-sm rounded-2xl border-4 border-slate-900 comic-shadow transition cursor-pointer flex flex-col items-center justify-center uppercase tracking-wider disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Shirt className="w-5 h-5" />
          {t("BALING BAJU KEMPEN SEKARANG! 👕 (SPACEBAR)", "TOSS CAMPAIGN T-SHIRT NOW! 👕 (SPACEBAR)")}
        </span>
        <span className="text-[10px] text-amber-200 font-mono font-normal">
          {t("[Sasarkan baju percuma kepada pengundi kampung!]", "[Aim free t-shirts at kampung voters!]")}
        </span>
      </button>
    </div>
  );
}
