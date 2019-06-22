import shuffle from 'lodash.shuffle';
import { makeRuleMaker } from './makeRuleMaker';

const ROW_COUNT = 30;
const COL_COUNT = 30;

const WATER = '~';
const VAPOR = '.';
const OIL = 'o';
const EMPTY = ' ';
const ROCK = 'O';
const EARTH = '@';
const MUD = 'M';
const ROOT = '!';
const STALK_8 = '8';
const STALK_7 = '7';
const STALK_6 = '6';
const STALK_5 = '5';
const STALK_4 = '4';
const STALK_3 = '3';
const STALK_2 = '2';
const STALK_1 = '|';
const STALK_1_HORIZ = '_';
const STALK_1_$E = '\\';
const STALK_1_RIGHT = '/';

let nextCanvas = [];
let canvas = [];
let visited = [];
let coords = [];
let i = 0;
for (let y = 0; y < ROW_COUNT; y += 1) {
  canvas[y] = [];
  visited[y] = [];
  nextCanvas[y] = [];
  for (let x = 0; x < COL_COUNT; x += 1) {
    coords[i] = [x, y];
    i += 1;

    nextCanvas[y][x] = canvas[y][x] =
      Math.random() < 0.2 ? WATER : Math.random() < 0.2 ? EARTH : EMPTY;

    visited[y][x] = false;
  }
}

const pick = array => {
  return array[Math.floor(Math.random() * array.length)];
};

const GROWTHRATE = 0.01;
const ROOT_GROWTHRATE = GROWTHRATE / 50;

const $NE = (_, n) => n[0][0];
const $N = (_, n) => n[0][1];
const $NW = (_, n) => n[0][2];
const $E = (_, n) => n[1][0];
const $C = (_, n) => n[1][1];
const $W = (_, n) => n[1][2];
const $SE = (_, n) => n[2][0];
const $S = (_, n) => n[2][1];
const $SW = (_, n) => n[2][2];

const makeRule = makeRuleMaker(COL_COUNT, ROW_COUNT, canvas, visited, EMPTY);

function makeFall(densities) {
  const canFall = Object.keys(densities).join('');
  const LESS_DENSE = (c, mainCell) => densities[c] < densities[mainCell];

  // prettier-ignore
  return makeRule(
    [
      [0, 0, 0],
      [0, canFall, 0],
      [0, LESS_DENSE, 0]
    ],
    1,
    [
      [0, 0, 0],
      [0, $S, 0],
      [0, $C, 0]
    ],
  );
}

function makeFlow(viscocities) {
  const prob = (c: string) => {
    const viscocity = viscocities[c];
    if (viscocity == null) {
      return 0;
    }
    return 1 - viscocity;
  };
  const canFlow = Object.keys(viscocities).join('');
  const MORE_DENSE = (c, o) => densities[c] >= densities[o];
  const LESS_DENSE = (c, o) => densities[c] < densities[o];
  // prettier-ignore
  const flowLeft = makeRule(
    [
      [0, 0, 0],
      [LESS_DENSE, canFlow, 0],
      [0, MORE_DENSE, 0]
    ],
    prob,
    [
      [0, 0, 0],
      [$C, $E, 0],
      [0, 0, 0]
    ],
  );
  // prettier-ignore
  const flowRight = makeRule(
    [
      [0, 0, 0],
      [0, canFlow, LESS_DENSE],
      [0, MORE_DENSE, 0]
    ],
    prob,
    [
      [0, 0, 0],
      [0, $W, $C],
      [0, 0, 0]
    ],
  );

  const flows = [flowLeft, flowRight];

  return (x, y) => {
    return pick(flows)(x, y);
  };
}

const neighborhoodProbability = (cellMatch, perCell) => (_, n) => {
  let p = 0;
  for (const row of n) {
    for (const cell of row) {
      if (cell === cellMatch) {
        p += perCell;
      }
    }
  }

  return p;
};

