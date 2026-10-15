// Draws whichever screen the app is on, plus any overlay.
import { renderTitle } from './screens/title.js';
import { renderStory } from './screens/story.js';
import { renderIntermission, renderGameOver } from './screens/intermission.js';
import { renderHelp, renderConfirm, renderStatus } from './screens/overlays.js';
import { renderMap } from './world/map-render.js';
import { renderPlay } from './game/play-render.js';

export function renderApp(ctx, app, gfx, time) {
  switch (app.screen) {
    case 'title': renderTitle(ctx, app.title, gfx, time); break;
    case 'story':
    case 'ending': renderStory(ctx, app.story, gfx, time); break;
    case 'map': renderMap(ctx, app.map, app.session, gfx, time); break;
    case 'level': renderPlay(ctx, app.play, gfx, time); break;
    case 'intermission': renderIntermission(ctx, app.inter, time); break;
    case 'gameover': renderGameOver(ctx, time); break;
    default: throw new Error(`Unknown screen: ${app.screen}`);
  }
  const { overlay } = app;
  if (!overlay) return;
  if (overlay.kind === 'help') renderHelp(ctx);
  if (overlay.kind === 'confirm') renderConfirm(ctx, overlay.lines);
  if (overlay.kind === 'status') {
    const session = app.screen === 'level' ? app.play.session : app.session;
    renderStatus(ctx, session, app.screen === 'level' ? app.play.keys : null, gfx);
  }
}
