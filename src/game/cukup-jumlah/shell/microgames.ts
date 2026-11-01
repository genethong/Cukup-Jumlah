import type { ComponentType } from "react";
import type { RoundId } from "./flow";
import { BalingRisalah } from "./games/BalingRisalah";
import { BayarDeposit } from "./games/BayarDeposit";
import { Borang14 } from "./games/Borang14";
import { CelupDakwat } from "./games/CelupDakwat";
import { GorengKueyTeow } from "./games/GorengKueyTeow";
import { PacakBendera } from "./games/PacakBendera";
import { PecutSPR } from "./games/PecutSPR";
import { PotongReben } from "./games/PotongReben";
import { SemakBorang } from "./games/SemakBorang";
import { PerangSpeaker } from "./games/PerangSpeaker";
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
  /** Bars of play, for a round that needs longer than the usual three. */
  bars?: number;
};

const STAND_IN: MicrogameEntry = {
  Game: TepukRentak,
  layout: "center",
  howTo: UI.comingSoon,
  beatPins: true,
};

const BUILT: Partial<Record<RoundId, MicrogameEntry>> = {
  bayar_deposit: { Game: BayarDeposit, layout: "cameo", howTo: GAME_TEXT.bayar.howTo, bars: 5 },
  baling_risalah: { Game: BalingRisalah, layout: "cameo", howTo: GAME_TEXT.baling.howTo, bars: 5 },
  pacak_bendera: { Game: PacakBendera, layout: "cameo", howTo: GAME_TEXT.pacak.howTo, bars: 5 },
  semak_borang: { Game: SemakBorang, layout: "cameo", howTo: GAME_TEXT.semak.howTo, bars: 5 },
  pecut_spr: { Game: PecutSPR, layout: "cameo", howTo: GAME_TEXT.pecut.howTo, bars: 7 },
  potong_reben: { Game: PotongReben, layout: "cameo", howTo: GAME_TEXT.potong.howTo, bars: 5 },
  borang_14: { Game: Borang14, layout: "between", howTo: GAME_TEXT.borang14.tapHint },
  goreng_kueyteow: { Game: GorengKueyTeow, layout: "stall", howTo: GAME_TEXT.goreng.howTo },
  celup_dakwat: { Game: CelupDakwat, layout: "side", howTo: GAME_TEXT.celup.howTo },
  perang_speaker: { Game: PerangSpeaker, layout: "full", howTo: GAME_TEXT.speaker.howTo },
};

export function microgameFor(round: RoundId): MicrogameEntry {
  return BUILT[round] ?? STAND_IN;
}
