import shuffle from 'lodash.shuffle';

// prettier-ignore
type Full_Template<T> = [
  [T, T, T],
  [T, T, T],
  [T, T, T]
];

// prettier-ignore
type Vertical_Template<T> = [
  [T],
  [T],
  [T],
];
// prettier-ignore
type SymmetricVertical_Template<T> = [
  [T],
  [T],
];

// prettier-ignore
type Horizontal_Template<T> = [
  [T, T, T],
];
// prettier-ignore
type SymmetricHorizontal_Template<T> = [
  [T, T],
];

type CellMatcher = 0 | string;
type CellValue = 0 | string;
type FuncCall = string;

// prettier-ignore
type Condition =
  | number
  | boolean
  | FuncCall;

// FIXME: Better name for this?
// prettier-ignore
type Rule =
  | [
      CellMatcher,
      CellValue,
      Condition[]?
    ]
  | [
      Full_Template<CellMatcher>,
      Full_Template<CellValue>,
      Condition[]?
    ]
  | [
      Vertical_Template<CellMatcher>,
      Vertical_Template<CellValue>,
      Condition[]?
    ]
  | [
      Horizontal_Template<CellMatcher>,
      Horizontal_Template<CellValue>,
      Condition[]?
    ]
  | [
      SymmetricVertical_Template<CellMatcher>,
      SymmetricVertical_Template<CellValue>,
      Condition[]?
    ]
  | [
      SymmetricHorizontal_Template<CellMatcher>,
      SymmetricHorizontal_Template<CellValue>,
      Condition[]?
    ];

type Layer = {
  order: string[];
  traits: {
    [traitName: string]: {
      [cell: string]: string | number;
      DEFAULT: string | number;
    };
  };
  rules: Rule[];
  compiledRules?: CompiledRule[];
};

type SimConfig = {
  layers: Layer[];
};

type Simulator = {
  layers: Array<{
    canvas: string[][];
    visited: boolean[][];
  }>;
  step: () => void;
};

function fillWith(canvas: string[][], cell: string) {
  for (let y = 0; y < canvas.length; y += 1) {
    canvas[y].fill(cell, 0, canvas[y].length);
  }
}

// TODO:
type Context = any;
type CompiledRule = (ctx: Context, x: number, y: number) => boolean;

function alwaysTrue() {
  return true;
}

function compileConditions(conditions?: Condition[]) {
  if (!conditions) {
    return alwaysTrue;
  }

  const finalConditions = [];

  for (let i = 0; i < conditions.length; i += 1) {
    const condition = conditions[i];
    if (typeof condition === 'string') {
      finalConditions[i] = new Function(
        'ctx',
        `with (ctx) {return ${condition};}`
      );
    } else {
      finalConditions[i] = condition;
    }
  }

  return (ctx: Context, x: number, y: number) => {
    for (let condition of finalConditions) {
      switch (typeof condition) {
        case 'function': {
          // yee haw 🤠
          condition = condition(ctx);
        }
        case 'boolean':
        case 'number': {
          if (condition == true) {
            continue;
          }
          if (condition == false) {
            return false;
          }
          if (Math.random() >= condition) {
            return false;
          }
          break;
        }

        default: {
          return true;
          throw new TypeError('Invalid probability' + typeof condition);
        }
      }
    }
    return true;
  };
}

const pickIndex = max => {
  return Math.floor(Math.random() * max);
};
const pick = array => {
  return array[pickIndex(array.length)];
};

const matchers = {};

function makeMatches(matcherStr) {
  if (matchers[matcherStr]) {
    return matchers[matcherStr];
  }

  let negate = false;
  let finalMatcherStr = matcherStr;
  if (matcherStr[0] === '^') {
    negate = true;
    finalMatcherStr = matcherStr.substr(1);
  }

  return matchers[matcherStr] = cell => {
    for (let cellToMatch of matcherStr) {
      if (cellToMatch === cell) {
        return !negate;
      }
    }

    return negate;
  };
}

