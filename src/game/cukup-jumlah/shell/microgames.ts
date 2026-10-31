import type { ComponentType } from "react";
import type { RoundId } from "./flow";
import { Borang14 } from "./games/Borang14";
import type { MicrogameProps, StageLayout } from "./microgame";
import { GAME_TEXT, type Text } from "./strings";
import { TepukRentak } from "./TepukRentak";

// Which game plays in each round. Rounds without an entry run the TepukRentak stand-in.

export type MicrogameEntry = {
  Game: ComponentType<MicrogameProps>;
  layout: StageLayout;
  /** Replaces the shell's "tap on beat 4" line under the beat pins. */
  tapHint?: Text;
};

const STAND_IN: MicrogameEntry = { Game: TepukRentak, layout: "center" };

const BUILT: Partial<Record<RoundId, MicrogameEntry>> = {
  borang_14: { Game: Borang14, layout: "side", tapHint: GAME_TEXT.borang14.tapHint },
};

export function microgameFor(round: RoundId): MicrogameEntry {
  return BUILT[round] ?? STAND_IN;
}
