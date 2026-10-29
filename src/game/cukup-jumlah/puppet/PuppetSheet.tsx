import { Link } from "@tanstack/react-router";
import { PuppetAvatar } from "./PuppetAvatar";
import type { HeadId, LowerId, OutfitId, PuppetConfig } from "./loadRig";
import type { PuppetPose } from "./motion";

const HEADS: HeadId[] = ["m_head_1", "m_head_2", "m_head_3", "f_head_1", "f_head_2"];
const OUTFITS: OutfitId[] = [
  "baju_melayu",
  "batik_shirt",
  "business_suit",
  "baju_kurung",
  "tshirt",
  "hoodie",
];
const LOWERS: (LowerId | null)[] = [null, "jeans", "songket_samping", "sarong"];

const MID_SWAY: PuppetPose = {
  sway: 2.6,
  head: -1.4,
  shoulder: 3.2,
  elbow: 5,
  hip: 1.2,
};

function Cell({ config, pose }: { config: PuppetConfig; pose?: PuppetPose }) {
  return (
    <figure className="m-0 flex w-[148px] flex-col items-center">
      <div className="h-[230px] w-full">
        <PuppetAvatar config={config} anim="still" pose={pose} />
      </div>
      <figcaption className="text-center text-[10px] leading-tight text-[#4a3018]">
        {config.head}
        <br />
        {config.outfit} · {config.lower ?? "tiada"}
        {config.footwear === "sneakers" ? " · kasut" : ""}
      </figcaption>
    </figure>
  );
}

function Grid({ pose }: { pose?: PuppetPose }) {
  return (
    <div className="flex flex-col gap-3">
      {HEADS.map((head) => (
        <div key={head} className="flex flex-wrap gap-1">
          {OUTFITS.flatMap((outfit) =>
            LOWERS.map((lower) => (
              <Cell
                key={`${head}-${outfit}-${lower ?? "none"}`}
                config={{
                  head,
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

/** Every head × outfit × lower, at rest and at the peak of the idle sway. */
export function PuppetSheet() {
  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto bg-[#f3dfc0] px-4 py-4 text-[#24170f]">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Semua kombinasi</h1>
        <Link to="/dev" search={{ lab: "puppet" }} className="text-sm font-bold underline">
          Kembali ke makmal
        </Link>
      </div>
      <h2 className="mb-2 font-tally text-xs tracking-widest uppercase">Rehat</h2>
      <Grid />
      <h2 className="mt-8 mb-2 font-tally text-xs tracking-widest uppercase">Puncak goyang</h2>
      <Grid pose={MID_SWAY} />
    </div>
  );
}
