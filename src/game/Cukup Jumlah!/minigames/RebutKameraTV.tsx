import React, { useEffect, useRef, useState, useCallback } from "react";
import { rhythmAudio } from "../rhythm";
import { Camera, Zap, Sparkles } from "lucide-react";
import { useLanguage } from "../languageContext";

interface RebutKameraTVProps {
  isMesraRakyat?: boolean;
  onComplete: (success: boolean) => void;
}

export function RebutKameraTVGame({ isMesraRakyat = false, onComplete }: RebutKameraTVProps) {
  const { t } = useLanguage();
  // Start player away from camera at 0% exposure
  const [playerPos, setPlayerPos] = useState({ x: 20, y: 75 });
  const [camPos, setCamPos] = useState({ x: 75, y: 30 });
  const [rival1Pos, setRival1Pos] = useState({ x: 72, y: 32 });
  const [rival2Pos, setRival2Pos] = useState({ x: 30, y: 25 });
  const [exposure, setExposure] = useState(0);
  const [isInFrame, setIsInFrame] = useState(false);
  const [shoveNotice, setShoveNotice] = useState<string | null>(null);
  const [shoveCooldown, setShoveCooldown] = useState(false);
  const [flashCountdown, setFlashCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [headlineNotice, setHeadlineNotice] = useState<string | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef({ x: 20, y: 75 });
  const camRef = useRef({ x: 75, y: 30 });
  const camTargetRef = useRef({ x: 30, y: 35 });
  const rival1Ref = useRef({ x: 72, y: 32 });
  const rival2Ref = useRef({ x: 30, y: 25 });
  const exposureRef = useRef(0);
  const keysPressedRef = useRef<Set<string>>(new Set());
  const finishedRef = useRef(false);
  const nextFlashTimeRef = useRef(4.0); // seconds until next paparazzi flash

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current.add(e.key.toLowerCase());
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handleShoveRival();
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

  const movePlayerTo = (clientX: number, clientY: number) => {
    if (finishedRef.current || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(88, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(16, Math.min(84, ((clientY - rect.top) / rect.height) * 100));
    playerRef.current = { x, y };
    setPlayerPos({ x, y });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    movePlayerTo(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || e.pointerType === "touch") {
      movePlayerTo(e.clientX, e.clientY);
    }
  };

  // Dash & shove both rivals out of the camera's path
  const handleShoveRival = useCallback(() => {
    if (finishedRef.current || shoveCooldown) return;
    rhythmAudio.playStampSlam();
    setShoveCooldown(true);
    setTimeout(() => setShoveCooldown(false), 1200);

    // Knock rival 1
    const knocked1 = {
      x: camRef.current.x > 50 ? 10 : 90,
      y: camRef.current.y > 50 ? 15 : 85,
    };
    rival1Ref.current = knocked1;
    setRival1Pos(knocked1);

    // Knock rival 2 opposite
    const knocked2 = {
      x: camRef.current.x > 50 ? 90 : 10,
      y: camRef.current.y > 50 ? 85 : 15,
    };
    rival2Ref.current = knocked2;
    setRival2Pos(knocked2);

    // Nudge player toward camera
    const dx = camRef.current.x - playerRef.current.x;
    const dy = camRef.current.y - playerRef.current.y;
    const nextP = {
      x: Math.max(12, Math.min(88, playerRef.current.x + dx * 0.45)),
      y: Math.max(16, Math.min(84, playerRef.current.y + dy * 0.45)),
    };
    playerRef.current = nextP;
    setPlayerPos(nextP);

    setShoveNotice(
      t("SIKU DUA-DUA LAWAN! FRAME BERSIH! 💥", "ELBOWED BOTH RIVALS! FRAME IS CLEAR! 💥")
    );
    setTimeout(() => setShoveNotice(null), 800);
  }, [shoveCooldown, t]);

  // Main simulation loop
  useEffect(() => {
    const tickMs = 50;
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      // 0. Keyboard steering
      const keys = keysPressedRef.current;
      let kx = 0;
      let ky = 0;
      if (keys.has("arrowleft") || keys.has("a")) kx -= 3.0;
      if (keys.has("arrowright") || keys.has("d")) kx += 3.0;
      if (keys.has("arrowup") || keys.has("w")) ky -= 3.0;
      if (keys.has("arrowdown") || keys.has("s")) ky += 3.0;
      if (kx !== 0 || ky !== 0) {
        playerRef.current = {
          x: Math.max(12, Math.min(88, playerRef.current.x + kx)),
          y: Math.max(16, Math.min(84, playerRef.current.y + ky)),
        };
      }

      // 1. Camera Viewfinder Drifting
      const curCam = camRef.current;
      const cdx = camTargetRef.current.x - curCam.x;
      const cdy = camTargetRef.current.y - curCam.y;
      const cDist = Math.hypot(cdx, cdy);

      if (cDist < 6) {
        camTargetRef.current = {
          x: 20 + Math.random() * 60,
          y: 22 + Math.random() * 56,
        };
      }

      const camSpeed = 1.9;
      const nextCam = {
        x: curCam.x + (cdx / Math.max(1, cDist)) * camSpeed,
        y: curCam.y + (cdy / Math.max(1, cDist)) * camSpeed,
      };
      camRef.current = nextCam;

      // 2. Rival 1 (Opponent) tracks camera closely
      const curR1 = rival1Ref.current;
      const r1dx = nextCam.x - curR1.x;
      const r1dy = nextCam.y - curR1.y;
      const r1Dist = Math.hypot(r1dx, r1dy);
      const nextR1 = {
        x: curR1.x + (r1dx / Math.max(1, r1Dist)) * 1.6,
        y: curR1.y + (r1dy / Math.max(1, r1Dist)) * 1.6,
      };
      rival1Ref.current = nextR1;

      // Rival 2 (Independent) wanders and cuts in
      const curR2 = rival2Ref.current;
      const r2dx = nextCam.x - curR2.x;
      const r2dy = nextCam.y - curR2.y;
      const r2Dist = Math.hypot(r2dx, r2dy);
      const nextR2 = {
        x: curR2.x + (r2dx / Math.max(1, r2Dist)) * 1.35 + (Math.random() - 0.5) * 1.5,
        y: curR2.y + (r2dy / Math.max(1, r2Dist)) * 1.35 + (Math.random() - 0.5) * 1.5,
      };
      rival2Ref.current = nextR2;

      // 3. Collision pushing player
      const pDist1 = Math.hypot(playerRef.current.x - nextR1.x, playerRef.current.y - nextR1.y);
      if (pDist1 < 12) {
        const pushAngle = Math.atan2(playerRef.current.y - nextR1.y, playerRef.current.x - nextR1.x);
        playerRef.current = {
          x: Math.max(10, Math.min(90, playerRef.current.x + Math.cos(pushAngle) * 8)),
          y: Math.max(16, Math.min(84, playerRef.current.y + Math.sin(pushAngle) * 8)),
        };
      }

      // 4. In Frame Check
      const frameRadius = isMesraRakyat ? 22 : 18;
      const playerToCam = Math.hypot(playerRef.current.x - nextCam.x, playerRef.current.y - nextCam.y);
      const inside = playerToCam <= frameRadius;

      // Accumulate airtime (~10-12s of good framing)
      const baseGain = inside ? (isMesraRakyat ? 0.95 : 0.8) : -0.25;
      let nextExp = Math.max(0, Math.min(100, exposureRef.current + baseGain));

      // 5. Paparazzi Flash Mechanism
      nextFlashTimeRef.current -= tickMs / 1000;
      if (nextFlashTimeRef.current <= 1.5 && nextFlashTimeRef.current > 0) {
        setFlashCountdown(Math.ceil(nextFlashTimeRef.current));
      } else if (nextFlashTimeRef.current <= 0) {
        // FLASH OCCURS!
        setIsFlashing(true);
        rhythmAudio.playStampSlam();
        setTimeout(() => setIsFlashing(false), 220);

        if (inside) {
          nextExp = Math.min(100, nextExp + 20); // Big bonus!
          setHeadlineNotice(
            t("📸 MUKA DEPAN AKHBAR UTAMA! (+20%) ✨", "📸 MAIN FRONT PAGE HEADLINE! (+20%) ✨")
          );
          rhythmAudio.playPaduSuccess();
        } else {
          setHeadlineNotice(
            t("📸 TERLEPAS FLASH WARTAWAN! 📰", "📸 MISSED PRESS FLASH! 📰")
          );
        }
        setTimeout(() => setHeadlineNotice(null), 1200);

        // Schedule next flash in 4.5 to 5.5 seconds
        nextFlashTimeRef.current = 4.5 + Math.random();
        setFlashCountdown(null);
      } else {
        setFlashCountdown(null);
      }

      exposureRef.current = nextExp;

      // Sync React state
      setPlayerPos({ ...playerRef.current });
      setCamPos(nextCam);
      setRival1Pos(nextR1);
      setRival2Pos(nextR2);
      setIsInFrame(inside);
      setExposure(nextExp);

      if (nextExp >= 100 && !finishedRef.current) {
        finishedRef.current = true;
        rhythmAudio.playPaduSuccess();
        setTimeout(() => onComplete(true), 400);
      }
    }, tickMs);

    return () => clearInterval(interval);
  }, [isMesraRakyat, onComplete]);

  return (
    <div className="space-y-2 select-none">
      {/* Live Broadcast Header & Airtime Progress */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl border-2 border-slate-950 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-black text-red-400">
            {t("SIARAN LANGSUNG TV", "LIVE TV BROADCAST")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {flashCountdown !== null && (
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded animate-bounce">
              {t(`📸 KILAT DALAM ${flashCountdown}s!`, `📸 FLASH IN ${flashCountdown}s!`)}
            </span>
          )}
          <span className="font-black text-amber-400">
            {t("MASA KEUDARAAN TV:", "TV AIRTIME:")} {Math.round(exposure)}% / 100%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border-2 border-slate-950">
        <div
          className={`h-full rounded-full transition-all duration-75 ${
            isInFrame ? "bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-500" : "bg-rose-500"
          }`}
          style={{ width: `${exposure}%` }}
        />
      </div>

      {/* Interactive Press Scrum Arena */}
      <div
        ref={arenaRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative h-56 bg-slate-800 rounded-2xl border-4 border-slate-900 overflow-hidden cursor-crosshair touch-none shadow-inner"
      >
        {/* Flash whiteout overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-fade-out opacity-90 flex items-center justify-center">
            <span className="text-4xl">📸💥</span>
          </div>
        )}

        {/* Backdrop Press Microphones & Banners */}
        <div className="absolute inset-x-0 top-1 text-center pointer-events-none opacity-20 text-[9px] font-mono text-slate-400">
          {t("SIDANG MEDIA CALON-CALON PRU PARLIMEN", "PARLIAMENTARY ELECTION CANDIDATES PRESS CONFERENCE")}
        </div>
        <div className="absolute bottom-1 inset-x-0 flex justify-around text-xl opacity-40 pointer-events-none">
          <span>🎙️</span>
          <span>📹</span>
          <span>🎙️</span>
          <span>📸</span>
          <span>🎙️</span>
          <span>🎥</span>
          <span>🎙️</span>
        </div>

        {/* Drifting TV Camera Viewfinder Box */}
        <div
          style={{
            left: `${camPos.x}%`,
            top: `${camPos.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 w-32 h-26 rounded-2xl border-4 pointer-events-none transition-all duration-75 flex flex-col justify-between p-1.5 z-10 ${
            isInFrame
              ? "border-emerald-400 bg-emerald-400/20 shadow-[0_0_25px_rgba(52,211,153,0.5)] scale-105"
              : "border-rose-500 border-dashed bg-rose-500/10"
          }`}
        >
          <div className="flex items-center justify-between text-[8px] font-mono font-black">
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Camera className="w-2.5 h-2.5" /> ● REC
            </span>
            <span className="text-white bg-slate-950/80 px-1 rounded">TV1 / ASTRO</span>
          </div>
          <div className="text-center text-[9px] font-mono font-bold text-amber-300">
            {isInFrame
              ? t("✨ MUKA YB DI TENGAH FRAME! ✨", "✨ YB FACE IN CENTER FRAME! ✨")
              : t("⚠️ KEJAR KOTAK INI!", "⚠️ CHASE THIS FRAME!")}
          </div>
        </div>

        {/* Rival 1: Opponent */}
        <div
          style={{
            left: `${rival1Pos.x}%`,
            top: `${rival1Pos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center transition-transform duration-75"
        >
          <div className="w-11 h-11 rounded-full bg-rose-600 border-2 border-slate-950 flex items-center justify-center text-xl shadow">
            🤵‍♂️
          </div>
          <span className="text-[8px] font-mono font-black bg-rose-950 text-rose-200 px-1.5 rounded border border-rose-500">
            {t("Calon Lawan", "Rival Candidate")}
          </span>
        </div>

        {/* Rival 2: Independent Photobomber */}
        <div
          style={{
            left: `${rival2Pos.x}%`,
            top: `${rival2Pos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center transition-transform duration-75"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-lg shadow">
            🙋
          </div>
          <span className="text-[8px] font-mono font-black bg-indigo-950 text-indigo-200 px-1 rounded border border-indigo-400">
            {t("Calon Bebas", "Independent Candidate")}
          </span>
        </div>

        {/* Player YB Avatar */}
        <div
          style={{
            left: `${playerPos.x}%`,
            top: `${playerPos.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-20 transition-transform duration-75"
        >
          <div className="w-12 h-12 rounded-full bg-amber-400 border-3 border-slate-950 flex items-center justify-center text-2xl shadow-xl">
            😁✌️
          </div>
          <span className="text-[9px] font-mono font-black bg-slate-950 text-amber-300 px-2 py-0.2 rounded-full border border-amber-400">
            {t("YB ANDA", "YOUR YB")}
          </span>
        </div>

        {/* Notices */}
        {shoveNotice && (
          <div className="absolute top-2 inset-x-0 text-center pointer-events-none z-30">
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 rounded-full border-2 border-slate-950 shadow-md">
              {shoveNotice}
            </span>
          </div>
        )}

        {headlineNotice && (
          <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none z-30 animate-bounce">
            <span className="bg-red-600 text-white font-black text-xs px-3.5 py-1 rounded-full border-2 border-slate-950 shadow-lg flex items-center justify-center gap-1.5 w-fit mx-auto">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {headlineNotice}
            </span>
          </div>
        )}
      </div>

      {/* Controls & Action Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-slate-700 leading-tight">
          {t(
            "👆 Seret / Klik dalam kotak atau guna WASD. Kekal dalam lensa bila jurugambar pancar kilat!",
            "👆 Drag / Click in box or use WASD. Stay inside the camera when paparazzi flash!"
          )}
        </div>
        <button
          type="button"
          disabled={shoveCooldown}
          onClick={handleShoveRival}
          className={`px-3 py-2 font-black text-xs rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer shrink-0 uppercase transition flex items-center gap-1.5 ${
            shoveCooldown
              ? "bg-slate-400 text-slate-700"
              : "bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>
            {shoveCooldown
              ? t("COOLDOWN...", "COOLDOWN...")
              : t("💪 SIKU LAWAN KE TEPI! (SPACE)", "💪 ELBOW RIVALS OUT! (SPACE)")}
          </span>
        </button>
      </div>
    </div>
  );
}
