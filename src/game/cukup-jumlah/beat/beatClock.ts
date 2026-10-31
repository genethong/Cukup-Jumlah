import { SECONDS_PER_BEAT, beatTime, eventToAudioTime } from "./timing";

// An audio-driven beat clock. Beats are scheduled a little ahead on the AudioContext's
// own clock, so the sound never drifts, and everything else (visuals, tap judging)
// reads time from that same clock.

const LOOKAHEAD_S = 0.12;
const TICK_MS = 25;

export type ScheduleBeat = (index: number, when: number, out: AudioNode) => void;

export class BeatClock {
  readonly ctx: AudioContext;
  readonly out: GainNode;
  readonly spb: number;
  private startTime = 0;
  private nextIndex = 0;
  private timer: number | null = null;
  private onSchedule: ScheduleBeat | null = null;

  private constructor(ctx: AudioContext, spb: number) {
    this.ctx = ctx;
    this.spb = spb;
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(ctx.destination);
  }

  /** Must be called from a user gesture (tap/click) so browsers allow audio. */
  static create(spb = SECONDS_PER_BEAT): BeatClock | null {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    return new BeatClock(new Ctor({ latencyHint: "interactive" }), spb);
  }

  get running(): boolean {
    return this.timer !== null;
  }

  /** Time of beat 0. */
  get start(): number {
    return this.startTime;
  }

  /** Starts beat 0 `leadIn` seconds from now and schedules every beat through `onSchedule`. */
  async begin(onSchedule: ScheduleBeat, leadIn = 0.3): Promise<void> {
    this.halt();
    if (this.ctx.state !== "running") await this.ctx.resume();
    this.onSchedule = onSchedule;
    this.startTime = this.ctx.currentTime + leadIn;
    this.nextIndex = 0;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  halt(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.onSchedule = null;
  }

  async close(): Promise<void> {
    this.halt();
    await this.ctx.close().catch(() => undefined);
  }

  beatTime(index: number): number {
    return beatTime(this.startTime, index, this.spb);
  }

  /** How far the speakers lag the audio clock, as far as the browser knows. */
  get outputLatency(): number {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return c.outputLatency || c.baseLatency || 0;
  }

  /** The audio-clock time of what is coming out of the speakers right now (for visuals). */
  heardTime(): number {
    return this.ctx.currentTime - this.outputLatency;
  }

  /** Audio-clock time of a tap, from its DOM event timestamp. */
  tapTime(eventTimeStampMs: number): number {
    return eventToAudioTime(eventTimeStampMs, this.ctx.currentTime, performance.now());
  }

  private tick(): void {
    const horizon = this.ctx.currentTime + LOOKAHEAD_S;
    while (this.onSchedule && this.beatTime(this.nextIndex) < horizon) {
      this.onSchedule(this.nextIndex, this.beatTime(this.nextIndex), this.out);
      this.nextIndex++;
    }
  }
}
