export const drawingColours = {
  blue: '蓝色',
  purple: '紫色',
  amber: '橙色',
  green: '绿色'
};

export const emptyDrawing = () => ({ colours: {}, links: [] });
export const nodeKey = ({cell, digit}) => cell * 10 + digit;

export function changeColour(drawing, node, colour) {
  const key = nodeKey(node);
  if (drawing.colours[key] === colour) delete drawing.colours[key];
  else drawing.colours[key] = colour;
}

export function changeLink(drawing, from, to, strong) {
  const start = nodeKey(from);
  const end = nodeKey(to);
  if (start === end) return;
  const index = drawing.links.findIndex(link => {
    const a = nodeKey(link.from), b = nodeKey(link.to);
    return a === start && b === end || b === start && a === end;
  });
  if (index < 0) drawing.links.push({from, to, strong});
  else if (drawing.links[index].strong === strong) drawing.links.splice(index, 1);
  else drawing.links[index].strong = strong;
}

export function removeCandidates(game, cells, digit, available) {
  let changed = false;
  for (const cell of cells) {
    if (game.board[cell] !== '0') continue;
    if (game.notes[cell].includes(digit)) {
      game.notes[cell] = game.notes[cell].filter(note => note !== digit);
      changed = true;
    }
    if (available[cell].includes(digit) && !game.removed[cell].includes(digit)) {
      game.removed[cell].push(digit);
      changed = true;
    }
  }
  return changed;
}
