// Goreng Kuey Teow (KACAU!): fry kuey teow for the cameras by stirring the wok in circles.
// Stirring fast enough cooks the noodles; stirring too slowly lets them burn. Cook them
// through before the fuse burns out. Pure rules here; the screen is GorengKueyTeow.tsx.

/** Seconds of full-speed stirring to cook the noodles through. */
export const COOK_SECONDS = 4.2;
/** Stirring at or above this many turns a second cooks at full rate. */
export const FULL_RPS = 1.4;
/** Below this many turns a second the noodles start to catch. */
export const SAFE_RPS = 0.6;
/** Seconds of no stirring at all from clean to burnt. */
export const BURN_SECONDS = 2.4;
/** How fast scorch fades (per second) while stirring properly. */
export const RECOVER_PER_S = 0.35;
/** Turns a second that flare the flame: WOK HEI! */
export const WOK_HEI_RPS = 2.6;
/** Seconds of stir history used to measure speed. */
export const SPEED_WINDOW_S = 0.4;

export type Wok = { cooked: number; burnt: number };

export const FRESH_WOK: Wok = { cooked: 0, burnt: 0 };

/** Shortest signed turn (radians) from angle `a` to angle `b`. */
export function angleDelta(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Measures stirring speed in turns per second from recent finger movement. */
export class StirMeter {
  private samples: { t: number; d: number }[] = [];

  add(t: number, delta: number): void {
    this.samples.push({ t, d: delta });
    this.trim(t);
  }

  /** Turns per second over the last window. Direction doesn't matter, steadiness does:
   *  wiggling back and forth cancels out. */
  rps(t: number): number {
    this.trim(t);
    const sum = this.samples.reduce((n, s) => n + s.d, 0);
    return Math.abs(sum) / (2 * Math.PI) / SPEED_WINDOW_S;
  }

  private trim(t: number): void {
    while (this.samples.length && t - this.samples[0]!.t > SPEED_WINDOW_S) this.samples.shift();
  }
}

/**
 * Advances the wok by `dt` seconds at stirring speed `rps`. `forgiving` (Mesra Rakyat)
 * makes the noodles slower to burn.
 */
export function stepWok(wok: Wok, dt: number, rps: number, forgiving = false): Wok {
  const pace = Math.min(1, rps / FULL_RPS);
  const cooked = Math.min(1, wok.cooked + (dt / COOK_SECONDS) * pace);
  const burnSeconds = forgiving ? BURN_SECONDS * 1.4 : BURN_SECONDS;
  const burnt =
    rps < SAFE_RPS
      ? Math.min(1, wok.burnt + (dt / burnSeconds) * (1 - rps / SAFE_RPS))
      : Math.max(0, wok.burnt - dt * RECOVER_PER_S);
  return { cooked, burnt };
}

/** Won when cooked through; lost when burnt or out of time. */
export function wokVerdict(wok: Wok, timeUp: boolean): "won" | "lost" | "cooking" {
  if (wok.burnt >= 1) return "lost";
  if (wok.cooked >= 1) return "won";
  return timeUp ? "lost" : "cooking";
}

/** The noodles' colour: pale raw, golden when cooked, charcoal when burnt. */
export function noodleColour(wok: Wok): string {
  const raw = [226, 205, 160];
  const done = [176, 110, 46];
  const char = [52, 38, 28];
  const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i]! - v) * k);
  const c = mix(mix(raw, done, wok.cooked), char, wok.burnt * 0.9);
  return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
}
