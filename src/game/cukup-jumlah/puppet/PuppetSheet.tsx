import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "./PuppetAvatar";
import type {
  ExpressionId,
  FootwearId,
  HeadId,
  HeadwearId,
  LowerId,
  OutfitId,
  PuppetConfig,
  ToneId,
} from "./loadRig";
import type { PuppetPose } from "./motion";

const HEADS: HeadId[] = ["m_oval", "m_round", "m_square", "f_oval", "f_round"];
const OUTFITS: OutfitId[] = [
  "baju_melayu",
  "batik_shirt",
  "business_suit",
  "baju_kurung",
  "tshirt",
  "hoodie",
];
const LOWERS: (LowerId | null)[] = [null, "jeans", "songket_samping", "sarong"];

const TONES_QA: ToneId[] = ["tone_2", "tone_5", "tone_7"];
const EXPR_QA: { id: ExpressionId; label: string }[] = [
  { id: "neutral", label: "Biasa" },
  { id: "smug_grin", label: "Senyum Sinis" },
  { id: "big_laugh", label: "Gelak Besar" },
  { id: "angry_shout", label: "Jerit Marah" },
  { id: "nervous_smile", label: "Senyum Gementar" },
  { id: "shocked_o", label: "Terkejut" },
  { id: "sly_smirk", label: "Senyum Senget" },
  { id: "crying_pout", label: "Menangis" },
];
const CAPS_QA: { id: HeadwearId; label: string }[] = [
  { id: "baseball_cap", label: "Topi Biru" },
  { id: "baseball_cap_red", label: "Topi Merah" },
  { id: "baseball_cap_mustard", label: "Topi Mustard" },
];
const FOOTWEAR_QA: { id: FootwearId; label: string }[] = [
  { id: "default", label: "Kaki Ayam" },
  { id: "selipar", label: "Selipar" },
  { id: "sneakers", label: "Sneakers" },
];

const MID_SWAY: PuppetPose = {
  sway: 2.6,
  head: -1.4,
  shoulder: 3.2,
  elbow: 5,
  hip: 1.2,
};

function Cell({
  config,
  pose,
  caption,
}: {
  config: PuppetConfig;
  pose?: PuppetPose;
  caption?: string;
}) {
  return (
    <figure className="m-0 flex w-[150px] flex-col items-center">
      <div className="h-[240px] w-full">
        <PuppetAvatar config={config} anim="still" pose={pose} />
      </div>
      <figcaption className="text-center text-[10px] leading-tight text-[#4a3018] mt-1">
        {caption ?? (
          <>
            {config.head ?? `${config.gender}_${config.faceShape}`}
            <br />
            {config.outfit} · {config.lower ?? "tiada"}
            {config.footwear === "sneakers" ? " · kasut" : ""}
          </>
        )}
      </figcaption>
    </figure>
  );
}

function Grid({ pose }: { pose?: PuppetPose }) {
  return (
    <div className="flex flex-col gap-3">
      {HEADS.map((head) => (
        <div key={head} className="flex flex-wrap gap-2">
          {OUTFITS.flatMap((outfit) =>
            LOWERS.map((lower) => (
              <Cell
                key={`${head}-${outfit}-${lower ?? "none"}`}
                config={{
                  head,
                  gender: head.startsWith("f") ? "f" : "m",
                  tone: "tone_4",
                  headwear: null,
                  outfit,
                  lower,
                  footwear:
                    outfit === "tshirt" || outfit === "hoodie" || lower === "jeans"
                      ? "sneakers"
                      : "default",
                }}
                pose={pose}
              />
            )),
          )}
        </div>
      ))}
    </div>
  );
}

