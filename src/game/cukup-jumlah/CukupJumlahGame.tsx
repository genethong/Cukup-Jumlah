import { useEffect, useRef, useState } from "react";
import { Trophy, RotateCcw, BookOpen, Share2 } from "lucide-react";
import type { CandidateProfile, GameScreen, MicrogameId, TalentType, QuirkType } from "./types";
import { PARTIES } from "./types";
import { YbCustomizer } from "./YbCustomizer";
import { SemakBorangGame } from "./minigames/SemakBorang";
import { BayarDepositGame } from "./minigames/BayarDeposit";
import { CopWatikahGame } from "./minigames/CopWatikah";
import { PecutDewanSPRGame } from "./minigames/PecutDewanSPR";
import { RebutKameraTVGame } from "./minigames/RebutKameraTV";
import { GorengKueyTeowGame } from "./minigames/GorengKueyTeow";
import { PotongRebenGame } from "./minigames/PotongReben";
import { PayungBosGame } from "./minigames/PayungBos";
import { PacakBenderaGame } from "./minigames/PacakBendera";
import { PerangSpeakerGame } from "./minigames/PerangSpeaker";
import { TurapJalanKilatGame } from "./minigames/TurapJalanKilat";
import { BalingBajuKempenGame } from "./minigames/BalingBajuKempen";
import { CuciLongkangGame } from "./minigames/CuciLongkang";
import { CelupDakwatKekalGame } from "./minigames/CelupDakwatKekal";
import { TapisUndiRosakGame } from "./minigames/TapisUndiRosak";
import { BlackoutPetiUndiGame } from "./minigames/BlackoutPetiUndi";
import { Borang14Game } from "./minigames/Borang14";
import { RundingPerpaduanGame } from "./minigames/RundingPerpaduan";
import { EndgameScreen } from "./EndgameScreen";
import { LevelSelectModal } from "./LevelSelectModal";
import { CONSTITUTION_FACTS } from "./facts";
import { drawPixelCandidate } from "./pixelAvatar";
import { VoxelSinglePreview } from "./voxel/VoxelSinglePreview";
import { ActShareCardModal } from "./ActShareCardModal";
import { SekolahFrame } from "./SekolahFrame";
import { rhythmAudio } from "./rhythm";
import { LanguageProvider, useLanguage } from "./languageContext";

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
  pecut_spr: {
    call: ["JAM...", "...SEMBILAN...", "...LIMA PULUH SEMBILAN?!"],
    hit: "PECUT MASUK SPR! 🏃🏾‍♂️",
  },
  rebut_kamera: {
    call: ["KAMERA...", "...BERITA...", "...SIARAN LANGSUNG?!"],
    hit: "REBUT FRAME TV! 📹",
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
  perang_speaker: {
    call: ["PASAR...", "...MALAM...", "...KHEMAH SEBERANG?!"],
    hit: "JERIT MEGAFON! 📢",
  },
  turap_jalan: {
    call: ["LUBANG...", "...JALAN...", "...KONVOI SAMPAI?!"],
    hit: "TURAP TAR KILAT! 🚧",
  },
  baling_baju: {
    call: ["ATAS...", "...LORI...", "...PENGUNDI LAMBAI?!"],
    hit: "BALING BAJU KEMPEN! 👕",
  },
  cuci_longkang: {
    call: ["SENTAL...", "...LUMUT...", "...KAMERASEDIA?!"],
    hit: "CUCI & SENYUM! 🧹",
  },
  celup_dakwat: {
    call: ["JARI...", "...TELUNJUK...", "...BOTOL UNGU?!"],
    hit: "CELUP DAKWAT KEKAL! 🟣",
  },
  tapis_undi_rosak: {
    call: ["SEMAK...", "...KERTAS...", "...CONTENG SAMBAL?!"],
    hit: "TAPIS UNDI SAH! 🔍",
  },
  blackout_peti: {
    call: ["LAMPU...", "...PADAM...", "...DEWAN GELAP?!"],
    hit: "SULUH PETI UNDI! 🔦",
  },
  borang_14: {
    call: ["KIRA...", "...UNDI...", "...BORANG 14?!"],
    hit: "CATAT TEPAT! 🗳️",
  },
  runding_perpaduan: {
    call: ["MEJA...", "...BULAT...", "...KERAJAAN PERPADUAN?!"],
    hit: "METERAI MoU! 🤝",
  },
};

interface MicrogameMeta {
  id: MicrogameId;
  prompt: { ms: string; en: string };
  subtext: { ms: string; en: string };
}

