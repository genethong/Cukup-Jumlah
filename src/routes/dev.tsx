import { createFileRoute } from "@tanstack/react-router";
import { PuppetLab } from "@/game/cukup-jumlah/puppet/PuppetLab";
import { PuppetSheet } from "@/game/cukup-jumlah/puppet/PuppetSheet";
import { StageStyleFrame } from "@/game/cukup-jumlah/stage/StageStyleFrame";
import { BeatLab } from "@/game/cukup-jumlah/beat/BeatLab";
import { Backstage } from "@/game/cukup-jumlah/creator/Backstage";
import { OptionAudit } from "@/game/cukup-jumlah/puppet/OptionAudit";
import { GameShell } from "@/game/cukup-jumlah/shell/GameShell";

const LABS = ["puppet", "panggung", "rentak", "belakang", "audit", "shell"] as const;
type LabId = (typeof LABS)[number];

function isLab(value: unknown): value is LabId {
  return (LABS as readonly unknown[]).includes(value);
}

function isSheet(value: unknown) {
  return value === 1 || value === "1" || value === true;
}

export const Route = createFileRoute("/dev")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsed: { lab: LabId; sheet?: 1 } = {
      lab: isLab(search.lab) ? search.lab : "puppet",
    };
    if (isSheet(search.sheet)) parsed.sheet = 1;
    return parsed;
  },
  component: DevLabPage,
});

function DevLabPage() {
  const { lab, sheet } = Route.useSearch();

  if (lab === "puppet" && sheet === 1) return <PuppetSheet />;
  if (lab === "panggung") return <StageStyleFrame />;
  if (lab === "rentak") return <BeatLab />;
  if (lab === "belakang") return <Backstage />;
  if (lab === "audit") return <OptionAudit />;
  if (lab === "shell") return <GameShell />;
  return <PuppetLab />;
}
