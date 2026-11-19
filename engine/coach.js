import {
  STRATEGY, TACTIC_ID, applyStep, boardFromPublic, countSolutions, digitsFromMask,
  generatePuzzle, getUniqueSolution, rateSteps, walkthrough
} from './sudoku-core.js';
import { puzzlePool } from '../data/examples.js';
export { lessons } from '../data/lessons.js';

const titles = {
  OPEN_SINGLES: '最后一格', HIDDEN_SINGLE: '隐性唯一数', NAKED_SINGLE: '显性唯一数',
  POINTING_ELIMINATION: '宫内区块排除', NAKED_PAIR: '显性数对', HIDDEN_PAIR: '隐性数对',
  HIDDEN_TRIPLE: '隐性数组（三数）', HIDDEN_QUAD: '隐性数组（四数）', NAKED_TRIPLE: '显性三数组',
  NAKED_QUAD: '显性四数组', X_WING: 'X 翼', SWORDFISH: '剑鱼', SKYSCRAPER: '摩天楼',
  TWO_STRING_KITE: '双线风筝', CRANE: '鹤形', Y_WING: 'Y 翼', W_WING: 'W 翼',
  XYZ_WING: 'XYZ 翼', WXYZ_WING: 'WXYZ 翼', SIMPLE_COLOURING: '简单染色',
  EMPTY_RECTANGLE: '空矩形', UNIQUE_RECTANGLE: '唯一矩形', FINNED_X_WING: '带鳍 X 翼',
  FINNED_SWORDFISH: '带鳍剑鱼', JELLYFISH: '水母', BUG_PLUS_ONE: 'BUG+1',
  FINNED_JELLYFISH: '带鳍水母', X_CHAIN: '单数链', XY_CHAIN: '双值链',
  MEDUSA_3D: '立体染色', AIC: '交替推理链', NISHIO: '西尾强制链'
};

const strategyKeys = new Map(Object.entries(STRATEGY).map(([key, name]) => [name, key]));
const row = i => Math.floor(i / 9);
const col = i => i % 9;
const box = i => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
const cellName = i => `第 ${row(i) + 1} 行第 ${col(i) + 1} 列`;
const encode = board => board.map(d => d || 0).join('');

function parse(input) {
  if (typeof input !== 'string') throw new TypeError('题面需要使用 81 个数字。');
  const text = input.replace(/\s/g, '').replace(/\./g, '0');
  if (!/^[0-9]{81}$/.test(text)) throw new TypeError('请输入 81 个数字，空格用 0 或英文句点表示。');
  return [...text].map(d => Number(d) || null);
}

function snapshot(state) {
  return state.candidates.map(digitsFromMask);
}

export function initialCandidates(text) {
  return snapshot(boardFromPublic(parse(text)));
}

function houseName(cells) {
  const i = cells[0];
  if (cells.every(n => row(n) === row(i))) return `第 ${row(i) + 1} 行`;
  if (cells.every(n => col(n) === col(i))) return `第 ${col(i) + 1} 列`;
  return `第 ${box(i) + 1} 宫`;
}

