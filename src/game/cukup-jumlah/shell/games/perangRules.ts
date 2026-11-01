// Perang Speaker (LAUNG!): two ceramah on the same field on a campaign night. The villagers
// in between drift toward whichever stage is louder. Mash to shout. The rival shouts in
// bursts and pauses for water; shout into the pauses. Both stages blaring at once is just
// noise that hardly moves anyone, and cranking the amp over the rival heats it fast; overheat
// and it screeches and trips, and the crowd walks off. Win with most of the crowd at your
// stage when the time is up.
// Pure rules here; the screen is PerangSpeaker.tsx.

export const CROWD = 20;
/** Villagers needed at your stage; Mesra Rakyat needs one fewer. */
export const NEED = 14;
/** Volume added per tap, and the share of it lost per second. */
export const TAP_VOLUME = 0.25;
export const VOLUME_DECAY = 1.8;
/** Heat per second at full volume, and cooling per second at none. */
export const HEAT_RATE = 0.5;
export const COOL_RATE = 0.6;
/** Seconds the amp is out after it trips, and the heat it comes back with. */
export const TRIP_S = 1.2;
export const TRIP_HEAT = 0.4;
/** How far each villager walks off when the amp screeches. */
export const SCREECH_PUSH = 0.12;
/** How fast villagers walk, in field widths per second at full pull. */
export const WALK = 0.25;
/** The rival's level while shouting, and while drinking water. */
export const RIVAL_LOUD = 0.55;
export const RIVAL_QUIET = 0.05;
/** How many times faster the amp heats while shouting over the rival. */
export const CLASH_HEAT = 2.5;
/** How much of the crowd's walk two loud stages cancel. */
export const CLASH = 0.9;
/** The rival raises the mic this long before each burst. */
export const TELL_S = 0.45;

export function needed(forgiving: boolean): number {
  return forgiving ? NEED - 1 : NEED;
}

/** Where the villagers start, 0 at your stage and 1 at the rival's: split down the middle. */
export function startCrowd(random: () => number = Math.random): number[] {
  return Array.from({ length: CROWD }, (_, i) => {
    const side = i % 2 === 0 ? 0.4 : 0.6;
    return side + (random() - 0.5) * 0.16;
  });
}

export type Burst = { from: number; to: number };

/** The rival's shouting bursts, in seconds of play, with a drink of water between. */
export function rivalBursts(limitS: number, random: () => number = Math.random): Burst[] {
  const out: Burst[] = [];
  let t = 0.4;
  while (t < limitS) {
    const len = 0.8 + random() * 0.3;
    out.push({ from: t, to: t + len });
    t += len + 1 + random() * 0.3;
  }
  return out;
}

export function rivalLevel(bursts: Burst[], t: number): number {
  return bursts.some((b) => t >= b.from && t < b.to) ? RIVAL_LOUD : RIVAL_QUIET;
}

/** The rival is about to shout: the mic goes up. */
export function rivalTell(bursts: Burst[], t: number): boolean {
  return bursts.some((b) => t >= b.from - TELL_S && t < b.from);
}

export type Rally = {
  volume: number;
  heat: number;
  /** Seconds the amp has left before it comes back on; 0 when it works. */
  tripped: number;
  crowd: number[];
  screeches: number;
};

export function freshRally(crowd: number[]): Rally {
  return { volume: 0, heat: 0, tripped: 0, crowd, screeches: 0 };
}

/** A tap on the mic: louder, unless the amp is out. */
export function shout(r: Rally): Rally {
  if (r.tripped > 0) return r;
  return { ...r, volume: Math.min(1, r.volume + TAP_VOLUME) };
}

/**
 * One frame: the amp heats (or cools), may screech and trip, and the crowd walks toward
 * the louder stage.
 */
export function stepRally(
  r: Rally,
  rival: number,
  dt: number,
): { rally: Rally; screeched: boolean } {
  const tripped = Math.max(0, r.tripped - dt);
  const volume = tripped > 0 ? 0 : Math.max(0, r.volume * (1 - VOLUME_DECAY * dt));
  // Cranking the amp to out-shout the rival heats it much faster.
  const rate = HEAT_RATE * (rival > RIVAL_QUIET ? CLASH_HEAT : 1);
  let heat = Math.min(1, Math.max(0, r.heat + (volume * rate - (1 - volume) * COOL_RATE) * dt));
  // Both stages blaring at once is just noise: the crowd hardly moves. Contrast moves it.
  const pull = (volume - rival) * (1 - (CLASH * Math.min(volume, rival)) / RIVAL_LOUD);
  let crowd = r.crowd.map((p) => Math.min(1, Math.max(0, p - pull * WALK * dt)));
  if (heat >= 1 && tripped === 0) {
    heat = TRIP_HEAT;
    crowd = crowd.map((p) => Math.min(1, p + SCREECH_PUSH));
    return {
      screeched: true,
      rally: { volume: 0, heat, tripped: TRIP_S, crowd, screeches: r.screeches + 1 },
    };
  }
  return { screeched: false, rally: { ...r, volume, heat, tripped, crowd } };
}

/** Villagers standing on your half of the field. */
export function yours(crowd: number[]): number {
  return crowd.filter((p) => p < 0.5).length;
}
