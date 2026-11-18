import { examples } from './examples.js';

const syllabus = [
  {
    id: 'open-singles', title: '最后一格', subtitle: '用缺少的数字补齐一组',
    rule: '每行、每列、每个九宫都要恰好用到 1 至 9。只剩一个空格时，缺少的数字就属于它。',
    observation: '找一找只剩一个空格的行、列或宫。',
    action: '选中空格，再点这一组缺少的数字。'
  },
  {
    id: 'hidden-single', title: '隐性唯一数', subtitle: '给一个数字寻找唯一位置',
    rule: '选定一个数字，逐格排除一组里不能放它的位置。当它只剩一个去处，就可以填入。',
    observation: '盯住一个数字，数一数它在这组还有几个位置。',
    action: '在唯一能容纳目标数字的空格填数。'
  },
  {
    id: 'naked-single', title: '显性唯一数', subtitle: '读出空格的最后一个候选',
    rule: '把同行、同列、同宫已有的数字从候选中划去。一个格子只剩一个候选时，它的值已经确定。',
    observation: '检查哪些空格的候选表只剩一个数字。',
    action: '选中这个空格，填入它仅剩的候选。'
  },
  {
    id: 'pointing', title: '宫内区块排除', subtitle: '沿着宫与行列的交线删数',
    rule: '如果一个数字在某宫的所有候选都位于同一行或同一列，它必定由这段交线上的一格取得。沿线走到宫外，其他格都可以删去这个数字。',
    observation: '查看一个宫，找出某个数字的所有候选是否排成一线。',
    action: '沿这条线走出宫，删去宫外格子里相同的候选数。'
  },
  {
    id: 'naked-pair', title: '显性数对', subtitle: '用两格锁定两个数字',
    rule: '同一组里，两格恰好拥有相同的两个候选。无论两数如何交换，它们都会占满这两格，因此可以从本组其余格删除这两个候选。',
    observation: '在同一行、列或宫里，寻找候选完全相同的两个双值格。',
    action: '保留数对两格的候选，从同组的其他格中删除被占用的数。'
  }
];

export const lessons = syllabus.map(lesson => ({ ...lesson, examples: examples[lesson.id] }));
