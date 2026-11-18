import assert from 'node:assert/strict';
import test from 'node:test';
import { analyze, generate, lessons, practiceLevels, starterPuzzle } from '../web/engine/coach.js';

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
      assert.ok(example.focus.length && example.updates.length);
      for (const { index, digit, kind } of example.updates) {
        assert.ok(example.candidates[index].includes(digit));
        assert.equal(kind === 'place', digit === Number(result.solution[index]));
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
