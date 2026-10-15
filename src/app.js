// Top-level game flow: title -> story -> overworld <-> levels -> ending.
// Pure state transitions; main.js owns the loop, input, audio and canvas.
import { createTitle, updateTitle } from './screens/title.js';
import { createStory, updateStory, INTRO_PAGES, ENDING_PAGES } from './screens/story.js';
import { createIntermission, updateIntermission } from './screens/intermission.js';
import { createMap, updateMap } from './world/map.js';
import { createPlay, updatePlay } from './game/play.js';
import { parseLevel } from './game/level.js';
import { createSession, completeLevel } from './game/session.js';
import { LEVELS } from './levels/index.js';

export function createApp(save) {
  return Object.freeze({
    screen: 'title',
    overlay: null,
    title: createTitle(!!save),
    save,
    session: null,
    map: null,
    play: null,
    levelStart: null,
    story: null,
    inter: null,
    t: 0,
  });
}

const result = (app, events = [], effects = []) => ({ app, events, effects });

function goMap(app, session, extra = {}) {
  return { ...app, ...extra, screen: 'map', session, play: null };
}

function startLevel(app, levelId) {
  const def = LEVELS[levelId];
  if (!def) throw new Error(`No level data for ${levelId}`);
  const play = createPlay(parseLevel(def), app.session);
  return { ...app, screen: 'level', play, levelStart: app.session };
}

function saveEffect(app) {
  return { type: 'save', data: { session: app.session, mapPos: app.map ? { x: app.map.x, y: app.map.y } : null } };
}

function updateOverlay(app, input) {
  const { overlay } = app;
  const { pressed } = input;
  if (overlay.kind === 'confirm') {
    if (pressed.yes) return confirmYes({ ...app, overlay: null }, overlay.id);
    if (pressed.no || pressed.back) return result({ ...app, overlay: null }, ['select']);
    return result(app);
  }
  return input.any ? result({ ...app, overlay: null }, ['select']) : result(app);
}

function confirmYes(app, id) {
  if (id === 'quitLevel') return result(goMap(app, app.levelStart), ['select']);
  if (id === 'quitTitle') return result({ ...createApp(app.save), save: app.save }, ['select'], [{ type: 'reloadSave' }]);
  return result(app);
}

function updateTitleScreen(app, input, dt) {
  const r = updateTitle(app.title, input, dt);
  const next = { ...app, title: r.state };
  if (r.action === 'help') return result({ ...next, overlay: { kind: 'help' } }, r.events);
  if (r.action === 'new') {
    return result({ ...next, screen: 'story', story: createStory(INTRO_PAGES), session: createSession(), map: createMap() }, r.events);
  }
  if (r.action === 'continue' && app.save) {
    const loaded = goMap(next, app.save.session, { map: createMap(app.save.mapPos, app.save.session.completed) });
    return result(loaded, r.events);
  }
  return result(next, r.events);
}

function updateStoryScreen(app, input, dt) {
  const r = updateStory(app.story, input, dt);
  const next = { ...app, story: r.state };
  if (r.action !== 'done') return result(next, r.events);
  if (app.story.kind === 'ending') return result(createApp(null), r.events, [{ type: 'clearSave' }]);
  const onMap = goMap(next, app.session);
  return result(onMap, r.events, [saveEffect(onMap)]);
}

function updateMapScreen(app, input, dt) {
  const { pressed } = input;
  if (!app.map.message) {
    if (pressed.back) return result({ ...app, overlay: { kind: 'confirm', id: 'quitTitle', lines: ['QUIT TO THE TITLE SCREEN?', '', 'PROGRESS IS SAVED.'] } }, ['select']);
    if (pressed.confirm) return result({ ...app, overlay: { kind: 'status' } }, ['select']);
    if (pressed.help) return result({ ...app, overlay: { kind: 'help' } }, ['select']);
  }
  const r = updateMap(app.map, input, app.session, dt);
  const next = { ...app, map: r.state };
  if (r.action?.type === 'enter') return result(startLevel(next, r.action.levelId), r.events);
  if (r.action?.type === 'ship') {
    return result({ ...next, screen: 'ending', story: createStory(ENDING_PAGES, 'ending') }, r.events, [{ type: 'clearSave' }]);
  }
  return result(next, r.events);
}

function updateLevelScreen(app, input, dt) {
  const { pressed } = input;
  if (app.play.phase === 'play') {
    if (pressed.back) return result({ ...app, overlay: { kind: 'confirm', id: 'quitLevel', lines: ['ABANDON THIS LEVEL?', '', 'ANYTHING YOU PICKED UP', 'HERE WILL BE LOST.'] } }, ['select']);
    if (pressed.confirm) return result({ ...app, overlay: { kind: 'status' } }, ['select']);
    if (pressed.help) return result({ ...app, overlay: { kind: 'help' } }, ['select']);
  }
  const r = updatePlay(app.play, input, dt);
  const next = { ...app, play: r.state };
  if (r.outcome === 'complete') {
    const session = completeLevel(r.state.session, r.state.level.id);
    return result({ ...next, screen: 'intermission', session, inter: createIntermission(r.state) }, r.events);
  }
  if (r.outcome === 'died') {
    const lives = app.levelStart.lives - 1;
    if (lives <= 0) return result({ ...next, screen: 'gameover', session: null, t: 0 }, r.events, [{ type: 'clearSave' }]);
    const back = goMap(next, { ...app.levelStart, lives });
    return result(back, r.events, [saveEffect(back)]);
  }
  return result(next, r.events);
}

function updateIntermissionScreen(app, input, dt) {
  const r = updateIntermission(app.inter, input, dt);
  if (r.action !== 'done') return result({ ...app, inter: r.state }, r.events);
  const back = goMap(app, app.session, { inter: null });
  return result(back, r.events, [saveEffect(back)]);
}

function updateGameOver(app, input, dt) {
  const t = app.t + dt;
  if (t > 1 && input.any) return result(createApp(null), ['select']);
  return result({ ...app, t });
}

// Returns { app, events (sound names), effects (side effects for main.js) }.
export function updateApp(app, input, dt) {
  if (app.overlay) return updateOverlay(app, input);
  switch (app.screen) {
    case 'title': return updateTitleScreen(app, input, dt);
    case 'story':
    case 'ending': return updateStoryScreen(app, input, dt);
    case 'map': return updateMapScreen(app, input, dt);
    case 'level': return updateLevelScreen(app, input, dt);
    case 'intermission': return updateIntermissionScreen(app, input, dt);
    case 'gameover': return updateGameOver(app, input, dt);
    default: throw new Error(`Unknown screen: ${app.screen}`);
  }
}

const THEME_TRACKS = { tech: 'tech', nukage: 'nukage', hell: 'hell' };

// Which soundtrack piece suits the current screen.
export function musicFor(app) {
  switch (app.screen) {
    case 'title':
    case 'story': return 'title';
    case 'map': return 'map';
    case 'level': return app.play.level.id === 'e1m8' ? 'boss' : THEME_TRACKS[app.play.level.theme];
    case 'intermission': return 'intermission';
    case 'gameover': return 'gameover';
    case 'ending': return 'ending';
    default: return null;
  }
}
