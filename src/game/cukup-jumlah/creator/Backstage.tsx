import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PuppetAvatar } from "../puppet/PuppetAvatar";
import type { PuppetConfig } from "../puppet/loadRig";
import type { PuppetAnim } from "../puppet/motion";
import {
  BROWS,
  EXPRESSIONS,
  EXTRAS,
  EYES,
  FACIAL_HAIR,
  FOOTWEAR,
  GENDERS,
  LOWERS,
  NOSES,
  OUTFITS,
  TONES,
  hairFor,
  hatsFor,
  randomConfig,
  shapesFor,
  withPatch,
  type Option,
} from "../puppet/options";
import { CutStamp, StageBox } from "../stage/Panggung";
import "../stage/stage.css";
import {
  DEFAULT_CANDIDATE,
  NAME_MAX,
  PARTIES,
  TALENTS,
  cleanName,
  loadCandidate,
  saveCandidate,
  type Candidate,
} from "./candidate";

// Backstage: the in-game candidate creator. A 9:16 frame with the player's puppet on
// the lit screen above and the wardrobe below. Every change is saved on this device.

type TabId = "rupa" | "rambut" | "baju" | "parti" | "bakat";

const TABS: { id: TabId; label: string }[] = [
  { id: "rupa", label: "Rupa" },
  { id: "rambut", label: "Rambut" },
  { id: "baju", label: "Baju" },
  { id: "parti", label: "Parti" },
  { id: "bakat", label: "Bakat" },
];

