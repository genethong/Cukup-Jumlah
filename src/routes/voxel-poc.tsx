import { createFileRoute } from "@tanstack/react-router";
import { VoxelPocPreview } from "@/game/cukup-jumlah/voxel/VoxelPocPreview";

export const Route = createFileRoute("/voxel-poc")({
  component: VoxelPocPage,
});

function VoxelPocPage() {
  return <VoxelPocPreview />;
}
