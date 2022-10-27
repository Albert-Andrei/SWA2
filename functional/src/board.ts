export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export type Match<T> = {
  matched: T;
  positions: Position[];
};

export type Board<T> = {
  generator: Generator<T>;
  width: number;
  height: number;
  board: T[][];
};

export type Effect<T> = {};

export type MoveResult<T> = {
  board: Board<T>;
  effects: Effect<T>[];
};

export function create<T>(
  generator: Generator<T>,
  width: number,
  height: number,
): Board<T> {
  let board = [...Array(height)].map(() => [...Array(width)]);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      board[i][j] = generator.next();
    }
  }

  return {
    generator,
    width,
    height,
    board,
  };
}

export function piece<T>(board: Board<T>, p: Position): T | undefined {
  return p.col > board.height || p.row > board.width || p.col < 0 || p.row < 0
    ? undefined
    : board.board[p.row][p.col];
}

export function canMove<T>(
  board: Board<T>,
  first: Position,
  second: Position,
): boolean {
  const sameColumn = first.col === second.col;
  const sameRow = first.col === second.col;

  if (
    !isValidRow(first.row) ||
    !isValidColumn(first.col) ||
    !isValidRow(second.row) ||
    !isValidColumn(second.col)
  ) {
    return false;
  }

  if ((sameRow && !sameColumn) || (!sameRow && sameColumn)) {
    return false;
  } else {
    return validateSwap(first, second, board.board);
  }
}

export function move<T>(
  generator: Generator<T>,
  board: Board<T>,
  first: Position,
  second: Position,
): MoveResult<T> {
  return undefined;
}

const isValidRow = (index: number) => {
  return index >= 0 && index < 4;
};

const isValidColumn = (index: number) => {
  return index >= 0 && index < 4;
};

const validateSwap = (first: Position, second: Position, board: any[][]) => {
  const sameColumn = first.col === second.col;

  let testArray = JSON.parse(JSON.stringify(board));
  let temp = testArray[first.row][first.col];
  testArray[first.row][first.col] = testArray[second.row][second.col];
  testArray[second.row][second.col] = temp;

  if (sameColumn) {
    let columnValues = testArray.map((d) => d[first.col]);

    return (
      checkForMatch(testArray[first.row]) ||
      checkForMatch(testArray[second.row]) ||
      checkForMatch(columnValues)
    );
  } else {
    let firstColumn = testArray.map((d) => d[first.col]);
    let secondColumn = testArray.map((d) => d[second.col]);

    return (
      checkForMatch(firstColumn) ||
      checkForMatch(secondColumn) ||
      checkForMatch(testArray[first.row])
    );
  }
};

const checkForMatch = (array: any[]) => {
  var count = 0,
    value = array[0],
    matched = 0;

  array.some((a) => {
    if (value !== a) {
      count = 0;
      value = a;
    }
    ++count;
    if (count >= 3) {
      matched = count;
    }
  });
  return matched >= 3;
};
