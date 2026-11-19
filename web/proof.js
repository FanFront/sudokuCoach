import { rc } from './ui.js';

export function proofLinks(proof) {
  if (!proof) return [];
  if (proof.kind === 'colour') return proof.edges.map(([from, to]) => ({ from, to, strong: true }));
  return proof.nodes.slice(1).map((_, from) => ({ from, to: from + 1, strong: from % 2 === 0 }));
}

function point({cell, digit}) {
  return [
    (cell % 9) * 30 + ((digit - 1) % 3) * 10 + 5,
    Math.floor(cell / 9) * 30 + Math.floor((digit - 1) / 3) * 10 + 5
  ];
}

export function drawLinks(proof) {
  const links = proofLinks(proof).map(({ from, to, strong }) => {
    const [x1, y1] = point(proof.nodes[from]);
    const [x2, y2] = point(proof.nodes[to]);
    return `<line class="${strong ? 'strong' : 'weak'}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  });
  return `<svg class="proof-lines" viewBox="0 0 270 270" aria-hidden="true">${links.join('')}</svg>`;
}

export function describeLinks(proof) {
  const label = node => `${rc(node.cell)} 的 ${node.digit}`;
  const links = proofLinks(proof).map(({ from, to, strong }) =>
    `<li>${label(proof.nodes[from])} · ${strong ? '强链接' : '弱链接'} · ${label(proof.nodes[to])}</li>`);
  return `<details class="proof-details"><summary>查看链接顺序</summary><ol>${links.join('')}</ol></details>`;
}
