import { gridFor, gridFormats } from './grid.js';
import { miniPuzzles } from '../data/mini-puzzles.js';
import { miniTechniques } from './mini-techniques.js';

export const miniLevels = {
  'mini-easy': { name:'更多已知数' },
  'mini-hard': { name:'更少已知数' }
};

export const miniLevelsFor = size => size===6
  ? {...miniLevels, 'mini-technique':{name:'技巧挑战'}}
  : miniLevels;

function setup(text, grid) {
  const {size, row, col, box} = grid;
  const board = [...text].map(Number);
  if (!new RegExp(`^[0-${size}]{${size * size}}$`).test(text)) throw new Error('题面有超出范围的数字');
  const groups = [row, col, box];
  const used = groups.map(() => new Array(size).fill(0));
  const all = (1 << size) - 1;
  const masks = (cell) => groups.map(group => group(cell));
  const bit = digit => 1 << (digit - 1);

  function candidates(cell) {
    if (board[cell]) return [];
    const occupied = masks(cell).reduce((mask, index, group) => mask | used[group][index], 0);
    return Array.from({length:size}, (_, i) => i + 1).filter(digit => (all & ~occupied & bit(digit)) !== 0);
  }
  function set(cell, digit) {
    const old = board[cell];
    masks(cell).forEach((index, group) => {
      if (old) used[group][index] &= ~bit(old);
      if (digit) used[group][index] |= bit(digit);
    });
    board[cell] = digit;
  }

  board.fill(0);
  for (const [cell, char] of [...text].entries()) {
    const digit = Number(char);
    if (!digit) continue;
    if (!candidates(cell).includes(digit)) throw new Error('已知数重复');
    set(cell, digit);
  }
  return {board, candidates, set};
}

export function miniCandidates(text) {
  const state = setup(text, gridFor(text));
  return state.board.map((_, cell) => state.candidates(cell));
}

function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function search(state, limit, random) {
  const solutions = [];
  function visit() {
    let best = -1;
    let options = null;
    for (const [cell, digit] of state.board.entries()) {
      if (digit) continue;
      const candidates = state.candidates(cell);
      if (!candidates.length) return;
      if (!options || candidates.length < options.length) {
        best = cell;
        options = candidates;
        if (options.length === 1) break;
      }
    }
    if (best < 0) {
      solutions.push(state.board.join(''));
      return;
    }
    if (random) shuffle(options, random);
    for (const digit of options) {
      state.set(best, digit);
      visit();
      state.set(best, 0);
      if (solutions.length >= limit) return;
    }
  }
  visit();
  return solutions;
}

export function analyzeMini(text, grid) {
  const empty = {difficulty:null, steps:[], solution:null, logicalComplete:false};
  let state;
  try { state = setup(text, grid); }
  catch { return {...empty, status:'invalid'}; }
  const [solution, second] = search(state, 2);
  if (!solution || second) return {...empty, status:second ? 'multiple' : 'none'};

  const steps = [];
  const deductions = state.board.map(() => []);
  let usesSearch = false;
  while (state.board.includes(0)) {
    const board = state.board.join('');
    const candidates = state.board.map((_, cell) => state.candidates(cell).filter(digit => !deductions[cell].includes(digit)));
    let cell = candidates.findIndex(list => list.length === 1);
    let digit, technique, title, clue, reason, region;
    if (cell >= 0) {
      digit = candidates[cell][0];
      technique = 'naked-single';
      title = '显性唯一数';
      region = [...new Set(grid.units.filter(unit => unit.includes(cell)).flat())];
      clue = '看这个格子所在的行、列和宫。';
      reason = `这个格子只剩候选 ${digit}，所以可以填入 ${digit}。`;
    } else {
      for (const unit of grid.units) {
        digit = Array.from({length:grid.size}, (_, i) => i + 1).find(value =>
          unit.filter(index => candidates[index].includes(value)).length === 1);
        if (!digit) continue;
        cell = unit.find(index => candidates[index].includes(digit));
        region = unit;
        technique = 'hidden-single';
        title = '隐性唯一数';
        clue = `观察这个单元中候选 ${digit} 可以出现的位置。`;
        reason = `这个单元只有标出的格子能放 ${digit}，所以在此填入 ${digit}。`;
        break;
      }
    }
    if (cell < 0) {
      let elimination;
      for (const find of Object.values(miniTechniques)) {
        elimination = find(candidates,grid);
        if (elimination) break;
      }
      if (elimination) {
        steps.push({board,candidates,...elimination});
        for(const {index,digit} of elimination.updates) deductions[index].push(digit);
        continue;
      }
      usesSearch = true;
      cell = candidates.findIndex(list => list.length > 0);
      digit = Number(solution[cell]);
      technique = 'completion-search';
      title = '搜索验证';
      region = [cell];
      clue = '逐个检查这个格子的候选是否能完成全盘。';
      reason = `搜索验证后，只有填 ${digit} 才存在满足行、列和宫规则的完整解。`;
    }
    steps.push({board,candidates,technique,title,focus:[cell],region,digits:[digit],updates:[{index:cell,digit,kind:'place'}],clue,reason});
    state.set(cell, digit);
  }
  return {...empty, status:'unique', solution, steps, logicalComplete:true, usesSearch};
}

export function generateMini(size, level, seed) {
  const grid = gridFormats[size];
  if (!grid || size === 9 || !Object.hasOwn(miniLevelsFor(size), level)) throw new RangeError('未知规格或难度');
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
  if (level === 'mini-technique') {
    const puzzles = [...new Set(Object.values(miniPuzzles[6]).flat())];
    const puzzle = puzzles[Math.floor(random() * puzzles.length)];
    const digits = shuffle([1,2,3,4,5,6], random);
    const variant = [...puzzle].map(digit=>digit==='0'?'0':digits[Number(digit)-1]).join('');
    const result = analyzeMini(variant,grid);
    return !result.usesSearch && result.steps.some(step=>step.updates[0].kind==='remove') ? variant : puzzle;
  }
  const length = size * size;
  const [solution] = search(setup('0'.repeat(length), grid), 1, random);
  const board = [...solution];
  const target = level === 'mini-easy' ? (size === 4 ? 8 : 20) : (size === 4 ? 5 : 12);
  let clues = length;
  for (const cell of shuffle(board.map((_, i) => i), random)) {
    board[cell] = '0';
    if (search(setup(board.join(''), grid), 2).length !== 1) board[cell] = solution[cell];
    else if (--clues <= target) break;
  }
  return board.join('');
}
