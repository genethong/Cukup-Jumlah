import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "./PuppetAvatar";
import {
  type HeadId,
  type HeadwearId,
  type LowerId,
  type OutfitId,
  type PuppetConfig,
  type ToneId,
} from "./loadRig";
import { PUPPET_BPM, beatPhase, type PuppetAnim } from "./motion";

const HEADS: { id: HeadId; gender: "m" | "f"; label: string }[] = [
  { id: "m_head_1", gender: "m", label: "Kepala L1" },
  { id: "m_head_2", gender: "m", label: "Kepala L2" },
  { id: "m_head_3", gender: "m", label: "Kepala L3" },
  { id: "f_head_1", gender: "f", label: "Kepala P1" },
  { id: "f_head_2", gender: "f", label: "Kepala P2" },
];

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



const HATS: { id: HeadwearId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "songkok", label: "Songkok" },
  { id: "tudung", label: "Tudung" },
  { id: "ketayap", label: "Ketayap" },
  { id: "turban", label: "Serban" },
  { id: "baseball_cap", label: "Topi" },
];

const OUTFITS: { id: OutfitId; label: string }[] = [
  { id: "baju_melayu", label: "Baju Melayu" },
  { id: "batik_shirt", label: "Batik" },
  { id: "business_suit", label: "Suit" },
  { id: "baju_kurung", label: "Baju Kurung" },
];

const LOWERS: { id: LowerId | null; label: string }[] = [
  { id: null, label: "Tiada" },
  { id: "songket_samping", label: "Samping" },
  { id: "sarong", label: "Kain" },
];

const CAST: PuppetConfig[] = [
  { gender: "m", tone: "tone_6", head: "m_head_1", headwear: "songkok", outfit: "baju_melayu", lower: "songket_samping" },
  { gender: "f", tone: "tone_4", head: "f_head_1", headwear: "tudung", outfit: "baju_kurung", lower: "sarong" },
  { gender: "m", tone: "tone_2", head: "m_head_2", headwear: "baseball_cap", outfit: "business_suit", lower: null },
];

type Burst = { index: number; anim: Extract<PuppetAnim, "hop" | "rod-wiggle">; token: number };

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function randomConfig(current?: PuppetConfig): PuppetConfig {
  let attempts = 0;
  while (attempts < 10) {
    const gender: "m" | "f" = Math.random() > 0.5 ? "m" : "f";
    const headsForGender = HEADS.filter((h) => h.gender === gender);
    const candidate: PuppetConfig = {
      gender,
      tone: pick(TONES).id,
      head: pick(headsForGender).id,
      headwear: pick(HATS).id,
      outfit: pick(OUTFITS).id,
      lower: pick(LOWERS).id,
    };
    if (!current) return candidate;
    // Ensure candidate visibly differs in outfit or head or headwear
    if (
      candidate.outfit !== current.outfit ||
      candidate.head !== current.head ||
      candidate.headwear !== current.headwear ||
      candidate.tone !== current.tone
    ) {
      return candidate;
    }
    attempts++;
  }
  return {
    gender: current?.gender === "m" ? "f" : "m",
    tone: pick(TONES).id,
    head: pick(HEADS).id,
    headwear: pick(HATS).id,
    outfit: pick(OUTFITS).id,
    lower: pick(LOWERS).id,
  };
}

function headLabel(id: HeadId) {
  return HEADS.find((item) => item.id === id)?.label ?? id;
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
      className="inline-block h-2.5 w-2.5 rounded-full bg-[#e4572e] shadow-[0_0_10px_2px_rgba(228,87,46,0.65)]"
    />
  );
}

const LABS = [
  { id: "head" as const, label: "Kepala" },
  { id: "character" as const, label: "YB" },
  { id: "stage" as const, label: "Pentas" },
  { id: "puppet" as const, label: "Wayang" },
];

