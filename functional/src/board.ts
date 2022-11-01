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
  board: BoardItem<T>[][];
};

type BoardItem<T> = {
  value: T;
  position: Position;
};

let matchedItems: BoardItem<any>[] = [];

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
      board[i][j] = {
        value: generator.next(),
        position: { row: i, col: j },
      };
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
    : board.board[p.row][p.col]?.value;
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
    return validateSwap(first, second, board);
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

const validateSwap = (first: Position, second: Position, board: Board<any>) => {
  const sameColumn = first.col === second.col;

  let testArray = JSON.parse(JSON.stringify(board.board));
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

const checkForMatch = <T>(array: BoardItem<any>[]) => {
  var count = 0,
    value: T,
    matched = 0,
    matchedItemsLocal = [];

  array.some((a) => {
    if (value !== a.value) {
      count = 0;
      value = a.value;
      matchedItemsLocal = [];
    }
    ++count;
    matchedItemsLocal.push(a);
    if (count >= 3) {
      matched = count;
      matchedItems = [...matchedItemsLocal];
      // emitEvent('Match');
    }
  });

  matchedItemsLocal = [];
  matchedItems = [];
  return matched >= 3;
};
