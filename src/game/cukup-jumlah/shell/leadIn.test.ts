import { describe, expect, it } from "vitest";
import { LEAD_IN_BEATS, leadInStep } from "./leadIn";

describe("lead-in", () => {
  it("counts three cempala knocks, then MULA!, then hands over to play", () => {
    expect(leadInStep(-0.1)).toBe(0);
    expect(leadInStep(0)).toBe(1);
    expect(leadInStep(1.5)).toBe(2);
    expect(leadInStep(2.99)).toBe(3);
    expect(leadInStep(3)).toBe(4);
    expect(leadInStep(LEAD_IN_BEATS)).toBe(0);
  });
});
