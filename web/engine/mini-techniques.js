const remove = (index, digit) => ({index,digit,kind:'remove'});

function elimination(technique, title, focus, region, digits, updates, clue, reason) {
  return updates.length ? {technique,title,focus,region,digits,updates,clue,reason} : null;
}

function locked(candidates, grid, fromBox) {
  const {size, units} = grid;
  const lines = units.slice(0, size * 2);
  const boxes = units.slice(size * 2);
  for (const from of fromBox ? boxes : lines) {
    for (let digit = 1; digit <= size; digit++) {
      const focus = from.filter(i => candidates[i].includes(digit));
      if (focus.length < 2) continue;
      const to = (fromBox ? lines : boxes).find(unit => focus.every(i => unit.includes(i)));
      if (!to) continue;
      const updates = to.filter(i => !from.includes(i) && candidates[i].includes(digit)).map(i => remove(i,digit));
      const result = elimination(fromBox?'pointing':'claiming',fromBox?'宫内区块排除':'行列区块排除',
        focus,[...new Set([...from,...to])],[digit],updates,
        `追踪候选 ${digit} 在${fromBox?'同一宫':'同一行或列'}内的位置。`,
        `${digit} 在起始单元里的所有候选都集中在两个单元的交界，另一个单元在交界外的候选 ${digit} 都可以删去。`);
      if (result) return result;
    }
  }
  return null;
}

function nakedPair(candidates, grid) {
  for (const unit of grid.units) {
    for (const first of unit) {
      const digits = candidates[first];
      if (digits.length !== 2) continue;
      const second = unit.find(i => i > first && candidates[i].length === 2 && digits.every(d => candidates[i].includes(d)));
      if (second === undefined) continue;
      const updates = unit.filter(i=>i!==first&&i!==second).flatMap(i=>digits.filter(d=>candidates[i].includes(d)).map(d=>remove(i,d)));
      const result = elimination('naked-pair','显性数对',[first,second],unit,digits,updates,
        '同一个单元内，哪两格只剩相同的两个候选？',
        `绿色两格只能填 ${digits.join(' 和 ')}，因此同单元的其他格可以删去这两个候选。`);
      if (result) return result;
    }
  }
  return null;
}

function hiddenPair(candidates, grid) {
  for (const unit of grid.units) {
    for (let a=1;a<grid.size;a++) {
      const focus=unit.filter(i=>candidates[i].includes(a));
      if(focus.length!==2)continue;
      for (let b=a+1;b<=grid.size;b++) {
        const match=unit.filter(i=>candidates[i].includes(b));
        if(match[0]!==focus[0]||match[1]!==focus[1]||match.length!==2)continue;
        const updates=focus.flatMap(i=>candidates[i].filter(d=>d!==a&&d!==b).map(d=>remove(i,d)));
        const result=elimination('hidden-pair','隐性数对',focus,unit,[a,b],updates,
          `找出 ${a} 和 ${b} 在同一个单元的位置。`,
          `${a} 和 ${b} 在该单元都只能填进绿色两格，因此这两格的其他候选可以删去。`);
        if(result)return result;
      }
    }
  }
  return null;
}

function xWing(candidates, grid) {
  const {size, units, row, col} = grid;
  for (const rowsFirst of [true,false]) {
    const bases = rowsFirst ? units.slice(0,size) : units.slice(size,2*size);
    const covers = rowsFirst ? units.slice(size,2*size) : units.slice(0,size);
    const cross = rowsFirst ? col : row;
    for(let digit=1;digit<=size;digit++) {
      const hits = bases.map(unit=>unit.filter(i=>candidates[i].includes(digit)));
      for(let i=0;i<hits.length;i++) {
        if(hits[i].length!==2)continue;
        const indexes=hits[i].map(cross);
        for(let j=i+1;j<hits.length;j++) {
          if(hits[j].length!==2||hits[j].map(cross).join()!==indexes.join())continue;
          const focus=[...hits[i],...hits[j]];
          const region=indexes.flatMap(k=>covers[k]);
          const updates=region.filter(cell=>!focus.includes(cell)&&candidates[cell].includes(digit)).map(cell=>remove(cell,digit));
          const result=elimination('x-wing','X 翼',focus,region,[digit],updates,
            `找出两个平行单元里，候选 ${digit} 都只出现在哪两条交叉线上。`,
            `两条起始线的 ${digit} 会分别占用这两条交叉线的一个位置，交叉线上的其余 ${digit} 可以删去。`);
          if(result)return result;
        }
      }
    }
  }
  return null;
}

function aic(candidates, grid) {
  const nodes = candidates.flatMap((digits, cell) => digits.map(digit=>({cell,digit})));
  const strong = nodes.map(()=>[]);
  const weak = nodes.map(()=>[]);
  const exclusive = (a,b) => a.cell===b.cell ? a.digit!==b.digit
    : a.digit===b.digit && grid.peers(a.cell,b.cell);
  for (const [i,a] of nodes.entries()) {
    for (let j=i+1;j<nodes.length;j++) {
      const b=nodes[j];
      if (!exclusive(a,b)) continue;
      weak[i].push(j);
      weak[j].push(i);
      const conjugate=a.cell===b.cell ? candidates[a.cell].length===2
        : grid.units.some(unit=>unit.includes(a.cell)&&unit.includes(b.cell)&&
          unit.filter(cell=>candidates[cell].includes(a.digit)).length===2);
      if(conjugate){
        strong[i].push(j);
        strong[j].push(i);
      }
    }
  }
  for (const [start,first] of nodes.entries()) {
    if (!strong[start].length) continue;
    const queue = [[start]];
    const visited = new Set([start * 2 + 1]);
    for (let i=0;i<queue.length;i++) {
      const path=queue[i], last=path.at(-1);
      const nextStrong=path.length%2===1;
      if (!nextStrong && path.length>=4 && last!==start) {
        const updates=nodes.filter((node,index)=>!path.includes(index)&&exclusive(node,first)&&exclusive(node,nodes[last]))
          .map(node=>remove(node.cell,node.digit));
        if(updates.length){
          const proofNodes=path.map(index=>nodes[index]);
          const focus=[...new Set(proofNodes.map(node=>node.cell))];
          return {...elimination('aic','交替推理链',focus,focus,[first.digit,nodes[last].digit],updates,
            '从端点出发，沿实线和虚线交替推理。',
            '若链的任一端为假，沿链会推出另一端为真。因此，与两端都互斥的候选可以删去。'),
            proof:{kind:'chain',nodes:proofNodes}};
        }
      }
      for (const next of (nextStrong?strong:weak)[last]) {
        const key=next*2+Number(!nextStrong);
        if (visited.has(key) || path.includes(next)) continue;
        visited.add(key);
        queue.push([...path,next]);
      }
    }
  }
  return null;
}

export const miniTechniques = {
  pointing: (candidates, grid) => locked(candidates, grid, true),
  claiming: (candidates, grid) => locked(candidates, grid, false),
  'naked-pair': nakedPair,
  'hidden-pair': hiddenPair,
  'x-wing': xWing,
  aic
};
