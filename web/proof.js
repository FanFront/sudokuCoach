import { rc } from './ui.js';
import { gridFormats } from './engine/grid.js';

export function proofLinks(proof) {
  if (!proof) return [];
  if (proof.kind === 'colour') return proof.edges.map(([from, to]) => ({ from, to, strong: true }));
  return proof.nodes.slice(1).map((_, from) => ({ from, to: from + 1, strong: from % 2 === 0 }));
}

function point({cell, digit}, grid) {
  const {boxRows,boxCols,col,row}=grid;
  return [
    (col(cell) + ((digit - 1) % boxCols + 0.5) / boxCols) * 30,
    (row(cell) + (Math.floor((digit - 1) / boxCols) + 0.5) / boxRows) * 30
  ];
}

export function drawLinks(proof, annotations = [], grid = gridFormats[9]) {
  const extent=grid.size*30;
  const evidence = proofLinks(proof).map(({ from, to, strong }) => ({
    from: proof.nodes[from], to: proof.nodes[to], strong
  }));
  const links = [...evidence, ...annotations].map(({ from, to, strong }, index) => {
    const [x1, y1] = point(from,grid);
    const [x2, y2] = point(to,grid);
    const layer = index < evidence.length ? '' : ' user-link';
    return `<line class="${strong ? 'strong' : 'weak'}${layer}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  });
  return `<svg class="proof-lines" viewBox="0 0 ${extent} ${extent}" aria-hidden="true">${links.join('')}</svg>`;
}

export function describeLinks(proof, size = 9) {
  const label = node => `${rc(node.cell,size)} 的 ${node.digit}`;
  const links = proofLinks(proof).map(({ from, to, strong }) =>
    `<li>${label(proof.nodes[from])} · ${strong ? '强链接' : '弱链接'} · ${label(proof.nodes[to])}</li>`);
  return `<details class="proof-details"><summary>查看链接顺序</summary><ol>${links.join('')}</ol></details>`;
}