const compileRule = (layer: Layer) => {
  const validCells = layer.order.reduce((r, cell) => {
    r[cell] = true;
    return r;
  }, {});

  return (rule: Rule): CompiledRule => {
    let [matcher, writer, conditions] = rule;
    const condition = compileConditions(conditions);

    if (typeof matcher === 'string' && typeof writer === 'string') {
      const matches = makeMatches(matcher);
      return (ctx: Context, x: number, y: number) => {
        const cell = ctx.canvas[y][x];
        if (!matches(cell) || !condition(ctx, x, y)) {
          return false;
        }

        ctx.canvas[y][x] = writer;
        return true;
      };
    }

    if (Array.isArray(matcher)) {
      const w = matcher[0].length;
      const h = matcher.length;
      let deltas = null;
      let allDeltas = null;

      let matcherCoords = null;
      let allMatcherCoords = null;

      let writerCoords = null;
      let allWriterCoords = null;

      let getters = null;
      let allGetters = null;

      const get = i => ctx => {
        const [dx, dy] = deltas[i];
        const ox = ctx.x + dx;
        if (ox < 0 || ox >= ctx.width) {
          // TODO: Find a better way to specify an "out of bounds" symbol:
          return ctx.layer.order[0];
        }
        const oy = ctx.y + dy;
        if (oy < 0 || oy >= ctx.height) {
          // TODO: Find a better way to specify an "out of bounds" symbol:
          return ctx.layer.order[0];
        }

        return ctx.canvas[oy][ox];
      };

      // Vertical pillar:
      // prettier-ignore
      if (w === 1 && h === 3) {
        deltas = [
          [0, -1],
          [0, 0],
          [0, 1]
        ];
        matcherCoords = [
          [0, 0],
          [0, 1],
          [0, 2]
        ];
        writerCoords = matcherCoords;
        getters = {
          $N: get(0),
          $C: get(1),
          $S: get(2),
        };
      }

      // Symmetric horizontal:
      // prettier-ignore
      if (w === 2 && h === 1) {
        allDeltas = [
          [[-1, 0], [0, 0]],
          [[0, 0], [1, 0]]
        ];
        allMatcherCoords = [
          [[0, 0], [1, 0]],
          [[1, 0], [0, 0]]
        ];
        allWriterCoords = allMatcherCoords;

        allGetters = [
          {
            $A: get(0),
            $B: get(1),
          },
          {
            $A: get(1),
            $B: get(0),
          },
        ];
      }

      if (
        (!deltas && !allDeltas) ||
        (!writerCoords && !allWriterCoords) ||
        (!matcherCoords && !allMatcherCoords) ||
        (!getters && !allGetters)
      ) {
        throw new TypeError('Invalid matcher');
      }

      const newCells = [];
      return (ctx: Context, x: number, y: number) => {
        if (allDeltas) {
          const i = Math.random() < 0.5 ? 0 : 1;
          deltas = allDeltas[i];
          matcherCoords = allMatcherCoords[i];
          writerCoords = allWriterCoords[i];
          getters = allGetters[i];
        }

        // ctx.deltas = deltas;
        // ctx.matcherCoords = matcherCoords;
        ctx.x = x;
        ctx.y = y;
        ctx.getters = getters;

        for (let i = 0; i < deltas.length; i += 1) {
          const [mx, my] = matcherCoords[i];
          const cellMatcher = matcher[my][mx];
          const cellWriter = writer[my][mx];
          if (!cellMatcher && !cellWriter) {
            continue;
          }

          const [dx, dy] = deltas[i];
          const ox = x + dx;
          if (ox < 0 || ox >= ctx.width) {
            return false;
          }
          const oy = y + dy;
          if (oy < 0 || oy >= ctx.height) {
            return false;
          }

          if (ctx.tick === ctx.visited[oy][ox]) {
            return false;
          }
        }

        for (let i = 0; i < deltas.length; i += 1) {
          const [mx, my] = matcherCoords[i];
          const cellMatcher = matcher[my][mx];
          if (!cellMatcher) {
            continue;
          }
          const matches = makeMatches(cellMatcher);
          const [dx, dy] = deltas[i];
          const ox = x + dx;
          const oy = y + dy;

          const otherCell = ctx.canvas[oy][ox];
          if (!matches(otherCell)) {
            return false;
          }
        }

        if (!condition(ctx, x, y)) {
          return false;
        }

        for (let i = 0; i < deltas.length; i += 1) {
          const [wx, wy] = writerCoords[i];
          let newCell = writer[wy][wx];

          if (newCell[0] === '$') {
            newCell = ctx[newCell];
          }
          newCells[i] = newCell;
        }

        for (let i = 0; i < deltas.length; i += 1) {
          if (newCells[i] === 0) {
            continue;
          }
          const [dx, dy] = deltas[i];
          const ox = x + dx;
          const oy = y + dy;

          ctx.canvas[oy][ox] = newCells[i];
          ctx.visited[oy][ox] = ctx.tick;
        }
        return true;
      };
    }

    throw new Error('Not implemented or invalid format');
  };
};

