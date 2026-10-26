import { useState } from "react";
import { UserCheck, Shield, Sparkles, AlertCircle } from "lucide-react";
import type {
  CandidateProfile,
  HeadwearType,
  OutfitType,
  PartyId,
  PropType,
  QuirkType,
  TalentType,
} from "./types";
import { PARTIES } from "./types";
import { ComicAvatar } from "./comicAvatar";

interface CustomizerProps {
  onStartGame: (profile: CandidateProfile) => void;
}

export function YbCustomizer({ onStartGame }: CustomizerProps) {
  const [name, setName] = useState("Ahmad Sempoi");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [party, setParty] = useState<PartyId>("PNL");
  const [headwear, setHeadwear] = useState<HeadwearType>("songkok");
  const [outfit, setOutfit] = useState<OutfitType>("baju_melayu");
  const [prop, setProp] = useState<PropType>("briefcase");
  const [talent, setTalent] = useState<TalentType>("lidah_manis");
  const [quirk, setQuirk] = useState<QuirkType>("janji_manis");

  const currentProfile: CandidateProfile = {
    name,
    gender,
    party,
    headwear,
    outfit,
    prop,
    talent,
    quirk,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      name: name.trim() || "YB Anonymous",
      gender,
      party,
      headwear,
      outfit,
      prop,
      talent,
      quirk,
    });
  };

  const selectedParty = PARTIES[party];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800">
      {/* Title & Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Fasa 1: Bina Calon YB Anda
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          CUKUP JUMLAH!
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Kustom watak bakal Ahli Parlimen anda sebelum Hari Penamaan Calon tiba!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Comic Caricature Avatar Preview Box (Lat / Gila-Gila Style) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-950 p-5 rounded-3xl border-2 border-slate-800 shadow-inner">
          <div className="relative bg-[#fbf5e5] p-3 rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
            {/* Top Comic Tag */}
            <div className="w-full flex items-center justify-between border-b-2 border-slate-900 pb-1 mb-2 text-[9px] font-black uppercase text-slate-900">
              <span>EDISI SATIRA PRU</span>
              <span
                className="px-1.5 py-0.5 rounded text-white shadow-sm"
                style={{ backgroundColor: selectedParty.themeColor === "#F8FAFC" ? "#475569" : selectedParty.themeColor }}
              >
                {selectedParty.name} {selectedParty.symbolEmoji}
              </span>
            </div>

            {/* Live SVG Comic Avatar with Lat Caricature */}
            <ComicAvatar profile={currentProfile} size={190} isBouncing={true} mood="happy" />

            {/* Speech bubble */}
            <div className="mt-2 bg-amber-200 border-2 border-slate-900 rounded-xl px-2.5 py-1 text-[11px] font-black text-slate-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
              "UNDILAH SAYA! GERENTI CUKUP JUMLAH!"
            </div>
          </div>

          <div className="flex-1 w-full space-y-3 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nama Calon YB
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                placeholder="Contoh: YB Mat Rempit"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Jantina & Dasar Watak
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGender("male");
                    if (headwear === "tudung") setHeadwear("songkok");
                    if (outfit === "baju_kurung") setOutfit("baju_melayu");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${
                    gender === "male"
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Lelaki 👨
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGender("female");
                    setHeadwear("tudung");
                    setOutfit("baju_kurung");
                  }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition ${
                    gender === "female"
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  Wanita 👩
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-amber-400">Vibe Parti:</span>{" "}
              <span className="text-slate-300">{selectedParty.vibe}</span>
            </div>
          </div>
        </div>

        {/* 4 Jalur Gemilang Food Parody Parties Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pilih Parti Gabungan (4 Warna Jalur Gemilang)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(["PNL", "BD", "GTT", "PBB"] as PartyId[]).map((pId) => {
              const p = PARTIES[pId];
              const isSelected = party === pId;
              return (
                <button
                  key={pId}
                  type="button"
                  onClick={() => setParty(pId)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? "border-amber-400 ring-2 ring-amber-500/50 bg-slate-800"
                      : "border-slate-700/80 bg-slate-950 hover:bg-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{p.symbolEmoji}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-slate-400 shadow-sm"
                        style={{ backgroundColor: p.themeColor === "#F8FAFC" ? "#FFFFFF" : p.themeColor }}
                      />
                    </div>
                    <div className="font-black text-sm text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.fullName}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-amber-300/90 truncate italic">
                    "{p.slogan}"
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Grids: Headwear, Outfit, Prop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Headwear */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pilihan Kepala / Rambut
            </label>
            <select
              value={headwear}
              onChange={(e) => setHeadwear(e.target.value as HeadwearType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="songkok">Songkok Hitam Kemas</option>
              <option value="songkok_senget">Songkok Senget (Nakal)</option>
              <option value="tudung">Tudung Bawal Anggun</option>
              <option value="kopiah">Kopiah Putih</option>
              <option value="pomade">Rambut Belah Tengah Pomade</option>
              <option value="topi_jerami">Topi Jerami Kampung</option>
            </select>
          </div>

          {/* Outfit */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pakaian Calon
            </label>
            <select
              value={outfit}
              onChange={(e) => setOutfit(e.target.value as OutfitType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="baju_melayu">Baju Melayu + Samping</option>
              <option value="batik">Kemeja Batik Sutera</option>
              <option value="baju_kurung">Baju Kurung Tradisional</option>
              <option value="kot_formal">Kot Hitam Formal Parlimen</option>
              <option value="jaket_banjir">Jaket Turun Padang / Banjir</option>
            </select>
          </div>

          {/* Prop */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Aksesori Ikonik (Prop)
            </label>
            <select
              value={prop}
              onChange={(e) => setProp(e.target.value as PropType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="briefcase">Beg Dokumen Kulit (Briefcase)</option>
              <option value="pen_emas">Pen Parker Emas (Sedia SD)</option>
              <option value="payung_vip">Payung Kuning VIP</option>
              <option value="tuala_goodmorning">Tuala Good Morning</option>
            </select>
          </div>
        </div>

        {/* Traits: Bakat (Buff) & Tabiat (Quirk) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/40">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Bakat Calon (Buff)
            </label>
            <select
              value={talent}
              onChange={(e) => setTalent(e.target.value as TalentType)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="lidah_manis">Lidah Manis (+Masa ekstra minigame)</option>
              <option value="mesra_rakyat">Mesra Rakyat (Hitbox lebih besar)</option>
              <option value="pakar_kira">Pakar Kira-Kira (Bonus kelajuan kiraan)</option>
              <option value="muka_tembok">Muka Tembok (Mula dengan 4 Deposit)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-rose-900/40">
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Tabiat Calon (Quirk)
            </label>
            <select
              value={quirk}
              onChange={(e) => setQuirk(e.target.value as QuirkType)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="janji_manis">Suka Janji Manis (Cepat kena soal)</option>
              <option value="kaki_zzz">Kaki Mengantuk (Mudah ZZZ)</option>
              <option value="sensitif">Mudah Sentap (Masa terhad)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-500/25 transition transform active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5" /> Hantar Pencalonan & Mula Bab 1!
          </button>
        </div>
      </form>
    </div>
  );
}