const MICROGAMES_ACT1: MicrogameMeta[] = [
  {
    id: "pecut_spr",
    prompt: {
      ms: "PECUT KE DEWAN SPR! 🏃💨",
      en: "SPR NOMINATION SPRINT! 🏃💨",
    },
    subtext: {
      ms: "Elak wartawan & rintangan 3 lorong sebelum pintu dewan SPR tutup jam 10:00 pagi!",
      en: "Dodge 3-lane obstacles & grab Teh O Ais before doors lock at 10:00 AM!",
    },
  },
  {
    id: "semak_borang",
    prompt: {
      ms: "SEMAK BORANG PENAMAAN! 📋",
      en: "VET CANDIDATE DOSSIERS! 📑",
    },
    subtext: {
      ms: "Luluskan calon sah, tolak calon muflis & belum 18 tahun (Perkara 47 & 48)!",
      en: "Approve eligible candidates, reject bankrupts & under-18s (Article 47/48)!",
    },
  },
  {
    id: "bayar_deposit",
    prompt: {
      ms: "KIRA DEPOSIT RM10,000! 💵",
      en: "COUNT 2 CASH DEPOSITS! 💵",
    },
    subtext: {
      ms: "Kira tepat 2 sampul deposit: RM10,000 Calon + RM5,000 Bahan Kempen!",
      en: "Count exactly 2 deposit envelopes: RM10,000 Candidate + RM5,000 Campaign Materials!",
    },
  },
  {
    id: "cop_watikah",
    prompt: {
      ms: "COP WATIKAH PARTI! 📜",
      en: "STAMP 3 PARTY CREDENTIALS! 📑",
    },
    subtext: {
      ms: "Cop 3 watikah rasmi parti mengikut Peraturan 11(2)(c) tepat pada rentak!",
      en: "Stamp 3 official party authorization letters under Regulation 11(2)(c)!",
    },
  },
  {
    id: "rebut_kamera",
    prompt: {
      ms: "REBUT SIARAN TV LANGSUNG! 📺",
      en: "HOG THE TV AIRTIME! 📺",
    },
    subtext: {
      ms: "Kekal di tengah kamera siaran langsung & siku calon lawan!",
      en: "Stay centered in the live news camera & elbow rivals during paparazzi flashes!",
    },
  },
];

const MICROGAMES_ACT2: MicrogameMeta[] = [
  {
    id: "goreng_kueyteow",
    prompt: {
      ms: "GORENG KUEY TEOW MAMAK! 🍳",
      en: "WOK-HEI CHAR KUEY TEOW! 🍳",
    },
    subtext: {
      ms: "Kacau mi dalam 3 fasa ramuan & senyum megah depan wartawan!",
      en: "Stir noodles through 3 ingredient phases & flash a smile for the press!",
    },
  },
  {
    id: "perang_speaker",
    prompt: {
      ms: "PERANG SPEAKER CERAMAH! 📢",
      en: "MEGAPHONE SPEAKER WAR! 📢",
    },
    subtext: {
      ms: "Menangi 3 pusingan laungan slogan lawan khemah sebelah & sejukkan genset!",
      en: "Win 3 slogan shouting rounds against the rival tent & keep the generator cool!",
    },
  },
  {
    id: "turap_jalan",
    prompt: {
      ms: "TURAP JALAN KILAT! 🚜",
      en: "FLASH ROAD PAVING! 🚜",
    },
    subtext: {
      ms: "Tuang tar panas & gilis lubang jalan sebelum konvoi Menteri tiba!",
      en: "Pour hot tar & steamroll potholes before the VIP minister convoy arrives!",
    },
  },
  {
    id: "potong_reben",
    prompt: {
      ms: "GUNTING 3 REBEN PERASMIAN! ✂️",
      en: "SNIP 3 VIP RIBBONS! ✂️",
    },
    subtext: {
      ms: "Gunting reben emas di 3 projek desa dengan gunting emas rasmi!",
      en: "Cut golden ribbons across 3 rural community projects with gold scissors!",
    },
  },
  {
    id: "baling_baju",
    prompt: {
      ms: "BALING BAJU KEMPEN! 👕",
      en: "TOSS CAMPAIGN T-SHIRTS! 👕",
    },
    subtext: {
      ms: "Baling baju parti percuma kepada 5 pengundi sambil elak ayam kampung!",
      en: "Launch free party shirts to 5 enthusiastic villagers while dodging kampung chickens!",
    },
  },
  {
    id: "payung_bos",
    prompt: {
      ms: "PAYUNGKAN BOS VIP! ☂️",
      en: "SHIELD THE VIP BOSS! ☂️",
    },
    subtext: {
      ms: "Iringi Bos VIP merentasi karpet merah dalam ribut monsun; kekalkan kering > 50%!",
      en: "Escort the VIP boss across the red carpet in a monsoon storm; keep dryness > 50%!",
    },
  },
  {
    id: "cuci_longkang",
    prompt: {
      ms: "CUCI 3 LONGKANG & POSE JEMPOL! 🧹",
      en: "CLEAN 3 DRAINS & POSE! 🧹",
    },
    subtext: {
      ms: "Sental 3 seksyen longkang sumbat & buat gaya jempol depan jurugambar!",
      en: "Scrub 3 clogged drain sections, clear debris, and strike a thumbs-up pose for cameras!",
    },
  },
  {
    id: "pacak_bendera",
    prompt: {
      ms: "PACAK BENDERA BULUH TENGAH MALAM! 🚩",
      en: "MIDNIGHT FLAGPOLE DUEL! 🚩",
    },
    subtext: {
      ms: "Imbang tiang buluh 10m lawan tiupan angin & ikat 5 bendera guna tali rafia!",
      en: "Balance the 10m bamboo pole against the wind and tie 5 party flags with red rafia!",
    },
  },
];