export function makeSimulator(
  config: SimConfig,
  width: number,
  height: number
): Simulator {
  for (const layer of config.layers) {
    for (const traitName in layer.traits) {
      const trait = layer.traits[traitName];
      for (const cell of layer.order) {
        trait[cell] = trait[cell] == null ? trait.DEFAULT : trait[cell];
      }
    }
  }

  const layers = config.layers.map(layer => {
    const canvas = [];
    const visited = [];
    for (let y = 0; y < height; y += 1) {
      canvas[y] = [];
      canvas[y].length = width;
      canvas[y].fill(layer.order[0], 0, width);

      visited[y] = [];
      visited[y].length = width;
      visited[y].fill(false, 0, width);
    }
    return { canvas, visited };
  });

  // "Compile" all our rules:
  for (const layer of config.layers) {
    layer.compiledRules = layer.rules.map(compileRule(layer));
  }

  let coords = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      coords.push([x, y]);
    }
  }

  let ctx = {
    config,
    layers,
    canvas: null,
    visited: null,
    layer: null,
    width,
    height,
    tick: true,
    getters: null,
    x: 0,
    y: 0,
    get $A() {
      return ctx.getters.$A(ctx);
    },
    get $B() {
      return ctx.getters.$B(ctx);
    },
    get $NW() {
      return ctx.getters.$NW(ctx);
    },
    get $N() {
      return ctx.getters.$N(ctx);
    },
    get $NE() {
      return ctx.getters.$NE(ctx);
    },
    get $W() {
      return ctx.getters.$W(ctx);
    },
    get $C() {
      return ctx.getters.$C(ctx);
    },
    get $E() {
      return ctx.getters.$E(ctx);
    },
    get $SW() {
      return ctx.getters.$SW(ctx);
    },
    get $S() {
      return ctx.getters.$S(ctx);
    },
    get $SE() {
      return ctx.getters.$SE(ctx);
    },
    COUNT: matcher => {
      const matches = makeMatches(matcher);
      const { x, y } = ctx;
      let count = 0;
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          if (!ctx.canvas[y + dy]) {
            continue;
          }

          if (matches(ctx.canvas[y + dy][x + dx])) {
            count += 1;
          }
        }
      }
      return count;
    },
  };
  const step = () => {
    ctx.tick = !ctx.tick;
    coords = shuffle(coords);
    let i = 0;
    for (const layer of config.layers) {
      const { canvas, visited } = layers[i];
      for (let y = 0; y < height; y += 1) {
        visited[y].fill(false, 0, width);
      }
      ctx.layer = layer;
      for (const traitName in ctx.layer.traits) {
        ctx[traitName] = ctx.layer.traits[traitName];
      }
      ctx.canvas = canvas;
      ctx.visited = visited;
      for (const [x, y] of coords) {
        ctx.x = x;
        ctx.y = y;
        for (const rule of layer.compiledRules) {
          if (rule(ctx, x, y)) {
            break;
          }
        }
      }
      i += 1;
    }
  };

  return {
    layers,
    step,
  };
}
