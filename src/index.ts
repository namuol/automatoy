import shuffle from 'lodash.shuffle';
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
const STALK_1_LEFT = '\\';
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
      Math.random() < 0.1 ? WATER : Math.random() < 0.4 ? EARTH : EMPTY;

    visited[y][x] = false;
  }
}

const pick = array => {
  return array[Math.floor(Math.random() * array.length)];
};

type Cell = 0 | string;
type Neighborhood = [
  [Cell, Cell, Cell],
  [Cell, Cell, Cell],
  [Cell, Cell, Cell]
];
type CellInput = 0 | string | ((cell: string, mainCell: string) => boolean);

type RuleInput = [
  [CellInput, CellInput, CellInput],
  [CellInput, CellInput, CellInput],
  [CellInput, CellInput, CellInput]
];

type CellOutput = 0 | string | ((cell: string, Neighborhood) => string);

type RuleOutput = [
  [CellOutput, CellOutput, CellOutput],
  [CellOutput, CellOutput, CellOutput],
  [CellOutput, CellOutput, CellOutput]
];

function makeRule(
  ruleInput: RuleInput,
  prob: number | ((cell: string, n: Neighborhood) => number),
  ruleOutput: RuleOutput,
) {
  const visitorsToCheck = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const cellOutput = ruleOutput[dy + 1][dx + 1];
      if (typeof cellOutput === 'function' || Boolean(cellOutput)) {
        visitorsToCheck.push([dx, dy]);
      }
    }
  }
  const neighborhood: Neighborhood = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  return function(x: number, y: number) {
    for (const [dx, dy] of visitorsToCheck) {
      const ox = x + dx;
      const oy = y + dy;
      if (ox < 0 || ox >= COL_COUNT || oy < 0 || oy >= ROW_COUNT) {
        return false;
      }
      if (visited[oy][ox]) {
        return false;
      }
    }

    const cell = canvas[y][x];
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const ox = x + dx;
        const oy = y + dy;
        const otherCell = (canvas[oy] || [])[ox];
        neighborhood[dy + 1][dx + 1] = otherCell || EMPTY;

        const cellMatcher = ruleInput[dy + 1][dx + 1];
        if (!cellMatcher) {
          continue;
        }

        switch (typeof cellMatcher) {
          case 'string': {
            if (!cellMatcher.includes(otherCell)) {
              return false;
            }
            break;
          }
          case 'function': {
            if (!cellMatcher(otherCell, cell)) {
              return false;
            }
            break;
          }
          default: {
            throw new TypeError('Malformed RuleInput');
          }
        }
      }
    }

    switch (typeof prob) {
      case 'number': {
        if (Math.random() >= prob) {
          return false;
        }
        break;
      }
      case 'function': {
        if (Math.random() >= prob(cell, neighborhood)) {
          return false;
        }
        break;
      }
      default: {
        throw new TypeError('Invalid probability');
      }
    }

    // If we got here, our probability hit!

    // If we got here, it's a match!
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const cellOutput = ruleOutput[dy + 1][dx + 1];
        if (!cellOutput) {
          continue;
        }

        const ox = x + dx;
        const oy = y + dy;

        canvas[oy][ox] =
          typeof cellOutput === 'string'
            ? cellOutput
            : cellOutput(canvas[oy][ox], neighborhood);
        visited[oy][ox] = true;
      }
    }
    return true;
  };
}

const GROWTHRATE = 0.01;
const ROOT_GROWTHRATE = GROWTHRATE / 50;

const CENTER = (_, n) => n[1][1];
const LEFT = (_, n) => n[1][0];
const RIGHT = (_, n) => n[1][2];
const BELOW = (_, n) => n[2][1];
const ABOVE = (_, n) => n[0][1];

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
      [0, BELOW, 0],
      [0, CENTER, 0]
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
      [CENTER, LEFT, 0],
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
      [0, RIGHT, CENTER],
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
  [EARTH]: 0.8,
  [MUD]: 0.6,
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

const rules = [
  makeFall(densities),
  makeFlow({
    [OIL]: 0.3,
    [WATER]: 0.1,
    [VAPOR]: 0.01,
    [EARTH]: 0.99,
    [MUD]: 0.99,
    [EMPTY]: 0.01,
  }),
  makeRule(
    [
      [0, 0, 0],
      [0, WATER, 0],
      [0, 0, 0]
    ],
    neighborhoodProbability(EMPTY, 0.0001),
    [
      [0, 0, 0],
      [0, VAPOR, 0],
      [0, 0, 0]
    ],
  ),
  makeRule(
    [
      [0, 0, 0],
      [0, VAPOR, 0],
      [0, 0, 0]
    ],
    neighborhoodProbability(VAPOR, 0.0001),
    [
      [0, 0, 0],
      [0, WATER, 0],
      [0, 0, 0]
    ],
  ),
  makeRule(
    [
      [0, 0, 0],
      [0, EARTH, 0],
      [0, 0, 0]
    ],
    neighborhoodProbability(WATER, 0.001),
    [
      [0, 0, 0],
      [0, MUD, 0],
      [0, 0, 0]
    ],
  ),
  makeRule(
    [
      [0, MUD, 0],
      [0, EARTH, 0],
      [0, 0, 0]
    ],
    ROOT_GROWTHRATE,
    [
      [0, MUD, 0],
      [0, ROOT, 0],
      [0, 0, 0]
    ],
  ),
  makeRule(
    [
      [0, [MUD, EARTH, WATER, STALKS].join(''), 0],
      [0, GROWABLE, 0],
      [0, 0, 0]
    ],
    GROWTHRATE,
    [
      [0, (c => STALKS[STALKS.indexOf(c) - 1] || STALK_1), 0],
      [0, c => STALKS[STALKS.indexOf(c) + 1], 0],
      [0, 0, 0]
    ],
  ),
  makeRule(
    [
      [EMPTY, EMPTY, 0],
      [[EMPTY, MUD, EARTH, WATER, STALKS].join(''), GROWABLE, 0],
      [0, 0, 0]
    ],
    GROWTHRATE / 2,
    [
      [0, 0, 0],
      [(c => STALKS_H[STALKS_H.indexOf(c) - 1] || STALK_1_HORIZ), c => STALKS_H[STALKS_H.indexOf(c) + 1], 0],
      [0, 0, 0]
    ],
  ),
];

let needsRender = true;
const simulate = () => {
  for (let y = 0; y < ROW_COUNT; y += 1) {
    for (let x = 0; x < COL_COUNT; x += 1) {
      visited[y][x] = false;
    }
  }
  coords = shuffle(coords);
  for (const [x, y] of coords) {
    for (const rule of rules) {
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

let stepMS = 1000;
let interval = setInterval(simulate, Math.sqrt(stepMS));
document.getElementById('stepMS').value = '' + stepMS;
document.getElementById('stepMS').addEventListener('change', e => {
  stepMS = parseFloat(e.target.value);
  clearInterval(interval);
  interval = setInterval(simulate, Math.sqrt(stepMS));
});

requestAnimationFrame(render);

render();
