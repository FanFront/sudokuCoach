import assert from 'node:assert/strict';
import test from 'node:test';
import { changeColour, changeLink, emptyDrawing, removeCandidates } from '../web/play-state.js';

test('batch removal affects only selected empty cells containing the digit', () => {
  const game = {
    board: '0010',
    notes: [[3, 8], [], [3], [3]],
    removed: [[], [8], [], []]
  };
  const available = [[3, 8], [3], [], [3]];
  assert.equal(removeCandidates(game, [0, 1, 2], 3, available), true);
  assert.deepEqual(game.notes, [[8], [], [3], [3]]);
  assert.deepEqual(game.removed, [[3], [8, 3], [], []]);
  assert.equal(removeCandidates(game, [0, 1, 2], 3, available), false);
});

test('manual drawings toggle colours and links, including a link drawn in reverse', () => {
  const drawing = emptyDrawing();
  const start = {cell: 0, digit: 1}, end = {cell: 1, digit: 1};
  changeColour(drawing, start, 'blue');
  assert.equal(drawing.colours[1], 'blue');
  changeColour(drawing, start, 'blue');
  assert.deepEqual(drawing.colours, {});
  changeLink(drawing, start, end, true);
  changeLink(drawing, end, start, false);
  assert.deepEqual(drawing.links, [{from:start,to:end,strong:false}]);
  changeLink(drawing, end, start, false);
  changeLink(drawing, start, start, false);
  assert.deepEqual(drawing.links, []);
});
