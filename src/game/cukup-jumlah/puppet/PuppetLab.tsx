import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "./PuppetAvatar";
import {
  type BrowId,
  type ExpressionId,
  type ExtraId,
  type EyeId,
  type FaceShapeId,
  type FacialHairId,
  type FootwearId,
  type HeadwearId,
  type LowerId,
  type NoseId,
  type OutfitId,
  type PuppetConfig,
  type ToneId,
} from "./loadRig";
import { PUPPET_BPM, beatPhase, type PuppetAnim } from "./motion";

const TONES: { id: ToneId; hex: string; label: string }[] = [
  { id: "tone_1", hex: "#F6DABA", label: "1" },
  { id: "tone_2", hex: "#ECC49A", label: "2" },
  { id: "tone_3", hex: "#D6A472", label: "3" },
  { id: "tone_4", hex: "#C48854", label: "4" },
  { id: "tone_5", hex: "#B27647", label: "5" },
  { id: "tone_6", hex: "#A0643A", label: "6" },
  { id: "tone_7", hex: "#764628", label: "7" },
  { id: "tone_8", hex: "#563420", label: "8" },
];

const GENDERS: { id: "m" | "f"; label: string }[] = [
  { id: "m", label: "Lelaki" },
  { id: "f", label: "Perempuan" },
];

const SHAPES_M: { id: FaceShapeId; label: string }[] = [
  { id: "oval", label: "Bujur" },
  { id: "round", label: "Bulat" },
  { id: "square", label: "Segi Empat" },
  { id: "long", label: "Panjang" },
];

const SHAPES_F: { id: FaceShapeId; label: string }[] = [
  { id: "oval", label: "Bujur" },
  { id: "round", label: "Bulat" },
  { id: "heart", label: "Bentuk Hati" },
  { id: "long", label: "Panjang" },
];

const EYES: { id: EyeId; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "sleepy", label: "Mengantuk" },
  { id: "round", label: "Bulat" },
];

const BROWS: { id: BrowId; label: string }[] = [
  { id: "natural", label: "Semula Jadi" },
  { id: "thick_arched", label: "Tebal" },
  { id: "bushy", label: "Lebat" },
  { id: "thin", label: "Nipis" },
];

const NOSES: { id: NoseId; label: string }[] = [
  { id: "soft", label: "Lembut" },
  { id: "medium", label: "Sederhana" },
  { id: "prominent", label: "Menonjol" },
];

const EXPRESSIONS: { id: ExpressionId; label: string }[] = [
  { id: "neutral", label: "Biasa" },
  { id: "smug_grin", label: "Senyum Sinis" },
  { id: "big_laugh", label: "Gelak Besar" },
  { id: "angry_shout", label: "Jerit Marah" },
  { id: "nervous_smile", label: "Senyum Gementar" },
  { id: "shocked_o", label: "Terkejut" },
  { id: "sly_smirk", label: "Senyum Senget" },
  { id: "crying_pout", label: "Menangis" },
];

const HAIR_M: { id: string; label: string }[] = [
  { id: "sidepart", label: "Belah Tepi" },
  { id: "crew", label: "Crew Cut" },
  { id: "curly", label: "Kerinting" },
  { id: "pompadour", label: "Pompadour" },
  { id: "long", label: "Panjang" },
  { id: "horseshoe", label: "Horseshoe" },
  { id: "bald", label: "Botak" },
];

const HAIR_F: { id: string; label: string }[] = [
  { id: "bun", label: "Sanggul" },
  { id: "bob", label: "Bob" },
  { id: "ponytail", label: "Ekor Kuda" },
  { id: "curly", label: "Kerinting" },
  { id: "long", label: "Panjang" },
  { id: "bouffant", label: "Bouffant" },
  { id: "pixie", label: "Pixie" },
  { id: "none", label: "Tiada" },
];

const FACIAL_HAIR: { id: FacialHairId; label: string }[] = [
  { id: "none", label: "Tiada" },
  { id: "handlebar", label: "Handlebar" },
  { id: "thin", label: "Nipis" },
  { id: "full_beard", label: "Janggut Penuh" },
  { id: "stubble", label: "Renjis" },
];

