// Keyboard input with "held" and "pressed this step" views per action.
// Ctrl is deliberately NOT bound: Ctrl+W/Ctrl+arrows trigger browser/OS shortcuts.

export const BINDINGS = Object.freeze({
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'KeyK'],
  pogo: ['KeyX', 'AltLeft', 'AltRight', 'KeyL'],
  fire: ['Space', 'KeyC', 'KeyJ'],
  confirm: ['Enter', 'NumpadEnter'],
  back: ['Escape'],
  mute: ['KeyM'],
  help: ['F1', 'KeyH'],
  yes: ['KeyY'],
  no: ['KeyN'],
});

const ACTIONS = Object.keys(BINDINGS);

const CODE_TO_ACTIONS = ACTIONS.reduce((map, action) => {
  BINDINGS[action].forEach((code) => map.set(code, [...(map.get(code) || []), action]));
  return map;
}, new Map());

function actionRecord(test) {
  return Object.freeze(Object.fromEntries(ACTIONS.map((a) => [a, test(a)])));
}

export const EMPTY_INPUT = Object.freeze({
  held: actionRecord(() => false),
  pressed: actionRecord(() => false),
  any: false,
});

export function makeInput({ held = [], pressed = [] } = {}) {
  return Object.freeze({
    held: actionRecord((a) => held.includes(a)),
    pressed: actionRecord((a) => pressed.includes(a)),
    any: pressed.length > 0,
  });
}

export function createInput(target = window) {
  const heldCodes = new Set();
  let pressedActions = new Set();
  let anyPressed = false;

  const onKeyDown = (event) => {
    const actions = CODE_TO_ACTIONS.get(event.code);
    if (actions) event.preventDefault();
    if (event.repeat) return;
    heldCodes.add(event.code);
    anyPressed = true;
    (actions || []).forEach((a) => pressedActions.add(a));
  };
  const onKeyUp = (event) => {
    heldCodes.delete(event.code);
    if (CODE_TO_ACTIONS.has(event.code)) event.preventDefault();
  };
  const onBlur = () => heldCodes.clear();

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return {
    snapshot() {
      const snap = Object.freeze({
        held: actionRecord((a) => BINDINGS[a].some((code) => heldCodes.has(code))),
        pressed: actionRecord((a) => pressedActions.has(a)),
        any: anyPressed,
      });
      pressedActions = new Set();
      anyPressed = false;
      return snap;
    },
    destroy() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
    },
  };
}