const MICROGAMES_ACT3: MicrogameMeta[] = [
  {
    id: "celup_dakwat",
    prompt: {
      ms: "CELUP DAKWAT KEKAL SPR! 🟣",
      en: "DIP INDELIBLE INK! 🟣",
    },
    subtext: {
      ms: "Celup 4 jari telunjuk pengundi yang menggigil tepat ke dalam botol dakwat SPR!",
      en: "Dip 4 trembling voter index fingers accurately into the official SPR purple ink bottle!",
    },
  },
  {
    id: "tapis_undi_rosak",
    prompt: {
      ms: "TAPIS 7 KERTAS UNDI! 🗳️",
      en: "SORT SPOILED BALLOTS! 🗳️",
    },
    subtext: {
      ms: "Tapis 7 kertas undi mengikut Peraturan 25: Terima undi sah [D], Tolak undi rosak [A]!",
      en: "Sort 7 ballots under Regulation 25: Accept valid votes [D], Reject spoiled votes [A]!",
    },
  },
  {
    id: "blackout_peti",
    prompt: {
      ms: "PERTAHANKAN PETI DARI BLACKOUT! 🔦",
      en: "BALLOT BOX BLACKOUT DEFENSE! 🔦",
    },
    subtext: {
      ms: "Suluh lampu suluh ke peti undi lutsinar SPR & halang tangan bayang ghaib!",
      en: "Shine the flashlight beam on the transparent ballot box & ward off shadowy hands!",
    },
  },
  {
    id: "borang_14",
    prompt: {
      ms: "METERAI BORANG 14 RASMI! 📜",
      en: "SEAL OFFICIAL FORM 14! 📜",
    },
    subtext: {
      ms: "Tally undi tepat 112 kerusi parlimen & tandatangan Borang 14 bersama KTM!",
      en: "Tally ballots to exactly 112 seats and sign the official Form 14 with the polling agent!",
    },
  },
];