const EXTRAS: { id: ExtraId; label: string }[] = [
  { id: "none", label: "Tiada" },
  { id: "glasses", label: "Cermin Mata" },
  { id: "sunglasses", label: "Cermin Gelap" },
  { id: "blush", label: "Pipi Merah" },
  { id: "mole", label: "Tahi Lalat" },
];

const HATS: { id: HeadwearId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "songkok", label: "Songkok" },
  { id: "tudung", label: "Tudung" },
  { id: "ketayap", label: "Ketayap" },
  { id: "turban", label: "Serban" },
  { id: "baseball_cap", label: "Topi Biru" },
  { id: "baseball_cap_red", label: "Topi Merah" },
  { id: "baseball_cap_mustard", label: "Topi Mustard" },
];

const OUTFITS: { id: OutfitId; label: string }[] = [
  { id: "baju_melayu", label: "Baju Melayu" },
  { id: "batik_shirt", label: "Batik" },
  { id: "business_suit", label: "Suit" },
  { id: "baju_kurung", label: "Baju Kurung" },
  { id: "tshirt", label: "T-shirt" },
  { id: "hoodie", label: "Hoodie" },
];

const LOWERS: { id: LowerId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "jeans", label: "Jeans" },
  { id: "songket_samping", label: "Samping" },
  { id: "sarong", label: "Kain" },
];

const FOOTWEAR: { id: FootwearId; label: string }[] = [
  { id: "default", label: "Kaki Ayam" },
  { id: "selipar", label: "Selipar" },
  { id: "sneakers", label: "Sneakers" },
];

const CAST: PuppetConfig[] = [
  {
    gender: "m",
    tone: "tone_6",
    faceShape: "oval",
    hair: "sidepart",
    headwear: "songkok",
    outfit: "baju_melayu",
    lower: "songket_samping",
  },
  {
    gender: "f",
    tone: "tone_4",
    faceShape: "oval",
    hair: "bun",
    headwear: "tudung",
    outfit: "baju_kurung",
    lower: "sarong",
  },
  {
    gender: "m",
    tone: "tone_2",
    faceShape: "round",
    hair: "curly",
    headwear: "baseball_cap",
    outfit: "business_suit",
    lower: null,
  },
];

type Burst = { index: number; anim: Extract<PuppetAnim, "hop" | "rod-wiggle">; token: number };

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function randomConfig(current?: PuppetConfig): PuppetConfig {
  const gender: "m" | "f" = Math.random() > 0.5 ? "m" : "f";
  const shapes = gender === "m" ? SHAPES_M : SHAPES_F;
  const hairs = gender === "m" ? HAIR_M : HAIR_F;

  return {
    gender,
    tone: pick(TONES).id,
    faceShape: pick(shapes).id,
    eyes: pick(EYES).id,
    brows: pick(BROWS).id,
    nose: pick(NOSES).id,
    expression: pick(EXPRESSIONS).id,
    hair: pick(hairs).id,
    facialHair: gender === "m" ? pick(FACIAL_HAIR).id : "none",
    extra: pick(EXTRAS).id,
    headwear: pick(HATS).id,
    outfit: pick(OUTFITS).id,
    lower: pick(LOWERS).id,
    footwear: pick(FOOTWEAR).id,
  };
}

