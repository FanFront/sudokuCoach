import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, generate, lessons, practiceLevels, starterPuzzle } from '../web/engine/coach.js';

import { getUniqueSolution } from '../web/engine/sudoku-core.js';
import { proofLinks } from '../web/proof.js';

const row = cell => Math.floor(cell / 9);
const col = cell => cell % 9;
const box = cell => Math.floor(row(cell) / 3) * 3 + Math.floor(col(cell) / 3);

function checkProof({ proof, candidates }) {
  for (const node of proof.nodes) assert.ok(candidates[node.cell].includes(node.digit));
  for (const { from, to, strong } of proofLinks(proof)) {
    const a = proof.nodes[from], b = proof.nodes[to];
    if (a.cell === b.cell) {
      assert.notEqual(a.digit, b.digit);
      if (strong) assert.equal(candidates[a.cell].length, 2);
    } else {
      assert.equal(a.digit, b.digit);
      const shared = [row, col, box].filter(house => house(a.cell) === house(b.cell));
      assert.ok(shared.length);
      if (strong) assert.ok(shared.some(house => candidates.filter((digits, cell) =>
        house(cell) === house(a.cell) && digits.includes(a.digit)).length === 2));
    }
    if (proof.kind === 'colour') assert.notEqual(a.colour, b.colour);
  }
  if (proof.kind === 'chain') assert.equal(proof.nodes.length % 2, 0);
}

test('import differentiates malformed, conflicting, unsolvable, ambiguous and complete puzzles', () => {
  assert.equal(analyze('1234').status, 'invalid');
  assert.equal(analyze('11' + '0'.repeat(79)).status, 'invalid');
  assert.equal(analyze('310420080000005000009680300100800096002000000806090000708001000000000003034000067').status, 'none');
  assert.equal(analyze('.'.repeat(81)).status, 'multiple');
  const { solution } = analyze(starterPuzzle);
  assert.equal(analyze(solution).status, 'unique');
  assert.equal(analyze(solution).steps.length, 0);
});

test('each drill matches the exact solver state and preserves the unique solution', () => {
  for (const lesson of lessons) {
    const puzzles = new Set();
    for (const { puzzle, stepIndex, ...example } of lesson.examples) {
      puzzles.add(puzzle);
      const result = analyze(puzzle);
      assert.equal(result.status, 'unique');
      assert.equal(example.technique, lesson.id);
      assert.deepEqual(result.steps[stepIndex], example);
      const solution = getUniqueSolution([...puzzle].map(digit => +digit || null));
      if (example.proof) checkProof(example);
      if (result.logicalComplete) assert.equal(result.solution, solution.join(''));
      assert.ok(example.focus.length && example.updates.length);
      for (const { index, digit, kind } of example.updates) {
        assert.ok(example.candidates[index].includes(digit));
        assert.equal(kind === 'place', digit === solution[index]);
      }
    }
    assert.equal(puzzles.size, lesson.practiceCount);
  }
});

test('fresh games match the advertised difficulty, with a unique logic-solvable path', () => {
  for (const [level, { technique }] of Object.entries(practiceLevels)) {
    const puzzle = generate(level, 2);
    const result = analyze(puzzle);
    assert.equal(result.status, 'unique');
    assert.equal(result.logicalComplete, true);
    if (level === 'L6') assert.ok(Number(result.difficulty.slice(1)) >= 6);
    else assert.equal(result.difficulty, level);
    assert.ok(result.steps.some(step => step.technique === technique));
  }
});

test('4×4 and 6×6 imports validate dimensions, box geometry, and replay', () => {
  const cases = [
    ['.213\n...2\n3124\n....', '4213134231242431'],
    ['600105 250406 430001 065340 500603 006250', '643125251436432561165342524613316254']
  ];
  for (const [input, solution] of cases) {
    const result = analyze(input);
    assert.equal(result.status, 'unique');
    assert.equal(result.solution, solution);
    let board = input.replace(/\s/g, '').replace(/\./g, '0');
    for (const step of result.steps) {
      assert.equal(step.board, board);
      const {index, digit} = step.updates[0];
      assert.equal(digit, Number(solution[index]));
      assert.ok(step.candidates[index].includes(digit));
      board = board.slice(0, index) + digit + board.slice(index + 1);
    }
    assert.equal(board, solution);
  }
  for (const [size, other] of [[4,5],[6,7]]) {
    assert.equal(analyze('1' + '0'.repeat(other-1) + '1' + '0'.repeat(size*size-other-1)).status, 'invalid');
    assert.equal(analyze((size+1) + '0'.repeat(size*size-1)).status, 'invalid');
    assert.equal(analyze('0'.repeat(size*size)).status, 'multiple');
  }
  assert.equal(analyze('604105250406430001065340500603006250').status, 'none');
  const advanced = analyze('003004000000005000620300450103001050');
  assert.equal(advanced.usesSearch, true);
  assert.ok(advanced.steps.some(step => step.technique === 'completion-search'));
});

test('small-grid generator supplies unique puzzles with both clue profiles', () => {
  for (const size of [4,6]) {
    for (const seed of [0, 3, 20, 100, 2147483648]) {
      const easy = generate('mini-easy', seed, size);
      const hard = generate('mini-hard', seed, size);
      assert.equal(easy.length, size * size);
      assert.equal(hard.length, size * size);
      assert.ok(easy.replace(/0/g, '').length > hard.replace(/0/g, '').length);
      for (const puzzle of [easy,hard]) assert.equal(analyze(puzzle).status,'unique');
    }
  }
});