const densities = {
  [VAPOR]: 0.009,
  [EMPTY]: 0.01,
  [OIL]: 0.3,
  [WATER]: 0.5,
  [MUD]: 0.8,
  [EARTH]: 0.8,
};

const GROWABLE = [
  ROOT,
  STALK_8,
  STALK_7,
  STALK_6,
  STALK_5,
  STALK_4,
  STALK_3,
  STALK_2,
].join('');

const STALKS = [
  ROOT,
  STALK_8,
  STALK_7,
  STALK_6,
  STALK_5,
  STALK_4,
  STALK_3,
  STALK_2,
  STALK_1,
].join('');

const STALKS_H = [
  ROOT,
  STALK_8,
  STALK_7,
  STALK_6,
  STALK_5,
  STALK_4,
  STALK_3,
  STALK_2,
  STALK_1_HORIZ,
].join('');

let rules = [
  // prettier-ignore
  makeRule(
    // Input
    [
      [0, 0, 0],
      [0, '~@', 0],
      [0, ' ', 0]
    ],
    1,
    // Output
    [
      [0, 0, 0],
      [0, ' ', 0],
      [0, $C, 0]
    ]
  ),

  // prettier-ignore
  makeRule(
    // Input
    [
      [0, 0, 0],
      [0, '@', 0],
      [0, '~', 0]],
    1,
    // Output
    [
      [0, 0, 0],
      [0, '~', 0],
      [0, '@', 0]
    ]
  ),

  // prettier-ignore
  makeRule(
    // Input
    [
      [0, 0, 0],
      ['^~@', '~', 0],
      [0, '^ ', 0]
    ],
    0.5,
    // Output
    [
      [0, 0, 0],
      ['~', $E, 0],
      [0, 0, 0]
    ]
  ),

  // prettier-ignore
  makeRule(
    // Input
    [
      [0, 0, 0],
      [0, '~', '^~@'],
      [0, '^ ', 0]
    ],
    0.5,
    // Output
    [
      [0, 0, 0],
      [0, $W, '~'],
      [0, 0, 0]
    ]
  ),

  // prettier-ignore
  makeRule(
    [
      [0, 0, 0],
      [0, '~', 0],
      [0, 0, 0]
    ],
    0.01,
    [
      [0, 0, 0],
      [0, '.', 0],
      [0, 0, 0]
    ],
  ),

  // makeRule(
  //   // Input
  //   [
  //     [0,0,0],
  //     [0,'~@',' '],
  //     [0,'~@',0]
  //   ],
  //   0.5,
  //   // Output
  //   [
  //     [0,0,0],
  //     [0,' ',$C],
  //     [0,0,0],
  //   ]
  // ),

  // makeRule(
  //   // Input
  //   [
  //     [0,0,0],
  //     [' ','~@',0],
  //     [0,'~@',0]
  //   ],
  //   0.5,
  //   // Output
  //   [
  //     [0,0,0],
  //     [$C,' ',0],
  //     [0,0,0],
  //   ]
  // ),
  // makeRule(
  //   // Input
  //   [
  //     [0,0,0],
  //     [0,'@',0],
  //     [0,'~',0]
  //   ],
  //   1,
  //   // Output
  //   [
  //     [0,0,0],
  //     [0,'~',0],
  //     [0,'@',0],
  //   ]
  // ),
  // makeRule(
  //   // Input
  //   [
  //     [0,0,0],
  //     ['~','@',0],
  //     [0,0,0]
  //   ],
  //   1,
  //   // Output
  //   [
  //     [0,0,0],
  //     ['@','~',0],
  //     [0,0,0],
  //   ]
  // ),
  // makeRule(
  //   // Input
  //   [
  //     [0,0,0],
  //     [0,'@','~'],
  //     [0,0,0]
  //   ],
  //   1,
  //   // Output
  //   [
  //     [0,0,0],
  //     [0,'~','@'],
  //     [0,0,0],
  //   ]
  // ),
  // makeFall(densities),
  // makeFlow({
  //   [OIL]: 0.3,
  //   [WATER]: 0.1,
  //   [VAPOR]: 0.01,
  //   [EARTH]: 0.99,
  //   [MUD]: 0.99,
  //   [EMPTY]: 0.01,
  // }),
  // makeRule(
  //   [
  //     [0, 0, 0],
  //     [0, WATER, 0],
  //     [0, 0, 0]
  //   ],
  //   neighborhoodProbability(EMPTY, 0.0001),
  //   [
  //     [0, 0, 0],
  //     [0, VAPOR, 0],
  //     [0, 0, 0]
  //   ],
  // ),
  // makeRule(
  //   [
  //     [0, 0, 0],
  //     [0, VAPOR, 0],
  //     [0, 0, 0]
  //   ],
  //   neighborhoodProbability(VAPOR, 0.0001),
  //   [
  //     [0, 0, 0],
  //     [0, WATER, 0],
  //     [0, 0, 0]
  //   ],
  // ),
  // makeRule(
  //   [
  //     [0, 0, 0],
  //     [0, EARTH, 0],
  //     [0, 0, 0]
  //   ],
  //   neighborhoodProbability(WATER, 0.001),
  //   [
  //     [0, 0, 0],
  //     [0, MUD, 0],
  //     [0, 0, 0]
  //   ],
  // ),
  // makeRule(
  //   [
  //     [0, MUD, 0],
  //     [0, EARTH, 0],
  //     [0, 0, 0]
  //   ],
  //   ROOT_GROWTHRATE,
  //   [
  //     [0, MUD, 0],
  //     [0, ROOT, 0],
  //     [0, 0, 0]
  //   ],
  // ),
  // makeRule(
  //   [
  //     [0, [MUD, EARTH, WATER, STALKS].join(''), 0],
  //     [0, GROWABLE, 0],
  //     [0, 0, 0]
  //   ],
  //   GROWTHRATE,
  //   [
  //     [0, (c => STALKS[STALKS.indexOf(c) - 1] || STALK_1), 0],
  //     [0, c => STALKS[STALKS.indexOf(c) + 1], 0],
  //     [0, 0, 0]
  //   ],
  // ),
  // makeRule(
  //   [
  //     [EMPTY, EMPTY, 0],
  //     [[EMPTY, MUD, EARTH, WATER, STALKS].join(''), GROWABLE, 0],
  //     [0, 0, 0]
  //   ],
  //   GROWTHRATE / 2,
  //   [
  //     [0, 0, 0],
  //     [(c => STALKS_H[STALKS_H.indexOf(c) - 1] || STALK_1_HORIZ), c => STALKS_H[STALKS_H.indexOf(c) + 1], 0],
  //     [0, 0, 0]
  //   ],
  // ),
];

let needsRender = true;
const simulate = () => {
  for (let y = 0; y < ROW_COUNT; y += 1) {
    for (let x = 0; x < COL_COUNT; x += 1) {
      visited[y][x] = false;
    }
  }
  coords = shuffle(coords);
  // rules = shuffle(rules);
  for (const [x, y] of coords) {
    for (const rule of shuffle(rules)) {
      rule(x, y);
    }
  }
  needsRender = true;
};

const render = () => {
  if (needsRender) {
    document.getElementById('canvas').innerHTML = canvas
      .map(row => row.join(''))
      .join('\n');
    needsRender = false;
  }
  requestAnimationFrame(render);
};

document.onclick = simulate;

let stepMS = 10000;
let interval = setInterval(simulate, Math.sqrt(stepMS));
document.getElementById('stepMS').value = '' + stepMS;
document.getElementById('stepMS').addEventListener('change', e => {
  stepMS = parseFloat(e.target.value);
  clearInterval(interval);
  interval = setInterval(simulate, Math.sqrt(stepMS));
});

requestAnimationFrame(render);

render();