function explain(technique, region, focus, digits, updates, proof) {
  const { digit, index } = updates[0];
  const group = houseName(region);
  const digitList = digits.join('、');
  if (technique === 'open-singles') return [
    `从${group}开始，数一数还空着几个格子。`,
    `${group}只剩一格，1 至 9 中还缺 ${digit}，所以${cellName(index)}填 ${digit}。`
  ];
  if (technique === 'hidden-single') return [
    `看看数字 ${digit} 在${group}能放到哪些格子。`,
    `${group}的空格中，只有${cellName(index)}保留候选 ${digit}，因此这一格必须填 ${digit}。`
  ];
  if (technique === 'naked-single') return [
    `观察${cellName(index)}，检查它的行、列和宫。`,
    `经过排除，${cellName(index)}仅剩候选 ${digit}，可以直接填入。`
  ];
  if (technique === 'pointing' || technique === 'claiming') {
    const i = focus[0];
    const line = focus.every(n => row(n) === row(i)) ? `第 ${row(i) + 1} 行` : `第 ${col(i) + 1} 列`;
    const square = `第 ${box(i) + 1} 宫`;
    const [source, target] = technique === 'pointing' ? [square, line] : [line, square];
    return [`先看${source}里的候选 ${digit}，它们集中在哪里？`,
      `${source}里所有的 ${digit} 都落在与${target}相交的格子里。这个交叠区必占一个 ${digit}，因此从${target}的其余格删去候选 ${digit}。`];
  }
  if (['naked-pair', 'naked-triple', 'naked-quad'].includes(technique)) return [
    `在${group}合并绿色格子的候选，数一数共有几个不同的数字。`,
    `绿色的 ${focus.length} 格合起来只包含 ${digitList}。这些数字刚好占满这几格，因此可以从${group}的其他格删去相同候选。`
  ];
  if (['hidden-pair', 'hidden-triple', 'hidden-quad'].includes(technique)) return [
    `在${group}找出 ${digitList} 的所有候选位置。`,
    `${digitList} 在${group}只出现在绿色的 ${focus.length} 格里。这些位置必须留给它们，所以从绿格中删去其余候选。`
  ];
  if (['x-wing', 'swordfish', 'jellyfish'].includes(technique)) return [
    `沿平行线追踪绿色格里的候选 ${digit}，再看它们落在哪些交叉线上。`,
    `每条起始线都必须放一个 ${digit}，它们只能占用图中相同数量的交叉线。每条交叉线因此都已有一个位置留给 ${digit}，可以删去线上的其余候选 ${digit}。`
  ];
  if (technique === 'skyscraper' || technique === 'two-string-kite') return [
    `找候选 ${digit} 的两组强链接，每组恰好有两个位置。`,
    `两组相连的内侧端点不能同时为 ${digit}，因此外侧的 ${cellName(focus[0])} 和 ${cellName(focus[1])} 至少有一处必须是 ${digit}。同时看得见这两格的位置可删去候选 ${digit}。`
  ];
  if (technique === 'y-wing') return [
    `以${cellName(focus[0])}为枢纽，比较它与两个翼格的候选。`,
    `枢纽填入任一个候选，都会迫使一个翼格填 ${digit}。同时看得见两个翼格的位置可删去候选 ${digit}。`
  ];
  if (technique === 'xyz-wing') return [
    `比较三值枢纽和两个双值翼格，找出它们共有的 ${digit}。`,
    `枢纽若不填 ${digit}，就会迫使一个翼格填 ${digit}。因此同时看得见三格的位置可以删去候选 ${digit}。`
  ];
  if (technique === 'unique-rectangle') return [
    `找出跨两个宫、共享 ${digitList} 的四角。`,
    `如果${cellName(index)}也使用这两个数字之一，四角上的 ${digitList} 就可以整体互换，产生第二个解。因为题面只有一个解，这一格必须改用额外候选。`
  ];
  if (technique === 'bug-plus-one') return [
    `检查唯一的三值格，暂时拿掉候选 ${digit} 后，观察每个数字在各单元中的出现次数。`,
    `若${cellName(index)}不填 ${digit}，所有空格将形成可整体翻转的双值结构，与题目的唯一解矛盾。因此这一格填 ${digit}。`
  ];
  if (proof?.kind === 'colour') {
    const eliminated = proof.nodes.find(node => node.cell === index && node.digit === digit);
    const reason = eliminated
      ? `${eliminated.colour === 0 ? '蓝色' : '紫色'}组内有两个候选互相排斥，它们无法同时为真。因此整组都为假。`
      : `${cellName(index)}的候选 ${digit} 同时受到蓝色和紫色候选排斥。不论哪一色为真，它都应删去。`;
    return ['沿实线检查每对蓝色与紫色的候选。一个颜色组为真，另一个为假。', reason];
  }
  if (proof?.kind === 'chain') {
    const start = proof.nodes[0];
    const end = proof.nodes.at(-1);
    const endpoints = `从${cellName(start.cell)}的 ${start.digit} 到${cellName(end.cell)}的 ${end.digit}，至少有一个端点为真。`;
    return ['沿实线（强链接）和虚线（弱链接）追踪这条链。', endpoints + (start.cell === end.cell
      ? '两端都在同一格，因此该格可以删去其余候选。'
      : `同时看得见两端的位置都可以删去候选 ${digit}。`)];
  }
  return [
    '先观察高亮格之间共享的行、列和宫。',
    `根据标出的候选结构，${updates.map(u => `${cellName(u.index)}${u.kind === 'place' ? '填入' : '删除候选'} ${u.digit}`).join('，')}。`
  ];
}

