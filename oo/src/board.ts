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

    // Initializing the board. Adding the value and the coordinates of it's position
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

      this.refillMatched();

      this.checkBoardMatches();
    }
  }

  // Local functions

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

    // Create a copy of existing board to check if the swap will result in a match
    let testArray: BoardItem<T>[][] = JSON.parse(JSON.stringify(this.board));

    // Swapping the values
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

      let matchedRow = this.checkForMatch(testArray[first.row]);
      let matchedFirstCol = this.checkForMatch(firstColumn);
      let matchedSecondRCol = this.checkForMatch(secondColumn);

      return matchedFirstCol || matchedSecondRCol || matchedRow;
    }
  }

  private checkBoardMatches() {
    let matched = false;
    this.matchedSequences = [];

    // Check if there are matches in rows
    this.board.forEach((row) => {
      if (this.checkForMatch(row)) {
        matched = true;
      }
    });

    // Check if there are matches in columns
    [...Array(this.width)].map((item, index) => {
      let testColumn = this.board.map((d) => d[index]);
      if (this.checkForMatch(testColumn)) {
        matched = true;
      }
    });

    if (!matched) {
      return;
    }

    this.refillMatched();

    // Calling this function to check again if there are any matches after refilling
    this.checkBoardMatches();
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

    matchedItems = [];
    this.matchedItems = [];
    return matched >= 3;
  }

  private refillMatched() {
    // removes the values that were matched
    this.matchedSequences.forEach((sequence) =>
      sequence.forEach((boardItem) => {
        let { row, col } = boardItem.position;
        this.board[row][col].value = undefined;
      }),
    );

    this.emitEvent('Refill');

    this.shiftTilesDownAndReplace();
  }

  private shiftTilesDownAndReplace() {
    for (let row = this.height - 1; row >= 0; row--) {
      for (let col = 0; col < this.width; col++) {
        // go through the board from down/up and left/right
        if (this.board[row][col].value == undefined) {
          let columnValues = this.board.map((d) => d[col].value);

          // get values in the column and add a new value in place
          // at the index that it was removed
          let firstNonUndef = columnValues.findIndex((el) => el != undefined);
          columnValues.splice(firstNonUndef, 0, this.generator.next());
          columnValues = columnValues.filter((element) => {
            return element !== undefined;
          });

          // populate column back
          for (let tempRow = this.height - 1; tempRow >= 0; tempRow--) {
            let valueToPush = columnValues.pop();
            this.board[tempRow][col].value = valueToPush;
          }
        }
      }
    }
  }

  private printBoard() {
    let boardText = '';
    console.log('------------');
    for (var i = 0; i < this.board.length; i++) {
      for (var j = 0; j < this.board[i].length; j++) {
        boardText += this.board[i][j].value + ' ';
      }
      console.log(boardText);
      boardText = '';
    }
    console.log('------------');
  }
}
