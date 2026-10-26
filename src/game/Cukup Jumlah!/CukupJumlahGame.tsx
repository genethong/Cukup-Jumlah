import { useEffect, useRef, useState } from "react";
import {
  Trophy,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  Share2,
} from "lucide-react";
import type { CandidateProfile, GameScreen, MicrogameId } from "./types";
import { PARTIES } from "./types";
import { YbCustomizer } from "./YbCustomizer";
import { SemakBorangGame } from "./minigames/SemakBorang";
import { BayarDepositGame } from "./minigames/BayarDeposit";
import { CopWatikahGame } from "./minigames/CopWatikah";
import { GorengKueyTeowGame } from "./minigames/GorengKueyTeow";
import { PotongRebenGame } from "./minigames/PotongReben";
import { PayungBosGame } from "./minigames/PayungBos";
import { PacakBenderaGame } from "./minigames/PacakBendera";
import { CONSTITUTION_FACTS } from "./facts";
import { drawPixelCandidate } from "./pixelAvatar";
import { ActShareCardModal } from "./ActShareCardModal";
import { SekolahFrame } from "./SekolahFrame";
import { rhythmAudio } from "./rhythm";

const RHYTHMIC_CALLS: Record<MicrogameId, { call: string[]; hit: string }> = {
  semak_borang: {
    call: ["BORANG...", "...KERTAS...", "...KELAYAKAN?!"],
    hit: "IMBAS SEKARANG! 📑",
  },
  bayar_deposit: {
    call: ["KIRA...", "...TEPAT...", "...RM10,000?!"],
    hit: "BAYAR DEPOSIT! 💵",
  },
  cop_watikah: {
    call: ["ANGKAT...", "...SURAT...", "...WATIKAH?!"],
    hit: "COP TEPAT! 📑",
  },
  goreng_kueyteow: {
    call: ["KACAU...", "...KUALI...", "...PANAS?!"],
    hit: "KACAU LAJU-LAJU! 🥢",
  },
  potong_reben: {
    call: ["SIAP...", "...SEDIA...", "...GUNTING?!"],
    hit: "POTONG REBEN! ✂️",
  },
  payung_bos: {
    call: ["JAGA...", "...HUJAN...", "...BOS VIP?!"],
    hit: "PAYUNG RAPAT! ☂️",
  },
  pacak_bendera: {
    call: ["IKAT...", "...TIANG...", "...LAMPU?!"],
    hit: "PACAK BENDERA! 🚩",
  },
};

const MICROGAMES_ACT1: { id: MicrogameId; prompt: string; subtext: string }[] = [
  {
    id: "semak_borang",
    prompt: "IMBAS KELAYAKAN!",
    subtext: "Luluskan yang layak, tolak yang muflis & bawah 18 tahun!",
  },
  {
    id: "bayar_deposit",
    prompt: "KIRA DEPOSIT TEPAT!",
    subtext: "Tap ikatan wang tunai tepat RM10,000!",
  },
  {
    id: "cop_watikah",
    prompt: "COP SURAT WATIKAH!",
    subtext: "Ketuk cop parti tepat di dalam ruang dokumen!",
  },
];

const MICROGAMES_ACT2: { id: MicrogameId; prompt: string; subtext: string }[] = [
  {
    id: "goreng_kueyteow",
    prompt: "KACAU KUALI!",
    subtext: "Kacau laju-laju untuk sesi bergambar depan wartawan!",
  },
  {
    id: "potong_reben",
    prompt: "GUNTING REBEN!",
    subtext: "Rasmikan projek cat tiang lampu jalan!",
  },
  {
    id: "payung_bos",
    prompt: "PAYUNGKAN VIP!",
    subtext: "Selaraskan payung agar bos tidak terkena air hujan!",
  },
  {
    id: "pacak_bendera",
    prompt: "IKAT BENDERA!",
    subtext: "Gantung bendera parti sebelum jam 11:59 malam!",
  },
];

