import React, { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Zap, Flashlight, AlertCircle } from "lucide-react";
import { useLanguage } from "../languageContext";

interface BlackoutPetiUndiProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

interface ShadowHand {
  id: number;
  x: number;
  y: number;
  speed: number;
}

export function BlackoutPetiUndiGame({ isMesraRakyat = false, onComplete }: BlackoutPetiUndiProps) {
  const { t } = useLanguage();
  const [lightPos, setLightPos] = useState({ x: 25, y: 75 });
  const [boxPos, setBoxPos] = useState({ x: 75, y: 30 });
  const [generatorPower, setGeneratorPower] = useState(15);
  const [isIlluminated, setIsIlluminated] = useState(false);
  const [hands, setHands] = useState<ShadowHand[]>([{ id: 1, x: 10, y: 20, speed: 1.2 }]);
  const [tamperWarning, setTamperWarning] = useState<string | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef({ x: 25, y: 75 });
  const boxRef = useRef({ x: 75, y: 30 });
  const boxTargetRef = useRef({ x: 30, y: 35 });
  const handsRef = useRef<ShadowHand[]>([{ id: 1, x: 10, y: 20, speed: 1.2 }]);
  const powerRef = useRef(15);
  const nextHandIdRef = useRef(2);
  const finishedRef = useRef(false);
  const keysPressedRef = useRef<Set<string>>(new Set());

  // Keyboard controls for flashlight
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key.toLowerCase());
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

  const moveFlashlight = (clientX: number, clientY: number) => {
    if (finishedRef.current || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(15, Math.min(85, ((clientY - rect.top) / rect.height) * 100));
    lightRef.current = { x, y };
    setLightPos({ x, y });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    moveFlashlight(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || e.pointerType === "touch") {
      moveFlashlight(e.clientX, e.clientY);
    }
  };

  const handleZapHand = (handId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (finishedRef.current) return;
    rhythmAudio.playStampSlam();
    handsRef.current = handsRef.current.filter((h) => h.id !== handId);
    setHands([...handsRef.current]);
    powerRef.current = Math.min(100, powerRef.current + 6);
    setGeneratorPower(Math.round(powerRef.current));
  };

  // Main simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // 0. Keyboard steering
      const keys = keysPressedRef.current;
      let kx = 0;
      let ky = 0;
      if (keys.has("arrowleft") || keys.has("a")) kx -= 3.2;
      if (keys.has("arrowright") || keys.has("d")) kx += 3.2;
      if (keys.has("arrowup") || keys.has("w")) ky -= 3.2;
      if (keys.has("arrowdown") || keys.has("s")) ky += 3.2;
      if (kx !== 0 || ky !== 0) {
        lightRef.current = {
          x: Math.max(10, Math.min(90, lightRef.current.x + kx)),
          y: Math.max(15, Math.min(85, lightRef.current.y + ky)),
        };
      }

      // 1. Move Peti Undi around the dark counting hall
      const curBox = boxRef.current;
      const dx = boxTargetRef.current.x - curBox.x;
      const dy = boxTargetRef.current.y - curBox.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6) {
        boxTargetRef.current = {
          x: 20 + Math.random() * 60,
          y: 22 + Math.random() * 54,
        };
      }

      const speed = 1.6;
      const nextBox = {
        x: curBox.x + (dx / Math.max(1, dist)) * speed,
        y: curBox.y + (dy / Math.max(1, dist)) * speed,
      };
      boxRef.current = nextBox;

      // 2. Check if flashlight beam covers Peti Undi
      const beamRadius = isMesraRakyat ? 25 : 20;
      const distToLight = Math.hypot(lightRef.current.x - nextBox.x, lightRef.current.y - nextBox.y);
      const lit = distToLight <= beamRadius;

      // 3. Update sneaky shadowy hands
      const updatedHands: ShadowHand[] = [];
      let boxTampered = false;

      for (const h of handsRef.current) {
        const handToLight = Math.hypot(lightRef.current.x - h.x, lightRef.current.y - h.y);
        // Beam dissolves hands
        if (handToLight < beamRadius * 0.95) {
          rhythmAudio.playBeatSound(2);
          continue;
        }

        // Creep toward Peti Undi
        const hdx = nextBox.x - h.x;
        const hdy = nextBox.y - h.y;
        const hDist = Math.hypot(hdx, hdy);

        if (hDist < 8) {
          boxTampered = true;
          // Re-spawn hand away
          continue;
        }

        const nextH = {
          ...h,
          x: h.x + (hdx / Math.max(1, hDist)) * h.speed,
          y: h.y + (hdy / Math.max(1, hDist)) * h.speed,
        };
        updatedHands.push(nextH);
      }

      // Spawn hands periodically
      if (updatedHands.length < 3 && Math.random() < 0.1) {
        const spawnSides = [
          { x: 5, y: 15 + Math.random() * 70 },
          { x: 95, y: 15 + Math.random() * 70 },
          { x: 15 + Math.random() * 70, y: 5 },
          { x: 15 + Math.random() * 70, y: 95 },
        ];
        const pick = spawnSides[Math.floor(Math.random() * spawnSides.length)];
        updatedHands.push({
          id: nextHandIdRef.current++,
          x: pick.x,
          y: pick.y,
          speed: 1.1 + Math.random() * 0.7,
        });
      }
      handsRef.current = updatedHands;

      // 4. Update generator power
      let nextPower = powerRef.current;
      if (lit) {
        nextPower += isMesraRakyat ? 0.95 : 0.75;
      } else {
        nextPower -= 0.2;
      }

      if (boxTampered) {
        nextPower = Math.max(0, nextPower - 8);
        rhythmAudio.playSkrrtMiss();
        setTamperWarning(
          t("⚠️ TANGAN GHAIB HAMPIRI PETI UNDI!", "⚠️ SHADOW HAND TOUCHED BALLOT BOX!")
        );
        setTimeout(() => setTamperWarning(null), 800);
      }

      nextPower = Math.max(0, Math.min(100, nextPower));
      powerRef.current = nextPower;

      // Sync state
      setLightPos({ ...lightRef.current });
      setBoxPos(nextBox);
      setIsIlluminated(lit);
      setHands([...updatedHands]);
      setGeneratorPower(Math.round(nextPower));

      if (nextPower >= 100 && !finishedRef.current) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isMesraRakyat, onComplete]);

  return (
    <div className="space-y-2 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono comic-shadow-sm">
        <div className="flex items-center gap-1.5 font-bold">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-amber-400">
            {t("GENERATOR KECEMASAN (GENSET):", "EMERGENCY GENERATOR (GENSET):")}
          </span>
          <span>{generatorPower}% / 100%</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded border ${
              isIlluminated
                ? "bg-emerald-950 text-emerald-400 border-emerald-500"
                : "bg-rose-950 text-rose-400 border-rose-500 animate-pulse"
            }`}
          >
            {isIlluminated
              ? t("PETI DISULUH! ✅", "BOX ILLUMINATED! ✅")
              : t("PETI DALAM GELAP! ⚠️", "BOX IN THE DARK! ⚠️")}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border-2 border-slate-950">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-75"
          style={{ width: `${generatorPower}%` }}
        />
      </div>

      {/* Dark Counting Hall Arena */}
      <div
        ref={arenaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative h-56 bg-slate-950 rounded-2xl border-4 border-slate-900 overflow-hidden cursor-crosshair touch-none comic-shadow"
      >
        {/* Pitch Black Dark Vignette */}
        <div className="absolute inset-0 bg-black/90 pointer-events-none" />

        {/* Flashlight Beam Light Circle */}
        <div
          style={{
            left: `${lightPos.x}%`,
            top: `${lightPos.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full pointer-events-none transition-all duration-75 ${
            isIlluminated
              ? "bg-amber-300/35 shadow-[0_0_80px_rgba(251,191,36,0.6)]"
              : "bg-white/20 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
          }`}
        />

        {/* Transparent Peti Undi SPR */}
        <div
          style={{
            left: `${boxPos.x}%`,
            top: `${boxPos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-10"
        >
          <div className="w-16 h-16 rounded-xl border-3 border-amber-300 bg-amber-400/30 backdrop-blur-xs flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            🗳️
          </div>
          <span className="text-[8px] font-mono font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full border border-slate-950 mt-0.5">
            {t("PETI UNDI SPR (LUTSINAR)", "BALLOT BOX (PETI UNDI SPR)")}
          </span>
        </div>

        {/* Sneaky Shadow Hands */}
        {hands.map((h) => (
          <div
            key={h.id}
            onClick={(e) => handleZapHand(h.id, e)}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl cursor-pointer hover:scale-125 transition-transform z-20 animate-pulse"
          >
            🖐️
          </div>
        ))}

        {/* Flashlight Icon at player pos */}
        <div
          style={{ left: `${lightPos.x}%`, top: `${lightPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 opacity-70"
        >
          <Flashlight className="w-6 h-6 text-amber-300 drop-shadow" />
        </div>

        {/* Tamper Warning */}
        {tamperWarning && (
          <div className="absolute top-2 inset-x-2 text-center pointer-events-none z-40 animate-shake">
            <span className="bg-rose-600 text-white font-black text-[10px] px-3 py-1 rounded-full border-2 border-slate-950 shadow">
              {tamperWarning}
            </span>
          </div>
        )}
      </div>

      <div className="text-[11px] font-bold text-slate-700 text-center font-mono">
        {t(
          "🔦 Halakan lampu picit (seret atau guna kekunci WASD / Panah) untuk suluh Peti Undi & tepuk tangan ghaib hingga generator pulih!",
          "🔦 Aim flashlight (drag or WASD / Arrow keys) to keep Ballot Box illuminated & zap sneaky hands until generator restores power!"
        )}
      </div>
    </div>
  );
}
