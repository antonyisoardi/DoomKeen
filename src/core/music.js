// Web Audio synth + look-ahead scheduler for the soundtrack. Voices are
// OPL-flavoured: filtered saw bass, overdriven power chords, square leads,
// triangle arps/pads and noise drums.
import { SONGS } from './songs.js';
import { compileSong } from './sequencer.js';

const MASTER_VOLUME = 0.32;
const LOOKAHEAD = 0.15;
const TICK_MS = 25;
const LEVELS = { bass: 0.42, power: 0.16, lead: 0.13, arp: 0.1, pad: 0.07, drums: 0.5 };

function distortionCurve(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function envelope(ctx, gain, t, dur, { attack = 0.005, peak = 1, sustain = 0.7, release = 0.05 } = {}) {
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.setTargetAtTime(peak * sustain, t + attack, 0.08);
  const end = t + Math.max(dur, attack + 0.01);
  gain.gain.setValueAtTime(peak * sustain, end);
  gain.gain.linearRampToValueAtTime(0, end + release);
  return end + release + 0.02;
}

function osc(ctx, type, freq, t, stopAt, dest, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.setValueAtTime(detune, t);
  o.connect(dest);
  o.start(t);
  o.stop(stopAt);
  return o;
}

export function createVoices(ctx, out) {
  const shaper = ctx.createWaveShaper();
  shaper.curve = distortionCurve(40);
  shaper.oversample = '2x';
  const powerTone = ctx.createBiquadFilter();
  powerTone.type = 'lowpass';
  powerTone.frequency.value = 2400;
  shaper.connect(powerTone).connect(out);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const gainNode = (level, dest = out) => {
    const g = ctx.createGain();
    g.gain.value = 0;
    const amp = ctx.createGain();
    amp.gain.value = level;
    g.connect(amp).connect(dest);
    return g;
  };

  const noiseHit = (t, { type, freq, q = 1, level, decay }) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    src.connect(filter).connect(g).connect(out);
    src.start(t);
    src.stop(t + decay + 0.02);
  };

  return {
    bass(freq, t, dur) {
      const g = gainNode(LEVELS.bass);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 6;
      lp.frequency.setValueAtTime(1400, t);
      lp.frequency.exponentialRampToValueAtTime(320, t + 0.12);
      lp.connect(g);
      const stop = envelope(ctx, g, t, dur * 0.9, { sustain: 0.6, release: 0.03 });
      osc(ctx, 'sawtooth', freq, t, stop, lp);
      osc(ctx, 'square', freq / 2, t, stop, lp);
    },
    power(freq, t, dur) {
      const g = gainNode(LEVELS.power, shaper);
      const stop = envelope(ctx, g, t, dur * 0.95, { sustain: 0.8, release: 0.04 });
      osc(ctx, 'sawtooth', freq, t, stop, g, -6);
      osc(ctx, 'sawtooth', freq * 1.4983, t, stop, g, 6);
      osc(ctx, 'sawtooth', freq * 2, t, stop, g);
    },
    lead(freq, t, dur) {
      const g = gainNode(LEVELS.lead);
      const stop = envelope(ctx, g, t, dur * 0.95, { sustain: 0.75, release: 0.08 });
      const o = osc(ctx, 'square', freq, t, stop, g);
      const vib = ctx.createOscillator();
      const depth = ctx.createGain();
      vib.frequency.value = 5.5;
      depth.gain.setValueAtTime(0, t);
      depth.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.3, dur));
      vib.connect(depth).connect(o.frequency);
      vib.start(t);
      vib.stop(stop);
    },
    arp(freq, t, dur) {
      const g = gainNode(LEVELS.arp);
      const stop = envelope(ctx, g, t, Math.min(dur, 0.18), { sustain: 0.4, release: 0.12 });
      osc(ctx, 'triangle', freq, t, stop, g);
      osc(ctx, 'square', freq * 2, t, stop, g, 4);
    },
    pad(freq, t, dur) {
      const g = gainNode(LEVELS.pad);
      const stop = envelope(ctx, g, t, dur, { attack: 0.3, sustain: 0.9, release: 0.5 });
      osc(ctx, 'triangle', freq, t, stop, g, -7);
      osc(ctx, 'sine', freq, t, stop, g, 7);
    },
    drums(drum, t) {
      if (drum === 'kick') {
        const g = ctx.createGain();
        g.gain.setValueAtTime(LEVELS.drums * 1.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        g.connect(out);
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        o.connect(g);
        o.start(t);
        o.stop(t + 0.25);
      } else if (drum === 'snare') {
        noiseHit(t, { type: 'bandpass', freq: 1800, q: 0.7, level: LEVELS.drums, decay: 0.16 });
        const g = ctx.createGain();
        g.gain.setValueAtTime(LEVELS.drums * 0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        g.connect(out);
        osc(ctx, 'triangle', 190, t, t + 0.1, g);
      } else if (drum === 'hat') {
        noiseHit(t, { type: 'highpass', freq: 7000, level: LEVELS.drums * 0.35, decay: 0.04 });
      } else {
        noiseHit(t, { type: 'highpass', freq: 4000, level: LEVELS.drums * 0.5, decay: 0.9 });
      }
    },
  };
}

export function createMusic(getContext) {
  const compiled = new Map();
  let ctx = null;
  let master = null;
  let bus = null;
  let voices = null;
  let timer = null;
  let track = null;
  let song = null;
  let step = 0;
  let nextTime = 0;
  let enabled = true;

  function ensure() {
    if (ctx) return true;
    ctx = getContext();
    if (!ctx) return false;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(comp).connect(ctx.destination);
    return true;
  }

  function songFor(id) {
    if (!compiled.has(id)) {
      const def = SONGS[id];
      if (!def) throw new Error(`Unknown music track: ${id}`);
      compiled.set(id, compileSong(def));
    }
    return compiled.get(id);
  }

  function tick() {
    try {
      if (ctx.currentTime > nextTime + 0.25) nextTime = ctx.currentTime + 0.05;
      while (nextTime < ctx.currentTime + LOOKAHEAD) {
        song.steps[step].forEach((ev) => {
          if (ev.instrument === 'drums') voices.drums(ev.drum, nextTime);
          else voices[ev.instrument](ev.freq, nextTime, ev.steps * song.stepDur);
        });
        nextTime += song.stepDur;
        step = (step + 1) % song.length;
      }
    } catch (err) {
      console.error('Music playback failed; stopping music.', err);
      halt();
    }
  }

  function halt() {
    if (timer) clearInterval(timer);
    timer = null;
    if (bus) {
      const old = bus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
      setTimeout(() => old.disconnect(), 600);
      bus = null;
    }
  }

  function start(id) {
    song = songFor(id);
    bus = ctx.createGain();
    bus.connect(master);
    voices = createVoices(ctx, bus);
    step = 0;
    nextTime = ctx.currentTime + 0.08;
    timer = setInterval(tick, TICK_MS);
    tick();
  }

  return {
    // Switch to a track (null = silence). Re-requesting the current track is a no-op.
    play(id) {
      if (id === track) return;
      track = id;
      halt();
      if (enabled && id && ensure()) start(id);
    },
    setEnabled(on) {
      if (on === enabled) return;
      enabled = on;
      const current = track;
      track = null;
      halt();
      if (on) this.play(current);
      else track = current;
    },
    get track() {
      return track;
    },
  };
}
