import React from "react";
import { X, Sparkles } from "lucide-react";
import type { CandidateProfile, GameScreen, MicrogameId, TalentType, QuirkType } from "./types";
import { TALENT_DETAILS, QUIRK_DETAILS } from "./types";

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMicrogame: (act: number, gameIndex: number, overrideTalent?: TalentType, overrideQuirk?: QuirkType) => void;
  onSelectScreen: (screen: GameScreen, seats?: number) => void;
  currentProfile: CandidateProfile | null;
}

interface StageOption {
  act: number;
  gameIndex: number;
  id: MicrogameId;
  name: string;
  icon: string;
  prompt: string;
  desc: string;
}

const STAGES_ACT1: StageOption[] = [
  {
    act: 1,
    gameIndex: 0,
    id: "pecut_spr",
    name: "1. Pecut Dewan SPR (BARU)",
    icon: "🏃🏾‍♂️",
    prompt: "PECUT DEWAN SPR!",
    desc: "Elak halangan di 3 lorong & pecut masuk sebelum 10:00 pagi.",
  },
  {
    act: 1,
    gameIndex: 1,
    id: "semak_borang",
    name: "2. Semak Borang",
    icon: "📑",
    prompt: "IMBAS KELAYAKAN!",
    desc: "Perkara 47/48: Luluskan calon layak, tolak muflis & bawah 18.",
  },
  {
    act: 1,
    gameIndex: 2,
    id: "bayar_deposit",
    name: "3. Bayar Deposit",
    icon: "💵",
    prompt: "KIRA DEPOSIT TEPAT!",
    desc: "Peraturan 8: Tap ikatan tunai tepat RM10,000 deposit calon Parlimen.",
  },
  {
    act: 1,
    gameIndex: 3,
    id: "cop_watikah",
    name: "4. Cop Watikah",
    icon: "🛑",
    prompt: "COP SURAT WATIKAH!",
    desc: "Selaraskan cop rasmi parti tepat dalam ruang dokumen.",
  },
  {
    act: 1,
    gameIndex: 4,
    id: "rebut_kamera",
    name: "5. Rebut Frame TV (BARU)",
    icon: "📹",
    prompt: "REBUT FRAME TV!",
    desc: "Kekal dalam kotak kamera berita & himpit calon lawan keluar.",
  },
];

const STAGES_ACT2: StageOption[] = [
  {
    act: 2,
    gameIndex: 0,
    id: "goreng_kueyteow",
    name: "6. Goreng Kuey Teow",
    icon: "🥢",
    prompt: "KACAU KUALI!",
    desc: "Kacau kuali laju-laju untuk sesi bergambar depan wartawan.",
  },
  {
    act: 2,
    gameIndex: 1,
    id: "perang_speaker",
    name: "7. Perang Speaker (BARU)",
    icon: "📢",
    prompt: "PERANG SPEAKER CERAMAH!",
    desc: "Lawan jeritan megafon khemah seberang, jaga suhu amplifier.",
  },
  {
    act: 2,
    gameIndex: 2,
    id: "turap_jalan",
    name: "8. Turap Jalan Kilat (BARU)",
    icon: "🚧",
    prompt: "TURAP JALAN KILAT!",
    desc: "Tuang tar & ratakan 6 lubang jalan sebelum konvoi VIP tiba.",
  },
  {
    act: 2,
    gameIndex: 3,
    id: "potong_reben",
    name: "9. Potong Reben",
    icon: "✂️",
    prompt: "GUNTING REBEN!",
    desc: "Rasmikan projek cat tiang lampu jalan pada beat ke-4.",
  },
  {
    act: 2,
    gameIndex: 4,
    id: "baling_baju",
    name: "10. Baling Baju 4x4 (BARU)",
    icon: "👕",
    prompt: "BALING BAJU KEMPEN!",
    desc: "Baling baju T-shirt tepat ke pengundi kampung, elak ayam.",
  },
  {
    act: 2,
    gameIndex: 5,
    id: "payung_bos",
    name: "11. Payung Bos",
    icon: "☂️",
    prompt: "PAYUNGKAN VIP!",
    desc: "Kawal payung emas agar Bos VIP tidak basah kuyup.",
  },
  {
    act: 2,
    gameIndex: 6,
    id: "cuci_longkang",
    name: "12. Cuci Longkang (BARU)",
    icon: "🧹",
    prompt: "CUCI LONGKANG PHOTO-OP!",
    desc: "Sental lumut longkang sampai bersih & pose depan wartawan.",
  },
  {
    act: 2,
    gameIndex: 7,
    id: "pacak_bendera",
    name: "13. Pacak Bendera",
    icon: "🚩",
    prompt: "IKAT BENDERA!",
    desc: "Ikat bendera parti dengan tali rafia sebelum 11:59 malam.",
  },
];