/** QA Sheet for Puppet v5: Tones, Expressions, Caps, Footwear and full combo grid */
export function PuppetSheet() {
  return (
    <div className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[#f3dfc0] px-6 py-6 text-[#24170f]">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-[#24170f]/20 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Helaian Hubungan Boneka (v5)</h1>
          <p className="text-xs text-[#6a4a32]">Pengesahan QA: Muka berlapis, Topi, Kasut & Jeans</p>
        </div>
        <Link to="/dev" search={{ lab: "puppet" }} className="text-sm font-bold underline hover:text-[#9a3b2f]">
          ← Kembali ke Makmal
        </Link>
      </div>

      {/* 1. Tones QA */}
      <section id="qa-tones" className="mb-8 rounded-xl bg-[#fff8ee]/70 p-4 border border-[#2a1c12]/15">
        <h2 className="mb-3 font-tally text-sm font-bold tracking-wider text-[#9a3b2f] uppercase">
          1. Jantina & 3 Nada Kulit (Tone 2, 5, 7)
        </h2>
        <div className="flex flex-wrap gap-4">
          {(["m", "f"] as const).flatMap((gender) =>
            TONES_QA.map((tone) => (
              <Cell
                key={`tone-${gender}-${tone}`}
                config={{
                  gender,
                  faceShape: "oval",
                  tone,
                  hair: gender === "m" ? "sidepart" : "bun",
                  headwear: null,
                  outfit: gender === "m" ? "baju_melayu" : "baju_kurung",
                  lower: gender === "m" ? "songket_samping" : "sarong",
                  footwear: "default",
                }}
                caption={`${gender === "m" ? "Lelaki" : "Perempuan"} · ${tone}`}
              />
            )),
          )}
        </div>
      </section>

      {/* 2. Expressions QA */}
      <section id="qa-expressions" className="mb-8 rounded-xl bg-[#fff8ee]/70 p-4 border border-[#2a1c12]/15">
        <h2 className="mb-3 font-tally text-sm font-bold tracking-wider text-[#9a3b2f] uppercase">
          2. Semua 8 Ekspresi Muka
        </h2>
        <div className="flex flex-wrap gap-4">
          {EXPR_QA.map((expr) => (
            <Cell
              key={`expr-${expr.id}`}
              config={{
                gender: "m",
                faceShape: "oval",
                tone: "tone_4",
                expression: expr.id,
                hair: "sidepart",
                headwear: null,
                outfit: "batik_shirt",
                lower: null,
                footwear: "default",
              }}
              caption={expr.label}
            />
          ))}
        </div>
      </section>

      {/* 3. Baseball Caps QA */}
      <section id="qa-caps" className="mb-8 rounded-xl bg-[#fff8ee]/70 p-4 border border-[#2a1c12]/15">
        <h2 className="mb-3 font-tally text-sm font-bold tracking-wider text-[#9a3b2f] uppercase">
          3. Tiga Warna Topi Baseball (Lelaki & Perempuan)
        </h2>
        <div className="flex flex-wrap gap-4">
          {(["m", "f"] as const).flatMap((gender) =>
            CAPS_QA.map((cap) => (
              <Cell
                key={`cap-${gender}-${cap.id}`}
                config={{
                  gender,
                  faceShape: "oval",
                  tone: "tone_3",
                  hair: gender === "m" ? "sidepart" : "bob",
                  headwear: cap.id,
                  outfit: "tshirt",
                  lower: "jeans",
                  footwear: "sneakers",
                }}
                caption={`${gender === "m" ? "Lelaki" : "Perempuan"} · ${cap.label}`}
              />
            )),
          )}
        </div>
      </section>

      {/* 4. Footwear & Jeans QA */}
      <section id="qa-footwear" className="mb-8 rounded-xl bg-[#fff8ee]/70 p-4 border border-[#2a1c12]/15">
        <h2 className="mb-3 font-tally text-sm font-bold tracking-wider text-[#9a3b2f] uppercase">
          4. Kasut dengan Jeans & Kain Sarong
        </h2>
        <div className="flex flex-wrap gap-4">
          {(["jeans", "sarong"] as const).flatMap((lower) =>
            FOOTWEAR_QA.map((fw) => (
              <Cell
                key={`fw-${lower}-${fw.id}`}
                config={{
                  gender: "m",
                  faceShape: "oval",
                  tone: "tone_4",
                  hair: "sidepart",
                  headwear: null,
                  outfit: lower === "jeans" ? "hoodie" : "batik_shirt",
                  lower,
                  footwear: fw.id,
                }}
                caption={`${lower === "jeans" ? "Jeans" : "Sarong"} · ${fw.label}`}
              />
            )),
          )}
        </div>
      </section>

      {/* 5. Full Grid */}
      <section className="mt-8 border-t border-[#2a1c12]/20 pt-6">
        <h2 className="mb-4 font-tally text-sm font-bold tracking-wider text-[#6a4a32] uppercase">
          5. Grid Kombinasi Bentuk Muka × Baju (Rehat)
        </h2>
        <Grid />
        <h2 className="mt-10 mb-4 font-tally text-sm font-bold tracking-wider text-[#6a4a32] uppercase">
          6. Grid Puncak Goyang
        </h2>
        <Grid pose={MID_SWAY} />
      </section>
    </div>
  );
}