function normalize(state, raw) {
  const key = strategyKeys.get(raw.strategy);
  let technique = TACTIC_ID[key] || raw.strategy;
  let title = titles[key] || raw.strategy.replace(/ Strategy$/, '');
  const focus = raw.patternCells || [];
  const region = raw.regionCells || focus;
  if (key === 'HIDDEN_GROUPS') {
    technique = focus.length === 3 ? 'hidden-triple' : 'hidden-quad';
    title = focus.length === 3 ? titles.HIDDEN_TRIPLE : titles.HIDDEN_QUAD;
  }
  const updates = raw.updates.map(u => ({
    index: u.index, digit: u.filledValue ?? u.eliminatedCandidate, kind: u.filledValue == null ? 'remove' : 'place'
  }));
  if (key === 'POINTING_ELIMINATION') {
    const outsideBox = updates.every(u => box(u.index) !== box(focus[0]));
    technique = outsideBox ? 'pointing' : 'claiming';
    title = outsideBox ? '宫内区块排除' : '行列区块排除';
  }
  const digits = raw.patternDigits || [...new Set(updates.map(u => u.digit))];
  const proof = raw.proof;
  const [clue, reason] = explain(technique, region, focus, digits, updates, proof);
  return { board: encode(state.values), candidates: snapshot(state), technique, title, focus, region, digits, updates, clue, reason, ...(proof && { proof }) };
}

export function analyze(text) {
  const empty = { difficulty: null, steps: [], solution: null, logicalComplete: false };
  let board, state;
  try {
    board = parse(text);
    state = boardFromPublic(board);
  } catch {
    return { ...empty, status: 'invalid' };
  }
  const count = countSolutions(board, 2);
  if (count !== 1) return { ...empty, status: count ? 'multiple' : 'none' };
  const path = walkthrough(state);
  const steps = path.steps.map(raw => {
    const view = normalize(state, raw);
    applyStep(state, raw);
    return view;
  });
  return {
    status: 'unique', steps, logicalComplete: path.solved,
    solution: encode(path.solved ? state.values : getUniqueSolution(board)),
    difficulty: path.solved ? rateSteps(path.steps).difficulty : null
  };
}

export const starterPuzzle = puzzlePool.L4?.[0] || '';
export const practiceLevels = {
  L1: { name: '入门', technique: 'open-singles' },
  L4: { name: '进阶', technique: 'pointing' },
  L5: { name: '挑战', technique: 'naked-pair' },
  L6: { name: '专家', technique: 'x-wing' }
};

export function generate(level, seed) {
  if (!Object.hasOwn(practiceLevels, level)) throw new RangeError('未知难度');
  const pool = puzzlePool[level];
  const value = seed === undefined ? Math.floor(Math.random() * 0x100000000) : seed >>> 0;
  const fallback = pool[value % pool.length];
  try {
    const fresh = generatePuzzle({ difficulty: level, seed: value, timeoutMs: 1200, maxAttempts: 32 });
    const puzzle = encode(fresh);
    if (level === 'L1') return puzzle;
    // A difficulty band may also be reached through a higher total effort score.
    // Keep the advertised teaching technique present even on that boundary.
    const target = practiceLevels[level].technique;
    return analyze(puzzle).steps.some(step => step.technique === target) ? puzzle : fallback;
  } catch {
    return fallback;
  }
}