export function CukupJumlahGame() {
  const [screen, setScreen] = useState<GameScreen>("customizer");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  // Gameplay state
  const [lives, setLives] = useState(3); // 3 Wang Deposit
  const [seatsWon, setSeatsWon] = useState(0); // Kerusi Parliamen
  const [currentAct, setCurrentAct] = useState(1);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isReadyPhase, setIsReadyPhase] = useState(true); // 1.5s reading window before timer starts
  const [timeLeft, setTimeLeft] = useState(8.0); // Generous 8.0s relaxed timer window
  const [lastGameSuccess, setLastGameSuccess] = useState<boolean | null>(null);
  const [showFactModal, setShowFactModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // 125 BPM Rhythm State & Sound
  const [currentBeat, setCurrentBeat] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      rhythmAudio.setMuted(next);
      return next;
    });
  };

  // 125 BPM Metronome Ticker for Active Microgame
  useEffect(() => {
    if (screen !== "microgame") return;

    const beatInterval = setInterval(() => {
      setCurrentBeat((prev) => {
        const next = (prev % 4) + 1;
        rhythmAudio.playBeatSound(next);
        return next;
      });
    }, 480); // 125 BPM = 480ms per beat

    return () => clearInterval(beatInterval);
  }, [screen]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw small avatar preview in HUD
  useEffect(() => {
    if (!profile) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPixelCandidate(ctx, profile, canvas.width / 2, canvas.height - 8, 2.0);
  }, [profile, screen]);

  // Handle timer countdown during active microgame with a "GET READY" pause
  useEffect(() => {
    if (screen !== "microgame") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // 1. Give player 1.5s breathing room to read the instructions first!
    setIsReadyPhase(true);
    setTimeLeft(8.0);

    const readyTimer = setTimeout(() => {
      setIsReadyPhase(false);

      // 2. Then start the relaxed 8.0s countdown
      const step = 0.05;
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= step) {
            handleMicrogameComplete(false);
            return 0;
          }
          return prev - step;
        });
      }, 50);
    }, 1500);

    return () => {
      clearTimeout(readyTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, currentGameIndex, currentAct]);

  const handleStartGame = (createdProfile: CandidateProfile) => {
    setProfile(createdProfile);
    // Buff: Muka Tembok gets 4 lives
    setLives(createdProfile.talent === "muka_tembok" ? 4 : 3);
    setSeatsWon(0);
    setCurrentAct(1);
    setCurrentGameIndex(0);
    setScreen("act1_intro");
  };

  const handleStartAct1 = () => {
    setCurrentAct(1);
    setCurrentGameIndex(0);
    setScreen("microgame");
  };

  const handleStartAct2 = () => {
    setCurrentAct(2);
    setCurrentGameIndex(0);
    setScreen("microgame");
  };

  const handleMicrogameComplete = (success: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLastGameSuccess(success);

    if (success) {
      setSeatsWon((prev) => prev + 5);
      rhythmAudio.playPaduSuccess();
    } else {
      setLives((prev) => Math.max(0, prev - 1));
      rhythmAudio.playStampSlam();
      setTimeout(() => rhythmAudio.playSkrrtMiss(), 120);
    }

    setScreen("microgame_result");
  };

  const activeMicrogameList = currentAct === 1 ? MICROGAMES_ACT1 : MICROGAMES_ACT2;

  const handleNextMicrogame = () => {
    if (lives <= 0) {
      setScreen("game_over");
      return;
    }

    const nextIndex = currentGameIndex + 1;
    if (nextIndex < activeMicrogameList.length) {
      setCurrentGameIndex(nextIndex);
      setScreen("microgame");
    } else {
      if (currentAct === 1) {
        setScreen("act1_complete");
        setShowShareModal(true);
      } else {
        setScreen("act2_complete");
        setShowShareModal(true);
      }
    }
  };

  const currentMicrogame = activeMicrogameList[currentGameIndex];
  const partyInfo = profile ? PARTIES[profile.party] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header / HUD Bar (Hidden during microgame so SekolahFrame takes full focus) */}
      {screen !== "microgame" && (
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile && (
                <div className="w-10 h-11 rounded-lg bg-[#fbf5e5] border-2 border-slate-900 flex items-center justify-center overflow-hidden p-0.5">
                  <span className="text-xl">🧔🏾‍♂️</span>
                </div>
              )}
              <div>
                <div className="text-xs font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                  CUKUP JUMLAH!
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {profile ? profile.name : "Kandidat Belum Berdaftar"}
                  {partyInfo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-black text-white" style={{ backgroundColor: partyInfo.themeColor === "#F8FAFC" ? "#475569" : partyInfo.themeColor }}>
                      {partyInfo.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Kerusi & Deposit Counters */}
            {screen !== "customizer" && (
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                  <span className="text-amber-400">Kerusi:</span>
                  <span className="text-white font-mono text-sm">{seatsWon} / 112</span>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
                  <span className="text-emerald-400">Deposit:</span>
                  <div className="flex gap-1 text-base">
                    {Array.from({ length: lives }).map((_, i) => (
                      <span key={i}>💵</span>
                    ))}
                    {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
                      <span key={i} className="opacity-30 grayscale">
                        💸
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Screen Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col justify-center">
        {screen === "customizer" && (
          <YbCustomizer onStartGame={handleStartGame} />
        )}

        {screen === "act1_intro" && profile && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
              BAB 1: HARI PENAMAAN CALON
            </div>
            <h2 className="text-2xl font-black text-white">
              Pusat Penamaan Calon SPR Dibuka!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dewan Rakyat telah dibubarkan! Anda tiba di pusat penamaan calon tepat jam 9:00 pagi.
              Selesaikan 3 tugas kilat dalam masa 4.5 saat setiap satu untuk melayakkan diri!
            </p>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="text-amber-400 font-bold">Misi Pantas Bab 1:</div>
              <div>1. Semak Borang Kelayakan (Perkara 47/48)</div>
              <div>2. Bayar Deposit RM10,000 (Seksyen 19)</div>
              <div>3. Cop Surat Watikah Parti</div>
            </div>

            <button
              onClick={handleStartAct1}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              MULAKAN MISI! (MASUK DEWAN SPR)
            </button>
          </div>
        )}

        {screen === "microgame" && currentMicrogame && (
          <SekolahFrame
            profile={profile}
            lives={lives}
            seatsWon={seatsWon}
            timeLeft={timeLeft}
            isReadyPhase={isReadyPhase}
            currentBeat={currentBeat}
            rhythmicCueText={
              currentBeat === 4
                ? RHYTHMIC_CALLS[currentMicrogame.id]?.hit || "TAP SEKARANG! 💥"
                : RHYTHMIC_CALLS[currentMicrogame.id]?.call[currentBeat - 1] || "..."
            }
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          >
            {/* Comic Header Prompt */}
            <div className="text-center mb-3 border-b-2 border-slate-900 pb-2">
              <div className="inline-block px-3 py-1 bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {currentMicrogame.prompt}
              </div>
              <p className="text-xs text-slate-800 font-bold">{currentMicrogame.subtext}</p>
            </div>

            {/* Active Microgame Render */}
            <div className={`transition-opacity duration-200 ${isReadyPhase ? "opacity-75 pointer-events-none" : "opacity-100"}`}>
              {currentMicrogame.id === "semak_borang" && (
                <SemakBorangGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "bayar_deposit" && (
                <BayarDepositGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "cop_watikah" && profile && (
                <CopWatikahGame
                  partyId={profile.party}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "goreng_kueyteow" && (
                <GorengKueyTeowGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "potong_reben" && (
                <PotongRebenGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "payung_bos" && (
                <PayungBosGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "pacak_bendera" && profile && (
                <PacakBenderaGame
                  partyId={profile.party}
                  onComplete={handleMicrogameComplete}
                />
              )}
            </div>
          </SekolahFrame>
        )}

        {screen === "microgame_result" && (
          <div className="max-w-md mx-auto text-center bg-[#fbf5e5] text-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
            {/* Comic Caricature Stamp Badge */}
            {lastGameSuccess ? (
              <div className="space-y-3">
                <div className="inline-block border-4 border-emerald-600 bg-emerald-100 px-6 py-2 rounded-2xl rotate-[-4deg] shadow-[4px_4px_0px_0px_rgba(5,150,105,1)]">
                  <div className="text-2xl md:text-3xl font-black text-emerald-800 uppercase tracking-wider">
                    SAH & LULUS! ✅
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-700">
                    +5 KERUSI PARLIMEN DI TANGAN!
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold max-w-xs mx-auto leading-relaxed">
                  "Padu YB! Sorakan bergema di bilik darjah. Langkah seterusnya makin hampir ke Seri Perdana!"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-block border-4 border-red-600 bg-red-100 px-6 py-2 rounded-2xl rotate-[4deg] shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                  <div className="text-2xl md:text-3xl font-black text-red-800 uppercase tracking-wider">
                    HILANG DEPOSIT! 💸
                  </div>
                  <div className="text-[10px] font-mono font-bold text-red-700">
                    LEBUR RM10,000 WANG PENAMAAN CALON!
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold max-w-xs mx-auto leading-relaxed">
                  "Aduhai YB! Pegawai Pengurus SPR menggeleng kepala. Jaga-jaga, baki wang deposit makin susut!"
                </p>
              </div>
            )}

            <button
              onClick={handleNextMicrogame}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:translate-x-1 active:translate-y-1 active:shadow-none text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer uppercase tracking-wider"
            >
              TERUSKAN KEMBARA PRU ➔
            </button>
          </div>
        )}

        {screen === "act1_complete" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">
              PENCALONAN DITERIMA RASMI!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tahniah <span className="font-bold text-amber-400">{profile?.name}</span>! Pegawai
              Pengurus SPR telah mengesahkan kertas penamaan calon anda. Anda kini sah bertanding dalam PRU!
            </p>

            {/* Constitution Education Spotlight */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> Fakta Sah Perlembagaan (Bab 1)
              </div>
              <div className="text-xs font-bold text-white">
                {CONSTITUTION_FACTS.act1_eligibility.article}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {CONSTITUTION_FACTS.act1_eligibility.didYouKnow}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowShareModal(true)}
                className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Buka Kad Watikah (Kongsi)
              </button>

              <button
                onClick={() => setScreen("act2_intro")}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Masuk Bab 2: Tempoh Kempen ➔
              </button>
            </div>
          </div>
        )}

        {screen === "act2_intro" && profile && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
              BAB 2: TEMPOH BERKEMPEN (14 HARI)
            </div>
            <h2 className="text-2xl font-black text-white">
              Turun Padang Rayu Undi!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pilihan raya kini bermula secara rasmi! Masa untuk turun padang, bersalaman, goreng kuey teow di pasar malam, dan gantung bendera parti sebelum jam 11:59 malam!
            </p>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="text-amber-400 font-bold">Misi Pantas Bab 2:</div>
              <div>1. Goreng Kuey Teow (Photo-op Pasar Malam)</div>
              <div>2. Potong Reben (Perasmian Cat Tiang Lampu)</div>
              <div>3. Payungkan VIP (Dodge Hujan Lebat)</div>
              <div>4. Pacak Bendera Parti (Sebelum 11:59 PM)</div>
            </div>

            <button
              onClick={handleStartAct2}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              MULAKAN JELAJAH KEMPEN! 🚗💨
            </button>
          </div>
        )}

        {screen === "act2_complete" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border border-amber-500/30 text-3xl">
              🍜
            </div>
            <h2 className="text-2xl font-black text-white">
              TEMPOH KEMPEN TAMAT! (11:59 PM)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tahniah <span className="font-bold text-amber-400">{profile?.name}</span>! Anda berjaya mengharungi 14 hari kempen yang penuh dengan bau gorengan kuey teow dan hujan lebat.
            </p>

            {/* Constitution Education Spotlight */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> Fakta Sah Perlembagaan & Akta (Bab 2)
              </div>
              <div className="text-xs font-bold text-white">
                {CONSTITUTION_FACTS.act2_campaign.article}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {CONSTITUTION_FACTS.act2_campaign.didYouKnow}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowShareModal(true)}
                className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Buka Poster Kempen (Kongsi)
              </button>

              <button
                onClick={() => {
                  alert("Tahniah menamatkan Bab 1 & Bab 2! Bab 3 (Hari Mengundi) akan datang!");
                  setScreen("customizer");
                }}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Main Semula 🔄
              </button>
            </div>
          </div>
        )}

        {screen === "game_over" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-rose-900/40 shadow-2xl space-y-4">
            <div className="text-5xl">💸</div>
            <h2 className="text-3xl font-black text-rose-500">
              HILANG DEPOSIT! (GAME OVER)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Semua 3 wang deposit anda telah hangus kepada kerajaan akibat kesilapan di pusat penamaan calon!
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1 text-slate-400">
              <div className="text-rose-400 font-bold">Seksyen 19 Akta Kesalahan Pilihan Raya 1954:</div>
              <div>"Wang deposit RM10,000 akan dirampas dan menjadi hak milik kerajaan sekiranya gagal mematuhi syarat atau meraih 1/8 undi."</div>
            </div>

            <button
              onClick={() => setScreen("customizer")}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> CUBA LAGI DENGAN CALON BARU
            </button>
          </div>
        )}
      </main>

      {/* Share Card Modal */}
      {showShareModal && profile && (
        <ActShareCardModal
          profile={profile}
          actNumber={currentAct}
          actTitle={currentAct === 1 ? "Hari Penamaan Calon" : "Tempoh Berkempen"}
          seatsWon={seatsWon}
          livesRemaining={lives}
          onContinue={() => {
            setShowShareModal(false);
            if (currentAct === 1) {
              setScreen("act2_intro");
            }
          }}
        />
      )}

      {/* Footer Disclaimer (Legal & Parody Shield) */}
      <footer className="border-t border-slate-900 px-4 py-3 text-center text-[11px] text-slate-400 bg-slate-950">
        <p>
          ⚖️ <span className="font-semibold text-slate-300">Cukup Jumlah!</span> adalah karya satira fiksyen & pendidikan sivik. Tiada kaitan dengan parti atau individu sebenar.
          Semua fakta undang-undang adalah berpandukan teks rasmi Perlembagaan Persekutuan Malaysia.
        </p>
      </footer>
    </div>
  );
}
