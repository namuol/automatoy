import shuffle from 'lodash.shuffle';
const ROW_COUNT = 30;
const COL_COUNT = 30;

const WATER = '~';
const VAPOR = '.';
const OIL = '@';
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
      Math.random() < 0.2 ? WATER : Math.random() < 0.0 ? EARTH : EMPTY;

    visited[y][x] = false;
  }
}

function fall(x, y, cell) {
  if (y + 1 >= ROW_COUNT || visited[y][x]) {
    return false;
  }

  const belowCell = canvas[y + 1][x];

  if (densities[cell] > densities[belowCell]) {
    canvas[y + 1][x] = cell;
    canvas[y][x] = belowCell;
    visited[y + 1][x] = true;
    visited[y][x] = true;
    return true;
  }

  return false;
}
const flow = viscocity => (x, y, cell) => {
  if (
    y === 0 ||
    y + 1 >= ROW_COUNT ||
    visited[y][x] ||
    Math.random() < viscocity
  ) {
    return;
  }

  if (densities[canvas[y + 1][x]] >= densities[cell]) {
    const xo = Math.random() < 0.5 ? 1 : -1;
    const otherCellA = canvas[y][x + xo];
    const otherCellB = canvas[y][x + xo * -1];
    if (
      densities[cell] > densities[otherCellA] &&
      !visited[y][x + xo] &&
      !visited[y][x]
    ) {
      canvas[y][x + xo] = cell;
      canvas[y][x] = otherCellA;
      visited[y][x + xo] = true;
      visited[y][x] = true;
      return true;
    } else if (
      densities[cell] > densities[otherCellB] &&
      !visited[y][x + xo * -1] &&
      !visited[y][x]
    ) {
      canvas[y][x + xo * -1] = cell;
      canvas[y][x] = otherCellB;
      visited[y][x + xo * -1] = true;
      visited[y][x] = true;
      return true;
    }
  }
};

function evaporateInto(cell, prob, x, y, otherCell = EMPTY) {
  if (visited[y][x]) {
    return false;
  }

  let probScale = 0.0;
  if ((canvas[y - 1] || [])[x] === otherCell) {
    probScale += 0.25;
  }
  if ((canvas[y + 1] || [])[x] === otherCell) {
    probScale += 0.25;
  }
  if (canvas[y][x - 1] === otherCell) {
    probScale += 0.25;
  }
  if (canvas[y][x + 1] === otherCell) {
    probScale += 0.25;
  }

  if (Math.random() < prob * probScale) {
    canvas[y][x] = cell;
    visited[y][x] = true;
    return true;
  }

  return false;
}

function condenseInto(otherCell, prob, x, y) {
  if (visited[y][x]) {
    return false;
  }

  const cell = canvas[y][x];

  let probScale = 0.0;
  if ((canvas[y - 1] || [])[x] === cell) {
    probScale += 0.25;
  }
  if ((canvas[y + 1] || [])[x] === cell) {
    probScale += 0.25;
  }
  if (canvas[y][x - 1] === cell) {
    probScale += 0.25;
  }
  if (canvas[y][x + 1] === cell) {
    probScale += 0.25;
  }

  if (Math.random() < prob * probScale) {
    canvas[y][x] = otherCell;
    visited[y][x] = true;
    return true;
  }

  return false;
}

const UP = [0, -1];
const UP_LEFT = [[-1, -1]];
const UP_RIGHT = [[1, -1]];
const MOSTLY_UPWARDS = [
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  UP,
  LEFT,
  RIGHT,
];

const pick = array => {
  return array[Math.floor(Math.random() * array.length)];
};

function growInto(
  cellToGrowInto,
  cellToGrowToward,
  cellToReplaceWith,
  direction,
  prob,
  x,
  y,
) {
  if (visited[y][x]) {
    return false;
  }

  let [dx, dy] = pick(direction);
  if (dx.length) {
    dx = pick(dx);
  }
  if (dy.length) {
    dy = pick(dy);
  }

  if (x + dx >= COL_COUNT || x + dx < 0 || y + dy >= ROW_COUNT || y + dy < 0) {
    return false;
  }

  if (visited[y + dy][x + dx]) {
    return false;
  }

  const cellTowardDirection = canvas[y + dy][x + dx];
  if (cellToGrowToward !== cellTowardDirection) {
    return false;
  }

  if (Math.random() < prob) {
    canvas[y + dy][x + dx] =
      cellToGrowInto === STALK_1
        ? dx < 0
          ? STALK_1_LEFT
          : dx > 0
          ? STALK_1_RIGHT
          : cellToGrowInto
        : cellToGrowInto;
    canvas[y][x] = cellToReplaceWith;
    visited[y + dy][x + dx] = true;
    visited[y][x] = true;
    return true;
  }
  return false;
}

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
  prob: number | ((cell: string, Neighborhood) => number),
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
  const neighborhood = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
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

const flows = {
  [OIL]: flow(0.3),
  [WATER]: flow(0.1),
  [EMPTY]: flow(0.01),
  [VAPOR]: flow(0.01),
  [ROCK]: () => {},
  [EARTH]: flow(0.99),
  [MUD]: flow(0.99),
};

