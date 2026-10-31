import type { Candidate, TalentId } from "../creator/candidate";

// The game's flow as plain data and one reducer, so the rules can be tested without a
// browser. Screens read `phase`; everything else is the scoreboard.

export const TOTAL_SEATS = 222;
export const SEAT_GOAL = 112;
/** Seats the party already holds safely when the election starts. */
export const START_SEATS = 64;
export const START_DEPOSITS = 3;

export type ActNo = 1 | 2 | 3;

export type RoundId =
  | "pecut_spr"
  | "semak_borang"
  | "bayar_deposit"
  | "cop_watikah"
  | "rebut_kamera"
  | "goreng_kueyteow"
  | "perang_speaker"
  | "turap_jalan"
  | "potong_reben"
  | "baling_risalah"
  | "payung_bos"
  | "cuci_longkang"
  | "pacak_bendera"
  | "celup_dakwat"
  | "tapis_undi_rosak"
  | "borang_14"
  | "rundingan_gabungan";

/** Nomination day wins no seats; the campaign and the count do. */
export const ACTS: Record<ActNo, { rounds: readonly RoundId[]; seatsPerWin: number }> = {
  1: {
    rounds: ["pecut_spr", "semak_borang", "bayar_deposit", "cop_watikah", "rebut_kamera"],
    seatsPerWin: 0,
  },
  2: {
    rounds: [
      "goreng_kueyteow",
      "perang_speaker",
      "turap_jalan",
      "potong_reben",
      "baling_risalah",
      "payung_bos",
      "cuci_longkang",
      "pacak_bendera",
    ],
    seatsPerWin: 4,
  },
  3: { rounds: ["celup_dakwat", "tapis_undi_rosak", "borang_14"], seatsPerWin: 7 },
};

export const COALITION_ROUND: RoundId = "rundingan_gabungan";

export type EndingId = "victory" | "coalition" | "opposition" | "depositLebur";

export type Phase =
  | { kind: "title" }
  | { kind: "backstage" }
  | { kind: "actIntro"; act: ActNo }
  | { kind: "round"; act: ActNo; index: number }
  | { kind: "coalition" }
  | { kind: "ending"; ending: EndingId };

export type GameState = {
  phase: Phase;
  candidate: Candidate | null;
  deposits: number;
  maxDeposits: number;
  seats: number;
  /** Result of the round just played, shown until `next`. Null while a round is live. */
  lastResult: { success: boolean; seatsGained: number } | null;
  /** Counts round starts, so replaying the same round still remounts its game. */
  attempt: number;
  /** Practice mode (dev): play only this round, over and over. */
  practice: RoundId | null;
};

export type Action =
  | { type: "play" }
  | { type: "cast"; candidate: Candidate }
  | { type: "beginAct" }
  | { type: "roundDone"; success: boolean }
  | { type: "next" }
  | { type: "toTitle" };

export const INITIAL_STATE: GameState = {
  phase: { kind: "title" },
  candidate: null,
  deposits: START_DEPOSITS,
  maxDeposits: START_DEPOSITS,
  seats: START_SEATS,
  lastResult: null,
  attempt: 0,
  practice: null,
};

export function practiceState(round: RoundId | null): GameState {
  return { ...INITIAL_STATE, practice: round };
}

/** Where a round sits in the acts. */
export function phaseFor(round: RoundId): Phase {
  for (const act of [1, 2, 3] as const) {
    const index = ACTS[act].rounds.indexOf(round);
    if (index >= 0) return { kind: "round", act, index };
  }
  return { kind: "coalition" };
}

export function depositsFor(talent: TalentId): number {
  return talent === "muka_tembok" ? START_DEPOSITS + 1 : START_DEPOSITS;
}

/** Bars of play after the one-bar lead-in. Lidah Manis buys an extra bar (≈2 s). */
export function roundBars(talent: TalentId | undefined): number {
  return talent === "lidah_manis" ? 4 : 3;
}

/** The round being played or just finished. */
export function currentRound(phase: Phase): RoundId | null {
  if (phase.kind === "round") return ACTS[phase.act].rounds[phase.index] ?? null;
  if (phase.kind === "coalition") return COALITION_ROUND;
  return null;
}

/** Best possible seats from a perfect run; must reach the goal. */
export const MAX_SEATS =
  START_SEATS +
  ([1, 2, 3] as const).reduce((n, a) => n + ACTS[a].rounds.length * ACTS[a].seatsPerWin, 0);

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "play":
      return {
        ...practiceState(state.practice),
        candidate: state.candidate,
        phase: { kind: "backstage" },
      };

    case "cast": {
      const deposits = depositsFor(action.candidate.talent);
      return {
        ...practiceState(state.practice),
        candidate: action.candidate,
        deposits,
        maxDeposits: deposits,
        attempt: state.attempt + 1,
        phase: state.practice ? phaseFor(state.practice) : { kind: "actIntro", act: 1 },
      };
    }

    case "beginAct":
      if (state.phase.kind !== "actIntro") return state;
      return {
        ...state,
        lastResult: null,
        attempt: state.attempt + 1,
        phase: { kind: "round", act: state.phase.act, index: 0 },
      };

    case "roundDone": {
      const { phase } = state;
      if ((phase.kind !== "round" && phase.kind !== "coalition") || state.lastResult) return state;
      if (phase.kind === "coalition") {
        const seatsGained = action.success ? Math.max(0, SEAT_GOAL - state.seats) : 0;
        return {
          ...state,
          seats: state.seats + seatsGained,
          lastResult: { success: action.success, seatsGained },
        };
      }
      const seatsGained = action.success ? ACTS[phase.act].seatsPerWin : 0;
      return {
        ...state,
        seats: Math.min(TOTAL_SEATS, state.seats + seatsGained),
        deposits: action.success ? state.deposits : Math.max(0, state.deposits - 1),
        lastResult: { success: action.success, seatsGained },
      };
    }

    case "next": {
      const { phase, lastResult } = state;
      if (!lastResult) return state;
      const cleared = { ...state, lastResult: null, attempt: state.attempt + 1 };
      if (state.practice) return { ...cleared, deposits: state.maxDeposits, seats: START_SEATS };
      if (phase.kind === "coalition") {
        return {
          ...cleared,
          phase: { kind: "ending", ending: lastResult.success ? "coalition" : "opposition" },
        };
      }
      if (phase.kind !== "round") return state;
      if (state.deposits <= 0)
        return { ...cleared, phase: { kind: "ending", ending: "depositLebur" } };
      if (phase.index + 1 < ACTS[phase.act].rounds.length) {
        return { ...cleared, phase: { ...phase, index: phase.index + 1 } };
      }
      if (phase.act < 3)
        return { ...cleared, phase: { kind: "actIntro", act: (phase.act + 1) as ActNo } };
      return state.seats >= SEAT_GOAL
        ? { ...cleared, phase: { kind: "ending", ending: "victory" } }
        : { ...cleared, phase: { kind: "coalition" } };
    }

    case "toTitle":
      return { ...practiceState(state.practice), candidate: state.candidate };
  }
}