const STAGES_ACT3: StageOption[] = [
  {
    act: 3,
    gameIndex: 0,
    id: "celup_dakwat",
    name: "14. Celup Dakwat (BARU)",
    icon: "🟣",
    prompt: "CELUP DAKWAT KEKAL!",
    desc: "Celup 3 jari telunjuk pengundi tepat ke dalam botol dakwat ungu.",
  },
  {
    act: 3,
    gameIndex: 1,
    id: "tapis_undi_rosak",
    name: "15. Tapis Undi Rosak (BARU)",
    icon: "🔍",
    prompt: "TAPIS UNDI ROSAK!",
    desc: "Asingkan 5 kertas undi: Terima Undi Sah ✅, Tolak Undi Rosak ❌.",
  },
  {
    act: 3,
    gameIndex: 2,
    id: "borang_14",
    name: "16. Borang 14",
    icon: "🗳️",
    prompt: "KIRA BORANG 14!",
    desc: "Kira undi sah saluran dengan PACA pada beat ke-4.",
  },
];

export function LevelSelectModal({
  isOpen,
  onClose,
  onSelectMicrogame,
  onSelectScreen,
  currentProfile,
}: LevelSelectModalProps) {
  const [selectedTalent, setSelectedTalent] = React.useState<TalentType>(
    currentProfile?.talent || "mesra_rakyat"
  );
  const [selectedQuirk, setSelectedQuirk] = React.useState<QuirkType>(
    currentProfile?.quirk || "kaki_zzz"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#152a20] text-slate-100 border-4 border-[#0f1d16] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0b1711] border-b-2 border-emerald-900/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕹️</span>
            <div>
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                PANEL UJIAN KILAT • LEVEL SELECTOR
              </div>
              <div className="text-sm font-black text-white">
                Pilih Mana-Mana Tahap Untuk Ujian Terus
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Stage Catalog */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          
          {/* Quick Trait Modifier for Testing */}
          <div className="bg-[#0b1711] p-3 rounded-2xl border border-emerald-800/60">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> UJI DENGAN BAKAT & TABIAT (TRAIT TESTER):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Talent Selector */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 block mb-1">Bakat (Talent):</span>
                <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                  {(Object.keys(TALENT_DETAILS) as TalentType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTalent(t)}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer flex items-center gap-1 ${
                        selectedTalent === t
                          ? "bg-amber-500 border-amber-300 text-slate-950 font-black shadow"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{TALENT_DETAILS[t].icon}</span>
                      <span className="truncate">{TALENT_DETAILS[t].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quirk Selector */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 block mb-1">Tabiat (Quirk):</span>
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                  {(Object.keys(QUIRK_DETAILS) as QuirkType[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSelectedQuirk(q)}
                      className={`p-1.5 rounded-lg border text-left transition cursor-pointer flex items-center gap-1 ${
                        selectedQuirk === q
                          ? "bg-purple-500 border-purple-300 text-white font-black shadow"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{QUIRK_DETAILS[q].icon}</span>
                      <span className="truncate">{QUIRK_DETAILS[q].name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Act 1: Hari Penamaan Calon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📑</span> BAB 1: HARI PENAMAAN CALON (5 TUGAS)
              </span>
              <button
                onClick={() => {
                  onSelectScreen("act1_intro");
                  onClose();
                }}
                className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                ➔ Kad Misi Bab 1
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STAGES_ACT1.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    onSelectMicrogame(stage.act, stage.gameIndex, selectedTalent, selectedQuirk);
                    onClose();
                  }}
                  className="p-3 bg-[#0b1711] hover:bg-[#12241b] active:scale-95 text-left rounded-2xl border-2 border-emerald-700/60 hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between group shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{stage.icon}</span>
                      <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                        ACT {stage.act}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition">
                      {stage.name}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">
                      {stage.prompt}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-2 line-clamp-2">
                    {stage.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Act 2: Tempoh Berkempen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🚗</span> BAB 2: TEMPOH BERKEMPEN (8 TUGAS)
              </span>
              <button
                onClick={() => {
                  onSelectScreen("act2_intro");
                  onClose();
                }}
                className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                ➔ Kad Misi Bab 2
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {STAGES_ACT2.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    onSelectMicrogame(stage.act, stage.gameIndex, selectedTalent, selectedQuirk);
                    onClose();
                  }}
                  className="p-3 bg-[#0b1711] hover:bg-[#12241b] active:scale-95 text-left rounded-2xl border-2 border-emerald-700/60 hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between group shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{stage.icon}</span>
                      <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                        ACT {stage.act}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition">
                      {stage.name}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">
                      {stage.prompt}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-2 line-clamp-2">
                    {stage.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Act 3: Hari Mengundi & Malam Kiraan Undi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🗳️</span> BAB 3: HARI MENGUNDI & KIRAAN UNDI (4 TUGAS)
              </span>
              <button
                onClick={() => {
                  onSelectScreen("act3_intro");
                  onClose();
                }}
                className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
              >
                ➔ Kad Misi Bab 3
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STAGES_ACT3.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    onSelectMicrogame(stage.act, stage.gameIndex, selectedTalent, selectedQuirk);
                    onClose();
                  }}
                  className="p-3 bg-[#0b1711] hover:bg-[#12241b] active:scale-95 text-left rounded-2xl border-2 border-emerald-700/60 hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between group shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{stage.icon}</span>
                      <span className="text-[9px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                        ACT {stage.act}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white group-hover:text-amber-300 transition">
                      {stage.name}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-400 mt-0.5">
                      {stage.prompt}
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-2 line-clamp-2">
                    {stage.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Finale & Endgames */}
          <div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🏛️</span> BABAK KEMUNCAK & PENENTU KERAJAAN PERPADUAN
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
              {/* Stage 18: Unity Negotiation */}
              <button
                type="button"
                onClick={() => {
                  onSelectScreen("unity_negotiation", 96);
                  onClose();
                }}
                className="p-3 bg-gradient-to-b from-emerald-950/80 to-slate-900 hover:from-emerald-900/70 active:scale-95 text-left rounded-2xl border-2 border-emerald-400 transition cursor-pointer flex flex-col justify-between group shadow"
              >
                <div>
                  <div className="text-2xl mb-1">🤝</div>
                  <div className="text-xs font-black text-emerald-300">
                    17. Runding Perpaduan (BARU)
                  </div>
                  <div className="text-[9px] font-mono text-amber-400 mt-0.5">
                    Stage Penentu PM
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 mt-2">
                  Pikat parti lain tandatangan MoU Kerajaan Perpaduan untuk capai 112+ kerusi.
                </div>
              </button>

              {/* Hung Parliament Briefing */}
              <button
                type="button"
                onClick={() => {
                  onSelectScreen("endgame_hung", 96);
                  onClose();
                }}
                className="p-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-left rounded-2xl border-2 border-amber-500/70 transition cursor-pointer flex flex-col justify-between group shadow"
              >
                <div>
                  <div className="text-2xl mb-1">⚖️</div>
                  <div className="text-xs font-black text-slate-200">Parlimen Tergantung</div>
                  <div className="text-[9px] font-mono text-amber-400 mt-0.5">96 / 112 Kerusi</div>
                </div>
                <div className="text-[9px] text-slate-400 mt-2">
                  Tiada parti cukup 112. Buka laluan ke Stage Rundingan Kerajaan Perpaduan!
                </div>
              </button>

              {/* Victory */}
              <button
                type="button"
                onClick={() => {
                  onSelectScreen("endgame_victory", 116);
                  onClose();
                }}
                className="p-3 bg-gradient-to-b from-amber-950/60 to-slate-900 hover:from-amber-900/60 active:scale-95 text-left rounded-2xl border-2 border-amber-500/80 transition cursor-pointer flex flex-col justify-between group shadow"
              >
                <div>
                  <div className="text-2xl mb-1">🏛️</div>
                  <div className="text-xs font-black text-amber-300">Cukup Jumlah! (Jadi PM)</div>
                  <div className="text-[9px] font-mono text-emerald-400 mt-0.5">116 Kerusi Dewan Rakyat</div>
                </div>
                <div className="text-[9px] text-slate-400 mt-2">
                  Sidang Khas Dewan Rakyat, majoriti 112+ kerusi &amp; watikah Perdana Menteri.
                </div>
              </button>

              {/* Opposition MP Ending */}
              <button
                type="button"
                onClick={() => {
                  onSelectScreen("endgame_opposition", 96);
                  onClose();
                }}
                className="p-3 bg-rose-950/60 hover:bg-rose-900/50 active:scale-95 text-left rounded-2xl border-2 border-rose-500/80 transition cursor-pointer flex flex-col justify-between group shadow"
              >
                <div>
                  <div className="text-2xl mb-1">🎙️</div>
                  <div className="text-xs font-black text-rose-300">MP Pembangkang (BARU)</div>
                  <div className="text-[9px] font-mono text-rose-400 mt-0.5">Gagal Rundingan MoU</div>
                </div>
                <div className="text-[9px] text-slate-400 mt-2">
                  Duduk di blok Pembangkang Dewan Rakyat &amp; jerit &quot;Tarik Balik!&quot;.
                </div>
              </button>

              {/* Game Over */}
              <button
                type="button"
                onClick={() => {
                  onSelectScreen("game_over", 64);
                  onClose();
                }}
                className="p-3 bg-rose-950/40 hover:bg-rose-900/40 active:scale-95 text-left rounded-2xl border-2 border-rose-800 transition cursor-pointer flex flex-col justify-between group shadow"
              >
                <div>
                  <div className="text-2xl mb-1">💸</div>
                  <div className="text-xs font-black text-rose-400">Deposit Lebur</div>
                  <div className="text-[9px] font-mono text-rose-400 mt-0.5">0 Wang Deposit (Game Over)</div>
                </div>
                <div className="text-[9px] text-slate-400 mt-2">
                  Semua wang deposit hangus kepada kerajaan mengikut Peraturan 8.
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#0b1711] border-t-2 border-emerald-900/60 p-3 text-center">
          <p className="text-[10px] text-emerald-400/80 font-mono">
            💡 Tip Pengujian: Anda boleh menguji mana-mana tahap secara berasingan tanpa perlu bermain dari awal.
          </p>
        </div>

      </div>
    </div>
  );
}