const densities = {
  [VAPOR]: 0.008,
  [EMPTY]: 0.01,
  [OIL]: 0.3,
  [WATER]: 0.5,
  [ROCK]: Infinity,
  [EARTH]: 0.8,
  [MUD]: 0.6,
  [STALK_8]: Infinity,
  [STALK_7]: Infinity,
  [STALK_6]: Infinity,
  [STALK_5]: Infinity,
  [STALK_4]: Infinity,
  [STALK_3]: Infinity,
  [STALK_2]: Infinity,
  [STALK_1]: Infinity,
  [STALK_1_LEFT]: Infinity,
  [STALK_1_RIGHT]: Infinity,
};

const GROWTHRATE = 0.01;
const MUD_GROWTHRATE = GROWTHRATE / 10;

const CENTER = (_, n) => n[1][1];
const LEFT = (_, n) => n[1][0];
const RIGHT = (_, n) => n[1][2];
const BELOW = (_, n) => n[2][1];

function makeFall(densities) {
  const canFall = Object.keys(densities).join('');
  const LESS_DENSE = (c, o) => densities[c] < densities[o];

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
  const LESS_DENSE = (c, o) => densities[c] <= densities[o];
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
      [CENTER, (_, n) => n[1][0], 0],
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

const rules = [
  makeFlow({
    [OIL]: 0.3,
    [WATER]: 0.1,
    [VAPOR]: 0.01,
    [ROCK]: () => {},
    [EARTH]: 0.99,
    [MUD]: 0.99,
  }),
  makeFall(densities),
];

// const FUNCS = {
//   [WATER]: (x, y) => {
//     for (const rule of waterRules) {
//       rule(x, y);
//     }
//   },
//   [MUD]: () => {},
//   [EMPTY]: () => {},
//   [EARTH]: () => {},
//   // [OIL]: (x, y, cell) => {
//   //   fall(x, y, cell) || flows[OIL](x, y, cell);
//   // },
//   // [WATER]: (x, y, cell) => {
//   //   evaporateInto(VAPOR, 0.002, x, y) ||
//   //     fall(x, y, cell) ||
//   //     flows[WATER](x, y, cell);
//   // },
//   // [EMPTY]: (x, y, cell) => {
//   //   fall(x, y, cell) || flows[EMPTY](x, y, cell);
//   // },
//   // [VAPOR]: (x, y, cell) => {
//   //   condenseInto(WATER, 0.0005, x, y) ||
//   //     fall(x, y, cell) ||
//   //     flows[VAPOR](x, y, cell);
//   // },
//   // [ROCK]: (x, y, cell) => {
//   //   evaporateInto(EARTH, 0.0001, x, y, VAPOR) ||
//   //     evaporateInto(EARTH, 0.01, x, y, EARTH);
//   // },
//   // [EARTH]: (x, y, cell) => {
//   //   evaporateInto(MUD, 0.01, x, y, WATER) ||
//   //     evaporateInto(MUD, 0.001, x, y, MUD) ||
//   //     evaporateInto(ROOT, 0.0001, x, y, MUD) ||
//   //     fall(x, y, cell) ||
//   //     flows[EARTH](x, y, cell);
//   // },
//   // [MUD]: (x, y, cell) => {
//   //   evaporateInto(EARTH, 0.01, x, y, STALK_1) ||
//   //     fall(x, y, cell) ||
//   //     flows[MUD](x, y, cell);
//   // },
//   // [ROOT]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_8, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_8, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_8, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_5, STALK_4, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_6, STALK_5, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_7, STALK_6, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_8, STALK_7, STALK_8, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_8]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_7, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_7, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_7, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_5, STALK_4, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_6, STALK_5, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_7, STALK_6, STALK_7, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_7]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_6, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_6, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_6, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_5, STALK_4, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_6, STALK_5, STALK_6, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_6]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_5, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_5, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_5, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_5, STALK_4, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_6, STALK_5, STALK_5, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_5]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_4, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_4, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_4, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_4, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_4, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_4, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_4, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_5, STALK_4, STALK_4, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_4]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_3, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_3, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_3, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_3, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_3, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_3, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_4, STALK_3, STALK_3, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_3]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_2, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_2, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_2, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_2, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_2, UP_RIGHT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_3, STALK_2, STALK_2, MOSTLY_UPWARDS, GROWTHRATE, x, y);
//   // },
//   // [STALK_2]: (x, y) => {
//   //   growInto(STALK_1, WATER, STALK_1, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_1, MUD, STALK_1, MOSTLY_UPWARDS, MUD_GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1, STALK_1, MOSTLY_UPWARDS, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_LEFT, STALK_1, UP_LEFT, GROWTHRATE, x, y) ||
//   //     growInto(STALK_2, STALK_1_RIGHT, STALK_1, UP_RIGHT, GROWTHRATE, x, y);
//   // },
//   // [STALK_1]: (x, y) => {
//   //   // growInto(ROOT, EARTH, MUD, DOWN_DIAG, GROWTHRATE, x, y);
//   // },
//   // [STALK_1_LEFT]: (x, y) => {},
//   // [STALK_1_RIGHT]: (x, y) => {},
// };

let needsRender = true;
const simulate = () => {
  for (let y = 0; y < ROW_COUNT; y += 1) {
    for (let x = 0; x < COL_COUNT; x += 1) {
      visited[y][x] = false;
    }
  }
  coords = shuffle(coords);
  for (const [x, y] of coords) {
    // const cell = canvas[y][x];
    // FUNCS[cell](x, y, cell);
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
