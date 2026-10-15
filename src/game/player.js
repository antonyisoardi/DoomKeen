// Commander Doom's movement: Keen 1 style walk/slide, hold-to-jump-higher,
// pogo bouncing, and the plasma pistol (Keen's raygun).
import { TILE, PHYS, PLAYER } from '../core/constants.js';
import { moveBody, approach } from './physics.js';

export function createPlayer(tx, ty) {
  return Object.freeze({
    x: tx * TILE + (TILE - PLAYER.w) / 2,
    y: (ty + 1) * TILE - PLAYER.h,
    w: PLAYER.w,
    h: PLAYER.h,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    pogo: false,
    holdLeft: 0,
    holdPassive: 0,
    coyote: 0,
    cooldown: 0,
    shootAnim: 0,
    freeze: 0,
    push: 0,
    anim: 0,
    dead: false,
  });
}

function steer(p, dir, pogo, freeze, push, dt) {
  if (push > 0) return p.vx;
  if (freeze > 0 && p.onGround) return 0;
  const grounded = p.onGround && !pogo;
  if (dir !== 0) {
    const accel = grounded ? PHYS.groundAccel : pogo ? PHYS.pogoAirAccel : PHYS.airAccel;
    return approach(p.vx, dir * PHYS.walkSpeed, accel * dt);
  }
  return approach(p.vx, 0, (grounded ? PHYS.groundDecel : PHYS.airDecel) * dt);
}

function makeShot(p) {
  return Object.freeze({
    kind: 'plasma',
    owner: 'player',
    x: p.facing > 0 ? p.x + p.w : p.x - 8,
    y: p.y + 8,
    w: 8,
    h: 5,
    vx: p.facing * PHYS.shotSpeed,
    vy: 0,
    ttl: PHYS.shotLife,
  });
}

// ctx: { level, hasPogo, ammo }. Returns { player, events, fired, blockers }.
export function updatePlayer(p, input, ctx, dt) {
  const { held, pressed } = input;
  const events = [];
  const pogo = pressed.pogo && ctx.hasPogo ? !p.pogo : p.pogo;
  const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  const push = Math.max(0, p.push - dt);
  let freeze = Math.max(0, p.freeze - dt);
  const facing = dir !== 0 && push <= 0 ? dir : p.facing;
  const vx = steer(p, dir, pogo, freeze, push, dt);

  let { vy, holdLeft, holdPassive, coyote } = p;
  if (pogo !== p.pogo) holdLeft = 0;
  if (!pogo && pressed.jump && (p.onGround || coyote > 0)) {
    vy = -PHYS.jumpSpeed;
    holdLeft = PHYS.jumpHold;
    holdPassive = 0;
    coyote = 0;
    events.push('jump');
  } else if (pogo && p.onGround) {
    vy = -PHYS.pogoSpeed;
    holdLeft = PHYS.pogoHold;
    holdPassive = PHYS.pogoPassiveHold;
    events.push('pogo');
  }

  if (holdLeft > 0 && (holdPassive > 0 || held.jump)) {
    vy = -(pogo ? PHYS.pogoSpeed : PHYS.jumpSpeed);
    holdLeft -= dt;
    holdPassive -= dt;
  } else {
    holdLeft = 0;
    vy = Math.min(vy + PHYS.gravity * dt, PHYS.maxFall);
  }

  const moved = moveBody(ctx.level, { x: p.x, y: p.y, w: p.w, h: p.h, vx, vy }, dt);
  if (moved.hitCeiling && holdLeft > 0) {
    holdLeft = 0;
    events.push('bump');
  }
  coyote = moved.onGround ? PHYS.coyoteTime : Math.max(0, coyote - dt);
  if (moved.onGround && !p.onGround && !pogo && p.vy > 160) events.push('land');

  let cooldown = Math.max(0, p.cooldown - dt);
  let shootAnim = Math.max(0, p.shootAnim - dt);
  let fired = null;
  if (pressed.fire && cooldown <= 0) {
    cooldown = PHYS.shotCooldown;
    if (ctx.ammo > 0) {
      fired = makeShot({ ...p, x: moved.x, y: moved.y, facing });
      shootAnim = 0.25;
      if (moved.onGround && !pogo) freeze = PHYS.shootFreeze;
      events.push('shoot');
    } else {
      events.push('click');
    }
  }

  const walking = moved.onGround && Math.abs(moved.vx) > 5;
  const player = Object.freeze({
    ...p,
    x: moved.x,
    y: moved.y,
    vx: moved.vx,
    vy: moved.vy,
    onGround: moved.onGround,
    facing,
    pogo,
    holdLeft,
    holdPassive,
    coyote,
    cooldown,
    shootAnim,
    freeze,
    push,
    anim: walking ? p.anim + dt : 0,
  });
  return { player, events, fired, blockers: moved.blockers };
}

// Shoved by a zombie (Keen 1 Yorp behaviour): no damage, just knocked aside.
export function pushPlayer(p, dir) {
  return Object.freeze({ ...p, vx: dir * PHYS.pushSpeed, push: PHYS.pushTime, facing: p.facing });
}

export function bouncePlayer(p) {
  return Object.freeze({ ...p, vy: -PHYS.stompBounce, holdLeft: 0, onGround: false });
}

export function killPlayer(p) {
  return Object.freeze({ ...p, dead: true, pogo: false, vx: -p.facing * 40, vy: -320 });
}
