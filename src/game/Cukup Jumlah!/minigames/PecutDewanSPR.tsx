import { useEffect, useRef, useState } from "react";
import { rhythmAudio } from "../rhythm";
import { useLanguage } from "../languageContext";

interface PecutDewanSPRProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface Obstacle {
  id: number;
  lane: 0 | 1 | 2;
  y: number; // 0 to 100%
  type: "kon" | "pisang" | "wartawan" | "teh_ais";
  label: string;
  icon: string;
}

export function PecutDewanSPRGame({ isMesraRakyat = false, onComplete }: PecutDewanSPRProps) {
  const { t } = useLanguage();
  const [playerLane, setPlayerLane] = useState<0 | 1 | 2>(1);
  const [distanceMeters, setDistanceMeters] = useState(0); // 0m to 100m
  const [turboActive, setTurboActive] = useState(false);
  const [stumbled, setStumbled] = useState(false);
  const [finished, setFinished] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { id: 1, lane: 1, y: 15, type: "kon", label: "Kon RELA", icon: "🚧" },
    { id: 2, lane: 0, y: 40, type: "pisang", label: "Pisang Goreng", icon: "🍌" },
    { id: 3, lane: 2, y: 65, type: "teh_ais", label: "Teh O Ais Turbo!", icon: "🥤" },
  ]);

  const playerLaneRef = useRef<0 | 1 | 2>(1);
  const distanceRef = useRef(0);
  const turboRef = useRef(false);
  const stumbledRef = useRef(false);
  const finishedRef = useRef(false);
  const nextIdRef = useRef(4);
  const obstaclesRef = useRef<Obstacle[]>(obstacles);

  // Current zone calculation
  const currentZone =
    distanceMeters < 35
      ? t(
          "ZON 1: JALAN KAMPUNG (ELAK KON & KULIT PISANG!) 🍌",
          "ZONE 1: KAMPUNG ROAD (DODGE CONES & BANANA PEELS) 🍌"
        )
      : distanceMeters < 70
        ? t(
            "ZON 2: PERKARANGAN SPR (SAMBAR TEH O AIS TURBO! 🥤)",
            "ZONE 2: SPR COURTYARD (GRAB TURBO TEH O AIS! 🥤)"
          )
        : t(
            "ZON 3: TANGGA DEWAN SPR (PECUAN AKHIR SEBELUM 10:00 PAGI!) 🏛️",
            "ZONE 3: SPR STAIRS (FINAL DASH TO 10:00 AM DEADLINE!) 🏛️"
          );

  const advanceDistance = (meters: number) => {
    if (finishedRef.current || (stumbledRef.current && !turboRef.current)) return;
    const boostMult = turboRef.current ? 1.7 : 1.0;
    const next = Math.min(100, distanceRef.current + meters * boostMult);
    distanceRef.current = next;
    setDistanceMeters(next);

    if (next >= 100 && !finishedRef.current) {
      finishedRef.current = true;
      setFinished(true);
      rhythmAudio.playPaduSuccess();
      setTimeout(() => onComplete(true), 450);
    }
  };

  const changeLane = (newLane: 0 | 1 | 2) => {
    if (finishedRef.current) return;
    playerLaneRef.current = newLane;
    setPlayerLane(newLane);
    // Changing lanes gives slight stride momentum
    advanceDistance(0.8);
  };

  const handleSprintTap = () => {
    if (finishedRef.current || (stumbledRef.current && !turboRef.current)) return;
    rhythmAudio.playBeatSound(2);
    // Tap stride
    const stride = isMesraRakyat ? 4.2 : 3.5;
    advanceDistance(stride);
  };

  // Keyboard controls (A/D/Arrows to change lanes, Space/Up/W to sprint)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        const next = Math.max(0, playerLaneRef.current - 1) as 0 | 1 | 2;
        changeLane(next);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        const next = Math.min(2, playerLaneRef.current + 1) as 0 | 1 | 2;
        changeLane(next);
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleSprintTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMesraRakyat]);

  // Main active game loop (tuned for a 16–18s full race duration)
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // Steady base jog forward
      if (!stumbledRef.current || turboRef.current) {
        advanceDistance(0.18);
      }

      // Move obstacles and powerups downward
      const updated: Obstacle[] = [];
      const obsSpeed = turboRef.current ? 4.2 : 3.0;

      for (const obs of obstaclesRef.current) {
        const nextY = obs.y + obsSpeed;

        // Collision check at player vertical position (~80%)
        const hitWindow = isMesraRakyat ? 6 : 8;
        if (
          obs.y < 82 &&
          nextY >= 82 - hitWindow &&
          obs.lane === playerLaneRef.current
        ) {
          if (obs.type === "teh_ais") {
            // Powerup pickup!
            rhythmAudio.playPaduSuccess();
            turboRef.current = true;
            setTurboActive(true);
            setTimeout(() => {
              turboRef.current = false;
              setTurboActive(false);
            }, 3000);
            continue; // Collected!
          } else if (!turboRef.current) {
            // Hit hazard!
            rhythmAudio.playSkrrtMiss();
            stumbledRef.current = true;
            setStumbled(true);
            distanceRef.current = Math.max(0, distanceRef.current - 5);
            setDistanceMeters(distanceRef.current);
            setTimeout(() => {
              stumbledRef.current = false;
              setStumbled(false);
            }, 550);
            continue;
          }
        }

        if (nextY < 104) {
          updated.push({ ...obs, y: nextY });
        }
      }

      // Spawn new hazards/powerups based on distance zone
      const highestY = updated.reduce((min, o) => Math.min(min, o.y), 100);
      if (highestY > 32 && updated.length < 4) {
        const lanes: (0 | 1 | 2)[] = [0, 1, 2];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

        // 25% chance of spawning Teh O Ais powerup, otherwise hazards
        const isPowerup = Math.random() < 0.28;
        if (isPowerup) {
          updated.push({
            id: nextIdRef.current++,
            lane: randomLane,
            y: 4,
            type: "teh_ais",
            label: "Teh O Ais Ikat Tepi!",
            icon: "🥤",
          });
        } else {
          const templates: { type: Obstacle["type"]; label: string; icon: string }[] = [
            { type: "kon", label: "Kon RELA", icon: "🚧" },
            { type: "pisang", label: "Kulit Pisang", icon: "🍌" },
            { type: "wartawan", label: "Kamera Berita", icon: "📸" },
          ];
          const chosen = templates[Math.floor(Math.random() * templates.length)];
          updated.push({
            id: nextIdRef.current++,
            lane: randomLane,
            y: 4,
            ...chosen,
          });
        }
      }

      obstaclesRef.current = updated;
      setObstacles(updated);
    }, 50);

    return () => clearInterval(interval);
  }, [isMesraRakyat, onComplete]);

  return (
    <div className="space-y-2 select-none">
      {/* Race Progress & Zone Header */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-black animate-pulse">
            {t("🕘 9:59 PAGI!", "🕘 9:59 AM!")}
          </span>
          <span className="text-[10px] text-slate-300 hidden sm:inline">
            {t("Pintu SPR Tutup 10:00 Pagi", "SPR Gate Closes 10:00 AM")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {turboActive && (
            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[9px] animate-bounce">
              {t("⚡ TURBO TEH O AIS! ⚡", "⚡ TURBO ICED TEA! ⚡")}
            </span>
          )}
          <span className="font-black text-emerald-400 text-sm">
            {Math.round(distanceMeters)}m / 100m
          </span>
        </div>
      </div>

      {/* Course Meter Bar */}
      <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border-2 border-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-75 ${
            turboActive
              ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400 animate-pulse"
              : "bg-gradient-to-r from-amber-400 to-emerald-500"
          }`}
          style={{ width: `${distanceMeters}%` }}
        />
      </div>

      {/* Current Zone Subtitle */}
      <div className="text-center text-[10px] font-mono font-bold text-amber-300 bg-slate-900/90 py-0.5 rounded-lg border border-slate-800">
        🏁 {currentZone}
      </div>

      {/* 3-Lane Track Arena */}
      <div className="relative h-52 bg-slate-800 rounded-2xl border-4 border-slate-900 overflow-hidden shadow-inner">
        {/* Red Carpet Finish Line at Top */}
        <div className="absolute top-0 inset-x-0 h-8 bg-amber-400 border-b-2 border-slate-900 flex items-center justify-center z-10 shadow">
          <span className="text-[11px] font-black text-slate-950 tracking-wider uppercase">
            {t(
              "🏛️ PINTU DEWAN PENAMAAN SPR (10:00 PAGI) 🏛️",
              "🏛️ SPR NOMINATION HALL DOORS (10:00 AM) 🏛️"
            )}
          </span>
        </div>

        {/* 3 Clickable Lanes */}
        <div className="absolute inset-0 top-8 grid grid-cols-3 divide-x-2 divide-dashed divide-amber-400/30">
          {([0, 1, 2] as const).map((laneIdx) => (
            <button
              key={laneIdx}
              type="button"
              onClick={() => changeLane(laneIdx)}
              className={`relative h-full transition cursor-pointer ${
                playerLane === laneIdx ? "bg-emerald-500/10" : "hover:bg-white/5"
              }`}
            >
              <span className="absolute bottom-1 inset-x-0 text-center text-[8px] font-mono font-bold text-slate-400 uppercase">
                {t(`Lorong ${laneIdx + 1}`, `Lane ${laneIdx + 1}`)}
              </span>
            </button>
          ))}
        </div>

        {/* Incoming Obstacles & Powerups */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              top: `${obs.y}%`,
              left: `${obs.lane * 33.33 + 16.66}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center transition-all duration-75"
          >
            <div
              className={`w-9 h-9 rounded-xl border-2 border-slate-950 shadow flex items-center justify-center text-xl ${
                obs.type === "teh_ais"
                  ? "bg-amber-400 animate-bounce ring-2 ring-emerald-300"
                  : "bg-rose-600"
              }`}
            >
              {obs.icon}
            </div>
            <span
              className={`text-[8px] font-mono font-black px-1.5 rounded mt-0.5 whitespace-nowrap border ${
                obs.type === "teh_ais"
                  ? "bg-amber-300 text-slate-950 border-slate-950"
                  : "bg-slate-950 text-amber-300 border-amber-400/40"
              }`}
            >
              {obs.label}
            </span>
          </div>
        ))}

        {/* Player YB Runner */}
        <div
          style={{
            bottom: "8%",
            left: `${playerLane * 33.33 + 16.66}%`,
          }}
          className="absolute -translate-x-1/2 pointer-events-none transition-all duration-100 flex flex-col items-center z-20"
        >
          <div
            className={`w-12 h-12 rounded-2xl border-3 border-slate-950 flex items-center justify-center text-2xl shadow-xl transition-transform ${
              stumbled
                ? "bg-rose-500 animate-bounce rotate-12"
                : turboActive
                  ? "bg-amber-300 scale-125 ring-4 ring-yellow-400"
                  : finished
                    ? "bg-emerald-400 scale-110"
                    : "bg-amber-400"
            }`}
          >
            {stumbled ? "😵" : turboActive ? "⚡🏃🏾‍♂️" : finished ? "🙌" : "🏃🏾‍♂️"}
          </div>
          <span className="text-[9px] font-black uppercase bg-slate-950 text-white px-2 py-0.5 rounded-full mt-0.5 border border-amber-400">
            {stumbled
              ? t("TERGELINCIR!", "STUMBLED!")
              : turboActive
                ? t("TURBO TEH AIS!", "TURBO ICED TEA!")
                : t("YB PECUT!", "YB SPRINT!")}
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => changeLane(Math.max(0, playerLane - 1) as 0 | 1 | 2)}
          className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-xl border-3 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
        >
          {t("⬅️ ELAK KIRI (A)", "⬅️ DODGE LEFT (A)")}
        </button>

        <button
          type="button"
          onClick={handleSprintTap}
          className="py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl border-3 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer uppercase animate-pulse"
        >
          {t("👟 PECUT PANTAS! (SPACE)", "👟 SPRINT! (SPACE)")}
        </button>

        <button
          type="button"
          onClick={() => changeLane(Math.min(2, playerLane + 1) as 0 | 1 | 2)}
          className="py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-xl border-3 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
        >
          {t("ELAK KANAN (D) ➡️", "DODGE RIGHT (D) ➡️")}
        </button>
      </div>
    </div>
  );
}
