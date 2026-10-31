import { describe, expect, it } from "vitest";
import { DEFAULT_CANDIDATE, type Candidate } from "../creator/candidate";
import {
  ACTS,
  INITIAL_STATE,
  MAX_SEATS,
  SEAT_GOAL,
  START_SEATS,
  gameReducer,
  phaseFor,
  practiceState,
  roundBars,
  type Action,
  type GameState,
} from "./flow";
import { ACT_FACTS, FACTS, ROUNDS, UI } from "./strings";

const run = (state: GameState, ...actions: Action[]) => actions.reduce(gameReducer, state);
const cast = (candidate: Candidate = DEFAULT_CANDIDATE) =>
  run(INITIAL_STATE, { type: "play" }, { type: "cast", candidate });

/** Plays every round of the current act with the given results (default: all wins). */
function playAct(state: GameState, result: (i: number) => boolean = () => true): GameState {
  let s = run(state, { type: "beginAct" });
  while (s.phase.kind === "round") {
    const { act, index } = s.phase;
    s = run(s, { type: "roundDone", success: result(index) }, { type: "next" });
    if (s.phase.kind === "round" && s.phase.act !== act) break;
  }
  return s;
}

describe("game flow", () => {
  it("goes title → backstage → act 1", () => {
    const s = cast();
    expect(s.phase).toEqual({ kind: "actIntro", act: 1 });
    expect(s.seats).toBe(START_SEATS);
    expect(s.deposits).toBe(3);
  });

  it("gives Muka Tembok a fourth deposit and Lidah Manis an extra bar", () => {
    expect(cast({ ...DEFAULT_CANDIDATE, talent: "muka_tembok" }).deposits).toBe(4);
    expect(roundBars("lidah_manis")).toBe(roundBars("mesra_rakyat") + 1);
  });

  it("keeps 112 reachable from a perfect run", () => {
    expect(MAX_SEATS).toBeGreaterThanOrEqual(SEAT_GOAL);
  });

  it("wins outright with a perfect run", () => {
    let s = cast();
    for (const _ of [1, 2, 3]) s = playAct(s);
    expect(s.seats).toBe(MAX_SEATS);
    expect(s.phase).toEqual({ kind: "ending", ending: "victory" });
  });

  it("loses a deposit per failed round and ends at zero", () => {
    let s = run(cast(), { type: "beginAct" });
    for (let i = 0; i < 3; i += 1)
      s = run(s, { type: "roundDone", success: false }, { type: "next" });
    expect(s.deposits).toBe(0);
    expect(s.phase).toEqual({ kind: "ending", ending: "depositLebur" });
  });

  it("sends a short majority to coalition talks, then coalition or opposition", () => {
    let s = cast();
    s = playAct(s);
    s = playAct(s, (i) => i < 6); // 6 of 8 campaign rounds, 2 deposits lost
    s = playAct(s);
    expect(s.seats).toBe(START_SEATS + 6 * 4 + 3 * 7);
    expect(s.seats).toBeLessThan(SEAT_GOAL);
    expect(s.phase).toEqual({ kind: "coalition" });

    const won = run(s, { type: "roundDone", success: true });
    expect(won.seats).toBe(SEAT_GOAL);
    expect(run(won, { type: "next" }).phase).toEqual({ kind: "ending", ending: "coalition" });

    const lost = run(s, { type: "roundDone", success: false }, { type: "next" });
    expect(lost.phase).toEqual({ kind: "ending", ending: "opposition" });
  });

  it("ignores a second result for the same round", () => {
    const s = run(cast(), { type: "beginAct" }, { type: "roundDone", success: false });
    expect(run(s, { type: "roundDone", success: false }).deposits).toBe(s.deposits);
  });

  it("keeps the candidate when going back to the title", () => {
    const s = run(cast(), { type: "toTitle" });
    expect(s.phase).toEqual({ kind: "title" });
    expect(s.candidate).toEqual(DEFAULT_CANDIDATE);
  });
});

describe("practice mode", () => {
  it("goes straight to the chosen round and replays it with full deposits", () => {
    let s = run(
      practiceState("borang_14"),
      { type: "play" },
      { type: "cast", candidate: DEFAULT_CANDIDATE },
    );
    expect(s.phase).toEqual(phaseFor("borang_14"));
    const first = s.attempt;
    s = run(s, { type: "roundDone", success: false }, { type: "next" });
    expect(s.phase).toEqual(phaseFor("borang_14"));
    expect(s.deposits).toBe(s.maxDeposits);
    expect(s.seats).toBe(START_SEATS);
    expect(s.attempt).toBeGreaterThan(first);
  });
});

describe("strings", () => {
  const all = (o: unknown): string[] =>
    typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(all) : [];

  it("has words for every round, in both languages", () => {
    const rounds = new Set(Object.values(ACTS).flatMap((a) => a.rounds));
    for (const id of rounds) {
      expect(ROUNDS[id].call.ms && ROUNDS[id].call.en).toBeTruthy();
      expect(ROUNDS[id].hint.ms && ROUNDS[id].hint.en).toBeTruthy();
    }
    for (const text of [...Object.values(UI), ...Object.values(FACTS).map((f) => f.text)]) {
      expect(text.ms.length && text.en.length).toBeTruthy();
    }
    expect(
      Object.values(ACT_FACTS)
        .flat()
        .every((id) => id in FACTS),
    ).toBe(true);
  });

  it("stays clear of real party names, royalty jokes and unconfirmed regulation numbers", () => {
    const text = all({ UI, ROUNDS, FACTS }).join(" ");
    expect(text).not.toMatch(
      /barisan|bersatu|pakatan|perikatan|perpaduan|istana|tuanku|mahkota|👑/i,
    );
    expect(text).not.toMatch(/peraturan \d|regulation \d|reg\. ?\d/i);
  });
});
