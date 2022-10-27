type Position = {
  row: number;
  col: number;
};

const points = [
  ['A', 'B', 'A', 'C'],
  ['D', 'C', 'A', 'C'],
  ['D', 'A', 'D', 'D'],
  ['C', 'C', 'D', 'C'],
];

console.log('Initial ', [
  ['A', 'B', 'A', 'C'],
  ['D', 'C', 'A', 'C'],
  ['D', 'A', 'D', 'D'],
  ['C', 'C', 'D', 'C'],
]);

const canMove = (first: Position, second: Position): boolean => {
  const sameColumn = first.col === second.col;
  const sameRow = first.col === second.col;

  console.log('First');

  if (
    !isValidRow(first.row) ||
    !isValidColumn(first.col) ||
    !isValidRow(second.row) ||
    !isValidColumn(second.col)
  ) {
    return false;
  }

  console.log('Second ', (sameRow && !sameColumn) || (!sameRow && sameColumn));

  if ((sameRow && !sameColumn) || (!sameRow && sameColumn)) {
    return false;
  } else {
    return validateSwap(first, second);
  }
};

const isValidRow = (index: number) => {
  return index >= 0 && index < 4;
};

const isValidColumn = (index: number) => {
  return index >= 0 && index < 4;
};

const validateSwap = (first: Position, second: Position) => {
  const sameColumn = first.col === second.col;

  let testArray = JSON.parse(JSON.stringify(points));
  let temp = testArray[first.row][first.col];
  testArray[first.row][first.col] = testArray[second.row][second.col];
  testArray[second.row][second.col] = temp;

  console.log('TEST ', testArray);

  if (sameColumn) {
    console.log('Column TEST ');
    let columnValues = testArray.map((d) => d[first.col]);

    checkForMatch(testArray[first.row]);
    checkForMatch(testArray[second.row]);
    checkForMatch(columnValues);

    return (
      checkForMatch(testArray[first.row]) ||
      checkForMatch(testArray[second.row]) ||
      checkForMatch(columnValues)
    );
  } else {
    console.log('Row TEST ');
    let firstColumn = testArray.map((d) => d[first.col]);
    let secondColumn = testArray.map((d) => d[second.col]);

    checkForMatch(firstColumn);
    checkForMatch(secondColumn);
    checkForMatch(testArray[first.row]);

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
      console.log('Matched', matched);
    }
  });
  console.log('Validation ', array, ' result: ', matched >= 3);
  return matched >= 3;
};

// console.log('Final <><><><>', canMove({ row: 2, col: 1 }, { row: 0, col: 1 }));
// console.log('Final <><><><>', canMove({ row: 0, col: 1 }, { row: 2, col: 1 }));
console.log('Final <><><><>', canMove({ row: 2, col: 3 }, { row: 3, col: 3 }));
