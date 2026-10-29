import { createFileRoute } from "@tanstack/react-router";
import { CukupJumlahGame } from "@/game/cukup-jumlah/CukupJumlahGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CukupJumlahGame />;
}
