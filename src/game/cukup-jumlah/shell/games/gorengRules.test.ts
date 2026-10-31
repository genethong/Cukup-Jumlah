import { describe, expect, it } from "vitest";
import {
  FRESH_WOK,
  RECIPE,
  SCORCH_SECONDS,
  TOSSES_NEEDED,
  TOSS_FROM,
  WOK_HEI_FROM,
  addIngredient,
  doneShare,
  heatUp,
  shuffledBowls,
  toss,
  wokVerdict,
  type Wok,
} from "./gorengRules";

const allIn = (): Wok => RECIPE.reduce((w, ing) => addIngredient(w, ing).wok, FRESH_WOK);
const hot = (w: Wok, heat: number): Wok => ({ ...w, heat });

describe("Goreng Kuey Teow rules", () => {
  it("only takes the ingredients in recipe order", () => {
    const wrong = addIngredient(FRESH_WOK, "telur");
    expect(wrong.correct).toBe(false);
    expect(wrong.wok).toEqual({ ...FRESH_WOK, mistakes: 1 });
    const right = addIngredient(FRESH_WOK, "minyak");
    expect(right.correct).toBe(true);
    expect(right.wok.added).toBe(1);
  });

  it("heats only once there's food in the wok, and burns if never tossed", () => {
    expect(heatUp(FRESH_WOK, 5)).toEqual(FRESH_WOK);
    const w = addIngredient(FRESH_WOK, "minyak").wok;
    expect(wokVerdict(heatUp(w, SCORCH_SECONDS), false)).toBe("lost");
    expect(heatUp(w, SCORCH_SECONDS, true).heat).toBeLessThan(1);
  });

  it("ignores tosses that are empty or too early, counts hot ones, doubles WOK HEI", () => {
    expect(toss(FRESH_WOK).result).toBe("empty");
    const w = addIngredient(FRESH_WOK, "minyak").wok;
    expect(toss(hot(w, TOSS_FROM / 2))).toEqual({ wok: hot(w, TOSS_FROM / 2), result: "early" });
    const good = toss(hot(w, TOSS_FROM));
    expect(good.result).toBe("good");
    expect(good.wok).toMatchObject({ tosses: 1, heat: 0 });
    const hei = toss(hot(w, WOK_HEI_FROM));
    expect(hei.result).toBe("wokHei");
    expect(hei.wok.tosses).toBe(2);
  });

  it("is done with every ingredient in and enough tosses", () => {
    const w = { ...allIn(), tosses: TOSSES_NEEDED };
    expect(doneShare(w)).toBe(1);
    expect(wokVerdict(w, false)).toBe("won");
    expect(wokVerdict({ ...allIn(), tosses: TOSSES_NEEDED - 1 }, false)).toBe("cooking");
    expect(wokVerdict({ ...allIn(), tosses: TOSSES_NEEDED - 1 }, true)).toBe("lost");
  });

  it("shuffles the bowls but keeps every ingredient", () => {
    let x = 7;
    const random = () => (x = (x * 9301 + 49297) % 233280) / 233280;
    const bowls = shuffledBowls(random);
    expect([...bowls].sort()).toEqual([...RECIPE].sort());
  });
});