export function PuppetLab() {
  const [cast, setCast] = useState<PuppetConfig[]>(CAST);
  const [selected, setSelected] = useState(1);
  const [burst, setBurst] = useState<Burst | null>(null);



  const trigger = (index: number, anim: Burst["anim"]) => {
    const token = Date.now() + Math.random();
    setSelected(index);
    setBurst({ index, anim, token });
    window.setTimeout(() => {
      setBurst((current) => (current?.token === token ? null : current));
    }, anim === "hop" ? 760 : 1040);
  };

  const update = (patch: Partial<PuppetConfig>) => {
    setCast((current) =>
      current.map((config, index) => {
        if (index !== selected) return config;
        const next = { ...config, ...patch };
        // When gender changes, ensure head matches gender
        if (patch.gender && patch.gender !== config.gender) {
          const availableHeads = HEADS.filter((h) => h.gender === patch.gender);
          if (!availableHeads.some((h) => h.id === next.head)) {
            next.head = availableHeads[0].id;
          }
        }
        return next;
      }),
    );
  };

  const active = cast[selected] ?? cast[0];
  const activeGender = active.gender ?? (active.head.startsWith("f_") ? "f" : "m");
  const availableHeads = HEADS.filter((h) => h.gender === activeGender);


  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto text-[#24170f]">
      <div
        className="flex min-h-full flex-col"
        style={{
          background: `
            radial-gradient(ellipse 48% 32% at 50% 0%, rgba(255, 214, 140, 0.95), transparent 62%),
            radial-gradient(ellipse 28% 20% at 12% 0%, rgba(255, 186, 96, 0.4), transparent 70%),
            radial-gradient(ellipse 28% 20% at 88% 0%, rgba(255, 186, 96, 0.38), transparent 70%),
            linear-gradient(180deg, #f4dfc0 0%, #e8c89a 46%, #d7ae78 100%)
          `,
        }}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <div>
            <p className="font-tally text-[10px] tracking-[0.22em] text-[#7a4e24] uppercase">
              Dev · boneka kertas
            </p>
            <h1 className="font-display text-2xl leading-none font-semibold text-[#3a2414]">
              Makmal Wayang
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Makmal" className="flex flex-wrap gap-1.5">
              {LABS.map((lab) => (
                <Link
                  key={lab.id}
                  to="/dev"
                  search={{ lab: lab.id }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    lab.id === "puppet"
                      ? "bg-[#3a2414] text-[#f6e7cf]"
                      : "bg-[#f6e7cf]/80 text-[#3a2414] ring-1 ring-[#3a2414]/15"
                  }`}
                >
                  {lab.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/"
              className="rounded-full bg-[#f6e7cf]/80 px-3 py-1.5 text-xs font-bold text-[#3a2414] ring-1 ring-[#3a2414]/15"
            >
              Permainan
            </Link>
          </div>
        </header>

        <section className="relative flex min-h-[42dvh] flex-1 flex-col px-2 pt-1 pb-2 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1 left-1/2 h-7 w-5 -translate-x-1/2 rounded-b-md bg-[#f3d48a]"
            style={{ boxShadow: "0 0 42px 18px rgba(255, 196, 110, 0.55)" }}
          />
          <div className="grid min-h-[300px] w-full flex-1 grid-cols-3 items-stretch gap-1 sm:min-h-[420px] sm:gap-4">
            {cast.map((config, index) => {
              const anim: PuppetAnim = burst?.index === index ? burst.anim : "idle";
              const currentToneHex = TONES.find((t) => t.id === config.tone)?.hex ?? "#C48854";
              return (
                <div key={index} className="flex h-full min-w-0 flex-col">
                  <button
                    type="button"
                    aria-pressed={selected === index}
                    aria-label={`${headLabel(config.head)}. Ketik untuk lompat.`}
                    onClick={() => trigger(index, "hop")}
                    className={`relative h-full min-h-[220px] w-full rounded-[28px] transition ${
                      selected === index ? "bg-[#fff6e4]/35 ring-2 ring-[#8a5a2a]/70" : ""
                    }`}
                  >
                    <PuppetAvatar config={config} anim={anim} />
                  </button>
                  <p className="truncate px-1 text-center text-[11px] font-semibold text-[#4a3018] sm:text-xs">
                    {headLabel(config.head)}
                    <span className="mt-0.5 flex items-center justify-center gap-1.5 font-normal text-[#6d5138]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-[#2a1c12]/30 shadow-xs"
                        style={{ backgroundColor: currentToneHex }}
                      />
                      Tone {config.tone.replace("tone_", "")}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="relative mx-3 mb-3 rounded-2xl px-4 py-3 shadow-[0_18px_40px_rgba(70,40,16,0.18)] ring-1 ring-[#2a1c12]/10 sm:mx-6"
          style={{
            backgroundColor: "#efe4d0",
            backgroundImage: `
              radial-gradient(rgba(48, 32, 18, 0.055) 0.7px, transparent 0.8px),
              radial-gradient(rgba(48, 32, 18, 0.04) 0.6px, transparent 0.75px),
              repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(60, 40, 20, 0.018) 4px)
            `,
            backgroundSize: "4px 4px, 7px 7px, auto",
            backgroundPosition: "0 0, 1px 2px, 0 0",
          }}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#2a1c12] pb-2">
            <div>
              <p className="font-tally text-[10px] tracking-[0.28em] text-[#9a3b2f] uppercase">
                Kertas wayang
              </p>
              <p className="font-display text-lg leading-tight font-semibold">
                Watak rekaan, bukan orang sebenar
              </p>
            </div>
            <p className="flex items-center gap-3 text-xs font-bold tracking-wide text-[#5c4030] uppercase">
              <Link to="/dev" search={{ lab: "puppet", sheet: 1 }} className="underline">
                Semua kombinasi
              </Link>
              <span className="inline-flex items-center gap-2">
                <BeatLamp />
                {PUPPET_BPM} BPM
              </span>
            </p>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <PaperButton
              onClick={() => {
                update(randomConfig(active));
                trigger(selected, "hop");
              }}
              label="Rawak boneka ini"
            >
              Rawak
            </PaperButton>
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

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Jantina (Gender) */}
            <Picker
              legend="Jantina"
              options={GENDERS}
              value={activeGender}
              onChange={(gender) => update({ gender })}
            />

            {/* Warna kulit (Skin Tone Swatches) */}
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

            {/* Kepala (Head Shape / Silhouette) */}
            <Picker
              legend="Kepala"
              options={availableHeads}
              value={active.head}
              onChange={(head) => update({ head })}
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

            {/* Kain */}
            <Picker
              legend="Kain"
              options={LOWERS}
              value={active.lower}
              onChange={(lower) => update({ lower })}
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
