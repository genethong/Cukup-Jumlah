// Synthesised wayang kulit percussion for the beat: gong (beat 1), kesi cymbals
// (beats 2–3), canang (beat 4, the hit cue), and gendang slaps for tap feedback.
// Every sound takes an exact AudioContext time so it can be scheduled ahead.

type Partial = { freq: number; gain: number; decay: number };

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noise(ctx: BaseAudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

function ring(
  ctx: BaseAudioContext,
  out: AudioNode,
  when: number,
  partials: Partial[],
  type: OscillatorType = "sine",
) {
  for (const p of partials) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(p.freq, when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(p.gain, when + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + p.decay);
    osc.connect(amp).connect(out);
    osc.start(when);
    osc.stop(when + p.decay + 0.02);
  }
}

function noiseBurst(
  ctx: BaseAudioContext,
  out: AudioNode,
  when: number,
  filter: BiquadFilterType,
  freq: number,
  q: number,
  gain: number,
  decay: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const bq = ctx.createBiquadFilter();
  bq.type = filter;
  bq.frequency.setValueAtTime(freq, when);
  bq.Q.setValueAtTime(q, when);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  src.connect(bq).connect(amp).connect(out);
  src.start(when);
  src.stop(when + decay + 0.02);
}

function thump(
  ctx: BaseAudioContext,
  out: AudioNode,
  when: number,
  from: number,
  to: number,
  gain: number,
  decay: number,
) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.frequency.setValueAtTime(from, when);
  osc.frequency.exponentialRampToValueAtTime(to, when + decay * 0.8);
  amp.gain.setValueAtTime(gain, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  osc.connect(amp).connect(out);
  osc.start(when);
  osc.stop(when + decay + 0.02);
}

/** Beat 1: a low hanging gong. Two close partials give the slow shimmer of real bronze. */
export function gong(ctx: BaseAudioContext, out: AudioNode, when: number) {
  thump(ctx, out, when, 90, 55, 0.35, 0.12);
  ring(ctx, out, when, [
    { freq: 98, gain: 0.32, decay: 1.4 },
    { freq: 99.6, gain: 0.22, decay: 1.3 },
    { freq: 196.8, gain: 0.08, decay: 0.8 },
    { freq: 287, gain: 0.04, decay: 0.5 },
  ]);
}

/** Beats 2–3: kesi, small hand cymbals. A short bright splash. */
export function kesi(ctx: BaseAudioContext, out: AudioNode, when: number) {
  noiseBurst(ctx, out, when, "highpass", 6500, 0.7, 0.18, 0.09);
  ring(ctx, out, when, [
    { freq: 3170, gain: 0.03, decay: 0.07 },
    { freq: 4760, gain: 0.02, decay: 0.05 },
  ]);
}

/** Beat 4 (the hit cue): canang, a small kettle gong with a clear bell-like ring. */
export function canang(ctx: BaseAudioContext, out: AudioNode, when: number) {
  noiseBurst(ctx, out, when, "bandpass", 2400, 2, 0.08, 0.03);
  ring(ctx, out, when, [
    { freq: 740, gain: 0.26, decay: 0.55 },
    { freq: 1776, gain: 0.08, decay: 0.3 },
    { freq: 2590, gain: 0.04, decay: 0.18 },
  ]);
}

/** A hit: the gendang's sharp "tak" slap. Perfect hits also get a second, higher skin. */
export function gendangHit(ctx: BaseAudioContext, out: AudioNode, when: number, perfect: boolean) {
  noiseBurst(ctx, out, when, "bandpass", 1900, 1.4, 0.35, 0.06);
  thump(ctx, out, when, 340, 230, 0.25, 0.09);
  if (perfect) {
    noiseBurst(ctx, out, when + 0.05, "bandpass", 2600, 1.6, 0.22, 0.05);
  }
}

/** A miss: a dull, slightly sour low gendang "dung". */
export function gendangMiss(ctx: BaseAudioContext, out: AudioNode, when: number) {
  thump(ctx, out, when, 150, 85, 0.3, 0.25);
  ring(ctx, out, when, [{ freq: 157, gain: 0.08, decay: 0.2 }], "triangle");
}

/** Groove: the gendang's deep open "dum". */
export function gendangDum(ctx: BaseAudioContext, out: AudioNode, when: number) {
  thump(ctx, out, when, 120, 70, 0.32, 0.18);
}

/** Groove: a light closed "tak" between the dums. */
export function gendangTak(ctx: BaseAudioContext, out: AudioNode, when: number) {
  noiseBurst(ctx, out, when, "bandpass", 2100, 1.4, 0.14, 0.04);
}

/** A sheet of paper landing on a pile. */
export function paperSlap(ctx: BaseAudioContext, out: AudioNode, when: number) {
  noiseBurst(ctx, out, when, "lowpass", 1800, 0.8, 0.4, 0.05);
  thump(ctx, out, when, 220, 140, 0.12, 0.05);
}

/** Last seconds: a dry woodblock tick. */
export function tick(ctx: BaseAudioContext, out: AudioNode, when: number) {
  ring(ctx, out, when, [{ freq: 1250, gain: 0.12, decay: 0.04 }], "square");
}
