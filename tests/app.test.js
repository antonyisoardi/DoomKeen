import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, updateApp } from '../src/app.js';
import { makeInput } from '../src/core/input.js';
import { STEP, RULES } from '../src/core/constants.js';

const press = (...keys) => makeInput({ pressed: keys });
const step = (app, input = makeInput()) => updateApp(app, input, STEP);

function toMap() {
  let app = createApp(null);
  app = step(app, press('confirm')).app;
  assert.equal(app.screen, 'story');
  for (let i = 0; i < 40 && app.screen === 'story'; i++) {
    app = step(app).app;
    app = step(app, press('confirm')).app;
  }
  return app;
}

test('new game goes title -> story -> overworld and saves', () => {
  let app = createApp(null);
  app = step(app, press('confirm')).app;
  assert.equal(app.screen, 'story');
  const r = step({ ...app, story: { ...app.story, page: 2, t: 1 } }, press('confirm'));
  assert.equal(r.app.screen, 'map');
  assert.ok(r.effects.some((fx) => fx.type === 'save'));
  assert.equal(toMap().screen, 'map');
});

test('continue resumes from a save', () => {
  const save = { session: { score: 500, lives: 3, ammo: 9, hasPogo: true, parts: [1], completed: ['e1m1', 'e1m2'], nextExtraLife: 20000 }, mapPos: { x: 100, y: 100 } };
  let app = createApp(save);
  assert.equal(app.title.items[app.title.sel].id, 'continue');
  app = step(app, press('confirm')).app;
  assert.equal(app.screen, 'map');
  assert.equal(app.session.score, 500);
  assert.equal(app.map.x, 100);
});

test('dying in a level costs a life and restores the pre-level session', () => {
  const map = toMap();
  let app = { ...map, screen: 'map' };
  const entered = step({ ...app, map: { ...app.map, x: 9 * 16 + 3, y: 7 * 16 + 3 } }, press('jump')).app;
  assert.equal(entered.screen, 'level');
  assert.equal(entered.play.level.id, 'e1m1');
  const dying = { ...entered, play: { ...entered.play, phase: 'dying', phaseTime: 10, session: { ...entered.play.session, score: 9999 } } };
  const r = step(dying);
  assert.equal(r.app.screen, 'map');
  assert.equal(r.app.session.lives, RULES.startLives - 1);
  assert.equal(r.app.session.score, 0, 'points from the failed attempt are lost');
  app = r.app;
  assert.ok(r.effects.some((fx) => fx.type === 'save'));
});

test('losing the last life is game over', () => {
  const map = toMap();
  const entered = step({ ...map, map: { ...map.map, x: 9 * 16 + 3, y: 7 * 16 + 3 } }, press('jump')).app;
  const last = { ...entered, levelStart: { ...entered.levelStart, lives: 1 }, play: { ...entered.play, phase: 'dying', phaseTime: 10 } };
  const r = step(last);
  assert.equal(r.app.screen, 'gameover');
  assert.ok(r.effects.some((fx) => fx.type === 'clearSave'));
});

test('completing a level shows the tally then marks it cleared', () => {
  const map = toMap();
  const entered = step({ ...map, map: { ...map.map, x: 9 * 16 + 3, y: 7 * 16 + 3 } }, press('jump')).app;
  const exiting = { ...entered, play: { ...entered.play, phase: 'exiting', phaseTime: 10 } };
  let app = step(exiting).app;
  assert.equal(app.screen, 'intermission');
  assert.deepEqual(app.session.completed, ['e1m1']);
  app = { ...app, inter: { ...app.inter, t: 5 } };
  const r = step(app, press('confirm'));
  assert.equal(r.app.screen, 'map');
});

test('escape in a level asks before quitting; overlays block gameplay', () => {
  const map = toMap();
  const entered = step({ ...map, map: { ...map.map, x: 9 * 16 + 3, y: 7 * 16 + 3 } }, press('jump')).app;
  const asking = step(entered, press('back')).app;
  assert.equal(asking.overlay.kind, 'confirm');
  const stayed = step(asking, press('no')).app;
  assert.equal(stayed.screen, 'level');
  assert.equal(stayed.overlay, null);
  const quit = step(step(stayed, press('back')).app, press('yes')).app;
  assert.equal(quit.screen, 'map');
  const status = step(entered, press('confirm')).app;
  assert.equal(status.overlay.kind, 'status');
});
