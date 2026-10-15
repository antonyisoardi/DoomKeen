// Demon sprites (all facing right). Legs for humanoids reuse the hero's leg
// shapes with a palette remap so walk cycles match.
import { LEGS } from './hero.js';
import { remap } from './util.js';

const ZOMBIE_HEAD = [
  '.....000000.....',
  '....08888880....',
  '....08777770....',
  '....077774740...',
  '....077777770...',
  '....077700770...',
  '.....0777770....',
  '......0770......',
];
const ZOMBIE_TORSO = [
  '....00666600....',
  '...0666666660...',
  '..066066666600..',
  '..0606666660888.',
  '..0706888886770.',
  '...00666666000..',
  '....06666660....',
];
const ZOMBIE_LEG_COLORS = { 2: '6', 6: '8' };

const IMP_HEAD = [
  '..F........F....',
  '..0F.0000.F0....',
  '...0F6666F0.....',
  '...066666660....',
  '...0666C6C60....',
  '...0666666660...',
  '...06660F0F0....',
  '....0666660.....',
];
const IMP_TORSO = [
  '..F00666600F....',
  '..0F66666666F0..',
  '..066066660660..',
  '..060666666060..',
  '..0F06666660F0..',
  '...006666660....',
  '....06666660....',
];
const IMP_TORSO_THROW = [
  '..F00666600F.CE.',
  '..0F666666660CC.',
  '..066066660660..',
  '..0606666660....',
  '..0F06666660....',
  '...0066666600...',
  '....06666660....',
];
const IMP_LEG_COLORS = { 2: '6', 8: '6', 6: '7' };

const PINKY_TOP = [
  '......00000000..........',
  '....00DDDDDDDD00........',
  '...0DDDDDDDDDDDD0.......',
  '..0DD5DDDDDDDDDDD00.....',
  '..0D55DDDDDDDD4DDDD0....',
  '.0DD5DDDDDDDDDDDDDDD0...',
  '.0D5DDDDDDDDDDD000000...',
  '.0D5DDDDDDDDD0FF0F0F0F0.',
  '.0D5DDDDDDDDD0444444440.',
  '.0D5DDDDDDDDD0F0F0F0FF0.',
  '.0DD5DDDDDDDDD0000000...',
  '..0DD55DDDDDDDDDD0......',
  '...0DDD55555DDDD0.......',
  '....00DDDDDDDD00........',
];
const PINKY_LEGS_A = [
  '.....0D5D0..0D5D0.......',
  '.....0D5D0..0D5D0.......',
  '....0D55D0.0D55D0.......',
  '....055550.055550.......',
  '....0FF0F0.0FF0F0.......',
  '....000000.000000.......',
];
const PINKY_LEGS_B = [
  '......0D5D00D5D0........',
  '......0D5D00D5D0........',
  '.....0D55D0D55D0........',
  '.....055550055550.......',
  '.....0FF0F00FF0F0.......',
  '.....00000000000........',
];

const SOUL_FLAMES_A = [
  '..C...E..C...E..',
  '.CEC.CEC.CEC.CE.',
  '.4CE00000000EC4.',
  '..40FFFFFFFF04..',
];
const SOUL_FLAMES_B = [
  '.E...C..E...C...',
  'ECE.CEC.ECE.CEC.',
  '.C4E00000000E4C.',
  '..C0FFFFFFFF0C..',
];
const SOUL_SKULL = [
  '..0FFFFFFFFFF0..',
  '.0FFFFFFFFFFFF0.',
  '.0F000FFFF000F0.',
  '.0F0C0FFFF0C0F0.',
  '.0F000FFFF000F0.',
  '.0FFFFF00FFFFF0.',
  '..0FFFF00FFFF0..',
  '..0F7F7F7F7F70..',
  '...0F0F0F0F0F0..',
  '...00000000000..',
  '................',
  '................',
];

