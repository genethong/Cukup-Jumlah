import { describe, expect, it } from "vitest";
import { FAULTS, FORMS_NEEDED, check, dealForms, deskVerdict, mistakesAllowed } from "./semakRules";

describe("Semak Borang rules", () => {
  it("deals forms that are each wrong in a different way", () => {
    for (let k = 0; k < 20; k++) {
      const forms = dealForms();
      expect(forms).toHaveLength(FORMS_NEEDED);
      expect(new Set(forms.map((f) => f.wrong)).size).toBe(FORMS_NEEDED);
      for (const f of forms) {
        expect(FAULTS).toContain(f.wrong);
        expect(f.age >= 18).toBe(f.wrong !== "age");
      }
    }
  });

  it("counts the right tap as a checked form and any other as a mistake", () => {
    const form = { wrong: "signature" as const, age: 40 };
    expect(check({ checked: 0, mistakes: 0 }, form, "signature")).toEqual({
      right: true,
      desk: { checked: 1, mistakes: 0 },
    });
    expect(check({ checked: 0, mistakes: 0 }, form, "name").desk.mistakes).toBe(1);
  });

  it("wins after three forms, loses on one mistake too many or on time", () => {
    expect(deskVerdict({ checked: 3, mistakes: 1 }, 1, false)).toBe("won");
    expect(deskVerdict({ checked: 1, mistakes: 2 }, mistakesAllowed(false), false)).toBe("lost");
    expect(deskVerdict({ checked: 1, mistakes: 2 }, mistakesAllowed(true), false)).toBe("going");
    expect(deskVerdict({ checked: 2, mistakes: 0 }, 1, true)).toBe("lost");
  });
});
