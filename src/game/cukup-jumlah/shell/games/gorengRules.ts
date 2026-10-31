// Goreng Kuey Teow (KACAU!): cook a plate of char kuey teow for the cameras, the way a
// hawker does. Add the ingredients in order, and toss the wok as it heats: toss too early
// and it doesn't count, toss as it starts to smoke for WOK HEI!, leave it and it burns.
// Pure rules here; the screen is GorengKueyTeow.tsx.

export const RECIPE = ["minyak", "udang", "kueyteow", "kicap", "telur", "taugeh"] as const;
export type Ingredient = (typeof RECIPE)[number];

/** Good tosses needed, on top of every ingredient going in. */
export const TOSSES_NEEDED = 4;
/** Seconds from a fresh toss to burnt, once there's food in the wok. */
export const SCORCH_SECONDS = 2.4;
/** Heat (share of the way to burnt) before a toss counts. Earlier is "too early". */
export const TOSS_FROM = 0.3;
/** Heat from which a toss is WOK HEI! and counts double. */
export const WOK_HEI_FROM = 0.65;
/** Seconds a wrong ingredient burns off the fuse. */
export const PENALTY_S = 1;

export type Wok = { added: number; tosses: number; heat: number; mistakes: number };

export const FRESH_WOK: Wok = { added: 0, tosses: 0, heat: 0, mistakes: 0 };

export function nextIngredient(wok: Wok): Ingredient | null {
  return RECIPE[wok.added] ?? null;
}

/** Puts `ing` in the wok. Only the next one in the recipe goes in; anything else is a mistake. */
export function addIngredient(wok: Wok, ing: Ingredient): { wok: Wok; correct: boolean } {
  const correct = nextIngredient(wok) === ing;
  return {
    correct,
    wok: correct ? { ...wok, added: wok.added + 1 } : { ...wok, mistakes: wok.mistakes + 1 },
  };
}

export type TossResult = "empty" | "early" | "good" | "wokHei";

/** Tossing the wok. Counts once it's hot; resets the heat when it does. */
export function toss(wok: Wok): { wok: Wok; result: TossResult } {
  if (wok.added === 0) return { wok, result: "empty" };
  if (wok.heat < TOSS_FROM) return { wok, result: "early" };
  const wokHei = wok.heat >= WOK_HEI_FROM;
  return {
    result: wokHei ? "wokHei" : "good",
    wok: { ...wok, heat: 0, tosses: wok.tosses + (wokHei ? 2 : 1) },
  };
}

/** The wok heats once there's food in it. `forgiving` (Mesra Rakyat) heats slower. */
export function heatUp(wok: Wok, dt: number, forgiving = false): Wok {
  if (wok.added === 0) return wok;
  const seconds = forgiving ? SCORCH_SECONDS * 1.4 : SCORCH_SECONDS;
  return { ...wok, heat: Math.min(1, wok.heat + dt / seconds) };
}

/** Seconds burnt off the fuse so far. `freeMistakes` (Mesra Rakyat) cost nothing. */
export function penaltySeconds(mistakes: number, freeMistakes = 0): number {
  return Math.max(0, mistakes - freeMistakes) * PENALTY_S;
}

/** Share of the dish done, for the cooked meter: ingredients first, then the tossing. */
export function doneShare(wok: Wok): number {
  return (wok.added / RECIPE.length) * 0.6 + Math.min(1, wok.tosses / TOSSES_NEEDED) * 0.4;
}

/** Won with every ingredient in and enough tosses; lost if it burns or time runs out. */
export function wokVerdict(wok: Wok, timeUp: boolean): "won" | "lost" | "cooking" {
  if (wok.heat >= 1) return "lost";
  if (wok.added >= RECIPE.length && wok.tosses >= TOSSES_NEEDED) return "won";
  return timeUp ? "lost" : "cooking";
}

/** The bowls in a fresh random order each round, so the player has to read them. */
export function shuffledBowls(random: () => number = Math.random): Ingredient[] {
  const bowls = [...RECIPE];
  for (let i = bowls.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [bowls[i], bowls[j]] = [bowls[j]!, bowls[i]!];
  }
  return bowls;
}

/** The noodles' colour: pale, darker once the kicap is in, browner with tossing, black near burning. */
export function noodleColour(wok: Wok): string {
  const raw = [238, 228, 205];
  const sauced = [176, 120, 64];
  const char = [52, 38, 28];
  const kicapIn = wok.added > RECIPE.indexOf("kicap") ? 1 : 0;
  const browned = Math.min(1, wok.tosses / TOSSES_NEEDED) * 0.4;
  const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i]! - v) * k);
  const c = mix(
    mix(raw, sauced, Math.min(1, kicapIn * 0.7 + browned)),
    char,
    Math.max(0, wok.heat - 0.6) * 1.6,
  );
  return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
}