function CukupJumlahGameContent() {
  const { lang, t, toggleLang } = useLanguage();
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

  // Trait & Quirk Gameplay States
  const [isSleeping, setIsSleeping] = useState(false);
  const [janjiNotice, setJanjiNotice] = useState<string | null>(null);
  const [isUnityGovernment, setIsUnityGovernment] = useState(false);

  // Dev / Testing Level Select State (strictly gated from public production)
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (import.meta.env.DEV || params.has("debug") || params.has("test")) {
      setIsDebugMode(true);
    }

    // Secret developer shortcut: Press Shift + D to toggle debug level select
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        setIsDebugMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [showLevelSelect, setShowLevelSelect] = useState(false);

  const handleSelectMicrogame = (
    act: number,
    gameIndex: number,
    overrideTalent?: TalentType,
    overrideQuirk?: QuirkType
  ) => {
    const currentOrTestProfile: CandidateProfile = profile || {
      name: "YB Test Daud",
      gender: "male",
      party: "PNL",
      headwear: "songkok_senget",
      outfit: "baju_melayu",
      prop: "briefcase",
      talent: overrideTalent || "mesra_rakyat",
      quirk: overrideQuirk || "kaki_zzz",
    };

    if (overrideTalent) currentOrTestProfile.talent = overrideTalent;
    if (overrideQuirk) currentOrTestProfile.quirk = overrideQuirk;

    setProfile(currentOrTestProfile);
    setLives(currentOrTestProfile.talent === "muka_tembok" ? 4 : 3);
    setSeatsWon(act === 1 ? 70 : act === 2 ? 78 : 107);
    setCurrentAct(act);
    setCurrentGameIndex(gameIndex);
    setScreen("microgame");
  };

  const handleSelectScreen = (targetScreen: GameScreen, customSeats?: number) => {
    if (!profile) {
      setProfile({
        name: "YB Test Daud",
        gender: "male",
        party: "PNL",
        headwear: "songkok_senget",
        outfit: "baju_melayu",
        prop: "briefcase",
        talent: "mesra_rakyat",
        quirk: "kaki_zzz",
      });
    }
    if (customSeats !== undefined) {
      setSeatsWon(customSeats);
    }
    setScreen(targetScreen);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      rhythmAudio.setMuted(next);
      return next;
    });
  };

  // 125 BPM Metronome Ticker for Active Microgame
  useEffect(() => {
    if (screen !== "microgame" && screen !== "unity_negotiation") return;

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
    if (screen !== "microgame" && screen !== "unity_negotiation") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // 1. Give player breathing room to read the instructions first!
    setIsReadyPhase(true);

    // Talent & Quirk Time Modifiers
    const actionGames: MicrogameId[] = [
      "pecut_spr",
      "rebut_kamera",
      "perang_speaker",
      "turap_jalan",
      "baling_baju",
      "cuci_longkang",
      "celup_dakwat",
      "tapis_undi_rosak",
      "blackout_peti",
      "runding_perpaduan",
    ];
    const activeId =
      screen === "unity_negotiation"
        ? "runding_perpaduan"
        : (currentAct === 1
            ? MICROGAMES_ACT1
            : currentAct === 2
              ? MICROGAMES_ACT2
              : MICROGAMES_ACT3)[currentGameIndex]?.id;

    let baseDuration =
      screen === "unity_negotiation"
        ? 18.0
        : 18.0; // Mario Party / Rabbids minigame standard duration (18s)
    if (profile?.talent === "lidah_manis") {
      baseDuration += 2.0; // +2.0s thinking time
    }
    if (profile?.quirk === "sensitif") {
      baseDuration -= 1.5; // -1.5s high tension
    }
    setTimeLeft(baseDuration);

    // Quirk: Kaki Zzz (starts round asleep!)
    if (profile?.quirk === "kaki_zzz") {
      setIsSleeping(true);
    } else {
      setIsSleeping(false);
    }

    setJanjiNotice(null);

    let popupTimer: NodeJS.Timeout | null = null;
    let clearTimer: NodeJS.Timeout | null = null;

    // Quirk: Janji Manis (random cheeky voter request popup)
    if (profile?.quirk === "janji_manis" && Math.random() < 0.65) {
      const requests = [
        "YB! Bila nak turap jalan tar kampung?!",
        "YB! Sumbangan kenduri kahwin ada bajet tak?",
        "YB! Jersi pasukan bola kampung bila nak sampai?!",
        "YB! Bumbung balai raya bocor belum baiki!",
        "YB! Mintak peruntukan wifi laju kat warung!",
      ];
      const chosen = requests[Math.floor(Math.random() * requests.length)];
      popupTimer = setTimeout(() => {
        setJanjiNotice(chosen);
      }, 1600);
      clearTimer = setTimeout(() => {
        setJanjiNotice(null);
      }, 4200);
    }

    const readyTimer = setTimeout(() => {
      setIsReadyPhase(false);

      // 2. Then start the countdown
      const step = 0.05;
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= step) {
            if (screen === "unity_negotiation") {
              handleUnityNegotiationComplete(false, 0);
            } else {
              handleMicrogameComplete(false);
            }
            return 0;
          }
          return prev - step;
        });
      }, 50);
    }, 700);

    return () => {
      clearTimeout(readyTimer);
      if (popupTimer) clearTimeout(popupTimer);
      if (clearTimer) clearTimeout(clearTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, currentGameIndex, currentAct, profile]);

  const handleUnityNegotiationComplete = (success: boolean, bonusSeats: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (success) {
      setSeatsWon((prev) => Math.min(222, prev + bonusSeats));
      setIsUnityGovernment(true);
      rhythmAudio.playPaduSuccess();
      setScreen("endgame_victory");
    } else {
      rhythmAudio.playStampSlam();
      setTimeout(() => rhythmAudio.playSkrrtMiss(), 120);
      setScreen("endgame_opposition");
    }
  };

  const handleStartGame = (createdProfile: CandidateProfile) => {
    setProfile(createdProfile);
    // Buff: Muka Tembok gets 4 lives
    setLives(createdProfile.talent === "muka_tembok" ? 4 : 3);
    setSeatsWon(64); // 64 safe seats baseline across the coalition
    setIsUnityGovernment(false);
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

  const handleStartAct3 = () => {
    setCurrentAct(3);
    setCurrentGameIndex(0);
    setScreen("microgame");
  };

  const handleMicrogameComplete = (success: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLastGameSuccess(success);

    if (success) {
      // Act 1 certifies candidacy (0 seats won on Nomination Day); Act 2 swings +4 marginal seats; Act 3 confirms +5 official seats
      const seatsGain = currentAct === 1 ? 0 : currentAct === 2 ? 4 : 5;
      setSeatsWon((prev) => Math.min(222, prev + seatsGain));
      rhythmAudio.playPaduSuccess();
    } else {
      setLives((prev) => Math.max(0, prev - 1));
      rhythmAudio.playStampSlam();
      setTimeout(() => rhythmAudio.playSkrrtMiss(), 120);
    }

    setScreen("microgame_result");
  };

  const activeMicrogameList =
    currentAct === 1 ? MICROGAMES_ACT1 : currentAct === 2 ? MICROGAMES_ACT2 : MICROGAMES_ACT3;

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
      } else if (currentAct === 2) {
        setScreen("act2_complete");
        setShowShareModal(true);
      } else {
        setScreen("act3_complete");
        setShowShareModal(true);
      }
    }
  };

  const currentMicrogame = activeMicrogameList[currentGameIndex];
  const partyInfo = profile ? PARTIES[profile.party] : null;

  return (
    <div className={`min-h-screen ${screen === "customizer" ? "bg-[#f5f0e1] text-slate-950" : "bg-slate-950 text-slate-100"} flex flex-col justify-between select-none`}>
      {/* Top Header / HUD Bar (Hidden during customizer and microgame so stage takes full focus) */}
      {screen !== "customizer" && screen !== "microgame" && screen !== "unity_negotiation" && (
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile && (
                <div className="flex-shrink-0">
                  <VoxelSinglePreview profile={profile} size={42} className="rounded-lg" />
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

            <div className="flex items-center gap-3">
              {/* Level Select Test Button in Header (Dev / Debug Only) */}
              {isDebugMode && (
                <button
                  onClick={() => setShowLevelSelect(true)}
                  className="px-2 py-1 bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[10px] rounded-lg border border-slate-900 shadow transition cursor-pointer flex items-center gap-1 uppercase font-mono"
                  title="Panel Ujian Tahap (Dev Only)"
                >
                  <span>🕹️</span>
                  <span className="hidden sm:inline">Level Dev</span>
                </button>
              )}

              {/* Kerusi & Deposit Counters */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
                  <span className="text-amber-400 font-comic">Kerusi:</span>
                  <span className="text-white font-tally text-sm">{seatsWon} / 112</span>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
                  <span className="text-emerald-400 font-comic">Deposit:</span>
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
            </div>
          </div>
        </header>
      )}

      {/* Main Screen Content */}
      <main className={`flex-1 w-full mx-auto flex flex-col justify-center ${screen === "customizer" ? "max-w-2xl p-0 md:py-2" : "max-w-3xl p-4"}`}>
        {screen === "customizer" && (
          <YbCustomizer onStartGame={handleStartGame} />
        )}

        {screen === "act1_intro" && profile && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="inline-block px-3.5 py-1 bg-amber-400 text-slate-950 border-2 border-slate-950 rounded-full text-xs font-black uppercase tracking-wider comic-shadow-sm">
              ACT 1: NOMINATION DAY • HARI PENAMAAN CALON (5 TASKS)
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              SPR Nomination Center Opens!
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Parliament has been dissolved! Arrive at the nomination center before the strict 10:00 AM statutory deadline.
              Complete all 5 Nomination Day challenges to certify your candidacy under Malaysian Election Regulations!
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-slate-800 text-left text-xs space-y-1.5 font-mono shadow-inner">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Act 1 Nomination Gauntlet:</div>
              <div className="text-slate-300">1. Sprint to SPR Hall (Before 10:00 AM - Reg. 6)</div>
              <div className="text-slate-300">2. Vet Nomination Papers 4 &amp; 5 (Art. 47/48)</div>
              <div className="text-slate-300">3. Pay RM10k &amp; RM5k Deposits (Reg. 8 / Sec. 16)</div>
              <div className="text-slate-300">4. Stamp Party Authorization Letter (Reg. 11)</div>
              <div className="text-slate-300">5. Hog the Live TV News Camera (Press Scrum)</div>
            </div>

            <button
              onClick={handleStartAct1}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition transform active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              ENTER SPR NOMINATION HALL! 🏛️ ➔
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
            currentAct={currentAct}
            isSleeping={isSleeping}
            onWakeUp={() => setIsSleeping(false)}
            janjiNotice={janjiNotice}
            onDismissJanji={() => setJanjiNotice(null)}
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
                {currentMicrogame.prompt[lang]}
              </div>
              <p className="text-xs text-slate-800 font-bold">{currentMicrogame.subtext[lang]}</p>
            </div>

            {/* Active Microgame Render */}
            <div
              key={`${currentAct}-${currentGameIndex}`}
              className="transition-opacity duration-200"
            >
              {currentMicrogame.id === "pecut_spr" && (
                <PecutDewanSPRGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "semak_borang" && (
                <SemakBorangGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "bayar_deposit" && (
                <BayarDepositGame
                  isPakarKira={profile?.talent === "pakar_kira"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "cop_watikah" && profile && (
                <CopWatikahGame
                  partyId={profile.party}
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "rebut_kamera" && (
                <RebutKameraTVGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "goreng_kueyteow" && (
                <GorengKueyTeowGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "perang_speaker" && (
                <PerangSpeakerGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "turap_jalan" && (
                <TurapJalanKilatGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "potong_reben" && (
                <PotongRebenGame onComplete={handleMicrogameComplete} />
              )}
              {currentMicrogame.id === "baling_baju" && (
                <BalingBajuKempenGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "payung_bos" && (
                <PayungBosGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "cuci_longkang" && (
                <CuciLongkangGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "pacak_bendera" && profile && (
                <PacakBenderaGame
                  partyId={profile.party}
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "celup_dakwat" && (
                <CelupDakwatKekalGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "tapis_undi_rosak" && (
                <TapisUndiRosakGame
                  isPakarKira={profile?.talent === "pakar_kira"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "blackout_peti" && (
                <BlackoutPetiUndiGame
                  isMesraRakyat={profile?.talent === "mesra_rakyat"}
                  onComplete={handleMicrogameComplete}
                />
              )}
              {currentMicrogame.id === "borang_14" && (
                <Borang14Game
                  currentBeat={currentBeat}
                  isPakarKira={profile?.talent === "pakar_kira"}
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
                    {t("STAGE LULUS! BERJAYA! ✅", "STAGE CLEARED! ✅")}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-700">
                    {currentAct === 1
                      ? t("PENCALONAN SAH & DEPOSIT SELAMAT! 📜", "CANDIDACY CERTIFIED & DEPOSIT SAFE! 📜")
                      : currentAct === 2
                        ? t("+4 KERUSI PANAS KEMPEN DIMENANGI! 🗳️", "+4 MARGINAL CAMPAIGN SEATS WON! 🗳️")
                        : t("+5 KERUSI RASMI PARLIMEN DISAHKAN! 🗳️", "+5 OFFICIAL POLLING SEATS CONFIRMED! 🗳️")}
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold max-w-xs mx-auto leading-relaxed">
                  {t(
                    '"Hebat YB! Sorakan bergema di segenap ceruk kampung. Seri Perdana makin menghampiri!"',
                    '"Brilliant work YB! Cheers echo across the constituency. Seri Perdana draws ever closer!"'
                  )}
                </p>

                {/* Trait Shoutouts on Success */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {profile?.talent === "lidah_manis" && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-400">
                      {t("🍯 Lidah Manis: Masa berfikir ekstra menyelamatkan keadaan!", "🍯 Sweet Tongue: Extra thinking time averted the crisis!")}
                    </span>
                  )}
                  {profile?.talent === "mesra_rakyat" && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-400">
                      {t("🤝 Mesra Rakyat: Zon toleransi luas menjamin kejayaan!", "🤝 People's Champion: Wider hitboxes secured the win!")}
                    </span>
                  )}
                  {profile?.talent === "pakar_kira" && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-400">
                      {t("🧮 Pakar Kira: Ketepatan kalkulator amat jitu!", "🧮 Math Prodigy: Sharp numerical precision!")}
                    </span>
                  )}
                  {profile?.talent === "muka_tembok" && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-400">
                      {t("🧱 Muka Tembok: Momentum teguh mara ke hadapan!", "🧱 Thick-Skinned: Unshakable momentum marches forward!")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-block border-4 border-red-600 bg-red-100 px-6 py-2 rounded-2xl rotate-[4deg] shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                  <div className="text-2xl md:text-3xl font-black text-red-800 uppercase tracking-wider">
                    {t("DEPOSIT HANGUS! 💸", "DEPOSIT FORFEITED! 💸")}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-red-700">
                    {t("HILANG RM10,000 WANG DEPOSIT PARLIMEN!", "LOST RM10,000 STATUTORY NOMINATION DEPOSIT!")}
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold max-w-xs mx-auto leading-relaxed">
                  {t(
                    '"Aduh YB! Pegawai SPR menggeleng kepala. Hati-hati—baki deposit kempen anda semakin tipis!"',
                    '"Ouch YB! The Returning Officer shakes his head. Watch out—your remaining campaign deposit is thinning!"'
                  )}
                </p>

                {/* Quirk Shoutouts on Failure */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {profile?.quirk === "kaki_zzz" && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-400">
                      {t("😴 Kaki Zzz: Terlelap sekejap menyebabkan masa berharga hilang!", "😴 Sleepyhead: Dozing off cost precious seconds!")}
                    </span>
                  )}
                  {profile?.quirk === "sensitif" && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-400">
                      {t("🌶️ Sensitif: Tekanan tinggi menyebabkan panik!", "🌶️ Thin-Skinned: High pressure caused sudden panic!")}
                    </span>
                  )}
                  {profile?.quirk === "janji_manis" && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-400">
                      {t("📢 Janji Manis: Terganggu dengan tuntutan vokal pengundi!", "📢 Sweet Promises: Distracted by vocal voter demands!")}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleNextMicrogame}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 active:translate-x-1 active:translate-y-1 active:shadow-none text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer uppercase tracking-wider"
            >
              {t("TERUSKAN KEMBARA PILIHAN RAYA ➔", "CONTINUE CAMPAIGN TRAIL ➔")}
            </button>
          </div>
        )}

        {screen === "act1_complete" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border-2 border-amber-400 shadow">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              {t("PENCALONAN DITERIMA SECARA RASMI!", "CANDIDACY OFFICIALLY ACCEPTED!")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {t(
                `Tahniah ${profile?.name}! Pegawai Pengurus SPR telah memperakui dokumen penamaan calon anda. Anda kini sah bertanding dalam Pilihan Raya Umum Parlimen!`,
                `Congratulations ${profile?.name}! The SPR Returning Officer has certified your nomination credentials. You are now officially on the ballot for the Parliamentary General Election!`
              )}
            </p>

            {/* Constitution Education Spotlight */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> {t("Undang-Undang Perlembagaan: Kelayakan Calon", "Constitutional Law: Nomination Qualifications")}
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
                className="py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-950 shadow transition flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                <Share2 className="w-4 h-4" /> {t("Kongsi Kad Watikah", "Share Credential Card")}
              </button>

              <button
                onClick={() => setScreen("act2_intro")}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl border-2 border-slate-950 shadow transition cursor-pointer uppercase"
              >
                {t("Masuk Fasa 2: Tempoh Kempen ➔", "Enter Act 2: Campaign Trail ➔")}
              </button>
            </div>
          </div>
        )}

        {screen === "act2_intro" && profile && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="inline-block px-3.5 py-1 bg-amber-400 text-slate-950 border-2 border-slate-950 rounded-full text-xs font-black uppercase tracking-wider comic-shadow-sm">
              {t("FASA 2: KEMBARA KEMPEN 14 HARI (8 TUGASAN)", "ACT 2: THE 14-DAY CAMPAIGN TRAIL (8 TASKS)")}
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              {t("Turun Padang Menyantuni Pengundi!", "Hit the Grassroots Campaign Trail!")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {t(
                "Tawan 8 misi lapangan sengit di kerusi panas luar bandar dan bandar demi meraih majoriti keramat 112 Cukup Jumlah!",
                "Conquer 8 intense grassroots field missions across rural and urban constituencies to swing marginal seats towards the magic majority of 112 Cukup Jumlah!"
              )}
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-slate-800 text-left text-xs space-y-1 font-mono shadow-inner">
              <div className="text-amber-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                {t("Misi Kempen Fasa 2:", "Act 2 Campaign Missions:")}
              </div>
              <div className="text-slate-300">{t("1. Goreng Kuey Teow Mamak • 2. Perang Speaker Megafon", "1. Wok-Hei Char Kuey Teow • 2. Megaphone Speaker War")}</div>
              <div className="text-slate-300">{t("3. Turap Jalan Kilat • 4. Gunting 3 Reben Perasmian", "3. Flash Road Paving • 4. Cut 3 VIP Ribbons")}</div>
              <div className="text-slate-300">{t("5. Baling Baju Parti • 6. Payungkan Bos VIP", "5. Campaign T-Shirt Cannon • 6. Escort VIP Boss")}</div>
              <div className="text-slate-300">{t("7. Cuci Longkang & Pose Jempol • 8. Pacak Buluh Bendera", "7. Scrub 3 Drains & Photo-Op • 8. Midnight Bamboo Flags")}</div>
            </div>

            <button
              onClick={handleStartAct2}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition transform active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              {t("MULAKAN KEMBARA KEMPEN! 🚗💨 ➔", "LAUNCH CAMPAIGN TRAIL! 🚗💨 ➔")}
            </button>
          </div>
        )}

        {screen === "act2_complete" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border-2 border-amber-400 shadow text-3xl">
              🍜
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              {t("TEMPOH KEMPEN TAMAT! (JAM 11:59 MALAM)", "CAMPAIGN WINDOW CLOSES! (11:59 PM)")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {t(
                `Tahniah ${profile?.name}! Anda berjaya mengharungi 14 hari kempen dari gerai mamak, pasar malam, ribut monsun hingga pacak buluh bendera. Esok Hari Mengundi!`,
                `Well done ${profile?.name}! You weathered 14 exhausting days of hawker stall cooking, night market rallies, torrential monsoon storms, and bamboo flag wars. Polling Day is here!`
              )}
            </p>

            {/* Constitution Education Spotlight */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> {t("Undang-Undang Pilihan Raya: Tempoh Bertenang Kempen", "Election Law: Campaign Quiet Period")}
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
                className="py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-950 shadow transition flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                <Share2 className="w-4 h-4" /> {t("Kongsi Poster Kempen", "Share Campaign Poster")}
              </button>

              <button
                onClick={() => setScreen("act3_intro")}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl border-2 border-slate-950 shadow transition cursor-pointer uppercase"
              >
                {t("Masuk Fasa 3: Hari Mengundi ➔", "Enter Act 3: Polling Day ➔")}
              </button>
            </div>
          </div>
        )}

        {screen === "act3_intro" && profile && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="inline-block px-3.5 py-1 bg-amber-400 text-slate-950 border-2 border-slate-950 rounded-full text-xs font-black uppercase tracking-wider comic-shadow-sm">
              {t("FASA 3: HARI MENGUNDI & PENGIRAAN UNDI (4 TUGASAN)", "ACT 3: POLLING DAY & VOTE COUNTING (4 TASKS)")}
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              {t("Pusat Mengundi & Dewan Kiraan Undi!", "Polling Stations & Counting Halls!")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {t(
                "Saat penentuan telah tiba! Awasi stesen dakwat kekal, semak kertas undi rosak bersama PACA, pertahankan peti undi dari blackout dewan, dan meterai Borang 14 bersejarah!",
                "The decisive hour has arrived! Supervise the indelible ink station, verify spoiled ballots with polling agents (PACA), defend the transparent ballot box during a counting hall blackout, and seal the decisive Form 14!"
              )}
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-slate-800 text-left text-xs space-y-1.5 font-mono shadow-inner">
              <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                {t("Urutan Pengiraan Fasa 3:", "Act 3 Counting Gauntlet:")}
              </div>
              <div className="text-slate-300">{t("1. Celup Dakwat Kekal (Saluran Mengundi • Peraturan 19)", "1. Dip Indelible Ink (Polling Stream • Reg. 19)")}</div>
              <div className="text-slate-300">{t("2. Tapis Undi Rosak vs Undi Sah (Meja PACA • Peraturan 25)", "2. Sort Spoiled vs Valid Ballots (PACA Table • Reg. 25)")}</div>
              <div className="text-slate-300">{t("3. Pertahankan Peti Undi Waktu Blackout (Suluh Lampu Suluh)", "3. Ballot Box Blackout Defense (Guard the Acrylic Box)")}</div>
              <div className="text-slate-300">{t("4. Tally & Meterai Borang 14 Rasmi (Seksyen 16 Akta 19)", "4. Tally & Sign Official Form 14 (Sec. 16 Act 19)")}</div>
            </div>

            <button
              onClick={handleStartAct3}
              className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm rounded-2xl border-3 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition transform active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              {t("MASUK DEWAN MENGUNDI & PENGIRAAN! 🗳️ ➔", "ENTER POLLING & COUNTING HALLS! 🗳️ ➔")}
            </button>
          </div>
        )}

        {screen === "act3_complete" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 md:p-8 rounded-3xl border-4 border-slate-950 shadow-2xl comic-shadow-lg space-y-4">
            <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border-2 border-amber-400 shadow text-3xl">
              🗳️
            </div>
            <h2 className="text-2xl font-black text-white uppercase">
              {t("PENGIRAAN UNDI RASMI SELESAI!", "OFFICIAL VOTE COUNTING CONCLUDED!")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {t(
                `Tahniah ${profile?.name}! Semua peti undi telah dikira dan penyata Borang 14 telah diperakui oleh Ketua Tempat Mengundi!`,
                `Congratulations ${profile?.name}! All ballot boxes have been tallied and Form 14 statements have been certified by the presiding officers!`
              )}
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> {t("Peraturan Pilihan Raya: Kiraan Undi", "Election Regulations: Vote Tallying")}
              </div>
              <div className="text-xs font-bold text-white">
                {CONSTITUTION_FACTS.act3_dakwat.article}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {CONSTITUTION_FACTS.act3_dakwat.didYouKnow}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowShareModal(true)}
                className="py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-950 shadow transition flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                <Share2 className="w-4 h-4" /> {t("Lihat Kad Keputusan", "View Results Card")}
              </button>

              <button
                onClick={() => {
                  if (seatsWon >= 112) {
                    setScreen("endgame_victory");
                  } else {
                    setScreen("endgame_hung");
                  }
                }}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl border-2 border-slate-950 shadow transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                <span>👑</span>
                <span>{t("Semak Mandat Parlimen ➔", "Check Parliament Mandate ➔")}</span>
              </button>
            </div>
          </div>
        )}

        {(screen === "endgame_victory" ||
          screen === "endgame_hung" ||
          screen === "endgame_opposition") &&
          profile && (
            <EndgameScreen
              profile={profile}
              seatsWon={seatsWon}
              lives={lives}
              mode={
                screen === "endgame_victory"
                  ? "victory"
                  : screen === "endgame_hung"
                    ? "hung"
                    : "opposition"
              }
              isUnityGovernment={isUnityGovernment}
              onStartUnityNegotiation={() => setScreen("unity_negotiation")}
              onRestart={() => setScreen("customizer")}
              onOpenShareCard={() => setShowShareModal(true)}
            />
          )}

        {screen === "unity_negotiation" && profile && (
          <SekolahFrame
            profile={profile}
            lives={lives}
            seatsWon={seatsWon}
            timeLeft={timeLeft}
            isReadyPhase={isReadyPhase}
            currentBeat={currentBeat}
            currentAct={3}
            isSleeping={isSleeping}
            onWakeUp={() => setIsSleeping(false)}
            janjiNotice={janjiNotice}
            onDismissJanji={() => setJanjiNotice(null)}
            rhythmicCueText={
              currentBeat === 4
                ? RHYTHMIC_CALLS.runding_perpaduan.hit
                : RHYTHMIC_CALLS.runding_perpaduan.call[currentBeat - 1] || "..."
            }
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          >
            <div className="text-center mb-3 border-b-2 border-slate-900 pb-2">
              <div className="inline-block px-3 py-1 bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                STAGE PENENTU: RUNDINGAN KERAJAAN PERPADUAN!
              </div>
              <p className="text-xs text-slate-800 font-bold">
                Pikat sekurang-kurangnya 2 parti lain menandatangani MoU untuk jadi PM—atau jadi Pembangkang!
              </p>
            </div>

            <RundingPerpaduanGame
              playerParty={profile.party}
              currentSeats={seatsWon}
              isMesraRakyat={profile.talent === "mesra_rakyat"}
              onComplete={handleUnityNegotiationComplete}
            />
          </SekolahFrame>
        )}

        {screen === "game_over" && (
          <div className="max-w-md mx-auto text-center bg-slate-900 p-6 rounded-3xl border border-rose-900/40 shadow-2xl space-y-4">
            <div className="text-5xl">💸</div>
            <h2 className="text-3xl font-black text-rose-500">
              {t("HILANG DEPOSIT! (TAMAT PERMAINAN)", "FORFEITED DEPOSIT! (GAME OVER)")}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(
                "Semua 3 wang deposit anda telah hangus kepada kerajaan akibat kesilapan di pusat penamaan calon!",
                "All 3 statutory deposits were forfeited to the government following critical campaign nomination errors!"
              )}
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1 text-slate-400">
              <div className="text-rose-400 font-bold">{t("Peraturan 8 Peraturan-Peraturan Pilihan Raya 1981:", "Regulation 8, Elections (Conduct of Elections) Regulations 1981:")}</div>
              <div>{t(
                '"Wang deposit pilihan raya RM10,000 akan dirampas dan dilucuthakkan kepada Kerajaan Persekutuan sekiranya calon gagal memperoleh lebih daripada 1/8 daripada jumlah undi sah."',
                '"The RM10,000 parliamentary election deposit shall be forfeited to the Federal Government if the candidate fails to secure more than 1/8 of the total valid votes cast."'
              )}</div>
            </div>

            <button
              onClick={() => setScreen("customizer")}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> {t("CUBA LAGI DENGAN CALON BARU 🔄", "TRY AGAIN WITH NEW CANDIDATE 🔄")}
            </button>
          </div>
        )}
      </main>

      {/* Share Card Modal */}
      {showShareModal && profile && (
        <ActShareCardModal
          profile={profile}
          actNumber={currentAct}
          actTitle={
            currentAct === 1
              ? "Hari Penamaan Calon"
              : currentAct === 2
                ? "Tempoh Berkempen"
                : "Malam Kiraan Undi"
          }
          seatsWon={seatsWon}
          livesRemaining={lives}
          onContinue={() => {
            setShowShareModal(false);
            if (currentAct === 1) {
              setScreen("act2_intro");
            } else if (currentAct === 2) {
              setScreen("act3_intro");
            } else {
              if (seatsWon >= 112) {
                setScreen("endgame_victory");
              } else {
                setScreen("endgame_hung");
              }
            }
          }}
        />
      )}

      {/* Floating Level Select Button (Dev / Testing Only) */}
      {isDebugMode && (
        <>
          <div className={`fixed z-40 ${screen === "customizer" ? "bottom-2 left-2" : "bottom-3 right-3"}`}>
            <button
              onClick={() => setShowLevelSelect(true)}
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/80 rounded-xl shadow-xl backdrop-blur font-black text-[9px] sm:text-xs uppercase flex items-center gap-1 transition cursor-pointer hover:scale-105 active:scale-95 font-mono"
              title="Buka Menu Pilih Tahap (Dev Only)"
            >
              <span>🕹️</span>
              <span className="hidden sm:inline">Pilih Level (Dev)</span>
            </button>
          </div>

          {/* Dev Level Select Modal */}
          <LevelSelectModal
            isOpen={showLevelSelect}
            onClose={() => setShowLevelSelect(false)}
            onSelectMicrogame={handleSelectMicrogame}
            onSelectScreen={handleSelectScreen}
            currentProfile={profile}
          />
        </>
      )}

      {/* Footer Disclaimer (Legal & Parody Shield - Hidden during customizer) */}
      {screen !== "customizer" && (
        <footer className="border-t border-slate-900 px-4 py-3 text-center text-[11px] text-slate-400 bg-slate-950 pb-12 sm:pb-3">
          <p>
            ⚖️ <span className="font-semibold text-slate-300">Cukup Jumlah!</span> {t(
              "adalah karya satira fiksyen & pendidikan sivik. Tiada kaitan dengan parti atau individu sebenar. Semua fakta undang-undang adalah berpandukan teks rasmi Perlembagaan Persekutuan Malaysia.",
              "is a work of satirical fiction and civic education. Unaffiliated with real parties or figures. All legal facts reference the Federal Constitution of Malaysia."
            )}
          </p>
        </footer>
      )}
    </div>
  );
}

export function CukupJumlahGame() {
  return (
    <LanguageProvider>
      <CukupJumlahGameContent />
    </LanguageProvider>
  );
}
