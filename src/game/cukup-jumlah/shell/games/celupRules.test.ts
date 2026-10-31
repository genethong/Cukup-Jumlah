import { describe, expect, it } from "vitest";
import {
  FINGERS,
  FRESH_OFFER,
  INK_FINGER_INDEX,
  celupVerdict,
  offerFinger,
  wrongAllowed,
} from "./celupRules";

describe("Celup Dakwat Kekal rules", () => {
  it("puts the YB's left hand on the player's right, thumbs inward", () => {
    expect(FINGERS.slice(0, 5).every((f) => f.hand === "right")).toBe(true);
    expect(FINGERS[4]!.name).toBe("thumb");
    expect(FINGERS[5]!.name).toBe("thumb");
    // The left index is just right of centre, beside the left thumb: easy to mistake.
    expect(INK_FINGER_INDEX).toBe(6);
    expect(FINGERS[3]).toEqual({ hand: "right", name: "index" });
  });

  it("inks only the left index finger", () => {
    expect(offerFinger(FRESH_OFFER, INK_FINGER_INDEX)).toEqual({
      right: true,
      offer: { wrong: 0, inked: true },
    });
    expect(offerFinger(FRESH_OFFER, 3)).toEqual({
      right: false,
      offer: { wrong: 1, inked: false },
    });
  });

  it("forgives one wrong finger (two with Mesra Rakyat), then loses", () => {
    expect(celupVerdict({ wrong: 1, inked: false }, wrongAllowed(false), false)).toBe("waiting");
    expect(celupVerdict({ wrong: 2, inked: false }, wrongAllowed(false), false)).toBe("lost");
    expect(celupVerdict({ wrong: 2, inked: false }, wrongAllowed(true), false)).toBe("waiting");
    expect(celupVerdict({ wrong: 1, inked: true }, 1, false)).toBe("won");
    expect(celupVerdict(FRESH_OFFER, 1, true)).toBe("lost");
  });
});
