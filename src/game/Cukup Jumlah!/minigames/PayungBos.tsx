import { useEffect, useState } from "react";
import { CloudRain } from "lucide-react";

interface PayungBosProps {
  onComplete: (success: boolean) => void;
}

export function PayungBosGame({ onComplete }: PayungBosProps) {
  const [vipX, setVipX] = useState(50);
  const [umbrellaX, setUmbrellaX] = useState(50);
  const [isProtected, setIsProtected] = useState(true);

  // VIP walks left and right erratically
  useEffect(() => {
    let direction = 1;
    const interval = setInterval(() => {
      setVipX((prev) => {
        let next = prev + direction * 6;
        if (next > 78) direction = -1;
        if (next < 22) direction = 1;
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Check protection match
  useEffect(() => {
    const diff = Math.abs(umbrellaX - vipX);
    setIsProtected(diff <= 18);
  }, [umbrellaX, vipX]);

  // Complete game after 3.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(isProtected);
    }, 3800);
    return () => clearTimeout(timer);
  }, [isProtected, onComplete]);

  return (
    <div className="flex flex-col items-center justify-between p-2 text-center w-full relative">
      
      {/* Comic Dialogue Pop */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="bg-amber-200 border-2 border-slate-900 rounded-xl px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          "PAYUNGKAN BOS VIP! JANGAN KENA HUJAN!!"
        </div>
        <div
          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            isProtected ? "bg-emerald-400 text-slate-950" : "bg-red-500 text-white animate-bounce"
          }`}
        >
          {isProtected ? "BOS KERING! ✅" : "BASAH KUYUP! ❌"}
        </div>
      </div>

      {/* Rainy Arena with Lat Comic Caricatures */}
      <div className="w-full h-52 bg-[#e0f2fe] p-3 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col justify-between">
        
        {/* Cartoon Rain Streaks */}
        <div className="absolute inset-0 pointer-events-none opacity-30 flex justify-around text-blue-600 font-mono text-sm">
          <span className="animate-pulse">/ / /</span>
          <span className="animate-pulse delay-75">/ / /</span>
          <span className="animate-pulse delay-150">/ / /</span>
          <span className="animate-pulse delay-100">/ / /</span>
        </div>

        {/* Puddle on ground */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#bae6fd] border-t-2 border-blue-400 opacity-60" />

        {/* Dynamic Characters Arena */}
        <div className="relative w-full h-full">
          
          {/* Gold VIP Umbrella dragged by player */}
          <div
            className="absolute top-2 transform -translate-x-1/2 transition-all duration-75 z-20 select-none cursor-grab active:cursor-grabbing"
            style={{ left: `${umbrellaX}%` }}
          >
            {/* SVG Giant Golden VIP Umbrella */}
            <svg viewBox="0 0 100 80" className="w-28 h-24 filter drop-shadow-lg">
              {/* Umbrella Canopy */}
              <path
                d="M 10 40 Q 50 2 90 40 Q 75 35 60 40 Q 50 35 40 40 Q 25 35 10 40 Z"
                fill="#eab308"
                stroke="#0f172a"
                strokeWidth="3.5"
              />
              <path d="M 50 15 L 50 2" stroke="#0f172a" strokeWidth="3" />
              {/* Gold ribs */}
              <path d="M 50 15 Q 35 25 30 40" stroke="#ca8a04" strokeWidth="2" fill="none" />
              <path d="M 50 15 Q 65 25 70 40" stroke="#ca8a04" strokeWidth="2" fill="none" />
              {/* Shaft & Handle held down */}
              <line x1="50" y1="40" x2="50" y2="78" stroke="#78350f" strokeWidth="4" />
              <path d="M 50 78 Q 50 84 44 84" fill="none" stroke="#78350f" strokeWidth="4" />
            </svg>
          </div>

          {/* VIP Politician Walking */}
          <div
            className="absolute bottom-2 transform -translate-x-1/2 transition-all duration-100 flex flex-col items-center select-none z-10"
            style={{ left: `${vipX}%` }}
          >
            <svg viewBox="0 0 80 90" className="w-20 h-22">
              {/* Luxury Coat Body */}
              <rect x="22" y="42" width="36" height="38" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
              <line x1="40" y1="42" x2="40" y2="80" stroke="#fbbf24" strokeWidth="2" />
              {/* Legs */}
              <line x1="30" y1="80" x2="30" y2="88" stroke="#0f172a" strokeWidth="4" />
              <line x1="50" y1="80" x2="50" y2="88" stroke="#0f172a" strokeWidth="4" />
              {/* VIP Face: Oblivious, beaming smile with gold tooth */}
              <circle cx="40" cy="24" r="16" fill="#fed7aa" stroke="#0f172a" strokeWidth="3" />
              {/* Songkok with gold band */}
              <path d="M 26 14 L 54 14 L 52 22 L 28 22 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="2.5" />
              <line x1="28" y1="21" x2="52" y2="21" stroke="#fbbf24" strokeWidth="2" />
              {/* Happy squinty eyes */}
              <path d="M 32 23 Q 36 20 40 23" fill="none" stroke="#0f172a" strokeWidth="2" />
              <path d="M 40 23 Q 44 20 48 23" fill="none" stroke="#0f172a" strokeWidth="2" />
              {/* Huge Lat smile */}
              <path d="M 32 30 Q 40 38 48 30 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <rect x="38" y="30" width="3" height="3" fill="#fbbf24" />
            </svg>
            <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              BOS VIP
            </span>
          </div>

        </div>
      </div>

      {/* Slider / Touch Controls to Move Umbrella */}
      <div className="w-full mt-3 bg-[#fbf5e5] p-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between text-[10px] font-black text-slate-700 mb-1">
          <span>KIRI ◄</span>
          <span className="text-amber-800 font-bold uppercase">LARASKAN PAYUNG DENGAN SLIDER</span>
          <span>► KANAN</span>
        </div>
        <input
          type="range"
          min="20"
          max="80"
          value={umbrellaX}
          onChange={(e) => setUmbrellaX(Number(e.target.value))}
          className="w-full h-3 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-900"
        />
      </div>
    </div>
  );
}
