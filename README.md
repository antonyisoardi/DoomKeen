# Commander Doom — Episode One: Marooned on Phobos

A Commander Keen 1 style side-scroller wearing Doom's armour. You get Keen's
320×200 EGA look, momentum, hold-to-jump-higher, pogo stick, raygun and one-hit
deaths, all set across the UAC base on Phobos (E1M1 Hangar → E1M8 Phobos Anomaly).

Billy Blaze's grandson was on a UAC school trip when the gates of Hell opened.
The demons stole four parts of his Bean-with-Bacon Megarocket. Find the parts,
then get back to the ship.

## Play

```bash
npm start
```

Then open http://localhost:8080. There are no dependencies to install; it needs Node 20+ only for the
tiny static server (any static file server works).

| Key | Action |
| --- | --- |
| Arrows / WASD | Move (walk the overworld, steer in the air) |
| Z | Jump — hold for a higher jump |
| X or Alt | Pogo stick on/off (once found in E1M2). Hold Z while bouncing to spring higher |
| Space or C | Fire the plasma pistol (limited charges — grab clips) |
| Enter | Status screen |
| Esc | Abandon level / quit to title |
| M | Cycle: music + sound → sound only → silent |

Ctrl is intentionally not bound: Ctrl+W and Ctrl+arrows trigger browser and OS shortcuts.

## Keen 1 → Doom

| Keen 1 | Commander Doom |
| --- | --- |
| Yorp (harmless, shoves you, stomp to stun) | Zombieman |
| Garg (spots you, charges) | Pinky demon |
| Vorticon (tough, jumps around) | Baron of Hell (E1M8 boss pair) |
| — | Imp (fireballs), Lost Soul (bounces, lunges) |
| Raygun | Plasma pistol |
| Joystick, Battery, Vacuum, Everclear | Fusion Battery, Nav Joystick, Plasma Manifold, Argent Fuel Cell |
| Lollipops, pizza, books… | Armor/health bonuses, stimpacks, medikits |
| Extra Keen | Soulsphere, plus an extra life every 20,000 points |
| Mars overworld | Phobos surface; force fields drop as you clear levels |

All art is original pixel art drawn in code with the 16-colour EGA palette, and
the soundtrack is original music in a Doom style, synthesized live with Web
Audio. Each screen has its own track, and E1M8's boss fight has its own.
No id Software assets or existing music are used.

## Development

```bash
npm test               # 99 unit + integration tests (node:test)
npm run check-levels   # ASCII reachability map of every level (or: npm run check-levels e1m3)
```

The level checker runs a conservative jump-physics BFS that collects keycards and
the pogo stick along the way. Tests fail if any level's exit, keycards, pogo or
Megarocket parts become unreachable. Player tests verify the real jump arc
exceeds the analyzer's assumptions, so "reachable" really means reachable.

```
src/
  core/      constants (physics tuning), palette, input, PC-speaker sfx, music synth + songs, font, save
  gfx/       pixel-string sprite data, procedural tiles, atlas builder
  game/      level parsing, tile physics, player, enemies, projectiles, play loop, reachability
  world/     Phobos overworld
  screens/   title, story, intermission, status/help overlays
  levels/    e1m1..e1m8 as ASCII maps
  app.js     screen flow (pure state transitions); main.js owns the loop and side effects
```

### Level legend

`#` wall · `=` girder · `-` one-way grate · `B` brick · `M` marble · `~` nukage · `%` lava · `^` spikes ·
`R/U/Y` red/blue/yellow door · `r/u/y` keycards · `E` exit (2 tall) · `X` boss gate ·
`@` start · `a h s m` bonuses · `c` clip · `S` soulsphere · `g` pogo · `1-4` parts ·
`z i p l V` zombieman/imp/pinky/lost soul/baron · `w L | T` decorations
