// PC-speaker style sound effects: one square-wave voice, higher priority
// sounds interrupt lower ones, exactly like Keen's monophonic speaker.

const VOLUME = 0.08;

// Each effect: priority + list of [startHz, endHz, seconds] sweeps.
export const SFX = Object.freeze({
  mapStep: { p: 0, s: [[90, 70, 0.012]] },
  land: { p: 1, s: [[150, 80, 0.03]] },
  bump: { p: 1, s: [[220, 120, 0.04]] },
  jump: { p: 2, s: [[260, 640, 0.09]] },
  pogo: { p: 2, s: [[200, 950, 0.07]] },
  push: { p: 2, s: [[180, 110, 0.06]] },
  click: { p: 2, s: [[90, 90, 0.03], [60, 60, 0.02]] },
  hitWall: { p: 3, s: [[320, 140, 0.05]] },
  shoot: { p: 4, s: [[1500, 260, 0.1]] },
  fireball: { p: 3, s: [[180, 520, 0.08], [520, 260, 0.06]] },
  roar: { p: 4, s: [[170, 60, 0.28]] },
  select: { p: 4, s: [[660, 660, 0.04]] },
  enemyHit: { p: 5, s: [[520, 240, 0.05]] },
  stomp: { p: 5, s: [[420, 160, 0.08]] },
  pickup: { p: 5, s: [[880, 880, 0.035], [1320, 1320, 0.05]] },
  ammo: { p: 5, s: [[300, 300, 0.03], [600, 600, 0.03], [450, 450, 0.04]] },
  enemyDie: { p: 6, s: [[760, 90, 0.2]] },
  denied: { p: 6, s: [[200, 200, 0.08], [150, 150, 0.12]] },
  key: { p: 6, s: [[1046, 1046, 0.05], [1568, 1568, 0.09]] },
  door: { p: 6, s: [[140, 50, 0.4]] },
  bigPickup: { p: 7, s: [[523, 523, 0.06], [659, 659, 0.06], [784, 784, 0.06], [1046, 1046, 0.12]] },
  oneUp: { p: 8, s: [[784, 784, 0.07], [988, 988, 0.07], [1175, 1175, 0.07], [1568, 1568, 0.15]] },
  exit: { p: 8, s: [[392, 392, 0.08], [523, 523, 0.08], [659, 659, 0.08], [784, 784, 0.08], [1046, 1046, 0.2]] },
  death: { p: 9, s: [[1000, 700, 0.12], [900, 400, 0.15], [600, 90, 0.35]] },
  bossDie: { p: 9, s: [[300, 40, 0.5], [500, 30, 0.5]] },
});

export function loudestEvent(events) {
  return events.reduce((best, name) => {
    const def = SFX[name];
    if (!def) return best;
    return !best || def.p >= SFX[best].p ? name : best;
  }, null);
}

export function createAudio() {
  let ctx = null;
  let muted = false;
  let current = null;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('Audio resume failed:', err));
    }
    return ctx;
  }

  function play(name) {
    if (muted || !name) return;
    const def = SFX[name];
    if (!def) {
      console.warn(`Unknown sound effect: ${name}`);
      return;
    }
    const ac = ensureContext();
    if (!ac) return;
    if (current && current.priority > def.p && ac.currentTime < current.endsAt) return;
    if (current) {
      try { current.osc.stop(); } catch { /* already stopped */ }
    }
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    let t = ac.currentTime;
    gain.gain.setValueAtTime(VOLUME, t);
    def.s.forEach(([from, to, dur]) => {
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.linearRampToValueAtTime(to, t + dur);
      t += dur;
    });
    gain.gain.setValueAtTime(VOLUME, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.01);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(t + 0.02);
    const voice = { osc, priority: def.p, endsAt: t };
    current = voice;
    osc.onended = () => { if (current === voice) current = null; };
  }

  return {
    play,
    unlock: ensureContext,
    context: ensureContext,
    setMuted(value) {
      muted = value;
    },
    get muted() {
      return muted;
    },
  };
}
