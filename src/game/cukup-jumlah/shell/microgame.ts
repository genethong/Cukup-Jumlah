import type { BeatClock } from "../beat/beatClock";
import type { Grade } from "../beat/timing";
import type { Candidate, TalentId } from "../creator/candidate";
import type { RoundId } from "./flow";
import type { Lang } from "./strings";

// The contract every microgame plugs into. Each game has its own controls and win rule
// (swipe, drag, mash, hold...); the beat clock is the music and the countdown, not the
// mechanic. The shell owns the stage: HUD, dalang banner, beat pins, fuse, the player's
// puppet, stamps and the gunungan. Bar 0 is a lead-in while the dalang calls the command;
// play starts on beat 4 and the time limit is `bars` bars.

export type MicrogameProps = {
  round: RoundId;
  clock: BeatClock;
  candidate: Candidate;
  lang: Lang;
  /** Mesra Rakyat: one extra mistake. Lidah Manis: more time (already in `bars`).
   *  Pakar Kira: counting help, where a game involves counting. */
  talent: TalentId;
  /** Time limit in bars after the lead-in (Lidah Manis adds one). */
  bars: number;
  /** Player's saved latency correction in ms (beat/calibrationStore). */
  offsetMs: number;
  /** Beat 1–4 as heard, 0 before the first beat; drives the beat pins. */
  onBeat: (beatInBar: number) => void;
  /** Share of the time limit left, 1 → 0; drives the fuse. */
  onTimeLeft?: (fraction: number) => void;
  /** Each good or bad move; the shell can react (sound, puppet). */
  onJudge: (grade: Grade) => void;
  /** Call once, when the round is decided. */
  onFinish: (success: boolean) => void;
};

/**
 * How the shell lays out the stage around a game. `center` keeps the puppet big in the
 * middle; `side` tucks it into the bottom-left; `full` takes the puppet off while the game
 * plays (it comes back for the result stamp).
 */
export type StageLayout = "center" | "side" | "full";

/** Mistakes a game forgives before the round is lost. */
export function mistakesAllowed(talent: TalentId, base = 1): number {
  return talent === "mesra_rakyat" ? base + 1 : base;
}
