function format(size, boxRows, boxCols) {
  const row = cell => Math.floor(cell / size);
  const col = cell => cell % size;
  const box = cell => Math.floor(row(cell) / boxRows) * (size / boxCols) + Math.floor(col(cell) / boxCols);
  const units = [row, col, box].flatMap(group =>
    Array.from({length: size}, (_, index) =>
      Array.from({length: size * size}, (_, cell) => cell).filter(cell => group(cell) === index)));
  const peers = (a, b) => row(a) === row(b) || col(a) === col(b) || box(a) === box(b);
  return {size, boxRows, boxCols, row, col, box, units, peers};
}

export const gridFormats = {4: format(4, 2, 2), 6: format(6, 2, 3), 9: format(9, 3, 3)};
export const gridFor = puzzle => gridFormats[Math.sqrt(puzzle.length)];
export const puzzleText = text => typeof text === 'string' ? text.replace(/\s/g, '').replace(/\./g, '0') : '';
