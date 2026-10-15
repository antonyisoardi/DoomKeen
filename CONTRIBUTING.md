# Contributing to Commander Doom

Thanks for wanting to help. The game has no build step and no dependencies,
so getting started is quick:

```bash
npm start      # http://localhost:8080
npm test
npm run check-levels
```

## Ground rules

- **Original assets only.** No sprites, sounds or music ripped from Doom,
  Commander Keen or any other game, and no note-for-note transcriptions of
  existing songs. Homage in style is fine; copying isn't.
- Keep it zero-dependency and runnable from plain static files.
- Match the existing style: small focused modules, pure update functions that
  return new state rather than mutating, and tests for new logic.

## Adding or editing a level

Levels are ASCII maps in `src/levels/` (the legend is in the README).

1. Edit the map. Every row must be the same width.
2. Run `npm run check-levels e1mN`. Reachable standing spots print as `o`.
   The exit, keycards, pogo stick and Megarocket parts must all be reachable.
3. Play it. The checker is deliberately conservative, but it can't judge fun.

## Adding or editing music

Songs live in `src/core/songs.js` as one-bar sections of 16 steps per channel:
notes like `E2` or `F#3`, `-` to hold, `.` for rest, and `k s h c` for drums.
`npm test` checks every bar is well formed.

## Pull requests

Describe what changed and how you tested it, and tick the checklist in the
PR template.
