export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export type Match<T> = {
  matched: T;
  positions: Position[];
};

export type BoardEvent<T> = {
  kind: 'Match' | 'Refill';
  match: Match<T>;
};

type BoardItem<T> = {
  value: T;
  position: Position;
};

export type BoardListener<T> = {};

export class Board<T> {
  generator: Generator<T>;
  width: number;
  height: number;
  board: T[][];
  matchedItems: BoardItem<T>[];

  constructor(generator: Generator<T>, width: number, height: number) {
    this.generator = generator;
    this.width = width;
    this.height = height;
    this.matchedItems = [];
    this.board = [...Array(height)].map(() => [...Array(width)]);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        this.board[i][j] = generator.next();
      }
    }
  }

  addListener(listener: BoardListener<T>) {}

  piece(p: Position): T | undefined {
    return p.col > this.height || p.row > this.width || p.col < 0 || p.row < 0
      ? undefined
      : this.board[p.row][p.col];
  }

  canMove(first: Position, second: Position): boolean {
    const sameColumn = first.col === second.col;
    const sameRow = first.col === second.col;

    if (
      !this.isValidRow(first.row) ||
      !this.isValidColumn(first.col) ||
      !this.isValidRow(second.row) ||
      !this.isValidColumn(second.col)
    ) {
      return false;
    }

    if ((sameRow && !sameColumn) || (!sameRow && sameColumn)) {
      return false;
    } else {
      return this.validateSwap(first, second);
    }
  }

  move(first: Position, second: Position) {
    if (this.canMove(first, second)) {
      let temp = this.board[first.row][first.col];
      this.board[first.row][first.col] = this.board[second.row][second.col];
      this.board[second.row][second.col] = temp;
    }
  }

  private isValidRow(index: number) {
    return index >= 0 && index < this.height;
  }

  private isValidColumn(index: number) {
    return index >= 0 && index < this.width;
  }

  private validateSwap(first: Position, second: Position) {
    const sameColumn = first.col === second.col;

    let testArray = JSON.parse(JSON.stringify(this.board));

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        testArray[i][j] = {
          value: this.piece({ row: i, col: j }),
          position: { row: i, col: j },
        };
      }
    }

    let temp = testArray[first.row][first.col];
    testArray[first.row][first.col] = testArray[second.row][second.col];
    testArray[second.row][second.col] = temp;

    if (sameColumn) {
      let columnValues = testArray.map((d) => d[first.col]);
      return (
        this.checkForMatch(testArray[first.row]) ||
        this.checkForMatch(testArray[second.row]) ||
        this.checkForMatch(columnValues)
      );
    } else {
      let firstColumn = testArray.map((d) => d[first.col]);
      let secondColumn = testArray.map((d) => d[second.col]);
      return (
        this.checkForMatch(firstColumn) ||
        this.checkForMatch(secondColumn) ||
        this.checkForMatch(testArray[first.row])
      );
    }
  }

  private checkForMatch(array: BoardItem<T>[]) {
    var count = 0,
      value: T,
      matched = 0,
      matchedItems = [];

    array.some((a) => {
      if (value !== a.value) {
        count = 0;
        value = a.value;
        matchedItems = [];
      }
      ++count;
      matchedItems.push(a);
      if (count >= 3) {
        matched = count;
        this.matchedItems = matchedItems;
      }
    });

    console.log(
      'Validation ',
      array,
      ' result: ',
      matched >= 3,
      ' Matched Items ',
      this.matchedItems,
    );
    matchedItems = [];
    this.matchedItems = [];
    return matched >= 3;
  }
}
