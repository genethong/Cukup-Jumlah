import type { ComponentType } from "react";
import type { RoundId } from "./flow";
import { Borang14 } from "./games/Borang14";
import { GorengKueyTeow } from "./games/GorengKueyTeow";
import type { MicrogameProps, StageLayout } from "./microgame";
import { GAME_TEXT, UI, type Text } from "./strings";
import { TepukRentak } from "./TepukRentak";

// Which game plays in each round. Rounds without an entry run the TepukRentak stand-in.

export type MicrogameEntry = {
  Game: ComponentType<MicrogameProps>;
  layout: StageLayout;
  /** One line under the banner telling the player what to do. */
  howTo: Text;
  /** Show the four beat pins. Only the tap-on-beat stand-in needs them. */
  beatPins?: boolean;
};

const STAND_IN: MicrogameEntry = {
  Game: TepukRentak,
  layout: "center",
  howTo: UI.comingSoon,
  beatPins: true,
};

const BUILT: Partial<Record<RoundId, MicrogameEntry>> = {
  borang_14: { Game: Borang14, layout: "between", howTo: GAME_TEXT.borang14.tapHint },
  goreng_kueyteow: { Game: GorengKueyTeow, layout: "center", howTo: GAME_TEXT.goreng.howTo },
};

export function microgameFor(round: RoundId): MicrogameEntry {
  return BUILT[round] ?? STAND_IN;
}
