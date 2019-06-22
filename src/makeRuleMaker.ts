// prettier-ignore
type FullTemplate<T> = [
  [T, T, T],
  [T, T, T],
  [T, T, T]
];

// prettier-ignore
type VerticalTemplate<T> = [
  [T],
  [T],
  [T],
];
// prettier-ignore
type SymmetricVerticalTemplate<T> = [
  [T],
  [T],
];

// prettier-ignore
type HorizontalTemplate<T> = [
  [T, T, T],
];
// prettier-ignore
type SymmetricHorizontalTemplate<T> = [
  [T, T],
];

type Template<T> =
  | T
  | FullTemplate<T>
  | VerticalTemplate<T>
  | SymmetricVerticalTemplate<T>
  | HorizontalTemplate<T>
  | SymmetricHorizontalTemplate<T>;

type Cell = string;
type Neighborhood = FullTemplate<Cell>;

type CellInput = 0 | string | ((cell: string, mainCell: string) => boolean);
type CellInputs = Template<CellInput>;

type CellMatcher =
  | 0
  | string
  | RegExp
  | ((cell: string, mainCell: string) => boolean);
type CellMatchers = Template<CellMatcher>;

type CellOutput = 0 | string | ((cell: string, Neighborhood) => string);
type CellOutputs = Template<CellOutput>;

export const makeRuleMaker = (
  COL_COUNT: number,
  ROW_COUNT: number,
  canvas: Cell[][],
  visited: boolean[][],
  DEFAULT_CELL: Cell
) => (
  cellInputs: CellInputs,
  prob: number | ((cell: string, n: Neighborhood) => number),
  cellOutputs: CellOutputs
) => {
  const cellMatchers: CellMatchers = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const visitorsToCheck = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const cellOutput = cellOutputs[dy + 1][dx + 1];
      if (typeof cellOutput === 'function' || Boolean(cellOutput)) {
        visitorsToCheck.push([dx, dy]);
      }
      const cellInput = cellInputs[dy + 1][dx + 1];
      cellMatchers[dy + 1][dx + 1] =
        typeof cellInput === 'string' && cellInput.length > 1
          ? new RegExp(`[${cellInput}]`)
          : cellInput;
    }
  }
  const neighborhood: Neighborhood = [
    [DEFAULT_CELL, DEFAULT_CELL, DEFAULT_CELL],
    [DEFAULT_CELL, DEFAULT_CELL, DEFAULT_CELL],
    [DEFAULT_CELL, DEFAULT_CELL, DEFAULT_CELL],
  ];
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
        neighborhood[dy + 1][dx + 1] = otherCell || DEFAULT_CELL;

        const cellMatcher = cellMatchers[dy + 1][dx + 1];
        if (!cellMatcher) {
          continue;
        }

        switch (typeof cellMatcher) {
          case 'string': {
            if (cellMatcher !== otherCell) {
              return false;
            }
            break;
          }
          case 'object': {
            // We assume regex here
            if (!cellMatcher.test(otherCell)) {
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
            throw new TypeError('Malformed CellInputs');
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
        const cellOutput = cellOutputs[dy + 1][dx + 1];
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
};
