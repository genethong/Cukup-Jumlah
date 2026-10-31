import type { BeatClock } from "../beat/beatClock";
import type { Grade } from "../beat/timing";
import type { TalentId } from "../creator/candidate";
import type { RoundId } from "./flow";
import type { Lang } from "./strings";

// The contract every microgame plugs into. The shell owns the stage: HUD, dalang banner,
// beat pins, the player's puppet, stamps and the gunungan. A microgame owns its play area
// and its timing. Bar 0 is a lead-in where the dalang calls the command; play starts at
// beat 4 and lasts `bars` bars.

export type MicrogameProps = {
  round: RoundId;
  clock: BeatClock;
  lang: Lang;
  talent: TalentId;
  /** Bars of play after the lead-in (Lidah Manis adds one). */
  bars: number;
  /** Player's saved latency correction in ms (beat/calibrationStore). */
  offsetMs: number;
  /** Beat 1–4 as heard, 0 before the first beat; drives the beat pins. */
  onBeat: (beatInBar: number) => void;
  /** Each judged tap or missed target; the shell animates the puppet. */
  onJudge: (grade: Grade) => void;
  /** Call once, when the round is decided. */
  onFinish: (success: boolean) => void;
};
