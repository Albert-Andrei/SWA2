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
  match?: Match<T>;
};

type BoardItem<T> = {
  value: T;
  position: Position;
};

export type BoardListener<T> = (event: BoardEvent<T>) => void;

export class Board<T> {
  generator: Generator<T>;
  width: number;
  height: number;
  board: BoardItem<T>[][];
  matchedItems: BoardItem<T>[];
  matchedSequences: BoardItem<T>[][];
  listener: BoardListener<T>;

  constructor(generator: Generator<T>, width: number, height: number) {
    this.generator = generator;
    this.width = width;
    this.height = height;
    this.matchedItems = [];
    this.matchedSequences = [];
    this.board = [...Array(height)].map(() => [...Array(width)]);

    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        this.board[i][j] = {
          value: generator.next(),
          position: { row: i, col: j },
        };
      }
    }
  }

  addListener(listener: BoardListener<T>) {
    this.listener = listener;
  }

  piece(p: Position): T | undefined {
    return p.col > this.height || p.row > this.width || p.col < 0 || p.row < 0
      ? undefined
      : this.board[p.row][p.col]?.value;
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
      let temp = this.board[first.row][first.col].value;
      this.board[first.row][first.col].value = this.board[second.row][second.col].value;
      this.board[second.row][second.col].value = temp;

      // removes the values that were matched
      console.log(this.matchedSequences);
      this.matchedSequences
        .forEach(sequence =>
          sequence
            .forEach(boardItem => {
              let { row, col } = boardItem.position;
              this.board[row][col].value = undefined;
            }
            ));

      this.shiftTilesDown();

      let boardText = '';
      for (var i = 0; i < this.board.length; i++) {
        for (var j = 0; j < this.board[i].length; j++) {
          boardText += this.board[i][j].value + ' ';
        }
        console.log(boardText);
        boardText = '';
      }

      this.replaceTiles();
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

    let testArray: BoardItem<T>[][] = JSON.parse(JSON.stringify(this.board));

    let temp = testArray[first.row][first.col].value;
    testArray[first.row][first.col].value =
      testArray[second.row][second.col].value;
    testArray[second.row][second.col].value = temp;

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

  private emitEvent(type: 'Match' | 'Refill') {
    if (this.listener == null) {
      return;
    }

    let event: BoardEvent<T>;

    switch (type) {
      case 'Match':
        event = {
          kind: 'Match',
          match: {
            matched: this.matchedItems[0].value,
            positions: this.matchedItems.map((a) => a.position),
          },
        };
        break;
      case 'Refill':
        event = { kind: 'Match' };
        break;
      default:
        event = null;
        break;
    }

    this.listener(event);
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
        this.matchedSequences.push(matchedItems);
        this.emitEvent('Match');
      }
    });

    // if (matched >= 3) {
    //   console.log(
    //     'Validation ',
    //     array,
    //     ' result: ',
    //     matched >= 3,
    //     ' Matched Items ',
    //     this.matchedItems,
    //   );
    // }
    matchedItems = [];
    this.matchedItems = [];
    return matched >= 3;
  }

  private shiftTilesDown() {
    for (let i = this.height - 1; i > 0; i--) {
      for (let j = 0; j < this.width; j++) {
        if (this.board[i][j]?.value == undefined) {
          this.board[i][j].value = this.board[i - 1][j].value;
          this.board[i - 1][j].value = undefined;
        }
      }
    }
  }

  private replaceTiles() {
    for (let i = this.height - 1; i >= 0; i--) {
      for (let j = 0; j < this.width; j++) {
        if (this.board[i][j]?.value == undefined) {
          this.board[i][j].value = this.generator.next();
        }
      }
    }
  }
}
