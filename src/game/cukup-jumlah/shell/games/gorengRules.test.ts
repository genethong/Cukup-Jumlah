import { describe, expect, it } from "vitest";
import {
  BURN_SECONDS,
  COOK_SECONDS,
  FRESH_WOK,
  FULL_RPS,
  SPEED_WINDOW_S,
  StirMeter,
  angleDelta,
  stepWok,
  wokVerdict,
  type Wok,
} from "./gorengRules";

const run = (seconds: number, rps: number, forgiving = false, from: Wok = FRESH_WOK) => {
  let w = from;
  for (let t = 0; t < seconds; t += 0.05) w = stepWok(w, 0.05, rps, forgiving);
  return w;
};

describe("Goreng Kuey Teow rules", () => {
  it("measures the shortest turn across the ±π seam", () => {
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(-3, 3)).toBeCloseTo(6 - 2 * Math.PI);
    expect(angleDelta(0, 1)).toBeCloseTo(1);
  });

  it("turns circling into turns per second, and wiggling cancels out", () => {
    const m = new StirMeter();
    for (let i = 0; i < 20; i += 1) m.add(i * 0.02, (2 * Math.PI) / 20); // one turn in 0.4 s
    expect(m.rps(0.4)).toBeCloseTo(1 / SPEED_WINDOW_S, 0);
    const w = new StirMeter();
    for (let i = 0; i < 20; i += 1) w.add(i * 0.02, i % 2 ? 0.3 : -0.3);
    expect(w.rps(0.4)).toBeLessThan(0.1);
  });

  it("cooks through with steady full-speed stirring, without burning", () => {
    const w = run(COOK_SECONDS + 0.1, FULL_RPS);
    expect(w.cooked).toBe(1);
    expect(w.burnt).toBe(0);
    expect(wokVerdict(w, false)).toBe("won");
  });

  it("burns when left alone, and Mesra Rakyat burns slower", () => {
    const idle = run(BURN_SECONDS + 0.1, 0);
    expect(wokVerdict(idle, false)).toBe("lost");
    expect(run(BURN_SECONDS + 0.1, 0, true).burnt).toBeLessThan(1);
  });

  it("recovers from a little scorch once stirring picks up", () => {
    const scorched = run(1, 0);
    expect(scorched.burnt).toBeGreaterThan(0.3);
    expect(run(1, FULL_RPS, false, scorched).burnt).toBeLessThan(scorched.burnt);
  });

  it("loses when time runs out half-cooked", () => {
    expect(wokVerdict({ cooked: 0.5, burnt: 0 }, true)).toBe("lost");
  });
});
