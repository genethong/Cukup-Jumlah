import React from "react";
import type { CandidateProfile } from "./types";
import { PARTIES, TALENT_DETAILS, QUIRK_DETAILS } from "./types";
import { Volume2, VolumeX, Award, Sparkles } from "lucide-react";
import { useLanguage } from "./languageContext";

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
  currentAct?: number;
  locationLabel?: string;
  isSleeping?: boolean;
  onWakeUp?: () => void;
  janjiNotice?: string | null;
  onDismissJanji?: () => void;
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
  currentAct = 1,
  locationLabel,
  isSleeping = false,
  onWakeUp,
  janjiNotice,
  onDismissJanji,
  children,
}: SekolahFrameProps) {
  const { lang, toggleLang, t } = useLanguage();
  const partyInfo = profile ? PARTIES[profile.party] : null;
  const talentInfo = profile ? TALENT_DETAILS[profile.talent] : null;
  const quirkInfo = profile ? QUIRK_DETAILS[profile.quirk] : null;

  const defaultLocation =
    currentAct === 1
      ? t("PUSAT PENAMAAN CALON • DEWAN SPR", "NOMINATION CENTER • SPR HALL")
      : currentAct === 2
        ? t("ZON KEMPEN • RAYUAN UNDI RAKYAT", "CAMPAIGN TRAIL • VOTER OUTREACH")
        : t("PUSAT MENGUNDI & DEWAN KIRAAN UNDI", "POLLING STREAM & COUNTING HALL");

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col justify-between select-none relative font-sans">
      {/* =================================================================== */}
      {/* 1. TOP HUD: SUNDAY NEWSPRINT HEADER BAR (BRIGHT & CRISP)           */}
      {/* =================================================================== */}
      <div className="bg-white border-4 border-slate-950 rounded-t-3xl p-3 sm:p-3.5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        {/* Subtle Halftone Corner Accent */}
        <div
          className="absolute -top-6 -right-6 w-24 h-24 bg-slate-100 border-b-2 border-l-2 border-slate-300 rotate-12 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 1.2px)", backgroundSize: "8px 8px" }}
        />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2.5">
          {/* Location Marker */}
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-white border-2 border-slate-900 text-[10px] font-mono px-2.5 py-0.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              {locationLabel || defaultLocation}
            </span>
            {partyInfo && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm flex items-center gap-1 border-2 border-slate-950"
                style={{ backgroundColor: partyInfo.themeColor === "#F8FAFC" ? "#475569" : partyInfo.themeColor }}
              >
                <span>{partyInfo.symbolEmoji}</span>
                <span>{partyInfo.name}</span>
              </span>
            )}
          </div>

          {/* Talents, Quirks & Controls */}
          <div className="flex items-center gap-1.5 text-[9px] font-bold">
            {talentInfo && (
              <span
                className="bg-slate-100 text-slate-800 border-2 border-slate-900 px-2 py-0.5 rounded-lg font-mono hidden sm:inline-flex items-center gap-1 shadow-xs"
                title={talentInfo.description}
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>{talentInfo.name}</span>
              </span>
            )}
            {quirkInfo && (
              <span
                className="bg-slate-100 text-slate-800 border-2 border-slate-900 px-2 py-0.5 rounded-lg font-mono hidden sm:inline-flex items-center gap-1 shadow-xs"
                title={quirkInfo.description}
              >
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>{quirkInfo.name}</span>
              </span>
            )}

            {/* Language Toggle Button */}
            <button
              onClick={toggleLang}
              className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-900 text-slate-900 transition cursor-pointer shadow-xs text-[10px] font-mono font-black flex items-center gap-1"
              title={lang === "ms" ? "Tukar ke Bahasa Inggeris (Switch to English)" : "Switch to Bahasa Melayu"}
            >
              <span>{lang === "ms" ? "🇲🇾 BM" : "🇬🇧 EN"}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-900 text-slate-900 transition cursor-pointer shadow-xs"
              title={isMuted ? (lang === "ms" ? "Buka Audio" : "Unmute Audio") : (lang === "ms" ? "Bisu" : "Mute")}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* HUD Metrics Display Row */}
        <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: 4-Beat Rhythmic Metronome */}
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <span>🥁</span>
              <span>{t("BEAT KOMPANG:", "KOMPANG BEAT:")}</span>
            </span>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4].map((b) => (
                <div
                  key={b}
                  className={`w-4 h-4 rounded-full border-2 transition-transform duration-75 flex items-center justify-center text-[8px] font-black ${
                    currentBeat === b
                      ? b === 4
                        ? "bg-amber-400 border-slate-950 text-slate-950 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                        : "bg-slate-900 border-slate-950 text-white scale-110 shadow-sm"
                      : "bg-slate-100 border-slate-400 text-slate-400"
                  }`}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Center: Countdown Timer Badge */}
          <div className="text-center">
            <div
              className={`font-tally text-xl sm:text-2xl px-3.5 py-0.5 rounded-xl border-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors duration-100 ${
                isReadyPhase
                  ? "bg-sky-100 border-slate-950 text-sky-950"
                  : timeLeft <= 3.0
                    ? "bg-rose-100 border-slate-950 text-rose-600 animate-pulse"
                    : "bg-white border-slate-950 text-slate-950"
              }`}
            >
              {isReadyPhase ? t("SEDIA!", "READY!") : `${timeLeft.toFixed(1)}s`}
            </div>
          </div>

          {/* Right: RM10,000 Cash Deposit Bundles (Lives) */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-wider">
              {t("WANG DEPOSIT SPR:", "SPR CASH DEPOSIT:")}
            </span>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 3 }).map((_, i) => {
                const isAlive = i < lives;
                return (
                  <div
                    key={i}
                    className={`px-1.5 py-0.5 rounded-lg border-2 transition-all duration-200 flex items-center gap-0.5 sm:gap-1 ${
                      isAlive
                        ? "bg-amber-100 border-slate-950 text-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-slate-100 border-slate-300 text-slate-400 opacity-40 line-through"
                    }`}
                    title={isAlive ? "RM10,000 Wang Deposit Sah (Seksyen 16 Akta 19)" : "Wang Deposit Hangus!"}
                  >
                    <span className="text-xs">{isAlive ? "💵" : "💸"}</span>
                    <span className="text-[9px] font-mono font-black">
                      {isAlive ? "RM10k" : t("HANGUS", "LOST")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. CENTER STAGE: SUNDAY NEWSPRINT COMIC CANVAS (BRIGHT & CRISP)     */}
      {/* =================================================================== */}
      <div className="bg-[#e2e8f0] border-x-4 border-slate-950 p-2.5 sm:p-3 relative shadow-inner">
        {/* Subtle Newspaper Dot Texture */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 1.2px)", backgroundSize: "12px 12px" }}
        />

        {/* Speech Banner */}
        {rhythmicCueText && (
          <div className="relative z-10 mb-2.5 bg-amber-300 border-3 border-slate-950 rounded-2xl p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center animate-bounce">
            <span className="font-black text-slate-950 text-xs md:text-sm tracking-wide uppercase">
              🗣️ {rhythmicCueText}
            </span>
          </div>
        )}

        {/* Microgame Inner Panel: Pure Crisp White Comic Canvas */}
        <div className="relative z-10 bg-white text-slate-900 border-4 border-slate-950 rounded-3xl p-3 sm:p-4 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden min-h-[350px] flex flex-col justify-between">
          {children}

          {/* Quirk: Kaki Zzz Overlay */}
          {isSleeping && (
            <div
              onClick={onWakeUp}
              className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 cursor-pointer select-none"
            >
              <span className="text-6xl mb-2 animate-bounce">😴💤</span>
              <div className="text-xl font-black text-amber-300 uppercase tracking-wider mb-1">
                {t("YB TERTIDUR DEPAN MEJA!", "YB FELL ASLEEP AT THE DESK!")}
              </div>
              <p className="text-xs text-slate-300 font-bold mb-3 max-w-xs">
                {t('"Penat sangat berkempen sampai terlena dalam dewan orang ramai!"', '"Exhausted from campaigning, YB dozed off in the community hall!"')}
              </p>
              <div className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                {t("⚡ KETUK UNTUK KEJUTKAN YB! ⚡", "⚡ TAP TO WAKE UP YB! ⚡")}
              </div>
            </div>
          )}

          {/* Quirk: Janji Manis Voter Request */}
          {janjiNotice && (
            <div className="absolute top-2 inset-x-3 z-30 bg-purple-100 border-3 border-purple-950 text-purple-950 p-2.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 animate-bounce">
              <div className="text-left text-xs font-black">
                <span className="block text-[8px] font-mono font-bold text-purple-700 uppercase">
                  {t("📢 PERMINTAAN PENGUNDI KAMPUNG:", "📢 VILLAGER CONSTITUENT REQUEST:")}
                </span>
                "{janjiNotice}"
              </div>
              <button
                onClick={onDismissJanji}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] rounded-lg border-2 border-purple-950 cursor-pointer shrink-0 uppercase shadow"
              >
                {t("BERI JANJI! 🤝", "MAKE PROMISE! 🤝")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM HUD: PARLIAMENTARY SEATS TRACKER (112 MAJORITI)          */}
      {/* =================================================================== */}
      <div className="bg-white border-4 border-t-0 border-slate-950 rounded-b-3xl p-3 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Acrylic Ballot Box Badge */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border-2 border-slate-950 flex items-center justify-center text-xl shadow-xs">
              🗳️
            </div>
            <div>
              <div className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                {t("DEWAN RAKYAT PARLIMEN MALAYSIA", "PARLIAMENT OF MALAYSIA • DEWAN RAKYAT")}
              </div>
              <div className="text-xs font-black text-slate-950 flex items-center gap-2">
                {t("SASARAN: 112 KERUSI BENTUK KERAJAAN", "TARGET: 112 SEATS TO FORM GOVERNMENT")}
              </div>
            </div>
          </div>

          {/* 112 Parliament Progress Bar */}
          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-xs font-tally">
              <span className="text-slate-950 font-bold">
                {t(`${seatsWon} Kerusi Dipegang`, `${seatsWon} Seats Won`)}
              </span>
              <span className="text-slate-700 font-bold">
                {t("112 Cukup Jumlah", "112 Magic Number")}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border-2 border-slate-950 relative p-0.5 shadow-inner">
              <div
                className="h-full bg-slate-950 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (seatsWon / 112) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
