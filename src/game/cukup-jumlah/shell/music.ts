import type { BeatClock } from "../beat/beatClock";
import { gendangDum, gendangTak, kesi } from "../beat/wayangSounds";
import { scheduleLeadIn } from "./leadIn";

// The backing track every microgame plays on: the dalang's lead-in, then a driving gendang
// groove (dum on even beats, tak on odd ones, kesi on every off-beat). It's music only; no
// game asks the player to hit it.

export function beginGroove(clock: BeatClock): void {
  void clock.begin((index, when, out) => {
    if (scheduleLeadIn(clock.ctx, out, index, when)) return;
    if (index % 2 === 0) gendangDum(clock.ctx, out, when);
    else gendangTak(clock.ctx, out, when);
    kesi(clock.ctx, out, when + clock.spb / 2);
  });
}
