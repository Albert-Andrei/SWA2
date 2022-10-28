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
  listener: BoardListener<T>;

  constructor(generator: Generator<T>, width: number, height: number) {
    this.generator = generator;
    this.width = width;
    this.height = height;
    this.matchedItems = [];
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
      this.board[first.row][first.col].value =
        this.board[second.row][second.col].value;
      this.board[second.row][second.col].value = temp;
    }
  }

  private isValidRow(index: number) {
    return index >= 0 && index < this.height;
  }

  private isValidColumn(index: number) {
    return index >= 0 && index < this.width;
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
        event = { kind: 'Refill' };
        break;
      default:
        event = null;
        break;
    }
    this.listener(event);
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
      let matchedFirstRow = this.checkForMatch(testArray[first.row]);
      let matchedSecondRow = this.checkForMatch(testArray[second.row]);
      let matchedColumn = this.checkForMatch(columnValues);

      return matchedFirstRow || matchedSecondRow || matchedColumn;
    } else {
      let firstColumn = testArray.map((d) => d[first.col]);
      let secondColumn = testArray.map((d) => d[second.col]);

      let matchedFirstCol = this.checkForMatch(firstColumn);
      let matchedSecondRCol = this.checkForMatch(secondColumn);
      let matchedRow = this.checkForMatch(testArray[first.row]);

      return matchedFirstCol || matchedSecondRCol || matchedRow;
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
        console.log('Here', {
          value: this.matchedItems[0].value,
          items: this.matchedItems,
        });
        this.emitEvent('Match');
      }
    });

    if (matched >= 3) {
      // console.log(
      //   'Validation ',
      //   array,
      //   ' result: ',
      //   matched >= 3,
      //   ' Matched Items ',
      //   this.matchedItems,
      // );
    }
    matchedItems = [];
    this.matchedItems = [];
    return matched >= 3;
  }
}
