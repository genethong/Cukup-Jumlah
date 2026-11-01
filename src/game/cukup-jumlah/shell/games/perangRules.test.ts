import { describe, expect, it } from "vitest";
import {
  CROWD,
  NEED,
  RIVAL_LOUD,
  RIVAL_QUIET,
  TELL_S,
  TRIP_S,
  freshRally,
  needed,
  rivalBursts,
  rivalLevel,
  rivalTell,
  shout,
  startCrowd,
  startPaces,
  stepRally,
  yours,
} from "./perangRules";

const middle = () => Array.from({ length: CROWD }, () => 0.5);

describe("Perang Speaker rules", () => {
  it("splits the crowd evenly to start; Mesra Rakyat needs one fewer", () => {
    expect(yours(startCrowd(() => 0.5))).toBe(CROWD / 2);
    expect(needed(false)).toBe(NEED);
    expect(needed(true)).toBe(NEED - 1);
  });

  it("gives the rival bursts with water breaks, and a tell before each", () => {
    const bursts = rivalBursts(6, () => 0.5);
    expect(bursts.length).toBeGreaterThan(2);
    const b = bursts[1]!;
    expect(rivalLevel(bursts, b.from + 0.1)).toBe(RIVAL_LOUD);
    expect(rivalLevel(bursts, b.to + 0.1)).toBe(RIVAL_QUIET);
    expect(rivalTell(bursts, b.from - TELL_S / 2)).toBe(true);
  });

  it("draws the crowd when shouting into the rival's pause", () => {
    let r = shout(shout(shout(shout(freshRally(middle())))));
    for (let i = 0; i < 10; i++) r = stepRally(r, RIVAL_QUIET, 0.05).rally;
    expect(yours(r.crowd)).toBe(CROWD);
  });

  it("loses the crowd when silent while the rival shouts", () => {
    let r = freshRally(middle().map((p) => p - 0.01));
    for (let i = 0; i < 10; i++) r = stepRally(r, RIVAL_LOUD, 0.05).rally;
    expect(yours(r.crowd)).toBe(0);
  });

  it("moves the crowd far less when both stages blare at once", () => {
    const loud = { ...freshRally(middle()), volume: 1 };
    const intoPause = stepRally(loud, RIVAL_QUIET, 0.1).rally.crowd[0]!;
    const overRival = stepRally(loud, RIVAL_LOUD, 0.1).rally.crowd[0]!;
    expect(0.5 - overRival).toBeLessThan((0.5 - intoPause) / 3);
  });

  it("screeches and trips the amp when it overheats; the crowd walks off while it's out", () => {
    const hot = { ...freshRally(middle()), volume: 1, heat: 0.999 };
    const { rally, screeched } = stepRally(hot, RIVAL_QUIET, 0.05);
    expect(screeched).toBe(true);
    expect(rally.tripped).toBe(TRIP_S);
    expect(shout(rally).volume).toBe(0);
    const later = stepRally(rally, RIVAL_QUIET, 0.2).rally;
    expect(later.crowd[0]!).toBeGreaterThan(rally.crowd[0]!);
    expect(later.drift).toBeGreaterThan(0);
  });

  it("starts the crowd spread across the field, half each side, at mixed paces", () => {
    const crowd = startCrowd();
    expect(yours(crowd)).toBe(CROWD / 2);
    expect(Math.min(...crowd)).toBeLessThan(0.2);
    expect(Math.max(...crowd)).toBeGreaterThan(0.8);
    const pace = startPaces();
    expect(Math.max(...pace) / Math.min(...pace)).toBeGreaterThan(3);
  });
});
