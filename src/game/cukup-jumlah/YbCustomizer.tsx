import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserCheck, Sparkles, Dices, ChevronLeft, ChevronRight, Box } from "lucide-react";
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
import { SKIN_PALETTE, COLOR_SWATCHES, BG_SWATCHES } from "./pixelAvatar";
import { useLanguage } from "./languageContext";
import { VoxelSinglePreview } from "./voxel/VoxelSinglePreview";
import { VoxelYbPortrait } from "./voxel/VoxelPocPreview";

interface CustomizerProps {
  onStartGame: (profile: CandidateProfile) => void;
}

const PROPS_LIST: { id: PropType; name: string; icon: string; desc: string }[] = [
  { id: "briefcase", name: "Beg Bimbit Parlimen", icon: "💼", desc: "Kulit rasmi fail sulit" },
  { id: "pen_emas", name: "Pen Emas 24K", icon: "✍️", desc: "Tandatangan cek peruntukan" },
  { id: "payung_vip", name: "Payung VIP Pengiring", icon: "☂️", desc: "Kuning diraja lindung panas" },
  { id: "tuala_goodmorning", name: "Tuala Good Morning", icon: "🧣", desc: "Lap peluh turun padang" },
];

const TALENTS_LIST: { id: TalentType; name: string; icon: string; desc: string }[] = [
  { id: "lidah_manis", name: "Lidah Manis", icon: "🍯", desc: "+1.5s masa berfikir ekstra" },
  { id: "mesra_rakyat", name: "Mesra Rakyat", icon: "🤝", desc: "Zon hitbox toleransi luas" },
  { id: "pakar_kira", name: "Pakar Kira", icon: "🧮", desc: "Bantuan kiraan undi automatik" },
  { id: "muka_tembok", name: "Muka Tembok", icon: "🧱", desc: "Mula dengan 4 nyawa deposit" },
];

const QUIRKS_LIST: { id: QuirkType; name: string; icon: string; desc: string }[] = [
  { id: "janji_manis", name: "Janji Manis", icon: "📜", desc: "Tuntutan spontan pengundi" },
  { id: "kaki_zzz", name: "Kaki Zzz", icon: "💤", desc: "Mula pusingan tertidur" },
  { id: "sensitif", name: "Sensitif", icon: "🌶️", desc: "-1.0s tekanan masa tinggi" },
];

