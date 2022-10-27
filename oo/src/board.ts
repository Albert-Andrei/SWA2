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

export type BoardListener<T> = {};

export class Board<T> {
  generator: Generator<T>;
  width: number;
  height: number;
  board: T[][];

  constructor(generator: Generator<T>, width: number, height: number) {
    this.generator = generator;
    this.width = width;
    this.height = height;
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
      sameColumn &&
      (first.row + 1 === second.row || first.row - 1 === second.row)
    ) {
      return true;
    } else if (
      sameRow &&
      (first.col + 1 === second.col || first.col - 1 === second.col)
    ) {
      return true;
    } else {
      return false;
    }
  }

  move(first: Position, second: Position) {
    if (this.canMove(first, second)) {
    }
  }
}