const BARON_TOP = [
  '......F........F........',
  '......7F......F7........',
  '.......7F0000F7.........',
  '........0CCCCC0.........',
  '.......0CCCCCCC0........',
  '.......0CCCC4C40........',
  '.......0CCCCCCCC0.......',
  '.......0CCC0F0F00.......',
  '........0CCCCCC0........',
  '.....000CCCCCCCC000.....',
  '....0CCCCCCCCCCCCCC0....',
  '...0CCC0CCCCCCCC0CCC0...',
  '...0CC0CCCFFFFCCC0CC0...',
  '...0CC0CCCCCCCCCC0CC0...',
  '...0CC0CCCC77CCCC0CC0...',
  '...0CC0CCCCCCCCCC0CC0...',
  '...0AA0CCCCCCCCCC0AA0...',
];
const BARON_LEGS_A = [
  '......066666666660......',
  '......066660066660......',
  '......066660066660......',
  '......066660066660......',
  '......066660066660......',
  '......066600006660......',
  '......066600006660......',
  '......06660..06660......',
  '.......0660..0660.......',
  '.......0660..0660.......',
  '......06660..06660......',
  '......08880..08880......',
  '.....088880..088880.....',
  '.....000000..000000.....',
  '........................',
];
const BARON_LEGS_B = [
  '......066666666660......',
  '......066660066660......',
  '.....066660..066660.....',
  '.....06660....06660.....',
  '....06660......06660....',
  '....06660......06660....',
  '....0660........0660....',
  '....0660........0660....',
  '....0660........0660....',
  '...06660........06660...',
  '...06660........06660...',
  '...08880........08880...',
  '..088880........088880..',
  '..000000........000000..',
  '........................',
];

export const FIREBALL = [
  '..CEEC..',
  '.CEFFEC.',
  'CEFFFFEC',
  'CEFFFFEC',
  '.CEFFEC.',
  '..CEEC..',
];
export const BARONBALL = remap(FIREBALL, { C: '2', E: 'A' });
export const PLASMA = [
  '..9BB9..',
  '.9BFFB9.',
  '9BFFFFB9',
  '.9BFFB9.',
  '..9BB9..',
];

// Sprite sheets: name -> rows. Draw anchors are computed from sizes at render time.
export function enemyFrames() {
  const zLegs = (name) => remap(LEGS[name], ZOMBIE_LEG_COLORS);
  const iLegs = (name) => remap(LEGS[name], IMP_LEG_COLORS);
  return {
    'zombie.stand': [...ZOMBIE_HEAD, ...ZOMBIE_TORSO, ...zLegs('stand')],
    'zombie.walkA': [...ZOMBIE_HEAD, ...ZOMBIE_TORSO, ...zLegs('walkA')],
    'zombie.walkB': [...ZOMBIE_HEAD, ...ZOMBIE_TORSO, ...zLegs('walkB')],
    'imp.stand': [...IMP_HEAD, ...IMP_TORSO, ...iLegs('stand')],
    'imp.walkA': [...IMP_HEAD, ...IMP_TORSO, ...iLegs('walkA')],
    'imp.walkB': [...IMP_HEAD, ...IMP_TORSO, ...iLegs('walkB')],
    'imp.throw': [...IMP_HEAD, ...IMP_TORSO_THROW, ...iLegs('stand')],
    'pinky.walkA': [...PINKY_TOP, ...PINKY_LEGS_A],
    'pinky.walkB': [...PINKY_TOP, ...PINKY_LEGS_B],
    'lostSoul.a': [...SOUL_FLAMES_A, ...SOUL_SKULL],
    'lostSoul.b': [...SOUL_FLAMES_B, ...SOUL_SKULL],
    'baron.walkA': [...BARON_TOP, ...BARON_LEGS_A],
    'baron.walkB': [...BARON_TOP, ...BARON_LEGS_B],
  };
}

// Main body colour per enemy, used to tint gib piles.
export const CORPSE_COLORS = Object.freeze({ zombie: '6', imp: '6', pinky: 'D', baron: 'C', lostSoul: 'F' });
