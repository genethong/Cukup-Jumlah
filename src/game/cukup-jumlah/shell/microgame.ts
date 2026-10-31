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
  /** Lead-in step as heard (leadIn.ts): 1–3 the cempala knocks, 4 MULA!, 0 once play starts. */
  onLeadIn?: (step: number) => void;
  /** Share of the time limit left (1 → 0) and the seconds left; drives the fuse. */
  onTimeLeft?: (fraction: number, seconds: number) => void;
  /** Each good or bad move; the shell can react (sound, puppet). */
  onJudge: (grade: Grade) => void;
  /** Call once, when the round is decided. */
  onFinish: (success: boolean) => void;
};

/**
 * How the shell lays out the stage around a game. `center` keeps the puppet big in the
 * middle; `side` tucks it into the bottom-left; `between` stands it small at the bottom
 * centre, between a game's two side areas; `full` leaves it off so the game has the whole kelir.
 */
export type StageLayout = "center" | "side" | "between" | "full";

/** Mistakes a game forgives before the round is lost. */
export function mistakesAllowed(talent: TalentId, base = 1): number {
  return talent === "mesra_rakyat" ? base + 1 : base;
}
