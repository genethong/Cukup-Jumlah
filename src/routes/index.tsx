import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { HeadGridInspector } from "@/game/Cukup Jumlah!/voxel/HeadGridInspector";
import { CukupJumlahGame } from "@/game/Cukup Jumlah!/CukupJumlahGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    return <CukupJumlahGame />;
  }

  return <HeadGridInspector onBackToGame={() => setShowGame(true)} />;
}
