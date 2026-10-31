import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "./PuppetAvatar";
import type { PuppetConfig } from "./loadRig";
import {
  EXPRESSIONS,
  EXTRAS,
  EYES,
  FACIAL_HAIR,
  FOOTWEAR,
  GENDERS,
  LOWERS,
  NOSES,
  browsFor,
  TONES,
  hairFor,
  hatsFor,
  outfitsFor,
  randomConfig,
  shapesFor,
  withPatch,
} from "./options";
import { PUPPET_BPM, beatPhase, type PuppetAnim } from "./motion";

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
  const availableShapes = shapesFor(activeGender);
  const availableHair = hairFor(activeGender);
  const availableHats = hatsFor(activeGender);

  const update = (patch: Partial<PuppetConfig>) => {
    setCast((prev) => prev.map((cfg, i) => (i === selected ? withPatch(cfg, patch) : cfg)));
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
            const anim: PuppetAnim = burst && burst.index === idx ? burst.anim : "idle";
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
                  <PuppetAvatar config={cfg} anim={anim} label={`Boneka ${idx + 1}`} />
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
                setCast([randomConfig(), randomConfig(), randomConfig()]);
                trigger(selected, "hop");
              }}
              label="Rawak ketiga-tiga boneka"
            >
              Rawak semua
            </PaperButton>
            <PaperButton onClick={() => trigger(selected, "hop")} label="Lompat dan sorak">
              Lompat
            </PaperButton>
            <PaperButton
              onClick={() => trigger(selected, "rod-wiggle")}
              label="Goyang batang wayang"
            >
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

            {/* Kening (perempuan sahaja) */}
            {activeGender === "f" ? (
              <Picker
                legend="Kening"
                options={browsFor(activeGender)}
                value={active.brows ?? "natural"}
                onChange={(brows) => update({ brows })}
              />
            ) : null}

            {/* Hidung */}
            <Picker
              legend="Hidung"
              options={NOSES}
              value={active.nose ?? "soft"}
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
              options={availableHats}
              value={active.headwear}
              onChange={(headwear) => update({ headwear })}
            />

            {/* Baju */}
            <Picker
              legend="Baju"
              options={outfitsFor(activeGender)}
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
