import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { CandidateProfile } from "@/game/cukup-jumlah/types";
import { PuppetLab } from "@/game/cukup-jumlah/puppet/PuppetLab";
import { PuppetSheet } from "@/game/cukup-jumlah/puppet/PuppetSheet";
import { StageStyleFrame } from "@/game/cukup-jumlah/stage/StageStyleFrame";
import { BeatLab } from "@/game/cukup-jumlah/beat/BeatLab";
import { Backstage } from "@/game/cukup-jumlah/creator/Backstage";
import { OptionAudit } from "@/game/cukup-jumlah/puppet/OptionAudit";
import { HeadGridInspector } from "@/game/cukup-jumlah/voxel/HeadGridInspector";
import { StageComparisonViewer } from "@/game/cukup-jumlah/voxel/StageComparisonViewer";
import { VoxelComparisonViewer } from "@/game/cukup-jumlah/voxel/VoxelComparisonViewer";
import type { StageStyleOption } from "@/game/cukup-jumlah/voxel/stageBuilder";
import type { VoxelStyleOption } from "@/game/cukup-jumlah/voxel/voxelBuilder";

const LABS = [
  "head",
  "character",
  "stage",
  "puppet",
  "panggung",
  "rentak",
  "belakang",
  "audit",
] as const;
type LabId = (typeof LABS)[number];

const LAB_LABEL: Record<LabId, string> = {
  head: "Kepala & muka",
  character: "YB model",
  stage: "Pentas",
  puppet: "Wayang",
  panggung: "Panggung",
  rentak: "Rentak",
  belakang: "Belakang Tabir",
  audit: "Audit pilihan",
};

const sampleProfile: CandidateProfile = {
  name: "Ahmad Sempoi",
  gender: "male",
  party: "PNL",
  headwear: "songkok",
  headwearColor: "#059669",
  headwearShadow: "#047857",
  headwearLight: "#10b981",
  outfit: "baju_melayu",
  clothesColor: "#1e293b",
  clothesShadow: "#0f172a",
  clothesLight: "#334155",
  skinIndex: 1,
  hair: "side_part",
  hairColor: "black",
  mouth: "clean",
  faceMark: "none",
  accessory: "none",
  bg: "#f59e0b",
  prop: "briefcase",
  talent: "lidah_manis",
  quirk: "janji_manis",
};

function isLab(value: unknown): value is LabId {
  return (LABS as readonly unknown[]).includes(value);
}

function isSheet(value: unknown) {
  return value === 1 || value === "1" || value === true;
}

export const Route = createFileRoute("/dev")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed: { lab: LabId; sheet?: 1 } = {
      lab: isLab(search.lab) ? search.lab : "head",
    };
    if (isSheet(search.sheet)) parsed.sheet = 1;
    return parsed;
  },
  component: DevLabPage,
});

function DevLabPage() {
  const { lab, sheet } = Route.useSearch();
  const navigate = useNavigate();
  const [voxelStyle, setVoxelStyle] = useState<VoxelStyleOption>("A");
  const [stageStyle, setStageStyle] = useState<StageStyleOption>("1");

  if (lab === "puppet" && sheet === 1) return <PuppetSheet />;
  if (lab === "puppet") return <PuppetLab />;
  if (lab === "panggung") return <StageStyleFrame />;
  if (lab === "rentak") return <BeatLab />;
  if (lab === "belakang") return <Backstage />;
  if (lab === "audit") return <OptionAudit />;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Dev</p>
          <h1 className="text-lg font-black">Makmal 3D</h1>
        </div>
        <Link
          to="/"
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
        >
          ← Kembali ke Game
        </Link>
      </div>

      <nav aria-label="Makmal" className="max-w-6xl mx-auto px-4 pt-3 flex gap-2">
        {LABS.map((id) => (
          <Link
            key={id}
            to="/dev"
            search={{ lab: id }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
              lab === id
                ? "bg-amber-400 text-slate-950 border-amber-300"
                : "bg-slate-900 text-slate-300 border-slate-700"
            }`}
          >
            {LAB_LABEL[id]}
          </Link>
        ))}
      </nav>

      <div className="max-w-6xl mx-auto">
        {lab === "head" && <HeadGridInspector onBackToGame={() => navigate({ to: "/" })} />}
        {lab === "character" && (
          <div className="p-4">
            <VoxelComparisonViewer
              profile={sampleProfile}
              selectedStyle={voxelStyle}
              onSelectStyle={setVoxelStyle}
              onClose={() => navigate({ to: "/" })}
            />
          </div>
        )}
        {lab === "stage" && (
          <div className="p-4">
            <StageComparisonViewer
              profile={sampleProfile}
              selectedStage={stageStyle}
              onSelectStage={setStageStyle}
              onClose={() => navigate({ to: "/" })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
