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
