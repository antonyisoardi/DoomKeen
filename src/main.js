// Entry point: canvas scaling, fixed-timestep loop, input/audio/save side effects.
import { SCREEN_W, SCREEN_H, STEP, MAX_STEPS_PER_FRAME } from './core/constants.js';
import { createInput } from './core/input.js';
import { createAudio, loudestEvent } from './core/audio.js';
import { loadSave, writeSave, clearSave } from './core/save.js';
import { buildAtlas } from './gfx/atlas.js';
import { createApp, updateApp, musicFor } from './app.js';
import { createMusic } from './core/music.js';
import { renderApp } from './render.js';
import { drawText } from './core/font.js';

const canvas = document.getElementById('screen');
const errorBox = document.getElementById('error');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// EGA 320x200 was shown on 4:3 monitors, so pixels are 1.2x taller than wide.
function fitCanvas() {
  const scale = Math.max(1, Math.min(window.innerWidth / SCREEN_W, window.innerHeight / (SCREEN_H * 1.2)));
  canvas.style.width = `${Math.floor(SCREEN_W * scale)}px`;
  canvas.style.height = `${Math.floor(SCREEN_H * 1.2 * scale)}px`;
}

function showFatal(err) {
  console.error(err);
  errorBox.textContent = `Commander Doom crashed: ${err.message}\nReload the page to try again (details in the console).`;
}

// M cycles: everything on -> music off -> all sound off.
const SOUND_MODES = Object.freeze([
  { music: true, sfx: true, label: 'MUSIC + SOUND ON' },
  { music: false, sfx: true, label: 'MUSIC OFF' },
  { music: false, sfx: false, label: 'ALL SOUND OFF' },
]);
const SOUND_KEY = 'commander-doom.sound';

function loadSoundMode() {
  try {
    const n = Number(localStorage.getItem(SOUND_KEY));
    return Number.isInteger(n) && n >= 0 && n < SOUND_MODES.length ? n : 0;
  } catch {
    return 0;
  }
}

function saveSoundMode(n) {
  try {
    localStorage.setItem(SOUND_KEY, String(n));
  } catch (err) {
    console.warn('Could not store sound preference:', err);
  }
}

function applyEffects(effects, app) {
  let next = app;
  effects.forEach((fx) => {
    if (fx.type === 'save') writeSave(fx.data);
    if (fx.type === 'clearSave') clearSave();
    if (fx.type === 'reloadSave') next = createApp(loadSave());
  });
  return next;
}

function start() {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  canvas.focus();

  const gfx = buildAtlas();
  const input = createInput(window);
  const audio = createAudio();
  const music = createMusic(audio.context);
  let soundMode = loadSoundMode();
  let soundToast = 0;
  let unlocked = false;
  const applySoundMode = () => {
    audio.setMuted(!SOUND_MODES[soundMode].sfx);
    music.setEnabled(SOUND_MODES[soundMode].music);
  };
  applySoundMode();
  let app = createApp(loadSave());
  let last = performance.now();
  let acc = 0;
  let time = 0;

  function frame(now) {
    try {
      acc = Math.min(acc + (now - last) / 1000, STEP * MAX_STEPS_PER_FRAME);
      last = now;
      while (acc >= STEP) {
        const snap = input.snapshot();
        if (snap.any && !unlocked) {
          unlocked = true;
          audio.unlock();
        }
        if (snap.pressed.mute) {
          soundMode = (soundMode + 1) % SOUND_MODES.length;
          saveSoundMode(soundMode);
          applySoundMode();
          soundToast = 2;
        }
        const r = updateApp(app, snap, STEP);
        app = applyEffects(r.effects, r.app);
        audio.play(loudestEvent(r.events));
        acc -= STEP;
        time += STEP;
        soundToast = Math.max(0, soundToast - STEP);
      }
      // Browsers only allow audio after a key press, so music waits for one.
      if (unlocked) music.play(musicFor(app));
      renderApp(ctx, app, gfx, time);
      if (soundToast > 0) drawText(ctx, SOUND_MODES[soundMode].label, SCREEN_W - SOUND_MODES[soundMode].label.length * 6 - 4, 4, 'E', { shadow: 0 });
      requestAnimationFrame(frame);
    } catch (err) {
      showFatal(err);
    }
  }
  requestAnimationFrame(frame);
}

try {
  start();
} catch (err) {
  showFatal(err);
}
