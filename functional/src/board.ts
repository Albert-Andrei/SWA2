export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export type Match<T> = {
  matched: T;
  positions: Position[];
};

type BoardItem<T> = {
  value: T;
  position: Position;
};

export type Board<T> = {
  generator: Generator<T>;
  width: number;
  height: number;
  board: BoardItem<T>[][];
};

export type Effect<T> = {
  kind: 'Match' | 'Refill';
  match?: Match<T>;
  board?: Board<T>;
};

export type MoveResult<T> = {
  board: Board<T>;
  effects: Effect<T>[];
};

let matchedItems: BoardItem<any>[] = [];
let matchedSequences: BoardItem<any>[][] = [];
let effects: Effect<any>[] = [];

export function create<T>(
  generator: Generator<T>,
  width: number,
  height: number,
): Board<T> {
  let board = [...Array(height)].map(() => [...Array(width)]);
  effects = [];
  matchedSequences = [];

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
    !isValidRow(first.row, board) ||
    !isValidColumn(first.col, board) ||
    !isValidRow(second.row, board) ||
    !isValidColumn(second.col, board)
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
  if (canMove(board, first, second)) {
    let temp = board.board[first.row][first.col].value;
    board.board[first.row][first.col].value =
      board.board[second.row][second.col].value;
    board.board[second.row][second.col].value = temp;

    addEffect('Refill');

    matchedSequences.forEach((sequence) =>
      sequence.forEach((boardItem) => {
        let { row, col } = boardItem.position;
        board.board[row][col].value = undefined;
      }),
    );

    shiftTilesDownAndReplace(board);
    return {
      board,
      effects,
    };
  }

  effects = [];
  return {
    board,
    effects,
  };
}

const isValidRow = <T>(index: number, board: Board<T>) => {
  return index >= 0 && index < board.height;
};

const isValidColumn = <T>(index: number, board: Board<T>) => {
  return index >= 0 && index < board.width;
};

const addEffect = <T>(type: 'Match' | 'Refill', board?: Board<T>) => {
  let effect: Effect<T>;

  switch (type) {
    case 'Match':
      effect = {
        kind: 'Match',
        match: {
          matched: matchedItems[0].value,
          positions: matchedItems.map((a) => a.position),
        },
      };
      break;
    case 'Refill':
      effect = { kind: 'Refill' };
      break;
    default:
      effect = null;
      break;
  }

  effects.push(effect);
};

const validateSwap = <T>(
  first: Position,
  second: Position,
  board: BoardItem<T>[][],
) => {
  const sameColumn = first.col === second.col;

  let testArray: BoardItem<T>[][] = JSON.parse(JSON.stringify(board));
  let temp = testArray[first.row][first.col].value;
  testArray[first.row][first.col].value =
    testArray[second.row][second.col].value;
  testArray[second.row][second.col].value = temp;

  if (sameColumn) {
    let columnValues = testArray.map((d) => d[first.col]);

    let matchedFirstRow = checkForMatch(testArray[first.row]);
    let matchedSecondRow = checkForMatch(testArray[second.row]);
    let matchedColumn = checkForMatch(columnValues);

    return matchedFirstRow || matchedSecondRow || matchedColumn;
  } else {
    let firstColumn = testArray.map((d) => d[first.col]);
    let secondColumn = testArray.map((d) => d[second.col]);

    let matchedRow = checkForMatch(testArray[first.row]);
    let matchedFirstCol = checkForMatch(firstColumn);
    let matchedSecondRCol = checkForMatch(secondColumn);

    return matchedFirstCol || matchedSecondRCol || matchedRow;
  }
};

const checkForMatch = <T>(array: BoardItem<T>[]) => {
  var count = 0,
    value: T,
    matched = 0,
    matchedLocalItems = [];

  array.some((a) => {
    if (value !== a.value) {
      count = 0;
      value = a.value;
      matchedLocalItems = [];
    }
    ++count;
    matchedLocalItems.push(a);
    if (count >= 3) {
      matched = count;
      matchedItems = [...matchedLocalItems];
      matchedSequences.push(matchedItems);
      addEffect('Match');
    }
  });

  matchedLocalItems = [];
  matchedItems = [];
  return matched >= 3;
};

const shiftTilesDownAndReplace = <T>(board: Board<T>) => {
  for (let row = board.height - 1; row >= 0; row--) {
    for (let col = 0; col < board.width; col++) {
      // go through the board from down/up and left/right
      if (board.board[row][col].value == undefined) {
        let columnValues = board.board.map((d) => d[col].value);

        // get values in the column and add a new value in place
        // at the index that it was removed
        let firstNonUndef = columnValues.findIndex((el) => el != undefined);
        columnValues.splice(firstNonUndef, 0, board.generator.next());
        columnValues = columnValues.filter((element) => {
          return element !== undefined;
        });

        // populate column back
        for (let tempRow = board.height - 1; tempRow >= 0; tempRow--) {
          let valueToPush = columnValues.pop();
          board.board[tempRow][col].value = valueToPush;
        }
      }
    }
  }
};

const printBoard = <T>(board: Board<T>) => {
  let boardText = '';
  console.log('------------');
  for (var i = 0; i < board.board.length; i++) {
    for (var j = 0; j < board.board[i].length; j++) {
      boardText += board.board[i][j].value + ' ';
    }
    console.log(boardText);
    boardText = '';
  }
  console.log('------------');
};
