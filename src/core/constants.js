// Global tuning values. Physics numbers approximate Commander Keen 1's feel at
// 320x200 with 16px tiles: snappy acceleration, a little slide on stopping,
// hold-to-jump-higher, and a bouncy pogo stick.

export const SCREEN_W = 320;
export const SCREEN_H = 200;
export const TILE = 16;
export const STEP = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const PHYS = Object.freeze({
  gravity: 1200,
  maxFall: 330,
  walkSpeed: 100,
  groundAccel: 900,
  groundDecel: 650,
  airAccel: 520,
  airDecel: 110,
  pogoAirAccel: 380,
  jumpSpeed: 230,
  jumpHold: 0.25,
  pogoSpeed: 270,
  pogoHold: 0.32,
  pogoPassiveHold: 0.06,
  coyoteTime: 0.06,
  stompBounce: 220,
  shotSpeed: 300,
  shotLife: 1.2,
  shotCooldown: 0.25,
  shootFreeze: 0.15,
  pushSpeed: 150,
  pushTime: 0.22,
});

export const PLAYER = Object.freeze({ w: 10, h: 22, spriteOffX: 3, spriteOffY: 2 });

export const RULES = Object.freeze({
  startLives: 4,
  startAmmo: 5,
  clipAmmo: 5,
  extraLifeEvery: 20000,
  partsNeeded: 4,
});

// Camera dead-zone (screen coordinates the player's centre may roam in).
export const CAMERA = Object.freeze({ left: 136, right: 176, top: 70, bottom: 120 });

export const TIMING = Object.freeze({
  levelBanner: 2.5,
  deathDuration: 2.2,
  exitDuration: 1.4,
  stunDuration: 4,
});
