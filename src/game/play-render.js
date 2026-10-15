// Draws a level: background, tiles, pickups, demons, shots, the hero and HUD.
import { TILE, SCREEN_W, SCREEN_H, PLAYER, TIMING } from '../core/constants.js';
import { tileAt } from './level.js';
import { drawHud, drawMessageBox, drawPanel } from '../ui/box.js';
import { drawTextCentered } from '../core/font.js';
import { egaColor } from '../core/palette.js';

function visibleRange(camera) {
  return {
    x0: Math.floor(camera.x / TILE),
    x1: Math.floor((camera.x + SCREEN_W) / TILE),
    y0: Math.floor(camera.y / TILE),
    y1: Math.floor((camera.y + SCREEN_H) / TILE),
  };
}

function tileKey(level, ch, tx, ty) {
  if (ch !== 'E') return ch;
  return tileAt(level, tx, ty - 1) === 'E' ? 'Ebot' : 'Etop';
}

function drawTiles(ctx, level, cam, gfx, time) {
  const { x0, x1, y0, y1 } = visibleRange(cam);
  const bg = gfx.tile(level.theme, 'bg');
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const sx = tx * TILE - cam.x;
      const sy = ty * TILE - cam.y;
      ctx.drawImage(bg, sx, sy);
      const ch = tileAt(level, tx, ty);
      if (ch === '.' || ty >= level.height) continue;
      const art = gfx.tile(level.theme, tileKey(level, ch, tx, ty), time + (tx * 0.13));
      if (art) ctx.drawImage(art, sx, sy);
    }
  }
}

function drawItems(ctx, items, cam, gfx, time) {
  items.forEach((item, i) => {
    const bob = Math.round(Math.sin(time * 4 + i) * 1.2);
    const art = gfx.item(item.kind);
    if (art) ctx.drawImage(art, Math.round(item.x - cam.x), Math.round(item.y - cam.y + bob));
  });
}

function enemySpriteName(e) {
  const step = Math.floor(e.anim * 6) % 2 ? 'walkB' : 'walkA';
  switch (e.kind) {
    case 'zombie': return e.state === 'walk' ? `zombie.${step}` : 'zombie.stand';
    case 'imp': return e.state === 'throw' ? 'imp.throw' : `imp.${step}`;
    case 'pinky': return `pinky.${Math.floor(e.anim * (e.state === 'charge' ? 14 : 6)) % 2 ? 'walkB' : 'walkA'}`;
    case 'lostSoul': return `lostSoul.${Math.floor(e.anim * 10) % 2 ? 'b' : 'a'}`;
    case 'baron': return e.onGround ? `baron.${Math.floor(e.anim * 4) % 2 ? 'walkB' : 'walkA'}` : 'baron.walkB';
    default: throw new Error(`No sprite for enemy ${e.kind}`);
  }
}

function drawStars(ctx, x, y, time) {
  ctx.fillStyle = egaColor('E');
  for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i * Math.PI * 2) / 3;
    ctx.fillRect(Math.round(x + Math.cos(a) * 6), Math.round(y + Math.sin(a) * 2), 2, 2);
  }
}

function drawEnemies(ctx, enemies, cam, gfx, time) {
  enemies.forEach((e) => {
    if (!e.alive) {
      const corpse = gfx.corpse(e.kind);
      ctx.drawImage(corpse, Math.round(e.x + e.w / 2 - corpse.width / 2 - cam.x), Math.round(e.y + e.h - corpse.height - cam.y));
      return;
    }
    const sprite = gfx.sprite(enemySpriteName(e), e.facing, e.flash > 0);
    const sx = Math.round(e.x + e.w / 2 - sprite.width / 2 - cam.x);
    const sy = e.kind === 'lostSoul'
      ? Math.round(e.y + e.h / 2 - 7 - cam.y)
      : Math.round(e.y + e.h - sprite.height - cam.y);
    ctx.drawImage(sprite, sx, sy);
    if (e.state === 'stunned') drawStars(ctx, sx + sprite.width / 2, sy + 1, time);
  });
}

function drawShots(ctx, shots, cam, gfx) {
  shots.forEach((s) => {
    const sprite = gfx.sprite(s.kind, s.vx >= 0 ? 1 : -1);
    ctx.drawImage(sprite, Math.round(s.x - cam.x), Math.round(s.y - cam.y));
  });
}

export function heroFrameName(p) {
  if (p.dead) return 'hero.dead';
  const torso = p.shootAnim > 0 ? 'shoot' : 'stand';
  if (p.pogo) return `hero.${torso}_pogo`;
  if (!p.onGround) return `hero.${torso}_jump`;
  if (Math.abs(p.vx) > 5) return `hero.${torso}_${['walkA', 'stand', 'walkB', 'stand'][Math.floor(p.anim * 9) % 4]}`;
  return `hero.${torso}_stand`;
}

function drawPlayer(ctx, state, cam, gfx) {
  const p = state.player;
  const sprite = gfx.sprite(heroFrameName(p), p.facing);
  const fade = state.phase === 'exiting' ? Math.max(0, 1 - state.phaseTime / (TIMING.exitDuration * 0.7)) : 1;
  ctx.globalAlpha = fade;
  ctx.drawImage(sprite, Math.round(p.x - PLAYER.spriteOffX - cam.x), Math.round(p.y - PLAYER.spriteOffY - cam.y));
  ctx.globalAlpha = 1;
}

function drawEffects(ctx, effects, level, cam, gfx, time) {
  effects.forEach((fx) => {
    if (fx.type === 'door') {
      const art = gfx.tile(level.theme, fx.ch, time);
      const drop = Math.round((fx.t / fx.dur) * TILE);
      const sx = fx.tx * TILE - cam.x;
      const sy = fx.ty * TILE - cam.y;
      ctx.drawImage(art, 0, 0, TILE, TILE - drop, sx, sy + drop, TILE, TILE - drop);
      return;
    }
    const frames = gfx.effectFrames(fx.name);
    const frame = Math.min(frames - 1, Math.floor((fx.t / fx.dur) * frames));
    ctx.drawImage(gfx.effect(fx.name, frame), Math.round(fx.x - cam.x), Math.round(fx.y - cam.y));
  });
}

function drawBanner(ctx, state) {
  if (state.banner <= 0) return;
  const label = `${state.level.id.toUpperCase()}: ${state.level.name}`;
  const w = label.length * 6 + 12;
  drawPanel(ctx, Math.round((SCREEN_W - w) / 2), SCREEN_H - 22, w, 14);
  drawTextCentered(ctx, label, SCREEN_W / 2, SCREEN_H - 18, 'C');
}

export function renderPlay(ctx, state, gfx, time) {
  const cam = { x: Math.round(state.camera.x), y: Math.round(state.camera.y) };
  drawTiles(ctx, state.level, cam, gfx, time);
  drawItems(ctx, state.items, cam, gfx, time);
  drawEnemies(ctx, state.enemies, cam, gfx, time);
  drawShots(ctx, state.shots, cam, gfx);
  drawPlayer(ctx, state, cam, gfx);
  drawEffects(ctx, state.effects, state.level, cam, gfx, time);
  drawHud(ctx, state.session, state.keys, gfx);
  drawBanner(ctx, state);
  if (state.phase === 'dialog' && state.dialog) drawMessageBox(ctx, state.dialog);
}