export function YbCustomizer({ onStartGame }: CustomizerProps) {
  const { lang, toggleLang, t } = useLanguage();

  // Active Tab: RUPA | PAKAIAN | PARTI | BAKAT
  const [activeTab, setActiveTab] = useState<"rupa" | "pakaian" | "parti" | "bakat">("rupa");

  // Basic Info
  const [name, setName] = useState("Ahmad Sempoi");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [party, setParty] = useState<PartyId>("PNL");

  // Avatar Attributes
  const [skinIndex, setSkinIndex] = useState(1);
  const [hair, setHair] = useState("side_part");
  const [hairColor, setHairColor] = useState<"black" | "brown" | "grey">("black");
  const [headwear, setHeadwear] = useState<HeadwearType>("songkok");
  const [headwearColor, setHeadwearColor] = useState("#059669");
  const [headwearShadow, setHeadwearShadow] = useState("#047857");
  const [headwearLight, setHeadwearLight] = useState("#10b981");
  const [outfit, setOutfit] = useState<OutfitType>("baju_melayu");
  const [clothesColor, setClothesColor] = useState("#1e293b");
  const [clothesShadow, setClothesShadow] = useState("#0f172a");
  const [clothesLight, setClothesLight] = useState("#334155");
  const [mouth, setMouth] = useState("clean");
  const [faceMark, setFaceMark] = useState("none");
  const [accessory, setAccessory] = useState("none");
  const [bg, setBg] = useState("#f59e0b");

  // Gameplay Attributes
  const [prop, setProp] = useState<PropType>("briefcase");
  const [talent, setTalent] = useState<TalentType>("lidah_manis");
  const [quirk, setQuirk] = useState<QuirkType>("janji_manis");

  const voxelStyle = "A" as const;
  const [voxelV2, setVoxelV2] = useState(false);
  useEffect(() => {
    setVoxelV2(new URLSearchParams(window.location.search).get("voxel") === "v2");
  }, []);

  const currentProfile: CandidateProfile = {
    name,
    gender,
    party,
    headwear,
    headwearColor,
    headwearShadow,
    headwearLight,
    outfit,
    clothesColor,
    clothesShadow,
    clothesLight,
    skinIndex,
    hair,
    hairColor,
    mouth,
    faceMark,
    accessory,
    bg,
    prop,
    talent,
    quirk,
  };

  const handleGenderSwitch = (newGender: "male" | "female") => {
    setGender(newGender);
    if (newGender === "male") {
      setName("YB Ahmad");
      setHair("side_part");
      setHeadwear("songkok");
      setOutfit("baju_melayu");
      setClothesColor("#1e293b");
      setClothesShadow("#0f172a");
      setClothesLight("#334155");
      setMouth("clean");
      setFaceMark("none");
    } else {
      setName("YB Siti");
      setHair("wavy_long");
      setHeadwear("tudung_bawal");
      setHeadwearColor("#059669");
      setHeadwearShadow("#047857");
      setHeadwearLight("#10b981");
      setOutfit("baju_kurung");
      setClothesColor("#db2777");
      setClothesShadow("#be185d");
      setClothesLight("#ec4899");
      setMouth("red_lips");
      setFaceMark("mole");
    }
  };

  const handleRandomize = () => {
    const isMale = Math.random() > 0.5;
    const gen = isMale ? "male" : "female";
    setGender(gen);

    const sIdx = Math.floor(Math.random() * SKIN_PALETTE.length);
    setSkinIndex(sIdx);

    const hColors: Array<"black" | "brown" | "grey"> = ["black", "black", "brown", "grey"];
    setHairColor(hColors[Math.floor(Math.random() * hColors.length)]);

    const cSwatch = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    setClothesColor(cSwatch.col);
    setClothesShadow(cSwatch.shd);
    setClothesLight(cSwatch.lit);

    const hwSwatch = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    setHeadwearColor(hwSwatch.col);
    setHeadwearShadow(hwSwatch.shd);
    setHeadwearLight(hwSwatch.lit);

    setBg(BG_SWATCHES[Math.floor(Math.random() * BG_SWATCHES.length)]);

    const marks = ["none", "none", "mole", "bindi", "veteran"];
    setFaceMark(marks[Math.floor(Math.random() * marks.length)]);

    if (isMale) {
      const hairs = ["side_part", "jambul", "short_crop", "bald"];
      const hats = ["none", "songkok", "kopiah", "turban", "cap"];
      const outfits = ["suit", "baju_melayu", "baju_tang", "kurta", "polo"];
      const mouths = ["clean", "misai", "beard", "goatee_full"];
      setHair(hairs[Math.floor(Math.random() * hairs.length)]);
      setHeadwear(hats[Math.floor(Math.random() * hats.length)]);
      setOutfit(outfits[Math.floor(Math.random() * outfits.length)]);
      setMouth(mouths[Math.floor(Math.random() * mouths.length)]);
      setName("YB " + ["Ahmad", "Chong", "Ramasamy", "Razak", "Muthu", "Hafiz"][Math.floor(Math.random() * 6)]);
    } else {
      const hairs = ["wavy_long", "bob_cut", "high_bun", "ponytail"];
      const hats = ["none", "tudung_bawal", "cap"];
      const outfits = ["baju_kurung", "saree", "cheongsam", "blazer", "kemeja_kempen"];
      const mouths = ["natural", "red_lips", "coral_lips", "smile"];
      setHair(hairs[Math.floor(Math.random() * hairs.length)]);
      setHeadwear(hats[Math.floor(Math.random() * hats.length)]);
      setOutfit(outfits[Math.floor(Math.random() * outfits.length)]);
      setMouth(mouths[Math.floor(Math.random() * mouths.length)]);
      setName("YB " + ["Siti", "Mei Ling", "Priya", "Fatimah", "Kavitha", "Nurul"][Math.floor(Math.random() * 6)]);
    }

    const accs = ["none", "none", "glasses", "shades", "garland", "earrings"];
    setAccessory(accs[Math.floor(Math.random() * accs.length)]);

    setProp(PROPS_LIST[Math.floor(Math.random() * PROPS_LIST.length)].id);
    setTalent(TALENTS_LIST[Math.floor(Math.random() * TALENTS_LIST.length)].id);
    setQuirk(QUIRKS_LIST[Math.floor(Math.random() * QUIRKS_LIST.length)].id);
  };

  const isHairCovered = headwear === "tudung_bawal" || headwear === "turban";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      ...currentProfile,
      name: name.trim() || (lang === "ms" ? "YB Calon" : "YB Candidate"),
    });
  };

  const selectedParty = PARTIES[party];

  const cycleIndex = (current: number, delta: number, len: number) => (current + delta + len) % len;
  const currentPropIndex = PROPS_LIST.findIndex((p) => p.id === prop);
  const currentTalentIndex = TALENTS_LIST.findIndex((t) => t.id === talent);
  const currentQuirkIndex = QUIRKS_LIST.findIndex((q) => q.id === quirk);

  return (
    <div className="w-full max-w-[420px] md:max-w-xl mx-auto h-[100dvh] max-h-[844px] p-2.5 sm:p-3.5 bg-[#faf8f0] text-slate-950 md:rounded-3xl border-0 md:border-4 border-slate-950 md:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] select-none relative overflow-hidden font-sans grid grid-rows-[auto_auto_auto_1fr_auto] gap-1.5">
      
      {/* Halftone Dot Accents (Sunday Newsprint) */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 bg-amber-100/60 rounded-full pointer-events-none hidden sm:block"
        style={{ backgroundImage: "radial-gradient(#cbd5e1 1.5px, transparent 1.5px)", backgroundSize: "8px 8px" }}
      />

      {/* 1. TOP BAR: Title / Logo + Controls */}
      <header className="flex-shrink-0 flex items-center justify-between pb-1 border-b-2 border-slate-950 z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-comic font-black text-sm tracking-wide text-red-600">CUKUP JUMLAH!</span>
          <span className="font-tally text-[9px] font-bold bg-slate-950 text-amber-400 px-1 py-0.5 rounded border border-slate-900">
            PRU-16
          </span>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border-1.5 border-slate-950 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{t("BORANG PENAMAAN", "CANDIDACY")}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRandomize}
            className="px-2 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-95 border-2 border-slate-950 font-comic font-black text-[11px] shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 cursor-pointer transition"
            title="Rawak Calon (Randomize)"
          >
            <Dices className="w-3 h-3" />
            <span>RAWAK</span>
          </button>

          <button
            type="button"
            onClick={toggleLang}
            className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-white active:scale-95 border-2 border-slate-950 font-tally font-bold text-[11px] text-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] flex items-center cursor-pointer"
          >
            <span>{lang === "ms" ? "🇲🇾 BM" : "🇬🇧 EN"}</span>
          </button>
        </div>
      </header>

      <nav
        aria-label={t("Makmal 3D", "3D lab")}
        className="flex-shrink-0 flex items-center justify-between gap-2 z-10"
      >
        <span className="font-comic font-black text-[10px] uppercase tracking-wide text-slate-500">
          {t("Makmal 3D", "3D lab")}
        </span>
        <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-900">
          <Link
            to="/dev"
            search={{ lab: "head" }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-comic font-black text-slate-300 hover:text-white"
          >
            🎯 {t("KEPALA", "HEAD")}
          </Link>
          <Link
            to="/dev"
            search={{ lab: "character" }}
            className="px-2 py-1 rounded-lg text-[10px] font-comic font-black text-slate-300 hover:text-white"
          >
            👤 {t("YB MODEL", "YB MODEL")}
          </Link>
          <Link
            to="/dev"
            search={{ lab: "stage" }}
            className="px-2 py-1 rounded-lg text-[10px] font-comic font-black text-slate-300 hover:text-white"
          >
            🏛️ {t("PENTAS", "STAGE")}
          </Link>
        </div>
      </nav>

      {/* 2. TOP HERO DOSSIER CARD (HERO OF THE CUSTOMIZER - BIGGER AVATAR) */}
      <section className="flex-shrink-0 bg-white border-3 border-slate-950 rounded-2xl p-2.5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative z-10">
        {/* Paperclip */}
        <div className="absolute -top-2 left-4 w-2.5 h-5 border-3 border-slate-600 rounded-t-full border-b-0 z-20 pointer-events-none" />

        {/* Dossier Header Tag */}
        <div className="w-full flex items-center justify-between border-b-2 border-slate-950 pb-1 mb-2">
          <span className="text-[9px] font-comic font-black text-slate-500 uppercase tracking-wider">
            {t("BORANG 4 SPR · DEWAN RAKYAT", "SPR FORM 4 · PARLIAMENT")}
          </span>
          <span
            className="px-2 py-0.5 rounded border border-slate-950 text-white font-tally font-bold text-[10px] shadow-sm"
            style={{ backgroundColor: selectedParty.themeColor === "#F8FAFC" ? "#475569" : selectedParty.themeColor }}
          >
            {selectedParty.name} {selectedParty.symbolEmoji}
          </span>
        </div>

        {/* Avatar Passport Box + Candidate Bio Side-by-Side */}
        <div className="grid grid-cols-[142px_1fr] sm:grid-cols-[156px_1fr] items-center gap-2.5">
          {/* Passport Photo Frame with Pure 3D Voxel Avatar */}
          <div className="relative flex-shrink-0 flex flex-col items-center">
            <div className="p-1 bg-[#fdf8ee] border-2.5 border-slate-950 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] -rotate-1 relative">
              {voxelV2 ? (
                <VoxelYbPortrait profile={currentProfile} size={142} />
              ) : (
                <VoxelSinglePreview
                  profile={currentProfile}
                  styleOption={voxelStyle}
                  size={142}
                  className="rounded-lg overflow-hidden"
                />
              )}
              {/* 3D Voxel Tag */}
              <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-950/85 text-amber-300 font-comic font-black text-[9px] border border-amber-400 shadow-sm pointer-events-none flex items-center gap-0.5">
                <Box className="w-2.5 h-2.5 text-amber-400" />
                <span>3D VOXEL</span>
              </div>
            </div>
            {/* Red Rubber Stamp */}
            <div className="absolute -bottom-1 -right-0.5 bg-red-600 text-white border-1.5 border-slate-950 rounded px-1.5 text-[8px] font-comic font-black rotate-6 shadow-sm">
              DISAHKAN ✓
            </div>
          </div>

          {/* Candidate Form Fields */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div>
              <label className="block text-[8px] font-comic font-black uppercase tracking-wider text-slate-500 mb-0.5">
                {t("NAMA PENUH CALON YB:", "CANDIDATE FULL NAME:")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={22}
                className="w-full bg-[#faf8f0] px-2 py-1 border-2 border-slate-950 rounded-lg font-comic font-black text-sm text-slate-950 outline-none leading-tight tracking-wide shadow-sm"
                placeholder="YB Calon"
                required
              />
            </div>

            {/* Gender Switcher */}
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleGenderSwitch("male")}
                className={`py-1 rounded-lg text-[10px] font-comic font-black border-2 transition cursor-pointer flex items-center justify-center gap-0.5 ${
                  gender === "male"
                    ? "bg-blue-600 text-white border-slate-950 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                }`}
                aria-pressed={gender === "male"}
              >
                <span>👨 LELAKI</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderSwitch("female")}
                className={`py-1 rounded-lg text-[10px] font-comic font-black border-2 transition cursor-pointer flex items-center justify-center gap-0.5 ${
                  gender === "female"
                    ? "bg-pink-600 text-white border-slate-950 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                }`}
                aria-pressed={gender === "female"}
              >
                <span>👩 WANITA</span>
              </button>
            </div>

            {/* Speech bubble / Quote */}
            <div className="bg-amber-300 border-1.5 border-slate-950 rounded-lg py-1 px-2 text-[9px] font-comic font-black text-slate-950 text-center shadow-sm truncate">
              {t('"UNDI SAYA! 100% CUKUP JUMLAH!" 🗳️', '"VOTE FOR ME! 100% CUKUP JUMLAH!" 🗳️')}
            </div>

            {/* Party Slogan Tag */}
            <div className="text-[8px] font-tally text-slate-500 italic truncate text-center">
              "{selectedParty.slogan}"
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOLDER TABS NAVIGATION */}
      <nav
        role="tablist"
        aria-label="Bahagian Kustomisasi"
        className="flex-shrink-0 flex gap-1 px-1 relative z-10 -mb-[3px]"
      >
        {[
          { id: "rupa", label: "🎨 RUPA", code: "S.1" },
          { id: "pakaian", label: "👔 PAKAIAN", code: "S.2" },
          { id: "parti", label: "🏛️ PARTI", code: "S.3" },
          { id: "bakat", label: "⚡ BAKAT", code: "S.4" },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isSelected}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-1.5 px-0.5 text-[11px] font-comic font-black border-3 border-slate-950 rounded-t-xl transition-all cursor-pointer min-h-[36px] flex items-center justify-center ${
                isSelected
                  ? "bg-[#faf8f0] text-slate-950 translate-y-0 z-20 relative pb-2.5 -mb-[3px] border-b-0 shadow-none"
                  : "bg-[#e8dfc4] text-slate-700 translate-y-[3px] hover:bg-[#dfd5b5] border-b-3"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 4. THE SINGLE BOARD PANEL (.board) */}
      <main
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-h-0 bg-[#faf8f0] border-3 border-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between overflow-hidden z-0"
        style={{
          backgroundImage: "radial-gradient(#0001 1px, transparent 1px)",
          backgroundSize: "6px 6px",
        }}
      >
        {/* TAB 1: RUPA (S.1) - 4 Rows Neatly Stacked (NO justify-between) */}
        {activeTab === "rupa" && (
          <div className="flex-1 flex flex-col justify-start divide-y-2 divide-dashed divide-slate-400/40 overflow-y-auto">
            
            {/* Row 1: Tona Kulit */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#c1121f] text-[#c1121f] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                KULIT
              </span>
              <div className="flex gap-1.5 items-center justify-between">
                {SKIN_PALETTE.map((sk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={skinIndex === idx}
                    onClick={() => setSkinIndex(idx)}
                    className={`flex-1 h-7.5 rounded-lg border-2 border-slate-950 transition-transform relative cursor-pointer min-w-[28px] ${
                      skinIndex === idx
                        ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 ring-2 ring-amber-400"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: sk.base }}
                    title={sk.name}
                  >
                    {skinIndex === idx && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-black border border-slate-950">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Rambut */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#1d3557] text-[#1d3557] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                RAMBUT
              </span>
              <div className="flex items-center gap-1.5">
                {/* Hairstyle Chips */}
                <div className={`grid grid-cols-4 gap-1 flex-1 ${isHairCovered ? "opacity-40 pointer-events-none" : ""}`}>
                  {(gender === "male"
                    ? [
                        { id: "side_part", label: "Belah" },
                        { id: "jambul", label: "Jambul" },
                        { id: "short_crop", label: "Pendek" },
                        { id: "bald", label: "Botak" },
                      ]
                    : [
                        { id: "wavy_long", label: "Alun" },
                        { id: "bob_cut", label: "Bob" },
                        { id: "high_bun", label: "Sanggul" },
                        { id: "ponytail", label: "Ekor" },
                      ]
                  ).map((h) => {
                    const isSel = hair === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setHair(h.id);
                          if (headwear !== "none") {
                            setHeadwear("none");
                          }
                        }}
                        className={`py-1 px-0.5 rounded-lg border-2 border-slate-950 font-comic font-bold text-[10px] text-center transition cursor-pointer min-h-[32px] flex items-center justify-center relative ${
                          isSel
                            ? "bg-[#ffd60a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 text-slate-950 font-black"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {h.label}
                        {isSel && (
                          <span className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Vertical ink rule divider */}
                <div className="w-[2px] h-6 bg-slate-950/40" />

                {/* 3 Hair Color Dots */}
                <div className="flex flex-col gap-1">
                  {[
                    { id: "black", col: "#0f172a" },
                    { id: "brown", col: "#78350f" },
                    { id: "grey", col: "#94a3b8" },
                  ].map((hc) => (
                    <button
                      key={hc.id}
                      type="button"
                      onClick={() => {
                        setHairColor(hc.id as typeof hairColor);
                        if (headwear !== "none") {
                          setHeadwear("none");
                        }
                      }}
                      className={`w-3.5 h-3.5 rounded-full border-1.5 border-slate-950 transition cursor-pointer ${
                        hairColor === hc.id ? "ring-2 ring-amber-400 scale-110 shadow-sm" : ""
                      }`}
                      style={{ backgroundColor: hc.col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Kepala / Headwear */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#c1121f] text-[#c1121f] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                KEPALA
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {(gender === "male"
                  ? [
                      { id: "none", label: "Tiada" },
                      { id: "songkok", label: "Songkok" },
                      { id: "kopiah", label: "Kopiah" },
                      { id: "turban", label: "Turban" },
                      { id: "cap", label: "Topi" },
                    ]
                  : [
                      { id: "none", label: "Tiada" },
                      { id: "tudung_bawal", label: "Tudung" },
                      { id: "cap", label: "Topi" },
                    ]
                ).map((hw) => {
                  const isSel = headwear === hw.id;
                  return (
                    <button
                      key={hw.id}
                      type="button"
                      onClick={() => setHeadwear(hw.id as HeadwearType)}
                      className={`py-1 px-1.5 rounded-lg border-2 border-slate-950 font-comic font-bold text-[10px] whitespace-nowrap transition cursor-pointer min-h-[32px] flex items-center justify-center relative flex-1 ${
                        isSel
                          ? "bg-[#ffd60a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 text-slate-950 font-black"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {hw.label}
                      {isSel && (
                        <span className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Swatches if headwear has color */}
                {(headwear === "tudung_bawal" || headwear === "turban" || headwear === "cap") && (
                  <div className="flex gap-1 pl-1 border-l-2 border-slate-400/40">
                    {COLOR_SWATCHES.slice(0, 3).map((sw, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setHeadwearColor(sw.col);
                          setHeadwearShadow(sw.shd);
                          setHeadwearLight(sw.lit);
                        }}
                        className={`w-4 h-4 rounded border border-slate-950 ${headwearColor === sw.col ? "ring-2 ring-amber-400 scale-110" : ""}`}
                        style={{ backgroundColor: sw.col }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 4: Wajah / Facial Hair */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#1d3557] text-[#1d3557] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                WAJAH
              </span>
              <div className="grid grid-cols-4 gap-1">
                {(gender === "male"
                  ? [
                      { id: "clean", label: "Tiada" },
                      { id: "misai", label: "Misai" },
                      { id: "beard", label: "Janggut" },
                      { id: "goatee_full", label: "Goatee" },
                    ]
                  : [
                      { id: "natural", label: "Natural" },
                      { id: "red_lips", label: "Merah" },
                      { id: "coral_lips", label: "Karang" },
                      { id: "smile", label: "Senyum" },
                    ]
                ).map((m) => {
                  const isSel = mouth === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMouth(m.id)}
                      className={`py-1 px-0.5 rounded-lg border-2 border-slate-950 font-comic font-bold text-[10px] text-center transition cursor-pointer min-h-[32px] flex items-center justify-center relative ${
                        isSel
                          ? "bg-[#ffd60a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 text-slate-950 font-black"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {m.label}
                      {isSel && (
                        <span className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PAKAIAN (S.2) - 3 Rows Neatly Stacked (NO justify-between) */}
        {activeTab === "pakaian" && (
          <div className="flex-1 flex flex-col justify-start divide-y-2 divide-dashed divide-slate-400/40 overflow-y-auto">
            
            {/* Row 1: Baju Outfit Tiles */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#c1121f] text-[#c1121f] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                BAJU
              </span>
              <div className="grid grid-cols-5 gap-1">
                {(gender === "male"
                  ? [
                      { id: "suit", label: "Sut", icon: "👔" },
                      { id: "baju_melayu", label: "Melayu", icon: "🕌" },
                      { id: "baju_tang", label: "Tang", icon: "🏮" },
                      { id: "kurta", label: "Kurta", icon: "✨" },
                      { id: "polo", label: "Polo", icon: "👕" },
                    ]
                  : [
                      { id: "baju_kurung", label: "Kurung", icon: "🌺" },
                      { id: "saree", label: "Saree", icon: "🥻" },
                      { id: "cheongsam", label: "Cheong", icon: "🏮" },
                      { id: "blazer", label: "Blazer", icon: "💼" },
                      { id: "kemeja_kempen", label: "Kemeja", icon: "👔" },
                    ]
                ).map((ot) => {
                  const isSel = outfit === ot.id;
                  return (
                    <button
                      key={ot.id}
                      type="button"
                      onClick={() => setOutfit(ot.id as OutfitType)}
                      className={`p-1 rounded-xl border-2 border-slate-950 flex flex-col items-center justify-center transition cursor-pointer min-h-[44px] relative ${
                        isSel
                          ? "bg-[#ffd60a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 font-black text-slate-950"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base leading-none">{ot.icon}</span>
                      <span className="font-comic text-[8px] mt-0.5 truncate">{ot.label}</span>
                      {isSel && (
                        <span className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Warna Pakaian */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#1d3557] text-[#1d3557] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                WARNA
              </span>
              <div className="flex gap-1.5 items-center justify-between">
                {COLOR_SWATCHES.map((sw, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setClothesColor(sw.col);
                      setClothesShadow(sw.shd);
                      setClothesLight(sw.lit);
                    }}
                    className={`flex-1 h-7.5 rounded-lg border-2 border-slate-950 transition-transform relative cursor-pointer min-w-[26px] ${
                      clothesColor === sw.col
                        ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 ring-2 ring-amber-400"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: sw.col }}
                    title={sw.name}
                  >
                    {clothesColor === sw.col && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] font-black border border-slate-950">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Aksesori Toggles */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2.5 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#c1121f] text-[#c1121f] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                AKSESORI
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "none", label: "Tiada" },
                  { id: "glasses", label: "Cermin Mata" },
                  { id: "shades", label: "Shades" },
                  { id: "garland", label: "Malai" },
                ].map((acc) => {
                  const isSel = accessory === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccessory(acc.id)}
                      className={`py-1 px-0.5 rounded-lg border-2 border-slate-950 font-comic font-bold text-[9px] text-center transition cursor-pointer min-h-[34px] flex items-center justify-center relative ${
                        isSel
                          ? "bg-[#ffd60a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 text-slate-950 font-black"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {acc.label}
                      {isSel && (
                        <span className="absolute -top-1 -right-1 bg-slate-950 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PARTI (S.3) - 2x2 Grid of Party Ballot Cards */}
        {activeTab === "parti" && (
          <div className="flex-1 grid grid-cols-2 auto-rows-min content-start gap-2 p-2 overflow-y-auto">
            {(["PNL", "BD", "GTT", "PBB"] as PartyId[]).map((pId) => {
              const p = PARTIES[pId];
              const isSelected = party === pId;
              return (
                <button
                  key={pId}
                  type="button"
                  onClick={() => {
                    setParty(pId);
                    const pCol = p.themeColor === "#F8FAFC" ? "#f8fafc" : p.themeColor;
                    setClothesColor(pCol);
                    setClothesShadow("#0f172a");
                    setClothesLight("#334155");
                  }}
                  className={`p-2.5 rounded-xl border-2.5 border-slate-950 text-left transition flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[96px] ${
                    isSelected
                      ? "bg-[#ffd60a] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 ring-2 ring-slate-950"
                      : "bg-white hover:bg-slate-50 text-slate-800 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {/* Selected DIPILIH Red Stamp */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white border-2 border-slate-950 text-[8px] font-comic font-black px-1.5 py-0.5 -rotate-8 shadow-sm">
                      DIPILIH ✓
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xl leading-none">{p.symbolEmoji}</span>
                      <span className="font-comic font-black text-sm tracking-wide text-slate-950">{p.name}</span>
                    </div>
                    <div className="text-[9px] font-bold text-slate-600 truncate">{p.fullName}</div>
                  </div>

                  <div className="mt-1">
                    <div className="text-[8px] font-bold text-slate-900 italic line-clamp-1">"{p.slogan}"</div>
                    <span className="inline-block mt-0.5 text-[7px] font-tally uppercase bg-slate-950 text-white px-1.5 py-0.5 rounded">
                      {p.colorName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 4: BAKAT (S.4) - 3 Slot Machine Rows (NO justify-between, natural compact layout) */}
        {activeTab === "bakat" && (
          <div className="flex-1 flex flex-col justify-start divide-y-2 divide-dashed divide-slate-400/40 p-1 overflow-y-auto">
            
            {/* Slot 1: Prop */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#1d3557] text-[#1d3557] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                ALAT
              </span>
              <div className="flex items-center gap-1.5 bg-white border-2 border-slate-950 rounded-xl p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setProp(PROPS_LIST[cycleIndex(currentPropIndex, -1, PROPS_LIST.length)].id)}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-950" />
                </button>
                <div className="flex-1 text-center px-1">
                  <div className="font-comic font-black text-xs text-slate-950 flex items-center justify-center gap-1">
                    <span>{PROPS_LIST[currentPropIndex]?.icon}</span>
                    <span>{PROPS_LIST[currentPropIndex]?.name}</span>
                  </div>
                  <div className="text-[8px] text-slate-500 font-bold truncate">
                    {PROPS_LIST[currentPropIndex]?.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProp(PROPS_LIST[cycleIndex(currentPropIndex, 1, PROPS_LIST.length)].id)}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-slate-950" />
                </button>
                <button
                  type="button"
                  onClick={() => setProp(PROPS_LIST[Math.floor(Math.random() * PROPS_LIST.length)].id)}
                  className="w-8 h-8 bg-amber-400 hover:bg-amber-300 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer text-xs"
                  title="Rawak Alat"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Slot 2: Talent Buff (Pale Green #e6f4ea) */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#059669] text-[#059669] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                BUFF
              </span>
              <div className="flex items-center gap-1.5 bg-[#e6f4ea] border-2 border-slate-950 rounded-xl p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setTalent(TALENTS_LIST[cycleIndex(currentTalentIndex, -1, TALENTS_LIST.length)].id)}
                  className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-emerald-950" />
                </button>
                <div className="flex-1 text-center px-1">
                  <div className="font-comic font-black text-xs text-emerald-950 flex items-center justify-center gap-1">
                    <span>{TALENTS_LIST[currentTalentIndex]?.icon}</span>
                    <span>{TALENTS_LIST[currentTalentIndex]?.name}</span>
                  </div>
                  <div className="text-[8px] text-emerald-800 font-bold truncate">
                    {TALENTS_LIST[currentTalentIndex]?.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTalent(TALENTS_LIST[cycleIndex(currentTalentIndex, 1, TALENTS_LIST.length)].id)}
                  className="w-8 h-8 bg-emerald-100 hover:bg-emerald-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-emerald-950" />
                </button>
                <button
                  type="button"
                  onClick={() => setTalent(TALENTS_LIST[Math.floor(Math.random() * TALENTS_LIST.length)].id)}
                  className="w-8 h-8 bg-emerald-400 hover:bg-emerald-300 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer text-xs"
                  title="Rawak Bakat"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Slot 3: Quirk Debuff (Pale Red #fde8e8) */}
            <div className="grid grid-cols-[68px_1fr] items-center gap-2 px-2 py-1.5">
              <span className="rotate-[-2deg] border-2 border-[#c1121f] text-[#c1121f] font-comic font-black text-[9px] px-1 py-0.5 uppercase text-center leading-tight">
                DEBUFF
              </span>
              <div className="flex items-center gap-1.5 bg-[#fde8e8] border-2 border-slate-950 rounded-xl p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  onClick={() => setQuirk(QUIRKS_LIST[cycleIndex(currentQuirkIndex, -1, QUIRKS_LIST.length)].id)}
                  className="w-8 h-8 bg-rose-100 hover:bg-rose-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-rose-950" />
                </button>
                <div className="flex-1 text-center px-1">
                  <div className="font-comic font-black text-xs text-rose-950 flex items-center justify-center gap-1">
                    <span>{QUIRKS_LIST[currentQuirkIndex]?.icon}</span>
                    <span>{QUIRKS_LIST[currentQuirkIndex]?.name}</span>
                  </div>
                  <div className="text-[8px] text-rose-800 font-bold truncate">
                    {QUIRKS_LIST[currentQuirkIndex]?.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuirk(QUIRKS_LIST[cycleIndex(currentQuirkIndex, 1, QUIRKS_LIST.length)].id)}
                  className="w-8 h-8 bg-rose-100 hover:bg-rose-200 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-rose-950" />
                </button>
                <button
                  type="button"
                  onClick={() => setQuirk(QUIRKS_LIST[Math.floor(Math.random() * QUIRKS_LIST.length)].id)}
                  className="w-8 h-8 bg-rose-400 hover:bg-rose-300 active:scale-95 border-2 border-slate-950 rounded-lg flex items-center justify-center font-black cursor-pointer text-xs"
                  title="Rawak Tabiat"
                >
                  🎲
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Ruled Ledger Footer */}
        <footer className="flex-shrink-0 px-2.5 py-1 bg-[#eae4d4] border-t-2 border-slate-950/30 flex items-center justify-between text-[8px] font-tally text-slate-500 tracking-wider">
          <span>SURUHANJAYA PILIHAN RAYA MALAYSIA</span>
          <span className="font-bold text-slate-700 uppercase">
            {activeTab === "rupa" && "BRG 4 · S.1"}
            {activeTab === "pakaian" && "BRG 4 · S.2"}
            {activeTab === "parti" && "BRG 4 · S.3"}
            {activeTab === "bakat" && "BRG 4 · S.4"}
          </span>
        </footer>
      </main>

      {/* 5. PINNED BALLOT SLOT LINE + CTA BUTTON */}
      <footer className="flex-shrink-0 pt-1 pb-[max(2px,env(safe-area-inset-bottom))] flex flex-col items-center z-10">
        {/* 6px Dark Ballot Slot Line */}
        <div className="w-24 h-1.5 bg-slate-950 rounded-full mb-1 opacity-80" />

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:translate-x-0.5 active:translate-y-0.5 text-slate-950 font-comic font-black text-sm rounded-xl border-3 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <UserCheck className="w-5 h-5 text-slate-950" />
          <span>DAFTAR CALON &amp; MASUK SPR! 🗳️ ➔</span>
        </button>
      </footer>
    </div>
  );
}
