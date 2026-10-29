import { useEffect, useState } from "react";
import { Share2, RotateCcw, BookOpen } from "lucide-react";
import type { CandidateProfile } from "./types";
import { PARTIES } from "./types";
import { ComicAvatar } from "./comicAvatar";
import { CONSTITUTION_FACTS } from "./facts";
import { rhythmAudio } from "./rhythm";
import { useLanguage } from "./languageContext";

interface EndgameScreenProps {
  profile: CandidateProfile;
  seatsWon: number;
  lives: number;
  mode: "victory" | "hung" | "opposition";
  isUnityGovernment?: boolean;
  onStartUnityNegotiation?: () => void;
  onRestart: () => void;
  onOpenShareCard: () => void;
}

export function EndgameScreen({
  profile,
  seatsWon,
  lives,
  mode,
  isUnityGovernment = false,
  onStartUnityNegotiation,
  onRestart,
  onOpenShareCard,
}: EndgameScreenProps) {
  const { lang, t } = useLanguage();
  const [hasBowed, setHasBowed] = useState(false);
  const [hasShoutedOpposition, setHasShoutedOpposition] = useState(false);

  const isVictory = mode === "victory";
  const isHung = mode === "hung";
  const isOpposition = mode === "opposition";

  const party = PARTIES[profile.party];
  const officialTitle = isVictory
    ? isUnityGovernment
      ? t(`YAB Perdana Menteri Malaysia • Kerajaan Perpaduan (${party.name})`, `YAB Prime Minister of Malaysia • Unity Government (${party.name})`)
      : t(`YAB Perdana Menteri Malaysia (${party.fullName})`, `YAB Prime Minister of Malaysia (${party.fullName})`)
    : isOpposition
      ? t("YB Ketua Pembangkang / Ahli Parlimen Pembangkang", "YB Leader of the Opposition / Opposition Member of Parliament")
      : t("Calon Perdana Menteri (Rundingan Kerajaan Gabungan)", "Prime Ministerial Candidate (Cross-Party Coalition Talks)");

  useEffect(() => {
    if (isVictory) {
      rhythmAudio.playPaduSuccess();
    } else {
      rhythmAudio.playStampSlam();
    }
  }, [isVictory]);

  const handleBow = () => {
    setHasBowed(true);
    rhythmAudio.playPaduSuccess();
    setTimeout(() => setHasBowed(false), 2400);
  };

  const handleOppositionShout = () => {
    setHasShoutedOpposition(true);
    rhythmAudio.playStampSlam();
    setTimeout(() => setHasShoutedOpposition(false), 2000);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col justify-between p-2 select-none animate-in fade-in zoom-in-95 duration-300">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & STAMP BADGE */}
      {/* =================================================================== */}
      <div className="text-center mb-3">
        {isVictory ? (
          <div className="space-y-1.5">
            <div className="inline-block border-4 border-amber-400 bg-amber-400 text-slate-950 px-6 py-2 rounded-2xl rotate-[-2deg] font-black text-xl md:text-2xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              👑 {isUnityGovernment ? t("KERAJAAN PERPADUAN PM! 👑", "UNITY GOVERNMENT PM! 👑") : t("CUKUP JUMLAH! 112 KERUSI! 👑", "CUKUP JUMLAH! 112 SEATS WON! 👑")}
            </div>
            <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest block">
              {t("PARLIMEN MALAYSIA • SIDANG KHAS DEWAN RAKYAT", "PARLIAMENT OF MALAYSIA • SPECIAL SESSION OF THE DEWAN RAKYAT")}
            </p>
          </div>
        ) : isHung ? (
          <div className="space-y-1.5">
            <div className="inline-block border-4 border-amber-500 bg-amber-400 text-slate-950 px-5 py-2 rounded-2xl rotate-[1deg] font-black text-xl md:text-2xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ⚖️ {t("PARLIMEN GANTUNG! (PUSINGAN PENENTU!)", "HUNG PARLIAMENT! (TIEBREAKER STAGE!)")}
            </div>
            <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest block">
              {t("PUSINGAN GABUNGAN • RUNDING KERAJAAN PERPADUAN UNTUK JADI PM!", "COALITION STAGE • NEGOTIATE A UNITY GOVERNMENT TO BECOME PM!")}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="inline-block border-4 border-rose-500 bg-rose-600 text-white px-5 py-2 rounded-2xl rotate-[2deg] font-black text-xl md:text-2xl uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              🎙️ {t("AHLI PARLIMEN PEMBANGKANG!", "OPPOSITION MEMBER OF PARLIAMENT!")}
            </div>
            <p className="text-xs font-mono font-bold text-rose-300 uppercase tracking-widest block">
              {t("DEWAN RAKYAT • BLOK PEMBANGKANG & SEMAK IMBANG", "DEWAN RAKYAT OPPOSITION BENCH • CHECKS AND BALANCES")}
            </p>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. MAIN CEREMONIAL PLAYFIELD */}
      {/* =================================================================== */}
      <div
        className={`w-full rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 relative overflow-hidden text-center ${
          isVictory
            ? "bg-gradient-to-b from-[#1e1b4b] via-[#0f172a] to-[#020617] text-white"
            : isHung
              ? "bg-gradient-to-b from-amber-950/80 via-slate-900 to-slate-950 text-slate-100"
              : "bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-950 text-slate-100"
        }`}
      >
        {/* Background Confetti / Ribbon Flares for Victory */}
        {isVictory && (
          <div className="absolute inset-0 pointer-events-none opacity-30 flex justify-around text-3xl animate-bounce">
            <span>🎉</span>
            <span>✨</span>
            <span>🎊</span>
            <span>✨</span>
            <span>🎉</span>
          </div>
        )}

        {/* Ceremonial Character Stage */}
        <div className="relative z-10 flex flex-col items-center justify-center my-1">
          {/* SVG Character Avatar */}
          <div
            className={`transition-transform duration-300 ${
              hasBowed ? "scale-95 translate-y-3" : hasShoutedOpposition ? "scale-110 rotate-[-3deg]" : ""
            }`}
          >
            <ComicAvatar
              profile={profile}
              size={185}
              mood={isVictory ? "happy" : isHung ? "normal" : hasShoutedOpposition ? "shout" : "sweat"}
            />
          </div>

          {/* Action button beneath avatar */}
          {isVictory ? (
            <button
              onClick={handleBow}
              disabled={hasBowed}
              className="mt-2 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:scale-95 transition"
            >
              {hasBowed ? t("🙏 TUNDUK HORMAT KEPADA RAKYAT! ✨", "🙏 BOWED TO CITIZENS! ✨") : t("🙏 TUNDUK HORMAT KEPADA RAKYAT JELATA", "🙏 BOW TO THE CITIZENS")}
            </button>
          ) : isOpposition ? (
            <button
              onClick={handleOppositionShout}
              disabled={hasShoutedOpposition}
              className="mt-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-full border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer active:scale-95 transition animate-pulse"
            >
              {hasShoutedOpposition ? t("📢 'TARIK BALIK PERNYATAAN ITU, YB!' 💥", "📢 'POINT OF ORDER, WITHDRAW THAT!' 💥") : t("📢 JERIT 'TARIK BALIK!' (ATURAN MESYUARAT)", "📢 SHOUT 'TARIK BALIK!' (POINT OF ORDER)")}
            </button>
          ) : null}

          {/* Official Name & Title Banner */}
          <div className="mt-3 space-y-1">
            <div className="text-xl md:text-2xl font-black text-white flex items-center justify-center gap-2">
              <span>{profile.name}</span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-bold text-white shadow-sm"
                style={{
                  backgroundColor: party.themeColor === "#F8FAFC" ? "#475569" : party.themeColor,
                }}
              >
                {party.symbolEmoji} {party.name}
              </span>
            </div>

            <div className="text-xs font-bold text-amber-300 font-mono">
              {officialTitle}
            </div>
          </div>
        </div>

        {/* Results Stats Box */}
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto my-3 text-left">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border-2 border-slate-800 shadow">
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase block">
              {t("KERUSI PARLIMEN:", "PARLIAMENT SEATS:")}
            </span>
            <div className="text-lg font-black text-white font-mono flex items-baseline gap-1">
              <span>{seatsWon}</span>
              <span className="text-xs text-slate-400 font-sans">/ 222</span>
            </div>
            <span
              className={`text-[9px] font-bold ${
                seatsWon >= 112 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {seatsWon >= 112
                ? isUnityGovernment
                  ? t("✅ Majoriti Gabungan Perpaduan", "✅ Unity Coalition Majority")
                  : t("✅ Melepasi Majoriti 112 Kerusi", "✅ Majority Surpassed (112+)")
                : t(`⚠️ Perlu ${112 - seatsWon} Lagi Kerusi`, `⚠️ Needs ${112 - seatsWon} More Seats`)}
            </span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border-2 border-slate-800 shadow">
            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase block">
              {t("BAKI WANG DEPOSIT:", "SAVED DEPOSITS:")}
            </span>
            <div className="text-lg font-black text-white font-mono flex items-baseline gap-1">
              <span>RM {(lives * 10000).toLocaleString()}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400">
              {t(`${lives} Sampul Deposit Selamat`, `${lives} Deposit Bundles Intact`)}
            </span>
          </div>
        </div>

        {/* Narrative Verdict Quote */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-200 leading-relaxed max-w-md mx-auto mb-2">
          {isVictory ? (
            <p className="italic">
              {isUnityGovernment ? (
                t(
                  `"Melalui rundingan meja bulat yang penuh debaran, parti-parti lain telah menandatangani MoU Kerajaan Perpaduan! Dengan gabungan gagah ${seatsWon} kerusi parlimen, anda kini memegang mandat majoriti Dewan Rakyat sebagai Perdana Menteri!"`,
                  `"Following high-stakes roundtable coalition talks, other parties signed the Unity Government MoU! With a commanding coalition of ${seatsWon} parliamentary seats, you now command the confidence of the Dewan Rakyat majority as Prime Minister!"`
                )
              ) : (
                t(
                  `"Dengan sokongan padu ${seatsWon} kerusi parlimen yang melepasi ambang perlembagaan 112 kerusi, anda secara rasminya memegang kepercayaan majoriti ahli Dewan Rakyat untuk mengetuai Jemaah Menteri!"`,
                  `"With solid support of ${seatsWon} parliamentary seats surpassing the constitutional threshold of 112, you officially command the majority confidence of the Dewan Rakyat to lead the Cabinet!"`
                )
              )}
            </p>
          ) : isHung ? (
            <p className="italic text-amber-200">
              {t(
                `"Tiada parti tunggal yang berjaya meraih 112 kerusi secara terus! Anda kini memegang ${seatsWon} kerusi. Masuk ke Bilik Rundingan Gabungan sekarang untuk memikat parti penentu dan membentuk Kerajaan Perpaduan. Jika gagal berunding, anda akan mengetuai blok Pembangkang!"`,
                `"No single party achieved 112 seats outright! You currently hold ${seatsWon} seats. Enter the Coalition Negotiation Suite now to win over kingmaker parties and form a Unity Government. If negotiations fail, you will take your seat as the Opposition MP!"`
              )}
            </p>
          ) : (
            <p className="italic text-rose-200">
              {t(
                `"Rundingan gabungan menemui jalan buntu! Gabungan lawan berjaya mengumpul kepercayaan majoriti terlebih dahulu. Namun begitu, demokrasi terus subur—anda kini Ahli Parlimen Pembangkang, memainkan peranan semak dan imbang demi rakyat dalam Dewan Rakyat!"`,
                `"Coalition talks broke down! The rival coalition secured majority confidence first. However, democracy prevails—you are now an Opposition Member of Parliament, serving as the people's watchdog to provide checks and balances in the Dewan Rakyat!"`
              )}
            </p>
          )}
        </div>

        {/* Educational Federal Constitution Box */}
        <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl text-left max-w-md mx-auto space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 uppercase">
            <BookOpen className="w-3.5 h-3.5" /> {t("Perlembagaan Persekutuan: Perkara 43(2)(a)", "Constitutional Law: Article 43(2)(a)")}
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            {CONSTITUTION_FACTS.endgame_constitution.didYouKnow}
          </p>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BOTTOM BUTTONS */}
      {/* =================================================================== */}
      {isHung ? (
        <div className="space-y-2 mt-3">
          <button
            onClick={onStartUnityNegotiation}
            className="w-full py-4 px-5 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400 hover:from-emerald-300 hover:to-amber-300 active:scale-95 text-slate-950 font-black text-sm rounded-2xl border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider animate-pulse"
          >
            <span>🤝</span>
            <span>{t("MULAKAN RUNDINGAN KERAJAAN PERPADUAN SEKARANG! ➔", "ENTER COALITION NEGOTIATIONS! (WIN PM AS UNITY GOV) ➔")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <button
            onClick={onOpenShareCard}
            className="py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Share2 className="w-4 h-4" /> {t("LIHAT KAD KEPUTUSAN RASMI (KONGSI)", "VIEW OFFICIAL RESULT CARD (SHARE)")}
          </button>

          <button
            onClick={onRestart}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-xs rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" /> {t("MAIN SEMULA DENGAN CALON BARU 🔄", "PLAY AGAIN WITH NEW CANDIDATE 🔄")}
          </button>
        </div>
      )}
    </div>
  );
}