function BeatLamp() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const { phase, index } = beatPhase(now / 1000, PUPPET_BPM);
      const accent = index % 4 === 0 ? 1 : 0.72;
      const pulse = Math.exp(-phase * 6.8) * accent;
      const el = ref.current;
      if (el) {
        el.style.transform = `scale(${0.72 + pulse * 0.48})`;
        el.style.opacity = `${0.45 + pulse * 0.55}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="inline-block h-2.5 w-2.5 rounded-full bg-[#e4572e] shadow-[0_0_8px_#e4572e] transition-transform"
    />
  );
}

export function PuppetLab() {
  const [cast, setCast] = useState<PuppetConfig[]>(CAST);
  const [selected, setSelected] = useState<number>(0);
  const [burst, setBurst] = useState<Burst | null>(null);

  const active = cast[selected];
  const activeGender = active.gender ?? "m";
  const availableShapes = activeGender === "m" ? SHAPES_M : SHAPES_F;
  const availableHair = activeGender === "m" ? HAIR_M : HAIR_F;

  const update = (patch: Partial<PuppetConfig>) => {
    setCast((prev) =>
      prev.map((cfg, i) => {
        if (i !== selected) return cfg;
        const next = { ...cfg, ...patch };
        if (patch.gender && patch.gender !== cfg.gender) {
          if (patch.gender === "m") {
            if (next.faceShape === "heart") next.faceShape = "oval";
            next.hair = "sidepart";
            next.brows = "thick_arched";
            next.nose = "medium";
          } else {
            if (next.faceShape === "square") next.faceShape = "oval";
            next.hair = "bun";
            next.brows = "natural";
            next.nose = "soft";
            next.facialHair = "none";
          }
        }
        return next;
      }),
    );
  };

  const trigger = (index: number, anim: Extract<PuppetAnim, "hop" | "rod-wiggle">) => {
    setBurst({ index, anim, token: Date.now() });
  };

  return (
    <div className="min-h-dvh bg-[#f3dfc0] px-4 py-6 text-[#24170f]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#24170f]/20 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Makmal Boneka Wayang (v5)
            </h1>
            <BeatLamp />
            <span className="font-tally text-xs tracking-wider text-[#6a4a32] uppercase">
              {PUPPET_BPM} BPM
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/dev"
              search={{ lab: "puppet", sheet: 1 }}
              className="font-bold underline hover:text-[#9a3b2f]"
            >
              Semua kombinasi
            </Link>
          </div>
        </header>

        {/* The Stage */}
        <div
          role="region"
          aria-label="Pentas boneka"
          className="relative grid min-h-[380px] grid-cols-3 items-end overflow-hidden rounded-2xl border-4 border-[#2a1c12] bg-[#fbf3e4] px-4 pt-12 pb-6 shadow-[6px_6px_0_#8a623c]"
        >
          {cast.map((cfg, idx) => {
            const isSelected = idx === selected;
            const anim: PuppetAnim =
              burst && burst.index === idx ? burst.anim : "idle";
            return (
              <div
                key={idx}
                className="relative flex h-[340px] min-h-0 w-full flex-col items-center"
              >
                <div
                  className={`relative min-h-0 w-full flex-1 cursor-pointer transition-transform ${
                    isSelected ? "scale-102" : "opacity-85 hover:opacity-100"
                  }`}
                  onClick={() => setSelected(idx)}
                >
                  <PuppetAvatar
                    config={cfg}
                    anim={anim}
                    label={`Boneka ${idx + 1}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(idx)}
                  className={`mt-2 shrink-0 rounded-full px-3 py-1 font-tally text-xs tracking-wider uppercase transition-colors ${
                    isSelected
                      ? "bg-[#2a1c12] text-[#f6ead8]"
                      : "bg-[#2a1c12]/10 text-[#2a1c12] hover:bg-[#2a1c12]/20"
                  }`}
                >
                  Boneka {idx + 1}
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <section aria-label="Kawalan Boneka" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <PaperButton
              onClick={() => {
                setCast([randomConfig(cast[0]), randomConfig(cast[1]), randomConfig(cast[2])]);
                trigger(selected, "hop");
              }}
              label="Rawak ketiga-tiga boneka"
            >
              Rawak semua
            </PaperButton>
            <PaperButton onClick={() => trigger(selected, "hop")} label="Lompat dan sorak">
              Lompat
            </PaperButton>
            <PaperButton onClick={() => trigger(selected, "rod-wiggle")} label="Goyang batang wayang">
              Goyang batang
            </PaperButton>
          </div>

          {/* Pickers Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Jantina */}
            <Picker
              legend="Jantina"
              options={GENDERS}
              value={activeGender}
              onChange={(gender) => update({ gender })}
            />

            {/* Warna kulit */}
            <fieldset className="min-w-0">
              <legend className="mb-1.5 font-tally text-[11px] tracking-[0.16em] text-[#6a4a32] uppercase">
                Warna kulit
              </legend>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {TONES.map((t) => {
                  const isCurrent = active.tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`Warna kulit ${t.label}`}
                      aria-pressed={isCurrent}
                      onClick={() => update({ tone: t.id })}
                      className={`relative h-8 w-8 rounded-full border border-black/20 transition-all ${
                        isCurrent
                          ? "scale-115 ring-2 ring-[#9a3b2f] ring-offset-2 shadow-md"
                          : "opacity-85 hover:opacity-100 hover:scale-105"
                      }`}
                      style={{ backgroundColor: t.hex }}
                    />
                  );
                })}
              </div>
            </fieldset>

            {/* Bentuk Muka */}
            <Picker
              legend="Bentuk Muka"
              options={availableShapes}
              value={active.faceShape ?? "oval"}
              onChange={(faceShape) => update({ faceShape })}
            />

            {/* Mata */}
            <Picker
              legend="Mata"
              options={EYES}
              value={active.eyes ?? "normal"}
              onChange={(eyes) => update({ eyes })}
            />

            {/* Kening */}
            <Picker
              legend="Kening"
              options={BROWS}
              value={active.brows ?? (activeGender === "m" ? "thick_arched" : "natural")}
              onChange={(brows) => update({ brows })}
            />

            {/* Hidung */}
            <Picker
              legend="Hidung"
              options={NOSES}
              value={active.nose ?? (activeGender === "m" ? "medium" : "soft")}
              onChange={(nose) => update({ nose })}
            />

            {/* Ekspresi */}
            <Picker
              legend="Ekspresi"
              options={EXPRESSIONS}
              value={active.expression ?? "neutral"}
              onChange={(expression) => update({ expression })}
            />

            {/* Rambut */}
            <Picker
              legend="Rambut"
              options={availableHair}
              value={active.hair ?? (activeGender === "m" ? "sidepart" : "bun")}
              onChange={(hair) => update({ hair })}
            />

            {/* Misai / Janggut (Lelaki sahaja) */}
            {activeGender === "m" ? (
              <Picker
                legend="Misai & Janggut"
                options={FACIAL_HAIR}
                value={active.facialHair ?? "none"}
                onChange={(facialHair) => update({ facialHair })}
              />
            ) : null}

            {/* Aksesori / Extras */}
            <Picker
              legend="Aksesori"
              options={EXTRAS}
              value={active.extra ?? "none"}
              onChange={(extra) => update({ extra })}
            />

            {/* Hiasan kepala */}
            <Picker
              legend="Hiasan kepala"
              options={HATS}
              value={active.headwear}
              onChange={(headwear) => update({ headwear })}
            />

            {/* Baju */}
            <Picker
              legend="Baju"
              options={OUTFITS}
              value={active.outfit}
              onChange={(outfit) => update({ outfit })}
            />

            {/* Seluar/Kain */}
            <Picker
              legend="Seluar/Kain"
              options={LOWERS}
              value={active.lower}
              onChange={(lower) => update({ lower })}
            />

            {/* Kasut */}
            <Picker
              legend="Kasut"
              options={FOOTWEAR}
              value={active.footwear ?? "default"}
              onChange={(footwear) => update({ footwear })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PaperButton({
  children,
  onClick,
  label,
}: {
  children: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="min-h-11 rounded-full bg-[#2a1c12] px-4 text-sm font-bold text-[#f6ead8] shadow-[2px_2px_0_#8a623c] active:translate-y-px"
    >
      {children}
    </button>
  );
}

function Picker<T extends string | null>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 font-tally text-[11px] tracking-[0.16em] text-[#6a4a32] uppercase">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const pressed = option.id === value;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(option.id)}
              className={`min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${
                pressed
                  ? "bg-[#9a3b2f] text-[#fff8ee]"
                  : "bg-[#fff8ee]/80 text-[#2a1c12] ring-1 ring-[#2a1c12]/15"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