export function Backstage() {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate>(DEFAULT_CANDIDATE);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabId>("rupa");
  const [anim, setAnim] = useState<PuppetAnim>("idle");
  const [starting, setStarting] = useState(false);
  const animTimer = useRef<number | null>(null);

  // Storage is read after mount so the server render and first client render match.
  useEffect(() => {
    const saved = loadCandidate();
    if (saved) setCandidate(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCandidate(candidate);
  }, [candidate, loaded]);

  useEffect(
    () => () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
    },
    [],
  );

  const play = (next: Extract<PuppetAnim, "hop" | "rod-wiggle">) => {
    setAnim(next);
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnim("idle"), 700);
  };

  const { puppet } = candidate;
  const gender = puppet.gender ?? "m";
  const party = PARTIES.find((p) => p.id === candidate.party) ?? PARTIES[0]!;

  const dress = (patch: Partial<PuppetConfig>) => {
    setCandidate((c) => ({ ...c, puppet: withPatch(c.puppet, patch) }));
    play("rod-wiggle");
  };

  const shuffle = () => {
    setCandidate((c) => ({ ...c, puppet: randomConfig() }));
    play("hop");
  };

  const start = () => {
    const ready = { ...candidate, name: cleanName(candidate.name) || DEFAULT_CANDIDATE.name };
    setCandidate(ready);
    saveCandidate(ready);
    setStarting(true);
    play("hop");
    window.setTimeout(() => void navigate({ to: "/dev", search: { lab: "rentak" } }), 900);
  };

  return (
    <div className="panggung flex h-dvh flex-col items-center overflow-y-auto bg-[#1a0f08] px-4 py-3 text-[var(--cream)]">
      <header className="flex w-full max-w-[440px] items-baseline justify-between gap-2 pb-2">
        <h1 className="font-display text-xl font-bold">Belakang Tabir</h1>
        <Link to="/dev" search={{ lab: "puppet" }} className="text-sm font-bold underline">
          Makmal boneka →
        </Link>
      </header>

      <StageBox>
        <div className="@container relative flex aspect-[9/16] w-full flex-col overflow-hidden rounded-[8px] bg-[#efe1c3] text-[var(--ink)]">
          <section aria-label="Calon anda" className="kelir relative h-[43%] shrink-0">
            <div className="kelir-glow pointer-events-none absolute inset-0" />
            <div className="absolute top-[4%] left-[4%] z-10 max-w-[60%]">
              <p
                className="truncate px-[2.4cqw] py-[0.6cqw] text-[3.4cqw] font-bold text-[var(--cream)] shadow-[0_2px_4px_rgba(40,14,6,0.35)]"
                style={{ backgroundColor: party.colour }}
              >
                {party.icon} {party.name}
              </p>
              <p className="mt-[1cqw] truncate font-display text-[6cqw] leading-tight font-bold italic">
                {candidate.name || DEFAULT_CANDIDATE.name}
              </p>
            </div>
            <button
              type="button"
              onClick={shuffle}
              className="absolute top-[4%] right-[4%] z-10 min-h-[10cqw] rounded-full bg-[var(--ink)] px-[3.6cqw] text-[3.6cqw] font-bold text-[var(--cream)] shadow-[2px_2px_0_var(--brass)] active:translate-y-px"
            >
              🎲 Rawak
            </button>
            <div className="absolute inset-x-0 bottom-0 flex h-[86%] justify-center">
              <div className="relative h-full w-[66%]">
                <PuppetAvatar config={puppet} anim={anim} label={`Boneka ${candidate.name}`} />
              </div>
            </div>
            {starting && (
              <CutStamp
                lines={["SEDIA", "BERTANDING!"]}
                tone="gold"
                className="top-[50%] w-[62%]"
              />
            )}
          </section>

          <nav
            aria-label="Bahagian"
            role="tablist"
            className="flex shrink-0 gap-[1cqw] bg-[var(--wood-dark)] px-[2cqw] pt-[1.6cqw]"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`min-h-[10cqw] flex-1 rounded-t-[1.6cqw] text-[3.6cqw] font-bold ${
                  tab === t.id
                    ? "bg-[#efe1c3] text-[var(--ink)]"
                    : "bg-[var(--wood)] text-[var(--cream)]/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div
            key={tab}
            role="tabpanel"
            className="min-h-0 flex-1 overflow-y-auto px-[4cqw] py-[3cqw]"
          >
            {tab === "rupa" && (
              <Stack>
                <Chips
                  legend="Jantina"
                  options={GENDERS}
                  value={gender}
                  onChange={(g) => dress({ gender: g })}
                />
                <fieldset>
                  <Legend>Warna kulit</Legend>
                  <div className="flex flex-wrap gap-[2cqw]">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-label={`Warna kulit ${t.label}`}
                        aria-pressed={puppet.tone === t.id}
                        onClick={() => dress({ tone: t.id })}
                        className={`h-[9cqw] w-[9cqw] rounded-full border border-black/25 ${
                          puppet.tone === t.id
                            ? "ring-[0.8cqw] ring-[var(--sambal)] ring-offset-2"
                            : ""
                        }`}
                        style={{ backgroundColor: t.hex }}
                      />
                    ))}
                  </div>
                </fieldset>
                <Chips
                  legend="Bentuk muka"
                  options={shapesFor(gender)}
                  value={puppet.faceShape ?? "oval"}
                  onChange={(faceShape) => dress({ faceShape })}
                />
                <Chips
                  legend="Mata"
                  options={EYES}
                  value={puppet.eyes ?? "normal"}
                  onChange={(eyes) => dress({ eyes })}
                />
                <Chips
                  legend="Kening"
                  options={BROWS}
                  value={puppet.brows ?? "natural"}
                  onChange={(brows) => dress({ brows })}
                />
                <Chips
                  legend="Hidung"
                  options={NOSES}
                  value={puppet.nose ?? "soft"}
                  onChange={(nose) => dress({ nose })}
                />
                <Chips
                  legend="Ekspresi"
                  options={EXPRESSIONS}
                  value={puppet.expression ?? "neutral"}
                  onChange={(expression) => dress({ expression })}
                />
                {gender === "m" && (
                  <Chips
                    legend="Misai & janggut"
                    options={FACIAL_HAIR}
                    value={puppet.facialHair ?? "none"}
                    onChange={(facialHair) => dress({ facialHair })}
                  />
                )}
                <Chips
                  legend="Aksesori"
                  options={EXTRAS}
                  value={puppet.extra ?? "none"}
                  onChange={(extra) => dress({ extra })}
                />
              </Stack>
            )}

            {tab === "rambut" && (
              <Stack>
                <Chips
                  legend="Rambut"
                  options={hairFor(gender)}
                  value={puppet.hair ?? ""}
                  onChange={(hair) => dress({ hair })}
                />
                <Chips
                  legend="Hiasan kepala"
                  options={hatsFor(gender)}
                  value={puppet.headwear}
                  onChange={(headwear) => dress({ headwear })}
                />
              </Stack>
            )}

            {tab === "baju" && (
              <Stack>
                <Chips
                  legend="Baju"
                  options={OUTFITS}
                  value={puppet.outfit}
                  onChange={(outfit) => dress({ outfit })}
                />
                <Chips
                  legend="Seluar / kain"
                  options={LOWERS}
                  value={puppet.lower}
                  onChange={(lower) => dress({ lower })}
                />
                <Chips
                  legend="Kasut"
                  options={FOOTWEAR}
                  value={puppet.footwear ?? "default"}
                  onChange={(footwear) => dress({ footwear })}
                />
              </Stack>
            )}

            {tab === "parti" && (
              <Stack>
                <label className="block">
                  <Legend>Nama calon</Legend>
                  <input
                    type="text"
                    value={candidate.name}
                    maxLength={NAME_MAX}
                    onChange={(e) => setCandidate((c) => ({ ...c, name: e.target.value }))}
                    onBlur={() => setCandidate((c) => ({ ...c, name: cleanName(c.name) }))}
                    placeholder="Nama rekaan anda"
                    className="min-h-[11cqw] w-full rounded-[1.6cqw] border-2 border-[var(--ink)]/30 bg-[#fbf3e4] px-[3cqw] text-[4.2cqw] font-semibold outline-none focus:border-[var(--sambal)]"
                  />
                  <span className="mt-[1cqw] block text-[3cqw] text-[#6a4a32]">
                    Guna nama rekaan, bukan nama orang sebenar.
                  </span>
                </label>
                <fieldset>
                  <Legend>Parti</Legend>
                  <div className="grid grid-cols-2 gap-[2.4cqw]">
                    {PARTIES.map((p) => (
                      <Card
                        key={p.id}
                        pressed={candidate.party === p.id}
                        onClick={() => {
                          setCandidate((c) => ({ ...c, party: p.id }));
                          play("hop");
                        }}
                        accent={p.colour}
                        title={`${p.icon} ${p.name}`}
                        body={`“${p.slogan}”`}
                      />
                    ))}
                  </div>
                </fieldset>
              </Stack>
            )}

            {tab === "bakat" && (
              <fieldset>
                <Legend>Pilih satu bakat</Legend>
                <div className="grid grid-cols-2 gap-[2.4cqw]">
                  {TALENTS.map((t) => (
                    <Card
                      key={t.id}
                      pressed={candidate.talent === t.id}
                      onClick={() => {
                        setCandidate((c) => ({ ...c, talent: t.id }));
                        play("hop");
                      }}
                      accent="var(--sambal)"
                      title={`${t.icon} ${t.name}`}
                      body={t.effect}
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-[2.4cqw] border-t-2 border-[var(--ink)]/15 bg-[#e6d3ae] px-[4cqw] py-[2.4cqw]">
            <p className="min-w-0 flex-1 text-[3cqw] leading-snug text-[#6a4a32]">
              Disimpan pada peranti ini.
            </p>
            <button
              type="button"
              onClick={start}
              disabled={starting}
              className="min-h-[12cqw] rounded-full bg-[var(--sambal)] px-[7cqw] font-display text-[5.4cqw] font-bold text-[var(--cream)] italic shadow-[2px_3px_0_var(--ink)] active:translate-y-px disabled:opacity-70"
            >
              Mula!
            </button>
          </div>
        </div>
      </StageBox>
    </div>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[3.6cqw]">{children}</div>;
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <legend className="mb-[1.4cqw] font-tally text-[3cqw] tracking-[0.14em] text-[#8a1c19] uppercase">
      {children}
    </legend>
  );
}

function Chips<T extends string | null>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset>
      <Legend>{legend}</Legend>
      <div className="flex flex-wrap gap-[1.6cqw]">
        {options.map((o) => {
          const pressed = o.id === value;
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(o.id)}
              className={`min-h-[10cqw] rounded-full px-[3.4cqw] text-[3.6cqw] font-semibold ${
                pressed
                  ? "bg-[var(--sambal)] text-[var(--cream)]"
                  : "bg-[#fbf3e4] text-[var(--ink)] ring-1 ring-[var(--ink)]/15"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Card({
  pressed,
  onClick,
  accent,
  title,
  body,
}: {
  pressed: boolean;
  onClick: () => void;
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-[1.6cqw] border-l-[1.6cqw] bg-[#fbf3e4] p-[2.4cqw] text-left shadow-[0_2px_3px_rgba(40,14,6,0.2)] ${
        pressed ? "ring-[0.8cqw] ring-[var(--ink)]" : "opacity-85"
      }`}
      style={{ borderLeftColor: accent }}
    >
      <span className="block text-[3.6cqw] leading-tight font-bold">{title}</span>
      <span className="mt-[1cqw] block text-[3cqw] leading-snug text-[#6a4a32]">{body}</span>
    </button>
  );
}
