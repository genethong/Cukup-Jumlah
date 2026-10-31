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
    playThroughSilentSwitch();
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

let silentSwitchHandled = false;

/**
 * iPhones mute Web Audio when the ring/silent switch is on silent. Marking the page as
 * media playback (Safari 16.4+), or playing a silent looping <audio> for older Safari,
 * makes the beat play like a video does. Must run inside the same user gesture.
 */
function playThroughSilentSwitch(): void {
  if (silentSwitchHandled) return;
  silentSwitchHandled = true;
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
      return;
    } catch {
      // Fall through to the <audio> trick.
    }
  }
  const el = document.createElement("audio");
  el.src = silentWav();
  el.loop = true;
  el.setAttribute("playsinline", "");
  void el.play().catch(() => undefined);
}

/** 0.1 s of silence as a tiny 8 kHz mono WAV data URI. */
function silentWav(): string {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples).fill(128);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}
